"use client";

import React from "react";
import { Brain, Activity, AlertCircle } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { NextAttackForecastCard } from "@/components/forecast/NextAttackForecastCard";
import type { PatientNextAttackDto } from "@/lib/model/migraineModelRecords";

type MigraineTypePrediction = {
  type: string;
  probability: number;
  summary: string;
  keySymptoms: string[];
  impact: {
    pain: number;
    aura: number;
    neuro: number;
    frequency: number;
    hormonal: number;
    vestibular: number;
    vision: number;
  };
};

type NextAttackPayload = PatientNextAttackDto;

type AnalyticsPayload = {
  generatedAt?: string;
  source?: string;
  predictedType?: string;
  confidence?: number;
  summary?: string;
  keySymptoms?: string[];
  predictions?: MigraineTypePrediction[];
  nextAttack?: NextAttackPayload | null;
  nextAttackUnavailableReason?: string | null;
  nextAttackDisclaimer?: string;
};

function formatModelTypeLabel(raw: string): string {
  if (!raw) return "—";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const FALLBACK_MIGRAINE_PREDICTIONS: MigraineTypePrediction[] = [
  {
    type: "Migraine without aura",
    probability: 26,
    summary: "Common migraine with unilateral throbbing pain and sensory sensitivity.",
    keySymptoms: ["Throbbing unilateral pain", "Nausea", "Photophobia"],
    impact: { pain: 86, aura: 10, neuro: 20, frequency: 52, hormonal: 18, vestibular: 22, vision: 25 },
  },
  {
    type: "Migraine with aura",
    probability: 34,
    summary: "Classic migraine with transient neurological aura before or during headache.",
    keySymptoms: ["Visual zig-zag lines", "Tingling", "Speech difficulty"],
    impact: { pain: 72, aura: 88, neuro: 76, frequency: 55, hormonal: 14, vestibular: 40, vision: 82 },
  },
  {
    type: "Hemiplegic migraine",
    probability: 5,
    summary: "Rare subtype with temporary one-sided weakness and stroke-like presentation.",
    keySymptoms: ["One-sided weakness", "Speech disturbance", "Motor aura"],
    impact: { pain: 44, aura: 66, neuro: 92, frequency: 28, hormonal: 8, vestibular: 36, vision: 30 },
  },
  {
    type: "Retinal migraine",
    probability: 6,
    summary: "Monocular visual disturbance followed by headache.",
    keySymptoms: ["One-eye vision loss", "Flashing lights", "Headache"],
    impact: { pain: 52, aura: 62, neuro: 35, frequency: 24, hormonal: 10, vestibular: 16, vision: 95 },
  },
  {
    type: "Chronic migraine",
    probability: 12,
    summary: "Headache on 15+ days/month with migraine features on at least 8 days.",
    keySymptoms: ["High monthly headache days", "Persistent disability", "High burden"],
    impact: { pain: 78, aura: 22, neuro: 32, frequency: 96, hormonal: 20, vestibular: 30, vision: 26 },
  },
  {
    type: "Menstrual migraine",
    probability: 4,
    summary: "Migraine linked to cycle-related hormonal changes.",
    keySymptoms: ["Perimenstrual pattern", "Hormone trigger", "Predictable timing"],
    impact: { pain: 64, aura: 18, neuro: 15, frequency: 34, hormonal: 90, vestibular: 14, vision: 22 },
  },
  {
    type: "Vestibular migraine",
    probability: 7,
    summary: "Dizziness and vertigo are dominant, headache may be absent.",
    keySymptoms: ["Vertigo", "Balance issues", "Motion sensitivity"],
    impact: { pain: 38, aura: 28, neuro: 42, frequency: 36, hormonal: 10, vestibular: 94, vision: 18 },
  },
  {
    type: "Status migrainosus",
    probability: 3,
    summary: "Severe prolonged migraine episode beyond 72 hours.",
    keySymptoms: ["Severe sustained pain", "72+ hour duration", "Emergency risk"],
    impact: { pain: 97, aura: 24, neuro: 33, frequency: 20, hormonal: 9, vestibular: 18, vision: 20 },
  },
  {
    type: "Probable migraine",
    probability: 3,
    summary: "Migraine-like symptoms without full diagnostic criteria match.",
    keySymptoms: ["Partial criteria", "Variable symptoms", "Diagnostic uncertainty"],
    impact: { pain: 42, aura: 26, neuro: 21, frequency: 30, hormonal: 12, vestibular: 17, vision: 19 },
  },
];

const categoryLabelMap = {
  pain: "Pain profile",
  aura: "Aura profile",
  neuro: "Neurological signs",
  frequency: "Episode frequency",
  hormonal: "Hormonal trigger",
  vestibular: "Vestibular impact",
  vision: "Visual impact",
} as const;

const COLORS = ["#4f46e5", "#2563eb", "#0ea5e9", "#14b8a6", "#22c55e", "#f59e0b", "#f97316", "#ef4444", "#a855f7"];

const shortType = (full: string) => {
  if (full === "Probable migraine") return "Probable";
  if (full === "Status migrainosus") return "Status";
  return full.replace(/^Migraine\s+/i, "").replace(/\s+migraine$/i, "").trim() || full;
};

function clamp100(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function confidenceMeaning(p: number) {
  if (p >= 80) return "High confidence: pattern is strongly consistent with this subtype.";
  if (p >= 60) return "Moderate confidence: this subtype is most likely, but overlaps exist.";
  if (p >= 40) return "Lower confidence: consider this as a leading hypothesis, not a final diagnosis.";
  return "Low confidence: model separation between subtypes is weak for this profile.";
}

/**
 * Practical mobile inputs: `key` matches what you’d POST from the app.
 * `source` = typical capture path (user form, device sensor, public API, health SDK).
 */
type AxisProperty = {
  key: string;
  label: string;
  description: string;
  source: "user" | "sensor" | "api" | "health";
};

const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function hash01(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function buildSleepHoursSeries(p: MigraineTypePrediction) {
  const burden = (p.impact.frequency + p.impact.pain) / 200;
  const base = 7.4 - burden * 2.2;
  return WEEKDAY_SHORT.map((day, i) => {
    const hours = base + Math.sin(i * 0.85) * 0.75 + (hash01(i, 1) - 0.5) * 0.55;
    return {
      day,
      hours: Math.round(Math.min(9.5, Math.max(4.2, hours)) * 10) / 10,
      target: 7.5,
    };
  });
}

function buildStressIndexSeries(p: MigraineTypePrediction) {
  const n = p.impact.neuro,
    f = p.impact.frequency;
  return WEEKDAY_SHORT.map((day, i) => ({
    day,
    stressIndex: clamp100(28 + n * 0.42 + f * 0.18 + Math.sin(i * 1.05) * 18 + (hash01(i, 2) - 0.5) * 22),
    hrvZ: Math.round((-1 + (hash01(i, 3) * 0.4 + n / 250)) * 10) / 10,
  }));
}

/** Demo 7-day outdoor / station weather sync (Open-Meteo-style): pressure + humidity you’d store per day. */
function buildEnvWeatherSeries(p: MigraineTypePrediction) {
  const v = p.impact.vestibular / 100,
    vis = p.impact.vision / 100;
  return WEEKDAY_SHORT.map((day, i) => ({
    day,
    pressureHpa: Math.round(1012 + v * 10 * Math.sin(i * 0.65 + 0.2) + (hash01(i, 4) - 0.5) * 5),
    humidityPct: clamp100(38 + vis * 28 + Math.cos(i * 0.75) * 14 + (hash01(i, 5) - 0.5) * 8),
  }));
}

type CategoryViz =
  | "horizontalBar"
  | "verticalBar"
  | "pie_share"
  | "sleep_area"
  | "stress_line"
  | "weather_composed"
  | "radar"
  | "radial_lifestyle";

const CATEGORY_VIZ: Record<string, { viz: CategoryViz; chartHint: string }> = {
  genetic: {
    viz: "horizontalBar",
    chartHint: "One-time or rare updates from onboarding questionnaire",
  },
  dietary: {
    viz: "pie_share",
    chartHint: "Share of logged exposures in the tracking window (meal diary / voice / photo tag)",
  },
  sleep: {
    viz: "sleep_area",
    chartHint: "Nightly hours from watch / phone (Health Connect, Apple Health) or manual bedtime editor",
  },
  stress: {
    viz: "stress_line",
    chartHint: "Daily stress index from HRV (watch) + optional journal slider merged",
  },
  hormonal: {
    viz: "radar",
    chartHint: "Cycle app fields + user meds; radar = phase-aligned risk shape for this profile",
  },
  environmental: {
    viz: "weather_composed",
    chartHint: "Weather API + phone light/noise mic samples (where permitted)",
  },
  lifestyle: {
    viz: "radial_lifestyle",
    chartHint: "Screen Time APIs, pickups, optional posture prompt check-ins",
  },
  medications: {
    viz: "horizontalBar",
    chartHint: "Med diary + pharmacy scan; days/month and acute-use counts",
  },
  medical: {
    viz: "radar",
    chartHint: "Home BP (Bluetooth cuff), symptom toggles, PT/TMJ questionnaires",
  },
  neurological: {
    viz: "radar",
    chartHint: "Daily sensory sliders (user) correlated with headache diary",
  },
};

const CATEGORY_AXIS_PROPERTIES: Record<string, readonly AxisProperty[]> = {
  genetic: [
    { key: "mother_migraine", label: "Mother hx", description: "Family questionnaire: maternal migraine history (weighted risk)", source: "user" },
    { key: "father_migraine", label: "Father hx", description: "Family questionnaire: paternal migraine history", source: "user" },
    { key: "sibling_migraine", label: "Sibling hx", description: "First-degree sibling with migraine", source: "user" },
    { key: "early_onset", label: "Early onset", description: "Age at first migraine vs population norm (genetic loading proxy)", source: "user" },
    { key: "familial_severity", label: "Severity in family", description: "Reported disability level in affected relatives", source: "user" },
  ],
  dietary: [
    { key: "chocolate", label: "Chocolate", description: "Food diary: chocolate exposure days (last 30d)", source: "user" },
    { key: "aged_cheese", label: "Aged cheese", description: "Tyramine-rich / aged cheese logged meals", source: "user" },
    { key: "processed_meat", label: "Processed meat", description: "Nitrate/nitrite-rich meats (bacon, deli)", source: "user" },
    { key: "msg_processed", label: "MSG / ultra-processed", description: "Restaurant / packaged foods tagged MSG or high additive load", source: "user" },
    { key: "caffeine_swing", label: "Caffeine ±", description: "Excess intake or withdrawal vs usual (mg + timing)", source: "user" },
    { key: "skipped_meals", label: "Skipped meals", description: "Fasting gaps & missed meals from meal logging", source: "user" },
  ],
  sleep: [
    { key: "sleep_debt_h", label: "Sleep debt (h)", description: "Sleep tracker: cumulative debt vs 7–9h target (normalized)", source: "sensor" },
    { key: "fragmentation", label: "Fragmentation", description: "Awakenings & WASO % (wearable / manual log)", source: "sensor" },
    { key: "schedule_jitter", label: "Irregular schedule", description: "Bed/wake time variance (std dev, last 14 nights)", source: "health" },
    { key: "oversleep_days", label: "Oversleep days", description: "Nights exceeding usual duration + reported grogginess", source: "sensor" },
    { key: "short_sleep", label: "Short sleep", description: "Nights under personal sleep need threshold", source: "sensor" },
    { key: "social_jetlag", label: "Social jet lag", description: "Mid-sleep time shift work vs free days", source: "health" },
  ],
  stress: [
    { key: "hrv_stress", label: "HRV stress load", description: "Wearable HRV-derived stress score (rolling avg)", source: "sensor" },
    { key: "self_anxiety", label: "Anxiety days", description: "Daily mood / GAD-style quick check-in frequency", source: "user" },
    { key: "work_stress", label: "Work stress index", description: "Calendar + self-report load metric", source: "user" },
    { key: "letdown_weekend", label: "Post-stress letdown", description: "“Weekend migraine” pattern / stress drop episodes", source: "user" },
    { key: "life_events", label: "Major life events", description: "Flagged acute stressors in journal (last 90d)", source: "user" },
  ],
  hormonal: [
    { key: "perimenstrual", label: "Perimenstrual window", description: "Cycle tracker: days −3..+3 vs menses start", source: "user" },
    { key: "estrogen_drop", label: "Estrogen dip phase", description: "Estimated late-luteal / withdrawal phase signal", source: "health" },
    { key: "oral_contraceptive", label: "Combined OCP", description: "Active birth-control pill use & pill-free interval", source: "user" },
    { key: "pregnancy_postpartum", label: "Pregnancy / PP", description: "Pregnancy or postpartum window (clinician-flagged)", source: "user" },
    { key: "hormone_therapy", label: "HRT / other hormones", description: "Hormone replacement or therapy changes", source: "user" },
  ],
  environmental: [
    { key: "baro_delta", label: "Pressure Δ (24h)", description: "Weather API: 24h barometric change (hPa) — migraine weather link", source: "api" },
    { key: "humidity_swing", label: "Humidity swing", description: "Weather API: hourly/daily relative humidity change", source: "api" },
    { key: "temp_swing", label: "Temp swing", description: "Weather API: temperature delta vs prior day", source: "api" },
    { key: "storm_front", label: "Storm / front", description: "Synoptic flag: approaching front or rapid pressure gradient", source: "api" },
    { key: "wind_gust", label: "Wind / gust load", description: "Max wind gust or sustained wind vs baseline", source: "api" },
    { key: "aqi_pollen", label: "AQI / pollen", description: "Air quality index + pollen tier if available", source: "api" },
    { key: "bright_light", label: "Bright light", description: "Ambient lux peaks or photophobia diary correlation", source: "sensor" },
    { key: "noise_exposure", label: "Noise exposure", description: "Decibel exposure or loud-environment logs", source: "sensor" },
    { key: "strong_odor", label: "Strong odors", description: "Perfume, smoke, cleaning chemical triggers logged", source: "user" },
  ],
  lifestyle: [
    { key: "screen_hours", label: "Screen time", description: "OS / app: daily screen hours (rolling 7d)", source: "health" },
    { key: "evening_blue", label: "Evening blue light", description: "Late-night screen use before target bedtime", source: "health" },
    { key: "posture_strain", label: "Posture strain", description: "Phone ergonomics / sedentary block questionnaire", source: "user" },
    { key: "eye_strain", label: "Eye strain", description: "Dry eye, focus strain, or reading marathon tags", source: "user" },
    { key: "neck_device_use", label: "Neck / device use", description: "Sustained down-gaze or workstation posture proxy", source: "user" },
  ],
  medications: [
    { key: "nsaid_days", label: "NSAID days / mo", description: "Analgesic days per month (MOH / rebound risk)", source: "user" },
    { key: "triptan_freq", label: "Triptan frequency", description: "Acute migraine-specific med use count", source: "user" },
    { key: "combo_overuse", label: "Combo overuse", description: "Multiple acute med classes same week", source: "user" },
    { key: "alcohol", label: "Alcohol (wine+)", description: "Units logged; red wine tagged separately if diary allows", source: "user" },
    { key: "nicotine", label: "Nicotine exposure", description: "Vape / cigarette exposure self-report", source: "user" },
  ],
  medical: [
    { key: "bp_elevated", label: "BP elevated days", description: "Home / clinic BP above patient threshold", source: "sensor" },
    { key: "sinus_symptoms", label: "Sinus symptoms", description: "Sinus pressure or infection symptom days", source: "user" },
    { key: "tmj_pain", label: "TMJ / jaw pain", description: "TMJ questionnaire or dentist-integrated score", source: "user" },
    { key: "neck_stiffness", label: "Neck / C-spine", description: "Cervical stiffness or PT-reported strain", source: "user" },
    { key: "orthostatic", label: "Orthostatic symptoms", description: "Lightheaded on standing (if tracked)", source: "user" },
  ],
  neurological: [
    { key: "photophobia_diary", label: "Photophobia diary", description: "Daily light sensitivity severity", source: "user" },
    { key: "phonophobia", label: "Phonophobia", description: "Sound sensitivity reporting", source: "user" },
    { key: "osmophobia", label: "Osmophobia", description: "Smell sensitivity", source: "user" },
    { key: "motion_sens", label: "Motion sensitivity", description: "Cars, boats, visual motion triggers", source: "user" },
    { key: "sensory_threshold", label: "Trigger threshold", description: "Composite low-threshold nervous system proxy", source: "user" },
  ],
};

function axisPropertyScore(
  categoryId: string,
  propertyKey: string,
  p: MigraineTypePrediction
): number {
  const { impact: i } = p;
  const t = p.type;
  switch (categoryId) {
    case "genetic": {
      const base = (i.pain + i.neuro + i.aura) / 3;
      const hem = t.includes("Hemiplegic") ? 12 : 0;
      const map: Record<string, number> = {
        mother_migraine: base * 0.95 + hem,
        father_migraine: base * 0.85 + 5,
        sibling_migraine: base * 0.9 + 3,
        early_onset: i.neuro * 0.55 + i.frequency * 0.25,
        familial_severity: i.pain * 0.65 + i.frequency * 0.3,
      };
      return clamp100(map[propertyKey] ?? base);
    }
    case "dietary":
      return clamp100(
        ({
          chocolate: i.frequency * 0.35 + i.pain * 0.45,
          aged_cheese: i.vestibular * 0.25 + i.pain * 0.55,
          processed_meat: i.neuro * 0.3 + i.pain * 0.5,
          msg_processed: i.frequency * 0.4 + i.neuro * 0.35,
          caffeine_swing: i.frequency * 0.55 + i.pain * 0.35,
          skipped_meals: i.frequency * 0.6 + i.vestibular * 0.2,
        } as Record<string, number>)[propertyKey] ?? i.pain * 0.5
      );
    case "sleep":
      return clamp100(
        ({
          sleep_debt_h: i.frequency * 0.5 + i.pain * 0.4,
          fragmentation: i.neuro * 0.45 + i.vestibular * 0.35,
          schedule_jitter: i.frequency * 0.65 + i.neuro * 0.2,
          oversleep_days: i.vestibular * 0.35 + i.frequency * 0.45,
          short_sleep: i.pain * 0.55 + i.frequency * 0.35,
          social_jetlag: i.frequency * 0.5 + i.vestibular * 0.3,
        } as Record<string, number>)[propertyKey] ?? i.frequency * 0.5
      );
    case "stress":
      return clamp100(
        ({
          hrv_stress: i.frequency * 0.45 + i.neuro * 0.4,
          self_anxiety: i.neuro * 0.5 + i.aura * 0.25,
          work_stress: i.frequency * 0.55 + i.pain * 0.3,
          letdown_weekend: i.frequency * 0.6 + i.vestibular * 0.2,
          life_events: i.pain * 0.45 + i.frequency * 0.4,
        } as Record<string, number>)[propertyKey] ?? i.frequency * 0.45
      );
    case "hormonal":
      return clamp100(
        ({
          perimenstrual: i.hormonal * 0.95 + (t.includes("Menstrual") ? 8 : 0),
          estrogen_drop: i.hormonal * 0.9,
          oral_contraceptive: i.hormonal * 0.55 + 15,
          pregnancy_postpartum: i.hormonal * 0.5 + 10,
          hormone_therapy: i.hormonal * 0.65,
        } as Record<string, number>)[propertyKey] ?? i.hormonal * 0.7
      );
    case "environmental": {
      const env = (i.vision + i.vestibular + i.neuro) / 3;
      return clamp100(
        ({
          baro_delta: i.vestibular * 0.45 + i.neuro * 0.4,
          humidity_swing: i.vision * 0.35 + i.vestibular * 0.5,
          temp_swing: i.neuro * 0.4 + i.pain * 0.35,
          storm_front: i.vestibular * 0.5 + i.neuro * 0.45,
          wind_gust: i.vestibular * 0.55 + i.neuro * 0.3,
          aqi_pollen: i.vision * 0.4 + i.neuro * 0.45,
          bright_light: i.vision * 0.85 + i.neuro * 0.1,
          noise_exposure: i.neuro * 0.5 + i.vestibular * 0.35,
          strong_odor: i.neuro * 0.55 + i.vision * 0.25,
        } as Record<string, number>)[propertyKey] ?? env
      );
    }
    case "lifestyle":
      return clamp100(
        ({
          screen_hours: i.vision * 0.55 + i.pain * 0.3,
          evening_blue: i.frequency * 0.35 + i.vision * 0.55,
          posture_strain: i.pain * 0.45 + i.neuro * 0.35,
          eye_strain: i.vision * 0.75 + i.pain * 0.2,
          neck_device_use: i.pain * 0.4 + i.vestibular * 0.45,
        } as Record<string, number>)[propertyKey] ?? i.vision * 0.5
      );
    case "medications":
      return clamp100(
        ({
          nsaid_days: i.frequency * 0.7 + i.pain * 0.25 + (t.includes("Chronic") ? 10 : 0),
          triptan_freq: i.frequency * 0.55 + i.pain * 0.35,
          combo_overuse: i.frequency * 0.75 + (t.includes("Status") ? 8 : 0),
          alcohol: i.pain * 0.4 + i.neuro * 0.35,
          nicotine: i.neuro * 0.4 + i.aura * 0.25,
        } as Record<string, number>)[propertyKey] ?? i.frequency * 0.55
      );
    case "medical":
      return clamp100(
        ({
          bp_elevated: i.pain * 0.45 + i.neuro * 0.35 + (t.includes("Status") ? 10 : 0),
          sinus_symptoms: i.neuro * 0.35 + i.pain * 0.45,
          tmj_pain: i.pain * 0.5 + i.neuro * 0.3,
          neck_stiffness: i.neuro * 0.4 + i.vestibular * 0.4 + i.pain * 0.2,
          orthostatic: i.vestibular * 0.55 + i.neuro * 0.3,
        } as Record<string, number>)[propertyKey] ?? i.pain * 0.45
      );
    case "neurological":
      return clamp100(
        ({
          photophobia_diary: i.vision * 0.85 + i.aura * 0.1,
          phonophobia: i.neuro * 0.45 + i.aura * 0.4,
          osmophobia: i.neuro * 0.5 + i.vision * 0.3,
          motion_sens: i.vestibular * 0.7 + i.neuro * 0.25,
          sensory_threshold: i.neuro * 0.45 + i.aura * 0.35 + i.vision * 0.2,
        } as Record<string, number>)[propertyKey] ?? (i.neuro + i.aura) / 2
      );
    default:
      return 0;
  }
}

function categoryAxisChartData(categoryId: string, prediction: MigraineTypePrediction) {
  const props = CATEGORY_AXIS_PROPERTIES[categoryId];
  if (!props) return [];
  return props.map((ap) => ({
    label: ap.label,
    description: ap.description,
    source: ap.source,
    value: axisPropertyScore(categoryId, ap.key, prediction),
  }));
}

const SOURCE_LABEL: Record<AxisProperty["source"], string> = {
  user: "User input",
  sensor: "Device sensor",
  api: "External API",
  health: "Health platform",
};

const TRIGGER_CATEGORIES = [
  {
    id: "genetic",
    emoji: "🧬",
    title: "Genetic factors",
    dataOrigin: "User: onboarding questionnaire. No sensor required.",
    bullets: ["Family history (very strong link)", "If parents have migraines → higher risk"],
  },
  {
    id: "dietary",
    emoji: "🍔",
    title: "Dietary triggers",
    dataOrigin: "User: meal log, quick tags, optional barcode. Can add voice note → NLP later.",
    bullets: [
      "Chocolate",
      "Cheese (especially aged)",
      "Processed meats (nitrates)",
      "MSG",
      "Caffeine (too much OR withdrawal)",
      "Skipping meals / fasting",
    ],
  },
  {
    id: "sleep",
    emoji: "😴",
    title: "Sleep issues",
    dataOrigin: "Sensor: watch / ring (Health Connect, Apple Health). Phone motion fallback. User can correct wake times.",
    bullets: ["Lack of sleep", "Oversleeping", "Irregular sleep schedule"],
  },
  {
    id: "stress",
    emoji: "😓",
    title: "Stress & emotions",
    dataOrigin: "Sensor: HRV-based stress (Garmin / Apple Watch). User: 1-tap mood + journal entries.",
    bullets: ["Stress (most common trigger)", "Anxiety", "Sudden relaxation after stress (“weekend migraine”)"],
  },
  {
    id: "hormonal",
    emoji: "💊",
    title: "Hormonal changes",
    dataOrigin: "User: cycle tracking. Health platform optional (Apple Cycle Tracking). Clinician flags for pregnancy/HRT.",
    bullets: ["Menstruation", "Pregnancy", "Birth control pills"],
    note: "Especially in females",
  },
  {
    id: "environmental",
    emoji: "🌦️",
    title: "Environmental factors",
    dataOrigin: "API: Open-Meteo / Apple Weather (pressure, RH, temp). Sensor: lux meter, mic dB (with consent). User: odor check-ins.",
    bullets: ["Bright lights", "Loud noise", "Strong smells (perfume, smoke)", "Weather changes (pressure, humidity)"],
  },
  {
    id: "lifestyle",
    emoji: "💻",
    title: "Lifestyle & screen exposure",
    dataOrigin: "Health / device: Screen Time (iOS), Digital Wellbeing (Android). User: ergonomics prompts.",
    bullets: ["Long screen time", "Poor posture", "Eye strain"],
  },
  {
    id: "medications",
    emoji: "💉",
    title: "Medications & substances",
    dataOrigin: "User: med diary, refill reminders. Optional EHR link later—not assumed here.",
    bullets: ["Overuse of painkillers → rebound headaches", "Alcohol (especially red wine)", "Nicotine"],
  },
  {
    id: "medical",
    emoji: "⚕️",
    title: "Medical conditions",
    dataOrigin: "Sensor: Bluetooth BP cuff. User: symptom toggles (sinus, TMJ, neck). PT forms optional.",
    bullets: ["Hypertension", "Sinusitis", "TMJ disorder", "Neck/spine issues"],
    note: "Less common but important",
  },
  {
    id: "neurological",
    emoji: "🧠",
    title: "Neurological sensitivity",
    dataOrigin: "User: daily 0–10 sensory sliders tied to headache diary. No extra hardware.",
    bullets: ["More sensitive nervous systems", "Lower threshold for triggers"],
  },
] as const;

type TelemetryRow = { label: string; value: number; description: string; source: AxisProperty["source"] };

function TelemetryCategoryCard({
  cat,
  chartData,
  accent,
  profileLabel,
  prediction,
}: {
  cat: (typeof TRIGGER_CATEGORIES)[number];
  chartData: TelemetryRow[];
  accent: string;
  profileLabel: string;
  prediction: MigraineTypePrediction;
}) {
  const meta = CATEGORY_VIZ[cat.id];
  const viz = meta?.viz ?? "verticalBar";

  const chartBlock = (() => {
    switch (viz) {
      case "sleep_area": {
        const sleepData = buildSleepHoursSeries(prediction);
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sleepData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis domain={[4, 10]} tick={{ fontSize: 10 }} label={{ value: "h sleep", angle: -90, position: "insideLeft", fontSize: 10 }} />
              <ReferenceLine y={7.5} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "Target ~7.5h", fill: "#64748b", fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [`${v} h`, "Time asleep"]} labelFormatter={(d) => `Night ${d}`} />
              <Area type="monotone" dataKey="hours" stroke={accent} fill={accent} fillOpacity={0.25} name="Hours" />
            </AreaChart>
          </ResponsiveContainer>
        );
      }
      case "stress_line": {
        const stressData = buildStressIndexSeries(prediction);
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stressData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="stress" domain={[0, 100]} tick={{ fontSize: 10 }} width={36} />
              <YAxis yAxisId="hrv" orientation="right" domain={[-2, 2]} tick={{ fontSize: 10 }} width={36} label={{ value: "HRV z", angle: 90, position: "insideRight", fontSize: 9 }} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === "stressIndex" ? [`${value}`, "Stress index (0–100)"] : [`${value}`, "HRV vs baseline (z)"]
                }
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="stress" type="monotone" dataKey="stressIndex" stroke={accent} strokeWidth={2} dot={{ r: 3 }} name="Stress index" />
              <Line yAxisId="hrv" type="monotone" dataKey="hrvZ" stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="HRV z" />
            </LineChart>
          </ResponsiveContainer>
        );
      }
      case "weather_composed": {
        const envData = buildEnvWeatherSeries(prediction);
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={envData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="rh" domain={[0, 100]} tick={{ fontSize: 10 }} width={32} label={{ value: "% RH", angle: -90, position: "insideLeft", fontSize: 9 }} />
              <YAxis yAxisId="hpa" orientation="right" domain={[995, 1035]} tick={{ fontSize: 10 }} width={40} label={{ value: "hPa", angle: 90, position: "insideRight", fontSize: 9 }} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === "humidityPct" ? [`${value}%`, "Relative humidity"] : [`${value} hPa`, "Sea-level pressure"]
                }
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area yAxisId="rh" type="monotone" dataKey="humidityPct" fill="#38bdf8" fillOpacity={0.35} stroke="#0284c7" name="humidityPct" />
              <Line yAxisId="hpa" type="monotone" dataKey="pressureHpa" stroke={accent} strokeWidth={2} dot={{ r: 2 }} name="pressureHpa" />
            </ComposedChart>
          </ResponsiveContainer>
        );
      }
      case "radar": {
        const radarRows = chartData.map((d) => ({
          subject: d.label,
          signal: d.value,
          description: d.description,
          source: d.source,
        }));
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarRows} margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="Patient signal" dataKey="signal" stroke={accent} fill={accent} fillOpacity={0.45} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as { subject: string; signal: number; description: string; source: AxisProperty["source"] };
                  return (
                    <div className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs shadow-sm max-w-[280px]">
                      <p className="font-medium text-gray-900">{d.subject}</p>
                      <p className="text-gray-600 mt-1">{d.description}</p>
                      <p className="text-gray-500 mt-1">{SOURCE_LABEL[d.source]}</p>
                      <p className="text-indigo-700 mt-1 font-mono">{d.signal} / 100</p>
                    </div>
                  );
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        );
      }
      case "radial_lifestyle": {
        const radialData = chartData.map((d, i) => ({
          name: d.label,
          value: d.value,
          fill: COLORS[i % COLORS.length],
        }));
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="18%" outerRadius="100%" data={radialData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <PolarAngleAxis type="category" dataKey="name" tick={{ fontSize: 8 }} />
              <RadialBar background dataKey="value" cornerRadius={4} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 9 }} formatter={(value) => (value.length > 14 ? `${value.slice(0, 12)}…` : value)} />
              <Tooltip formatter={(value: number) => [`${value} / 100`, "Intensity"]} />
            </RadialBarChart>
          </ResponsiveContainer>
        );
      }
      case "pie_share": {
        const pieData = chartData.map((d) => ({
          ...d,
          value: Math.max(5, d.value),
        }));
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="48%"
                innerRadius={36}
                outerRadius={72}
                paddingAngle={2}
                label={(props) => {
                  const name = typeof props.name === "string" ? props.name : (props as { label?: string }).label ?? "";
                  const pct = (props.percent ?? 0) * 100;
                  return `${name} ${pct.toFixed(0)}%`;
                }}
              >
                {pieData.map((_, i) => (
                  <Cell key={`pie-${i}`} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _n, props) => {
                  const pl = props?.payload as TelemetryRow & { value: number };
                  return [`${value} (weight)`, SOURCE_LABEL[pl?.source ?? "user"]];
                }}
                labelFormatter={(_l, p) => (p?.[0]?.payload as TelemetryRow)?.description ?? ""}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      case "horizontalBar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="label" width={118} tick={{ fontSize: 9 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as TelemetryRow;
                  return (
                    <div className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs shadow-sm max-w-[260px]">
                      <p className="font-medium text-gray-900">{row.label}</p>
                      <p className="text-gray-600 mt-1">{row.description}</p>
                      <p className="text-gray-500 mt-1">{SOURCE_LABEL[row.source]}</p>
                      <p className="text-indigo-700 mt-1 font-mono">{row.value} / 100</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" fill={accent} radius={[0, 4, 4, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "verticalBar":
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 6, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-38} textAnchor="end" height={chartData.length > 6 ? 90 : 76} />
              <YAxis domain={[0, 100]} width={34} tick={{ fontSize: 10 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as TelemetryRow;
                  return (
                    <div className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs shadow-sm max-w-[280px]">
                      <p className="font-medium text-gray-900">{row.label}</p>
                      <p className="text-gray-600 mt-1">{row.description}</p>
                      <p className="text-gray-500 mt-1">{SOURCE_LABEL[row.source]}</p>
                      <p className="text-indigo-700 mt-1 font-mono">{row.value} / 100</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" fill={accent} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  })();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col h-full">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <span aria-hidden>{cat.emoji}</span>
          {cat.title}
        </h3>
        {"note" in cat && cat.note ? <p className="text-xs text-gray-500 mt-1">{cat.note}</p> : null}
        <p className="text-[11px] text-gray-600 mt-2 leading-snug border-l-2 border-indigo-200 pl-2">{cat.dataOrigin}</p>
        <ul className="mt-2 text-xs text-gray-600 space-y-0.5 list-disc list-inside">
          {cat.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-gray-500 mb-1">
        <span className="font-medium text-gray-700">{meta?.chartHint ?? "Signal chart."}</span> Demo data is aligned to{" "}
        <span className="font-medium text-gray-800">{profileLabel}</span> — swap in live payloads keyed as in{" "}
        <code className="text-[10px]">CATEGORY_AXIS_PROPERTIES</code>.
      </p>
      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">{viz.replace(/_/g, " ")}</p>
      <div className="flex-1 min-h-[260px]">{chartBlock}</div>
    </div>
  );
}

type PatientAnalyticsPredictionPageProps = {
  /** When true, strip full-page chrome for use inside doctor patient detail. */
  embedded?: boolean
  /** Shown in the analytics banner when embedded in a patient profile. */
  patientName?: string | null
  /** Patient id for loading patient-specific analytics. */
  patientId?: string | null
}

export default function PatientAnalyticsPredictionPage({
  embedded = false,
  patientName = null,
  patientId = null,
}: PatientAnalyticsPredictionPageProps) {
  const [modelPayload, setModelPayload] = React.useState<AnalyticsPayload | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const endpoint = patientId
      ? `/api/patients/${patientId}/analytics`
      : "/model/patient_analytics_prediction.json"
    fetch(endpoint, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load model output: ${res.status}`);
        return res.json();
      })
      .then((payload: AnalyticsPayload) => {
        if (cancelled) return;
        const hasPredictions = Array.isArray(payload?.predictions) && payload.predictions.length > 0;
        const hasNext = Boolean(payload?.nextAttack?.predictedType);
        const hasNextHint = Boolean(payload?.nextAttackUnavailableReason?.trim());
        if (hasPredictions || hasNext || hasNextHint) {
          setModelPayload(payload);
        }
      })
      .catch(() => {
        // Keep fallback demo values if model output is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const activePredictions =
    modelPayload?.predictions && modelPayload.predictions.length > 0
      ? modelPayload.predictions
      : FALLBACK_MIGRAINE_PREDICTIONS;

  const sortedPredictions = [...activePredictions].sort((a, b) => b.probability - a.probability);
  const topPrediction = sortedPredictions[0];

  const probabilityChartData = sortedPredictions.map((p) => ({
    type: p.type.replace("migraine", "").trim(),
    probability: p.probability,
    fullType: p.type,
  }));

  const topCategoryData = (Object.keys(topPrediction.impact) as Array<keyof MigraineTypePrediction["impact"]>)
    .map((key) => ({
      category: categoryLabelMap[key],
      score: topPrediction.impact[key],
    }))
    .sort((a, b) => b.score - a.score);

  const symptomShareData = topCategoryData.slice(0, 5);

  const next = modelPayload?.nextAttack;

  return (
    <div className={embedded ? 'min-h-0' : 'min-h-screen bg-gray-50 p-4'}>
      <div className={embedded ? 'max-w-full mx-auto space-y-6' : 'max-w-7xl mx-auto space-y-6'}>
        <div className="bg-linear-to-r from-blue-600 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <h1 className="text-2xl sm:text-3xl font-bold">Patient Migraine Prediction Analytics</h1>
          <p className="text-blue-100 mt-1">
            {patientName
              ? `Model outputs and symptom impact for ${patientName}.`
              : 'Single-page view with model outputs and symptom impact analytics'}
          </p>
          <div className="text-sm text-blue-100 mt-2">
            Updated:{" "}
            {modelPayload?.generatedAt
              ? new Date(modelPayload.generatedAt).toLocaleString()
              : new Date().toLocaleString()}
          </div>
        </div>

        {modelPayload && !next?.predictedType && modelPayload.nextAttackUnavailableReason ? (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-slate-800 mb-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
              <h2 className="text-lg font-semibold">Next migraine attack forecast</h2>
            </div>
            <p className="text-sm text-slate-700">{modelPayload.nextAttackUnavailableReason}</p>
            <p className="text-xs text-slate-500 mt-3">
              After the model API is updated: run{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">POST /pipeline/run-next</code> once to
              train the bundle, then reload the page.
            </p>
          </div>
        ) : null}

        {next?.predictedType ? (
          <NextAttackForecastCard
            nextAttack={next}
            disclaimer={modelPayload?.nextAttackDisclaimer}
            variant="doctor"
          />
        ) : null}


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-blue-200 p-5 lg:col-span-2">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Brain className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Predicted Migraine Type</h2>
            </div>
            <p className="text-2xl font-bold text-gray-900">{topPrediction.type}</p>
            <p className="text-sm text-gray-600 mt-2">{topPrediction.summary}</p>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Most influential symptoms/properties</p>
              <div className="flex flex-wrap gap-2">
                {topPrediction.keySymptoms.map((s) => (
                  <span key={s} className="px-3 py-1 text-sm rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-indigo-700 mb-2">
              <Activity className="w-5 h-5" />
              <h3 className="text-base font-semibold">Confidence</h3>
            </div>
            <p className="text-4xl font-bold text-indigo-700">{topPrediction.probability}%</p>
            <p className="text-sm text-gray-600 mt-2">{confidenceMeaning(topPrediction.probability)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">All Migraine Type Prediction Outputs</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={probabilityChartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" angle={-25} textAnchor="end" interval={0} height={72} />
                <YAxis domain={[0, 40]} />
                <Tooltip formatter={(value: number, _name, payload) => [`${value}%`, payload?.payload?.fullType]} />
                <Bar dataKey="probability" radius={[6, 6, 0, 0]}>
                  {probabilityChartData.map((_, index) => (
                    <Cell key={`prob-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Type Category Impact</h3>
            <p className="text-sm text-gray-600 mb-3">
              Which symptom/property groups affected <span className="font-medium">{topPrediction.type}</span> the most.
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategoryData} layout="vertical" margin={{ top: 4, right: 8, left: 10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="category" width={130} />
                  <Tooltip formatter={(value: number) => [`${value} / 100`, "Impact score"]} />
                  <Bar dataKey="score" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Dominant Symptom Share</h3>
            <p className="text-sm text-gray-600 mb-3">Relative contribution among top 5 strongest categories.</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={symptomShareData}
                    dataKey="score"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  >
                    {symptomShareData.map((_, i) => (
                      <Cell key={`share-cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} / 100`, "Impact score"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

{/*         <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Mobile telemetry by trigger domain</h3>
          </div>
          <p className="text-sm text-gray-600 mb-5">
            Each card maps to what you can collect on-device: user forms, wearables (sleep, HRV), phone sensors (lux, mic with consent), health
            SDKs (Screen Time), and public weather/air-quality APIs. Chart type matches the data shape (trend week vs multi-axis snapshot vs share
            of diary tags). Replace demo series with your persisted <span className="font-medium">key</span> payloads from{" "}
            <code className="text-xs">CATEGORY_AXIS_PROPERTIES</code>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {TRIGGER_CATEGORIES.map((cat, i) => {
              const chartData = categoryAxisChartData(cat.id, topPrediction);
              return (
                <TelemetryCategoryCard
                  key={cat.id}
                  cat={cat}
                  chartData={chartData}
                  accent={COLORS[i % COLORS.length]}
                  profileLabel={topPrediction.type}
                  prediction={topPrediction}
                />
              );
            })}
          </div>
        </div> */}

{/*         <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Category effects by migraine type</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Symptom/property impact scores from the model for each migraine class. Bars show the top four drivers for that type.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedPredictions.map((prediction, pi) => {
              const ranked = (Object.keys(prediction.impact) as Array<keyof MigraineTypePrediction["impact"]>)
                .map((key) => ({
                  key,
                  label: categoryLabelMap[key],
                  value: prediction.impact[key],
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 4);

              const barData = ranked.map((r) => ({ ...r, label: r.label }));
              const accent = COLORS[pi % COLORS.length];

              return (
                <div key={prediction.type} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h4 className="font-semibold text-gray-900 text-sm leading-snug">{prediction.type}</h4>
                    <span className="text-xs font-medium px-2 py-1 rounded shrink-0 bg-indigo-100 text-indigo-700">
                      {prediction.probability}%
                    </span>
                  </div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} layout="vertical" margin={{ top: 2, right: 8, left: 4, bottom: 2 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="label" width={118} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => [`${v} / 100`, "Impact"]} />
                        <Bar dataKey="value" fill={accent} radius={[0, 4, 4, 0]} maxBarSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </div> */}

{/*         <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Hormonal vs. vestibular burden (by type)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Highlights how strongly hormone-related triggers and balance/vertigo load differ across subtypes for this patient.
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedPredictions.map((p) => ({
                  label: shortType(p.type),
                  fullType: p.type,
                  hormonal: p.impact.hormonal,
                  vestibular: p.impact.vestibular,
                }))}
                margin={{ top: 8, right: 8, left: 4, bottom: 48 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" angle={-25} textAnchor="end" interval={0} height={64} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value: number) => [`${value}`, ""]}
                  labelFormatter={(_, p) => (p?.[0]?.payload?.fullType as string) ?? ""}
                />
                <Legend />
                <Bar dataKey="hormonal" fill="#db2777" name="Hormonal load" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vestibular" fill="#0891b2" name="Vestibular load" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div> */}
      </div>
    </div>
  );
}
