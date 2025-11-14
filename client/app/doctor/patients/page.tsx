'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Filter, Brain, AlertTriangle, Calendar, Activity } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Filter patients based on search term and filters
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || patient.status === statusFilter;
    const matchesSeverity = severityFilter === '' || patient.migraineSeverity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const handleAddPatient = () => {
    setEditingPatient(null);
    setShowForm(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  const handleDeletePatient = (id: string) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      setPatients(patients.filter(patient => patient.id !== id));
    }
  };

  const handleSavePatient = (patientData: Omit<Patient, 'id'>) => {
    if (editingPatient) {
      // Edit existing patient
      setPatients(patients.map(patient =>
        patient.id === editingPatient.id
          ? { ...patientData, id: editingPatient.id }
          : patient
      ));
    } else {
      // Add new patient
      const newPatient: Patient = {
        ...patientData,
        id: Date.now().toString(),
      };
      setPatients([...patients, newPatient]);
    }
    setShowForm(false);
    setEditingPatient(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPatient(null);
  };

  // Get unique severity levels for filter
  const uniqueSeverities = Array.from(new Set(patients.map(patient => patient.migraineSeverity)));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <Header />
        
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                Migraine Patient Management
              </h1>
              <p className="text-gray-600 mt-1">Manage and monitor your migraine patients</p>
            </div>
            <Button onClick={handleAddPatient} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Patient
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-900">{patients.length}</p>
                </div>
                <Brain className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Patients</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {patients.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Severe Cases</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {patients.filter(p => p.migraineSeverity === 'severe').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Episodes</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {patients.reduce((sum, p) => sum + p.totalEpisodes, 0)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <select
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discharged">Discharged</option>
              </select>
              
              <select
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severities</option>
                {uniqueSeverities.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Patients Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age/Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Episodes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Episode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={patient.avatar} alt={`${patient.firstName} ${patient.lastName}`} />
                            <AvatarFallback>
                              {patient.firstName[0]}{patient.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{patient.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.age} / {patient.gender}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            patient.migraineSeverity === 'severe' ? 'destructive' :
                            patient.migraineSeverity === 'moderate' ? 'default' : 'secondary'
                          }
                        >
                          {patient.migraineSeverity}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.totalEpisodes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(patient.lastEpisodeDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            patient.status === 'active' ? 'default' :
                            patient.status === 'inactive' ? 'secondary' : 'destructive'
                          }
                        >
                          {patient.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPatient(patient)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePatient(patient.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
