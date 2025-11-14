'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Calendar,
  Settings,
  Bell,
  LogOut,
  GraduationCap,
  PlayCircle,
  User,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentSidebarProps {
  activeItem?: string;
}

const studentSidebarItems = [
  { icon: Home, label: 'Dashboard', id: 'dashboard', href: '/student/dashboard' },
  { icon: PlayCircle, label: 'Learning Center', id: 'lms', href: '/student/lms' },
  { icon: BookOpen, label: 'Courses', id: 'courses', href: '/student/courses' },
  { icon: Calendar, label: 'Schedule', id: 'schedule', href: '/student/schedule' },
  { icon: Award, label: 'Grades', id: 'grades', href: '/student/grades' },
  { icon: User, label: 'Profile', id: 'profile', href: '/student/profile' },
  { icon: Settings, label: 'Settings', id: 'settings', href: '/student/settings' },
  { icon: Bell, label: 'Notifications', id: 'notifications', href: '/student/notifications' },
];

export default function StudentSidebar({ activeItem }: StudentSidebarProps) {
  const pathname = usePathname();
  
  return (
    <div className="w-20 lg:w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center justify-center lg:justify-start">
        <Link href="/student/dashboard" className="flex items-center">
          <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 font-bold text-xl text-gray-800 hidden lg:block">EduTrack</span>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 space-y-2">
        {studentSidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id || pathname === item.href;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group',
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 shrink-0',
                isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
              )} />
              <span className={cn(
                'font-medium transition-colors hidden lg:block',
                isActive ? 'text-blue-700' : 'text-gray-700 group-hover:text-gray-900'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-center lg:justify-start space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-gray-900">Student Name</p>
            <p className="text-xs text-gray-500">Class 10A</p>
          </div>
        </div>
        
        <button className="w-full lg:w-auto mt-3 flex items-center justify-center lg:justify-start space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium hidden lg:block">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
