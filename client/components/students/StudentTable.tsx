'use client';

import React from 'react';
import { Edit, Trash2, Eye, Mail, Phone, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Student } from '@/app/doctor/students/page';

interface StudentTableProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

export default function StudentTable({ students, onEdit, onDelete }: StudentTableProps) {
  const getStatusColor = (status: Student['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'graduated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 75) return 'text-blue-600';
    if (performance >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (students.length === 0) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-500">No students match your current search and filter criteria.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/80 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 font-medium text-gray-900">Student</th>
              <th className="text-left py-4 px-6 font-medium text-gray-900">Class</th>
              <th className="text-left py-4 px-6 font-medium text-gray-900">Contact</th>
              <th className="text-left py-4 px-6 font-medium text-gray-900">Performance</th>
              <th className="text-left py-4 px-6 font-medium text-gray-900">Status</th>
              <th className="text-left py-4 px-6 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={student.avatar} alt={`${student.firstName} ${student.lastName}`} />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {student.firstName[0]}{student.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div>
                    <p className="font-medium text-gray-900">{student.class}</p>
                    <p className="text-sm text-gray-500">{student.grade} Grade</p>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-3 h-3 mr-2" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-3 h-3 mr-2" />
                      <span>{student.phoneNumber}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="space-y-1">
                    <p className={`font-semibold ${getPerformanceColor(student.performance)}`}>
                      {student.performance}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {student.attendance}% attendance
                    </p>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <Badge className={getStatusColor(student.status)}>
                    {student.status}
                  </Badge>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(student)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(student.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden p-4 space-y-4">
        {students.map((student) => (
          <div key={student.id} className="bg-gray-50/50 rounded-xl p-4 space-y-3">
            {/* Student Info */}
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={student.avatar} alt={`${student.firstName} ${student.lastName}`} />
                <AvatarFallback className="bg-blue-500 text-white">
                  {student.firstName[0]}{student.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {student.firstName} {student.lastName}
                </p>
                <p className="text-sm text-gray-500">{student.class} - {student.grade} Grade</p>
              </div>
              <Badge className={getStatusColor(student.status)}>
                {student.status}
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2 shrink-0" />
                <span className="truncate">{student.email}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 shrink-0" />
                <span>{student.phoneNumber}</span>
              </div>
            </div>

            {/* Performance */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Performance</p>
                <p className={`font-semibold ${getPerformanceColor(student.performance)}`}>
                  {student.performance}% ({student.attendance}% attendance)
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(student)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(student.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
