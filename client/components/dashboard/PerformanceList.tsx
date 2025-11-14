'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: string;
  name: string;
  avatar?: string;
  class: string;
  performance: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
}

interface PerformanceListProps {
  students?: Student[];
}

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    class: '10A',
    performance: 95,
    status: 'excellent'
  },
  {
    id: '2', 
    name: 'Bob Smith',
    class: '10B',
    performance: 87,
    status: 'good'
  },
  {
    id: '3',
    name: 'Carol Davis',
    class: '10A',
    performance: 92,
    status: 'excellent'
  },
  {
    id: '4',
    name: 'David Wilson',
    class: '10C',
    performance: 78,
    status: 'good'
  },
  {
    id: '5',
    name: 'Eva Brown',
    class: '10B',
    performance: 65,
    status: 'average'
  }
];

export default function PerformanceList({ students = mockStudents }: PerformanceListProps) {
  const getStatusColor = (status: Student['status']) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'average':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (performance: number) => {
    if (performance >= 90) return 'bg-green-500';
    if (performance >= 75) return 'bg-blue-500';
    if (performance >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-800">Student Performance</h3>
        <Badge variant="secondary" className="text-xs">
          {students.length} Students
        </Badge>
      </div>
      
      <div className="space-y-3 md:space-y-4">
        {students.map((student) => (
          <div key={student.id} className="flex items-center space-x-3 md:space-x-4 p-2 md:p-3 rounded-xl hover:bg-gray-50/80 transition-colors">
            <Avatar className="w-8 h-8 md:w-10 md:h-10 shrink-0">
              <AvatarImage src={student.avatar} alt={student.name} />
              <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-xs md:text-sm">
                {student.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-1 sm:space-y-0">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{student.name}</p>
                  <p className="text-xs text-gray-600">Class {student.class}</p>
                </div>
                <div className="flex items-center space-x-2 sm:text-right">
                  <p className="text-sm font-semibold text-gray-800">{student.performance}%</p>
                  <Badge className={`text-xs ${getStatusColor(student.status)} hidden sm:inline-flex`}>
                    {student.status}
                  </Badge>
                </div>
              </div>
              
              <div className="w-full">
                <Progress 
                  value={student.performance} 
                  className="h-2"
                />
              </div>
              
              {/* Mobile status badge */}
              <Badge className={`text-xs ${getStatusColor(student.status)} sm:hidden mt-1`}>
                {student.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
        View All Students →
      </button>
    </Card>
  );
}
