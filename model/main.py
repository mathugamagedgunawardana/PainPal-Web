"""
Flask server: API endpoint to generate a patient summary from migraine attack symptoms.
"""
import os
import sys
from flask import Flask, request, jsonify

app = Flask(__name__)

# Human-readable labels for symptoms (used in summary)
SYMPTOM_LABELS = {
    "Age": "age",
    "Duration": "attack duration (hours)",
    "Frequency": "attack frequency per month", 
    "Location": "pain location",
    "Character": "pain character",
    "Intensity": "pain intensity (1-10)",
    "Nausea": "nausea",
    "Vomit": "vomiting",
    "Phonophobia": "phonophobia (sound sensitivity)",
    "Photophobia": "photophobia (light sensitivity)",
    "Visual": "visual aura",
    "Sensory": "sensory aura",
    "Dysphasia": "dysphasia (speech difficulty)",
    "Dysarthria": "dysarthria (slurred speech)",
    "Vertigo": "vertigo",
    "Tinnitus": "tinnitus",
    "Hypoacusis": "hearing loss",
    "Diplopia": "diplopia (double vision)",
    "Defect": "visual field defect",
    "Ataxia": "ataxia",
    "Conscience": "consciousness disturbance",
    "Paresthesia": "paresthesia (tingling/numbness)",
    "DPF": "duration/pattern factor",
}

# Pain location/character mappings for readable summary (numeric or string)
LOCATION_MAP = {"0": "unknown", "1": "unilateral", "2": "bilateral", "unilateral": "unilateral", "bilateral": "bilateral"}
CHARACTER_MAP = {"0": "unknown", "1": "throbbing", "2": "pressure", "throbbing": "throbbing", "pressure": "pressure"}


def _format_value(key: str, value) -> str:
    if value is None:
        return "not reported"
    if key in ("Nausea", "Vomit", "Phonophobia", "Photophobia", "Visual", "Sensory", "Dysphasia",
               "Dysarthria", "Vertigo", "Tinnitus", "Hypoacusis", "Diplopia", "Defect", "Ataxia",
               "Conscience", "Paresthesia"):
        return "yes" if int(value) != 0 else "no"
    if key == "Location":
        return LOCATION_MAP.get(str(value).strip().lower(), str(value))
    if key == "Character":
        return CHARACTER_MAP.get(str(value).strip().lower(), str(value))
    return str(value)


def generate_summary(symptoms: dict) -> str:
    """Build a short clinical summary from a dict of symptom key-value pairs."""
    parts = []

    # Demographics / attack pattern
    age = symptoms.get("Age")
    if age is not None:
        parts.append(f"Patient age {age}.")
    dur = symptoms.get("Duration")
    freq = symptoms.get("Frequency")
    if dur is not None or freq is not None:
        bits = []
        if dur is not None:
            bits.append(f"attack duration {dur} hours")
        if freq is not None:
            bits.append(f"frequency {freq} per month")
        parts.append(" ".join(bits).capitalize() + ".")

    # Pain
    loc = symptoms.get("Location")
    char = symptoms.get("Character")
    intensity = symptoms.get("Intensity")
    pain_bits = []
    if loc is not None:
        pain_bits.append(_format_value("Location", loc))
    if char is not None:
        pain_bits.append(_format_value("Character", char))
    if intensity is not None:
        pain_bits.append(f"intensity {intensity}/10")
    if pain_bits:
        parts.append("Pain: " + ", ".join(pain_bits) + ".")

    # Associated symptoms (present)
    associated = []
    for key in ("Nausea", "Vomit", "Phonophobia", "Photophobia"):
        if key in symptoms and symptoms.get(key) not in (None, 0, "0"):
            associated.append(SYMPTOM_LABELS.get(key, key).replace(" (sound sensitivity)", "").replace(" (light sensitivity)", ""))
    if associated:
        parts.append("Associated symptoms: " + ", ".join(associated) + ".")

    # Aura / neurological
    aura = []
    for key in ("Visual", "Sensory", "Dysphasia", "Dysarthria", "Vertigo", "Tinnitus", "Hypoacusis",
                "Diplopia", "Defect", "Ataxia", "Conscience", "Paresthesia"):
        if key in symptoms and symptoms.get(key) not in (None, 0, "0"):
            aura.append(SYMPTOM_LABELS.get(key, key))
    if aura:
        parts.append("Aura/neurological features: " + ", ".join(aura) + ".")

    if not parts:
        return "No symptom details provided."
    return " ".join(parts)


def predict_migraine_type(symptoms: dict):
    """If model artifacts exist, return predicted migraine type; else None."""
    base = os.path.dirname(os.path.abspath(__file__))
    text_dir = os.path.join(base, "text")
    model_path = os.path.join(text_dir, "xgboost_patient_model.pkl")
    encoder_path = os.path.join(text_dir, "label_encoder.pkl")
    if not os.path.isfile(model_path) or not os.path.isfile(encoder_path):
        return None
    try:
        import pandas as pd
        import joblib
        model = joblib.load(model_path)
        label_encoder = joblib.load(encoder_path)
        enc_path = os.path.join(text_dir, "artifacts", "feature_encoders.joblib")
        cols_path = os.path.join(text_dir, "artifacts", "feature_columns.joblib")
        feature_encoders = joblib.load(enc_path) if os.path.isfile(enc_path) else None
        feature_columns = joblib.load(cols_path) if os.path.isfile(cols_path) else None

        # Build one row with same columns as training
        row = {k: symptoms.get(k, 0) for k in (feature_columns or [])}
        if not row:
            row = {k: symptoms.get(k, 0) for k in SYMPTOM_LABELS if k != "Type"}
        df = pd.DataFrame([row])

        if feature_encoders:
            for col in ("Location", "Character", "DPF"):
                if col in feature_encoders and col in df.columns:
                    le = feature_encoders[col]
                    val = df[col].astype(str).iloc[0]
                    df[col] = le.transform([val])[0] if val in le.classes_ else -1
        if feature_columns:
            df = df.reindex(columns=feature_columns, fill_value=0)

        pred = model.predict(df)
        return label_encoder.inverse_transform(pred)[0]
    except Exception:
        return None


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/summary", methods=["POST"])
def api_summary():
    """
    Generate a patient summary from migraine attack symptoms.
    Body: JSON object with keys like Age, Duration, Frequency, Location, Character,
    Intensity, Nausea, Vomit, Phonophobia, Photophobia, Visual, Sensory, Dysphasia,
    Dysarthria, Vertigo, Tinnitus, Hypoacusis, Diplopia, Defect, Ataxia, Conscience,
    Paresthesia, DPF.
    """
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400
    data = request.get_json()
    if not isinstance(data, dict):
        return jsonify({"error": "Body must be a JSON object"}), 400

    summary = generate_summary(data)
    predicted_type = predict_migraine_type(data)

    out = {
        "summary": summary,
        "symptoms_received": list(data.keys()),
    }
    if predicted_type is not None:
        out["predicted_migraine_type"] = predicted_type
    return jsonify(out)


@app.route("/api/summary", methods=["GET"])
def api_summary_get():
    """Same as POST but accepts query params or JSON for quick testing."""
    data = dict(request.args)
    for k, v in data.items():
        if v.isdigit():
            data[k] = int(v)
        elif v.replace(".", "", 1).isdigit():
            data[k] = float(v)
    summary = generate_summary(data)
    predicted_type = predict_migraine_type(data)
    out = {"summary": summary, "symptoms_received": list(data.keys())}
    if predicted_type is not None:
        out["predicted_migraine_type"] = predicted_type
    return jsonify(out)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
