from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
db = SQLAlchemy(app)


# ---------------- MODELS ----------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50))
    role = db.Column(db.String(20))


# ---------------- ROLE PERMISSIONS ----------------
ROLE_PERMISSIONS = {
    "admin": ["vehicles", "sales", "users"],
    "manager": ["vehicles", "sales"],
    "customer": ["vehicles"]
}


def is_authorized(role, table):
    return table in ROLE_PERMISSIONS.get(role, [])


# ---------------- CHATBOT ENDPOINT ----------------
@app.post("/chat")
def chat():
    data = request.json
    message = data["message"]
    role = data["role"]  # admin / manager / customer

    # ---------- Ask Gemini To Generate SQL ----------
    prompt = f"""
    You are an SQL expert. Convert the following question into a valid SQL query.
    Only use these tables: vehicles, sales, users.
    The user role is: {role}.
    DO NOT EXPLAIN ANYTHING. Output ONLY SQL.

    Question: {message}
    """

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    sql_query = response.text.strip()

    # ---- Extract table name (for role checking) ----
    try:
        table = sql_query.upper().split("FROM")[1].strip().split()[0].lower()
    except:
        return jsonify({"error": "Failed to understand SQL"}), 400

    if not is_authorized(role, table):
        return jsonify({"error": "Unauthorized access for this role"}), 403

    # ---------- Execute SQL Safely ----------
    try:
        result = db.session.execute(text(sql_query)).fetchall()
        data = [tuple(r) for r in result]
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "sql": sql_query,
        "data": data
    })


# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True)
