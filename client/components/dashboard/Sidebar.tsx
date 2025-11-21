'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Calendar,
  Settings,
  Bell,
  LogOut,
  Brain,
  Activity,
  FileText,
  BarChart3,
  AlertTriangle,
  Stethoscope,
  HeartPulse,
  ClipboardList,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeItem?: string;
  userRole?: 'doctor' | 'patient' | 'admin';
  userName?: string;
  userEmail?: string;
}

// Navigation items for different roles
const navigationByRole = {
  doctor: [
    { icon: Home, label: 'Overview', id: 'overview', href: '/doctor/overview' },
    { icon: Users, label: 'Patients', id: 'patients', href: '/doctor/patients' },
    { icon: Activity, label: 'Analytics', id: 'analytics', href: '/doctor/analytics' },
    { icon: BarChart3, label: 'Risk Assessment', id: 'risk', href: '/doctor/risk' },
    { icon: FileText, label: 'Treatments', id: 'treatments', href: '/doctor/treatments' },
    { icon: Settings, label: 'Settings', id: 'settings', href: '/doctor/settings' },
    { icon: Bell, label: 'Notifications', id: 'notifications', href: '/doctor/notifications' },
  ],
  patient: [
    { icon: Home, label: 'Overview', id: 'overview', href: '/patient/overview' },
    { icon: HeartPulse, label: 'My Episodes', id: 'episodes', href: '/patient/episodes' },
    { icon: FileText, label: 'My Treatments', id: 'treatments', href: '/patient/treatments' },
    { icon: Calendar, label: 'Appointments', id: 'appointments', href: '/patient/appointments' },
    { icon: ClipboardList, label: 'Reports', id: 'reports', href: '/patient/reports' },
    { icon: MessageSquare, label: 'Messages', id: 'messages', href: '/patient/messages' },
    { icon: Settings, label: 'Settings', id: 'settings', href: '/patient/settings' },
    { icon: Bell, label: 'Notifications', id: 'notifications', href: '/patient/notifications' },
  ],
  admin: [
    { icon: Home, label: 'Dashboard', id: 'dashboard', href: '/admin/dashboard' },
    { icon: Stethoscope, label: 'Doctors', id: 'doctors', href: '/admin/doctors' },
    { icon: Users, label: 'Patients', id: 'patients', href: '/admin/patients' },
    { icon: Activity, label: 'Analytics', id: 'analytics', href: '/admin/analytics' },
    { icon: Settings, label: 'System Settings', id: 'settings', href: '/admin/settings' },
    { icon: Bell, label: 'Notifications', id: 'notifications', href: '/admin/notifications' },
  ]
};

export default function Sidebar({ activeItem, userRole = 'doctor', userName = 'Dr. Johnson', userEmail = 'doctor@example.com' }: SidebarProps) {
  const pathname = usePathname();
  
  // Get navigation items based on role
  const sidebarItems = navigationByRole[userRole] || navigationByRole.patient;
  
  // Get user initials
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const handleSignOut = () => {
    // TODO: Implement Clerk sign out when integrated
    // For now, redirect to login
    window.location.href = '/sign-in';
  };
  
  return (
    <div className="w-20 lg:w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center justify-center lg:justify-start">
        <Link href={`/${userRole}/overview`} className="flex items-center">
          <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 font-bold text-xl text-gray-800 hidden lg:block">MigraineTrack</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {userInitials}
          </div>
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {userName}
            </p>
            <p className="text-xs text-gray-600 capitalize">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id || pathname === item.href;
          
          return (
            <Link key={item.id} href={item.href}>
              <button
                className={cn(
                  "w-full flex items-center justify-center lg:justify-start px-3 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                )} />
                <span className="ml-3 font-medium hidden lg:block">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center lg:justify-start px-3 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5" />
          <span className="ml-3 font-medium hidden lg:block">Logout</span>
        </button>
      </div>
    </div>
  );
}
