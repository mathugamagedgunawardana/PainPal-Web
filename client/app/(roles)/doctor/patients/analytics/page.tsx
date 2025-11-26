"use client"
import React, { useState } from 'react';
import { Activity, AlertCircle, Brain, Calendar, Clock, TrendingUp, Users, Zap } from 'lucide-react';

const MigraineDashboard = () => {
  const [activeTab, setActiveTab] = useState('diagnosis');

  // Sample patient data
  const patientData = {
    diagnosis: {
      type: 'Migraine with Aura',
      confidence: 92,
      subtype: 'Episodic Migraine'
    },
    severity: {
      level: 'Moderate',
      score: 6.5,
      trend: 'stable'
    },
    chronicRisk: {
      risk: 'Medium',
      probability: 35,
      factors: ['Frequency increase', 'Medication overuse']
    },
    disability: {
      midas: 21,
      hit6: 62,
      impact: 'Moderate Disability'
    },
    treatment: {
      recommended: ['Triptans', 'Beta-blockers', 'Sleep hygiene'],
      effectiveness: { triptans: 85, betaBlockers: 70, lifestyle: 60 }
    },
    forecast: {
      nextAttack: '3-5 days',
      intensity: 'Moderate-Severe',
      auraLikelihood: 75
    },
    aura: {
      types: ['Visual', 'Sensory'],
      duration: '20-30 minutes',
      pattern: 'Consistent'
    },
    redFlags: {
      status: 'Low Risk',
      strokeLike: false,
      warnings: []
    },
    clustering: {
      phenotype: 'Type A: High-Frequency Visual Aura',
      similarPatients: 147
    }
  };

  const tabs = [
    { id: 'diagnosis', label: 'Diagnosis', icon: Brain },
    { id: 'severity', label: 'Severity', icon: Activity },
    { id: 'risk', label: 'Risk Prediction', icon: AlertCircle },
    { id: 'treatment', label: 'Treatment', icon: Zap },
    { id: 'forecast', label: 'Attack Forecast', icon: Calendar },
    { id: 'aura', label: 'Aura Analysis', icon: TrendingUp },
    { id: 'redflags', label: 'Red Flags', icon: AlertCircle },
    { id: 'clustering', label: 'Patient Clustering', icon: Users }
  ];

  const renderDiagnosis = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-2">Migraine Type</h3>
        <p className="text-3xl font-bold text-blue-700">{patientData.diagnosis.type}</p>
        <p className="text-sm text-blue-600 mt-2">Confidence: {patientData.diagnosis.confidence}%</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-700 mb-2">Classification</h4>
        <p className="text-gray-600">{patientData.diagnosis.subtype}</p>
      </div>
    </div>
  );

  const renderSeverity = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-orange-900 mb-2">Severity Level</h3>
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
        </div>
      </div>
    </div>
  );

  const renderRisk = () => (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-purple-900 mb-2">Chronic Progression Risk</h3>
        <p className="text-3xl font-bold text-purple-700">{patientData.chronicRisk.risk}</p>
        <p className="text-sm text-purple-600 mt-2">Probability: {patientData.chronicRisk.probability}%</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-700 mb-3">Risk Factors</h4>
        <ul className="space-y-2">
          {patientData.chronicRisk.factors.map((factor, idx) => (
            <li key={idx} className="flex items-center text-gray-600">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              {factor}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderTreatment = () => (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-green-900 mb-4">Treatment Response Prediction</h3>
        {patientData.treatment.recommended.map((treatment, idx) => {
          // Map the displayed treatment labels to the typed effectiveness keys/values
          const labelMap: Record<string, number> = {
            'Triptans': patientData.treatment.effectiveness.triptans,
            'Beta-blockers': patientData.treatment.effectiveness.betaBlockers,
            'Sleep hygiene': patientData.treatment.effectiveness.lifestyle
          };
          const effectiveness = labelMap[treatment];
          const display = typeof effectiveness === 'number' ? `${effectiveness}%` : 'N/A';
          const width = typeof effectiveness === 'number' ? `${effectiveness}%` : '0%';

          return (
            <div key={idx} className="mb-4">
              <div className="flex justify-between text-sm text-green-700 mb-1">
                <span className="font-medium">{treatment}</span>
                <span>{display}</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderForecast = () => (
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
    </div>
  );

  const renderAura = () => (
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
    </div>
  );

  const renderRedFlags = () => (
    <div className="space-y-4">
      <div className={`border rounded-lg p-6 ${
        patientData.redFlags.status === 'Low Risk' 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <h3 className="text-xl font-semibold mb-2" style={{
          color: patientData.redFlags.status === 'Low Risk' ? '#065f46' : '#991b1b'
        }}>
          Neurological Red-Flag Assessment
        </h3>
        <p className="text-3xl font-bold mb-4" style={{
          color: patientData.redFlags.status === 'Low Risk' ? '#047857' : '#dc2626'
        }}>
          {patientData.redFlags.status}
        </p>
        <div className="space-y-2">
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-3 ${
              patientData.redFlags.strokeLike ? 'bg-red-500' : 'bg-green-500'
            }`}></span>
            <span className="text-gray-700">
              Stroke-like symptoms: {patientData.redFlags.strokeLike ? 'Present' : 'Not detected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClustering = () => (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-teal-900 mb-2">Patient Sub-Phenotype</h3>
        <p className="text-lg font-bold text-teal-700 mb-4">{patientData.clustering.phenotype}</p>
        <div className="bg-white rounded-lg p-4 border border-teal-100">
          <p className="text-sm text-teal-600 mb-1">Similar Patients in Database</p>
          <p className="text-2xl font-bold text-teal-800">{patientData.clustering.similarPatients}</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'diagnosis': return renderDiagnosis();
      case 'severity': return renderSeverity();
      case 'risk': return renderRisk();
      case 'treatment': return renderTreatment();
      case 'forecast': return renderForecast();
      case 'aura': return renderAura();
      case 'redflags': return renderRedFlags();
      case 'clustering': return renderClustering();
      default: return renderDiagnosis();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Migraine Prediction Dashboard</h1>
            <p className="text-blue-100">Comprehensive AI-Powered Migraine Analysis & Forecasting</p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50 overflow-x-auto">
            <div className="flex min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
          <div className="p-6">
            {renderContent()}
          </div>

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