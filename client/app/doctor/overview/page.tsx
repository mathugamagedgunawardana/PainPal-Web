'use client';

import React from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  BookOpen 
} from 'lucide-react';

import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import PatientList from '@/components/dashboard/PatientList';
import AttendanceChart from '@/components/dashboard/AttendanceChart';
import LessonsTable from '@/components/dashboard/LessonsTable';
import CalendarWidget from '@/components/dashboard/CalendarWidget';
import NotesSection from '@/components/dashboard/NotesSection';

export default function DashboardOverview() {
  const statsData = [
    {
      title: 'Total Classes',
      value: '02/08',
      icon: BookOpen,
      iconColor: 'text-blue-600',
      change: '+12% from last month',
      changeType: 'positive' as const
    },
    {
      title: 'Total Students',
      value: '156',
      icon: Users,
      iconColor: 'text-green-600',
      change: '+8 new students',
      changeType: 'positive' as const
    },
    {
      title: 'Total Sessions',
      value: '24/30',
      icon: Calendar,
      iconColor: 'text-purple-600',
      change: '80% completion rate',
      changeType: 'neutral' as const
    },
    {
      title: 'Total Hours',
      value: '142.5',
      icon: Clock,
      iconColor: 'text-orange-600',
      change: '+5.2 hrs this week',
      changeType: 'positive' as const
    }
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar activeItem="dashboard" />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header />

          {/* Dashboard Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
                {statsData.map((stat, index) => (
                  <StatsCard
                    key={index}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    iconColor={stat.iconColor}
                    change={stat.change}
                    changeType={stat.changeType}
                  />
                ))}
              </div>

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
                {/* Left Section - Students Performance */}
                <div className="xl:col-span-4 order-1">
                  <PatientList />
                </div>

                {/* Middle Section - Attendance Chart */}
                <div className="xl:col-span-5 order-3 xl:order-2">
                  <div className="space-y-4 md:space-y-6">
                    <AttendanceChart />
                    <LessonsTable />
                  </div>
                </div>

                {/* Right Section - Calendar and Notes */}
                <div className="xl:col-span-3 order-2 xl:order-3">
                  <div className="space-y-4 md:space-y-6">
                    <CalendarWidget />
                    <NotesSection />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
