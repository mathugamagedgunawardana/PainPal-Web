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
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeItem?: string;
}

const sidebarItems = [
  { icon: Home, label: 'Overview', id: 'overview', href: '/doctor/overview' },
  { icon: Users, label: 'Patients', id: 'patients', href: '/doctor/patients' },
  { icon: Activity, label: 'Analytics', id: 'analytics', href: '/doctor/analytics' },
  { icon: BarChart3, label: 'Risk Assessment', id: 'risk', href: '/doctor/risk' },
  { icon: FileText, label: 'Treatments', id: 'treatments', href: '/doctor/treatments' },
  { icon: Settings, label: 'Settings', id: 'settings', href: '/doctor/settings' },
  { icon: Bell, label: 'Notifications', id: 'notifications', href: '/doctor/notifications' },
];

export default function Sidebar({ activeItem }: SidebarProps) {
  const pathname = usePathname();
  
  return (
    <div className="w-20 lg:w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center justify-center lg:justify-start">
        <Link href="/doctor/overview" className="flex items-center">
          <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 font-bold text-xl text-gray-800 hidden lg:block">MigraineTrack</span>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 space-y-2">
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
      <div className="p-4">
        <button className="w-full flex items-center justify-center lg:justify-start px-3 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group">
          <LogOut className="w-5 h-5" />
          <span className="ml-3 font-medium hidden lg:block">Logout</span>
        </button>
      </div>
    </div>
  );
}
