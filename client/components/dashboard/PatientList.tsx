'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Activity, Calendar } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  avatar?: string;
  age: number;
  migraineSeverity: 'mild' | 'moderate' | 'severe';
  riskScore: number;
  lastEpisode: string;
  status: 'stable' | 'improving' | 'monitoring' | 'critical';
}

interface PatientListProps {
  patients?: Patient[];
}

const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    age: 32,
    migraineSeverity: 'moderate',
    riskScore: 65,
    lastEpisode: '2024-11-10',
    status: 'stable'
  },
  {
    id: '2', 
    name: 'John Doe',
    age: 45,
    migraineSeverity: 'severe',
    riskScore: 85,
    lastEpisode: '2024-11-12',
    status: 'monitoring'
  },
  {
    id: '3',
    name: 'Emily Smith',
    age: 28,
    migraineSeverity: 'mild',
    riskScore: 35,
    lastEpisode: '2024-11-08',
    status: 'improving'
  },
  {
    id: '4',
    name: 'Michael Johnson',
    age: 38,
    migraineSeverity: 'moderate',
    riskScore: 55,
    lastEpisode: '2024-11-09',
    status: 'stable'
  },
  {
    id: '5',
    name: 'Anna Williams',
    age: 35,
    migraineSeverity: 'mild',
    riskScore: 40,
    lastEpisode: '2024-10-15',
    status: 'improving'
  }
];

export default function PatientList({ patients = mockPatients }: PatientListProps) {
  const getStatusColor = (status: Patient['status']) => {
    switch (status) {
      case 'stable':
        return 'bg-green-100 text-green-800';
      case 'improving':
        return 'bg-blue-100 text-blue-800';
      case 'monitoring':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: Patient['migraineSeverity']) => {
    switch (severity) {
      case 'mild':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'severe':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 70) return 'bg-red-500';
    if (riskScore >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <h3 className="text-base md:text-lg font-semibold text-gray-800">Recent Patients</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {patients.length} Patients
        </Badge>
      </div>
      
      <div className="space-y-3 md:space-y-4">
        {patients.map((patient) => (
          <div key={patient.id} className="flex items-center space-x-3 md:space-x-4 p-2 md:p-3 rounded-xl hover:bg-gray-50/80 transition-colors">
            <Avatar className="w-8 h-8 md:w-10 md:h-10 shrink-0">
              <AvatarImage src={patient.avatar} alt={patient.name} />
              <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-xs md:text-sm">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-1 sm:space-y-0">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{patient.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>Age {patient.age}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(patient.lastEpisode)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:text-right">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">Risk: {patient.riskScore}%</p>
                    <div className="flex gap-1">
                      <Badge className={`text-xs ${getSeverityColor(patient.migraineSeverity)} hidden sm:inline-flex`}>
                        {patient.migraineSeverity}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(patient.status)} hidden sm:inline-flex`}>
                        {patient.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Risk Assessment</span>
                  <Activity className="h-3 w-3 text-gray-400" />
                </div>
                <Progress 
                  value={patient.riskScore} 
                  className="h-2"
                />
              </div>
              
              {/* Mobile badges */}
              <div className="flex gap-1 sm:hidden mt-2">
                <Badge className={`text-xs ${getSeverityColor(patient.migraineSeverity)}`}>
                  {patient.migraineSeverity}
                </Badge>
                <Badge className={`text-xs ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
        View All Patients →
      </button>
    </Card>
  );
}
