'use client';

import React, { useState } from 'react';
import { Search, Bell, LogOut, User, X, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export default function Header({ 
  userName = "Karla Johnson", 
  userEmail = "k.johnson@school.edu",
  userAvatar = ""
}: HeaderProps) {
  const { logout } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Patient Assigned',
      message: 'John Smith has been assigned to your care',
      time: '5 min ago',
      read: false,
      type: 'info'
    },
    {
      id: '2',
      title: 'Appointment Reminder',
      message: 'Upcoming appointment with Sarah Davis at 2:00 PM',
      time: '1 hour ago',
      read: false,
      type: 'warning'
    },
    {
      id: '3',
      title: 'Report Completed',
      message: 'Monthly analytics report is ready for review',
      time: '3 hours ago',
      read: false,
      type: 'success'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 border-l-amber-500';
      case 'success':
        return 'bg-green-50 border-l-green-500';
      default:
        return 'bg-blue-50 border-l-blue-500';
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 relative z-40">
      <div className="flex items-center justify-between">
        {/* Greeting Section */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-0.5 md:mb-1 truncate">
            Greetings, {userName.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm lg:text-base hidden sm:block">{currentDate}</p>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search Bar - Hidden on small screens */}
          <div className="hidden lg:flex items-center bg-gray-100/80 rounded-xl px-4 py-2 w-60 xl:w-80">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search students, classes..."
              className="bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 flex-1"
            />
          </div>

          {/* Mobile Search Button */}
          <button className="lg:hidden p-2 rounded-xl bg-gray-100/80 hover:bg-gray-200/80 transition-colors">
            <Search className="w-4 h-4 text-gray-600" />
          </button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative">
                <button className="p-2 rounded-xl bg-gray-100/80 hover:bg-gray-200/80 transition-colors">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-1 h-8 rounded-full ${
                              notification.type === 'warning' ? 'bg-amber-500' :
                              notification.type === 'success' ? 'bg-green-500' :
                              'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium text-gray-800 ${
                                !notification.read ? 'font-semibold' : ''
                              }`}>
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium w-full text-center">
                    View all notifications
                  </button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 sm:space-x-3 bg-gray-100/80 rounded-xl px-2 sm:px-4 py-2 focus:outline-none">
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-xs sm:text-sm">
                    {userName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="font-medium text-gray-800 text-sm">{userName}</p>
                  <p className="text-xs text-gray-600">{userEmail}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-4 py-2 text-sm">
                <div className="font-semibold">{userName}</div>
                <div className="text-xs text-gray-500">{userEmail}</div>
              </div>
              <div className="my-1 h-px bg-gray-200" />
              <DropdownMenuItem className="gap-2">
                <User className="h-4 w-4 text-gray-500" />
                Profile
              </DropdownMenuItem>
              <div className="my-1 h-px bg-gray-200" />
              <DropdownMenuItem className="gap-2 text-red-600" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
