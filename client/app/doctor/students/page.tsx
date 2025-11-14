'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Filter, Brain, AlertTriangle, Calendar, Activity } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PatientForm from '@/components/patients/PatientForm';
import PatientTable from '@/components/patients/PatientTable';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  registrationDate: string;
  status: 'active' | 'inactive' | 'discharged';
  avatar?: string;
  migraineSeverity: 'mild' | 'moderate' | 'severe';
  lastEpisodeDate: string;
  totalEpisodes: number;
  currentMedication: string;
  triggers: string[];
  doctorId: string;
}

const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@email.com',
    age: 32,
    gender: 'female',
    dateOfBirth: '1991-05-15',
    phoneNumber: '+1234567890',
    address: '123 Main St, City, State',
    emergencyContact: 'Robert Chen',
    emergencyPhone: '+1234567891',
    registrationDate: '2023-08-15',
    status: 'active',
    migraineSeverity: 'moderate',
    lastEpisodeDate: '2024-11-10',
    totalEpisodes: 24,
    currentMedication: 'Sumatriptan',
    triggers: ['stress', 'lack of sleep', 'bright lights'],
    doctorId: 'doc-001'
  },
  {
    id: '2',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    age: 45,
    gender: 'male',
    dateOfBirth: '1979-03-22',
    phoneNumber: '+1234567892',
    address: '456 Oak Ave, City, State',
    emergencyContact: 'Jane Doe',
    emergencyPhone: '+1234567893',
    registrationDate: '2023-09-15',
    status: 'active',
    migraineSeverity: 'severe',
    lastEpisodeDate: '2024-11-12',
    totalEpisodes: 48,
    currentMedication: 'Rizatriptan',
    triggers: ['weather changes', 'hormonal changes', 'alcohol'],
    doctorId: 'doc-001'
  },
  {
    id: '3',
    firstName: 'Emily',
    lastName: 'Smith',
    email: 'emily.smith@email.com',
    age: 28,
    gender: 'female',
    dateOfBirth: '1996-07-10',
    phoneNumber: '+1234567894',
    address: '789 Pine Rd, City, State',
    emergencyContact: 'Michael Smith',
    emergencyPhone: '+1234567895',
    registrationDate: '2024-01-15',
    status: 'active',
    migraineSeverity: 'mild',
    lastEpisodeDate: '2024-11-08',
    totalEpisodes: 12,
    currentMedication: 'Ibuprofen',
    triggers: ['dehydration', 'certain foods', 'stress'],
    doctorId: 'doc-001'
  },
  {
    id: '4',
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.johnson@email.com',
    age: 38,
    gender: 'male',
    dateOfBirth: '1986-01-18',
    phoneNumber: '+1234567896',
    address: '321 Elm St, City, State',
    emergencyContact: 'Lisa Johnson',
    emergencyPhone: '+1234567897',
    registrationDate: '2023-10-15',
    status: 'active',
    migraineSeverity: 'moderate',
    lastEpisodeDate: '2024-11-09',
    totalEpisodes: 32,
    currentMedication: 'Naratriptan',
    triggers: ['bright lights', 'strong smells', 'fatigue'],
    doctorId: 'doc-001'
  },
  {
    id: '5',
    firstName: 'Anna',
    lastName: 'Williams',
    email: 'anna.williams@email.com',
    age: 35,
    gender: 'female',
    dateOfBirth: '1989-09-25',
    phoneNumber: '+1234567898',
    address: '654 Maple Dr, City, State',
    emergencyContact: 'David Williams',
    emergencyPhone: '+1234567899',
    registrationDate: '2024-02-15',
    status: 'inactive',
    migraineSeverity: 'mild',
    lastEpisodeDate: '2024-10-15',
    totalEpisodes: 8,
    currentMedication: 'Acetaminophen',
    triggers: ['hormonal changes', 'certain foods'],
    doctorId: 'doc-001'
  }
];

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = filterClass === 'all' || student.class === filterClass;
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    
    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleAddStudent = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(student => student.id !== id));
    }
  };

  const handleSaveStudent = (studentData: Omit<Student, 'id'>) => {
    if (editingStudent) {
      // Update existing student
      setStudents(students.map(student => 
        student.id === editingStudent.id 
          ? { ...studentData, id: editingStudent.id }
          : student
      ));
    } else {
      // Add new student
      const newStudent: Student = {
        ...studentData,
        id: Date.now().toString()
      };
      setStudents([...students, newStudent]);
    }
    setIsFormOpen(false);
    setEditingStudent(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingStudent(null);
  };

  // Get unique classes for filter
  const uniqueClasses = Array.from(new Set(students.map(student => student.class)));

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar activeItem="students" />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header />

          {/* Page Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Students</h1>
                  <p className="text-gray-600 mt-1">Manage student information and records</p>
                </div>
                <Button onClick={handleAddStudent} className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </div>

              {/* Filters and Search */}
              <Card className="p-4 md:p-6 mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Class Filter */}
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Classes</option>
                      {uniqueClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="graduated">Graduated</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Students Table */}
              <StudentTable
                students={filteredStudents}
                onEdit={handleEditStudent}
                onDelete={handleDeleteStudent}
              />
            </div>
          </main>
        </div>
      </div>

      {/* Student Form Modal */}
      {isFormOpen && (
        <StudentForm
          student={editingStudent}
          onSave={handleSaveStudent}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
