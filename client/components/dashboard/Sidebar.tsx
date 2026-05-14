'use client'

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  UserCog,
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
  MessageSquare,
  CheckCircle2,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SIDEBAR_COLLAPSED_KEY = 'mt-sidebar-nav-collapsed';

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
    { icon: CheckCircle2, label: 'Approvals', id: 'approvals', href: '/doctor/patients/approve' },
    { icon: Activity, label: 'Analytics', id: 'analytics', href: '/doctor/analytics' },
    // { icon: BarChart3, label: 'Risk Assessment', id: 'risk', href: '/doctor/risk' },
    // { icon: FileText, label: 'Treatments', id: 'treatments', href: '/doctor/treatments' },
    { icon: Settings, label: 'Settings', id: 'settings', href: '/doctor/settings' },
    // { icon: Bell, label: 'Notifications', id: 'notifications', href: '/doctor/notifications' },
  ],
  patient: [
    { icon: Home, label: 'Overview', id: 'overview', href: '/patient/overview' },
    { icon: Activity, label: 'Analytics', id: 'analytics', href: '/patient/analytics' },
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
    { icon: UserCog, label: 'Users', id: 'users', href: '/admin/users' },
    { icon: Stethoscope, label: 'Doctors', id: 'doctors', href: '/admin/doctors' },
    { icon: Users, label: 'Patients', id: 'patients', href: '/admin/patients' },
    { icon: Activity, label: 'Analytics', id: 'analytics', href: '/admin/analytics' },
    { icon: Settings, label: 'System Settings', id: 'settings', href: '/admin/settings' },
    { icon: Bell, label: 'Notifications', id: 'notifications', href: '/admin/notifications' },
  ]
};

export default function Sidebar({ activeItem, userRole = 'doctor', userName = 'Dr. Johnson', userEmail = 'doctor@example.com' }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

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
    <div
      className={cn(
        'bg-white/80 backdrop-blur-sm border-r border-gray-200 h-screen flex flex-col sticky top-0 shrink-0 transition-[width] duration-200 ease-out',
        collapsed ? 'w-16' : 'w-20 lg:w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('p-4 flex items-center', collapsed ? 'justify-center' : 'justify-center lg:justify-start lg:px-6 lg:pt-6')}>
        <Link
          href={`/${userRole}/overview`}
          className="flex items-center min-w-0"
          title={collapsed ? 'PainPal AI' : undefined}
        >
          <div className="w-8 h-8 shrink-0 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className={cn('ml-3 font-bold text-xl text-gray-800 truncate', collapsed ? 'hidden' : 'hidden lg:inline')}>
            PainPal AI
          </span>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-2 pb-3 border-b border-gray-200 lg:px-4">
        <div
          className={cn(
            'flex items-center rounded-lg bg-blue-50',
            collapsed ? 'justify-center p-2' : 'gap-3 p-3 justify-center lg:justify-start'
          )}
          title={collapsed ? `${userName} (${userRole})` : undefined}
        >
          <div className="w-10 h-10 shrink-0 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {userInitials}
          </div>
          <div className={cn('flex-1 min-w-0', collapsed ? 'hidden' : 'hidden lg:block')}>
            <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
            <p className="text-xs text-gray-600 capitalize">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 space-y-2 overflow-y-auto py-3 lg:px-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id || pathname === item.href;
          
          return (
            <Link key={item.id} href={item.href} title={collapsed ? item.label : undefined}>
              <button
                type="button"
                className={cn(
                  'w-full flex items-center px-2 py-3 rounded-xl transition-all duration-200 group',
                  collapsed ? 'justify-center' : 'justify-center lg:justify-start lg:px-3',
                  isActive
                    ? 'bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                  )}
                />
                <span className={cn('ml-3 font-medium truncate', collapsed ? 'hidden' : 'hidden lg:inline')}>
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-1 lg:px-4">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            'w-full flex items-center rounded-xl border border-gray-200 bg-gray-50/80 text-gray-700 hover:bg-gray-100 transition-colors py-2.5',
            collapsed ? 'justify-center px-0' : 'justify-center gap-2 px-2 lg:justify-start lg:px-3'
          )}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5 shrink-0 hidden lg:block" />
              <span className="text-xs font-medium hidden lg:inline">Collapse</span>
              <PanelLeft className="w-5 h-5 shrink-0 lg:hidden" />
            </>
          )}
        </button>
      </div>

      {/* Logout */}
      <div className="p-2 border-t border-gray-200 lg:p-4">
        <button 
          type="button"
          onClick={handleSignOut}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'w-full flex items-center text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group px-2 py-3',
            collapsed ? 'justify-center' : 'justify-center lg:justify-start lg:px-3'
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className={cn('ml-3 font-medium', collapsed ? 'hidden' : 'hidden lg:inline')}>Logout</span>
        </button>
      </div>
    </div>
  );
}
