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
} from "recharts";

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

const migrainePredictions: MigraineTypePrediction[] = [
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

export default function PatientAnalyticsPredictionPage() {
  const sortedPredictions = [...migrainePredictions].sort((a, b) => b.probability - a.probability);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-linear-to-r from-blue-600 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <h1 className="text-3xl font-bold">Patient Migraine Prediction Analytics</h1>
          <p className="text-blue-100 mt-1">Single-page view with model outputs and symptom impact analytics</p>
          <div className="text-sm text-blue-100 mt-2">Updated: {new Date().toLocaleString()}</div>
        </div>

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
            <p className="text-sm text-gray-600 mt-2">Highest probability among all migraine type classes.</p>
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

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Category Effects By Migraine Type</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Each card shows which symptom/property categories have the strongest effect for that migraine type in this patient.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedPredictions.map((prediction) => {
              const ranked = (Object.keys(prediction.impact) as Array<keyof MigraineTypePrediction["impact"]>)
                .map((key) => ({
                  key,
                  label: categoryLabelMap[key],
                  value: prediction.impact[key],
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 4);

              return (
                <div key={prediction.type} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h4 className="font-semibold text-gray-900">{prediction.type}</h4>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-indigo-100 text-indigo-700">
                      {prediction.probability}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    {ranked.map((row) => (
                      <div key={row.key}>
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>{row.label}</span>
                          <span>{row.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${row.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
