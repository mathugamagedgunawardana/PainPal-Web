"use client"

import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  Brain,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
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
  RadialBarChart,
  RadialBar,
  Legend,
  CartesianGrid,
} from "recharts";

// Single-file React + Tailwind dashboard that uses recharts for visualization.
// Default-exported component so it can be previewed in the canvas.

const MigraineDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("diagnosis");

  // Sample patient data (taken from user's snippet)
  const patientData = {
    diagnosis: {
      type: "Migraine with Aura",
      confidence: 92,
      subtype: "Episodic Migraine",
    },
    severity: {
      level: "Moderate",
      score: 6.5,
      trend: "stable",
    },
    chronicRisk: {
      risk: "Medium",
      probability: 35,
      factors: ["Frequency increase", "Medication overuse"],
    },
    disability: {
      midas: 21,
      hit6: 62,
      impact: "Moderate Disability",
    },
    treatment: {
      recommended: ["Triptans", "Beta-blockers", "Sleep hygiene"],
      effectiveness: { triptans: 85, betaBlockers: 70, lifestyle: 60 },
    },
    forecast: {
      nextAttack: "3-5 days",
      intensity: "Moderate-Severe",
      auraLikelihood: 75,
    },
    aura: {
      types: ["Visual", "Sensory"],
      duration: "20-30 minutes",
      pattern: "Consistent",
    },
    redFlags: {
      status: "Low Risk",
      strokeLike: false,
      warnings: [],
    },
    clustering: {
      phenotype: "Type A: High-Frequency Visual Aura",
      similarPatients: 147,
    },
  } as const;

  const tabs = [
    { id: "diagnosis", label: "Diagnosis", icon: Brain },
    { id: "severity", label: "Severity", icon: Activity },
    { id: "risk", label: "Risk Prediction", icon: AlertCircle },
    { id: "treatment", label: "Treatment", icon: Zap },
    { id: "forecast", label: "Attack Forecast", icon: Calendar },
    { id: "aura", label: "Aura Analysis", icon: TrendingUp },
    { id: "redflags", label: "Red Flags", icon: AlertCircle },
    { id: "clustering", label: "Patient Clustering", icon: Users },
  ];

  // Chart-friendly formatted data
  const treatmentChartData = patientData.treatment.recommended.map((label) => {
    const map: Record<string, number> = {
      Triptans: patientData.treatment.effectiveness.triptans,
      "Beta-blockers": patientData.treatment.effectiveness.betaBlockers,
      "Sleep hygiene": patientData.treatment.effectiveness.lifestyle,
    };
    return { name: label, value: map[label] ?? 0 };
  });

  const disabilityData = [
    { name: "MIDAS", value: patientData.disability.midas },
    { name: "HIT-6", value: patientData.disability.hit6 },
  ];

  const riskPieData = [
    { name: "Chance", value: patientData.chronicRisk.probability },
    { name: "Remaining", value: 100 - patientData.chronicRisk.probability },
  ];

  const auraPieData = patientData.aura.types.map((t, i) => ({ name: t, value: 1 + i }));

  const severityRadialData = [
    { name: "Pain score", value: patientData.severity.score * 10 }, // scale to 0-100
  ];

  const COLORS = ["#10B981", "#06B6D4", "#F59E0B", "#EF4444"]; // tailwind green, cyan, amber, red

  // Small helper renderers
  const renderDiagnosisPane = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-2">Migraine Type</h3>
        <p className="text-3xl font-bold text-blue-700">{patientData.diagnosis.type}</p>
        <p className="text-sm text-blue-600 mt-2">Confidence: {patientData.diagnosis.confidence}%</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Subtype</p>
          <p className="text-lg font-semibold">{patientData.diagnosis.subtype}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Next Attack</p>
          <p className="text-lg font-semibold">{patientData.forecast.nextAttack}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Aura Likelihood</p>
          <p className="text-lg font-semibold">{patientData.forecast.auraLikelihood}%</p>
        </div>
      </div>
    </div>
  );

  const renderSeverityPane = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-1/3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="60%"
              outerRadius="100%"
              data={severityRadialData}
              startAngle={180}
              endAngle={-180}
            >
              <RadialBar
                minAngle={15}
                clockWise
                dataKey="value"
                cornerRadius={8}
              />
              <Legend verticalAlign="bottom" />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-semibold text-orange-900 mb-2">Severity</h3>
          <p className="text-3xl font-bold text-orange-700">{patientData.severity.level}</p>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-orange-600 mb-1">
              <span>Pain Score</span>
              <span>{patientData.severity.score}/10</span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-3">
              <div
                className="bg-orange-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(patientData.severity.score / 10) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Trend: {patientData.severity.trend}</p>
          </div>
        </div>
      </div>

      {/* Disability small chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Disability Scores</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={disabilityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Forecast Aura Likelihood</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="100%"
                barSize={12}
                data={[{ name: "aura", value: patientData.forecast.auraLikelihood }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar dataKey="value" cornerRadius={10} />
                <Legend verticalAlign="bottom" />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRiskPane = () => (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-purple-900 mb-2">Chronic Progression Risk</h3>
        <p className="text-3xl font-bold text-purple-700">{patientData.chronicRisk.risk}</p>
        <p className="text-sm text-purple-600 mt-2">Probability: {patientData.chronicRisk.probability}%</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Risk Breakdown</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  dataKey="value"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Risk Factors</p>
          <ul className="space-y-2">
            {patientData.chronicRisk.factors.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-gray-700">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderTreatmentPane = () => (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-green-900 mb-4">Treatment Response Prediction</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={treatmentChartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                {treatmentChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Notes</p>
        <p className="text-gray-700">Effectiveness predictions are model outputs and require clinical validation.</p>
      </div>
    </div>
  );

  const renderForecastPane = () => (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-indigo-900 mb-4">Next Attack Forecast</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-indigo-600 mb-1">Timing</p>
            <p className="text-lg font-bold text-indigo-800">{patientData.forecast.nextAttack}</p>
          </div>
          <div>
            <p className="text-sm text-indigo-600 mb-1">Expected Intensity</p>
            <p className="text-lg font-bold text-indigo-800">{patientData.forecast.intensity}</p>
          </div>
          <div>
            <p className="text-sm text-indigo-600 mb-1">Aura Likelihood</p>
            <p className="text-lg font-bold text-indigo-800">{patientData.forecast.auraLikelihood}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Aura Types</p>
        <div className="flex flex-wrap gap-2">
          {patientData.aura.types.map((t, i) => (
            <span key={i} className="px-3 py-1 bg-pink-100 rounded-full text-sm">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAuraPane = () => (
    <div className="space-y-4">
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-pink-900 mb-4">Aura Classification</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-pink-600 mb-1">Types Detected</p>
            <div className="flex flex-wrap gap-2">
              {patientData.aura.types.map((type, idx) => (
                <span key={idx} className="px-3 py-1 bg-pink-200 text-pink-800 rounded-full text-sm font-medium">
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-pink-600 mb-1">Duration</p>
            <p className="text-lg font-semibold text-pink-800">{patientData.aura.duration}</p>
          </div>

          <div>
            <p className="text-sm text-pink-600 mb-1">Pattern</p>
            <p className="text-lg font-semibold text-pink-800">{patientData.aura.pattern}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Aura Composition</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={auraPieData} dataKey="value" outerRadius={80} label>
                {auraPieData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderRedFlagsPane = () => (
    <div className="space-y-4">
      <div
        className={`border rounded-lg p-6 ${
          patientData.redFlags.status === "Low Risk" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}
      >
        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: patientData.redFlags.status === "Low Risk" ? "#065f46" : "#991b1b" }}
        >
          Neurological Red-Flag Assessment
        </h3>
        <p
          className="text-3xl font-bold mb-4"
          style={{ color: patientData.redFlags.status === "Low Risk" ? "#047857" : "#dc2626" }}
        >
          {patientData.redFlags.status}
        </p>

        <div className="space-y-2">
          <div className="flex items-center">
            <span
              className={`w-3 h-3 rounded-full mr-3 ${patientData.redFlags.strokeLike ? "bg-red-500" : "bg-green-500"}`}
            ></span>
            <span className="text-gray-700">Stroke-like symptoms: {patientData.redFlags.strokeLike ? "Present" : "Not detected"}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClusteringPane = () => (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-teal-900 mb-2">Patient Sub-Phenotype</h3>
        <p className="text-lg font-bold text-teal-700 mb-4">{patientData.clustering.phenotype}</p>
        <div className="bg-white rounded-lg p-4 border border-teal-100">
          <p className="text-sm text-teal-600 mb-1">Similar Patients in Database</p>
          <p className="text-2xl font-bold text-teal-800">{patientData.clustering.similarPatients}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Clustering Summary</p>
        <p className="text-gray-700">This phenotype groups patients who show frequent visual auras and similar response profiles.</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "diagnosis":
        return renderDiagnosisPane();
      case "severity":
        return renderSeverityPane();
      case "risk":
        return renderRiskPane();
      case "treatment":
        return renderTreatmentPane();
      case "forecast":
        return renderForecastPane();
      case "aura":
        return renderAuraPane();
      case "redflags":
        return renderRedFlagsPane();
      case "clustering":
        return renderClusteringPane();
      default:
        return renderDiagnosisPane();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">Migraine Prediction Dashboard</h1>
                <p className="text-blue-100">Comprehensive AI-Powered Migraine Analysis & Forecasting</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-blue-100 text-right">
                  <div>Patient: <span className="font-medium">Anonymous</span></div>
                  <div className="text-xs">Updated: {new Date().toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50 overflow-x-auto">
            <div className="flex min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon as any;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">{renderContent()}</div>

          {/* Disability Scores - Always Visible */}
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Disability Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">MIDAS Score</p>
                <p className="text-3xl font-bold text-gray-800">{patientData.disability.midas}</p>
                <p className="text-xs text-gray-500 mt-1">Grade III: Moderate Disability</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">HIT-6 Score</p>
                <p className="text-3xl font-bold text-gray-800">{patientData.disability.hit6}</p>
                <p className="text-xs text-gray-500 mt-1">Substantial Impact</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Overall Impact</p>
                <p className="text-xl font-bold text-gray-800">{patientData.disability.impact}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigraineDashboard;
