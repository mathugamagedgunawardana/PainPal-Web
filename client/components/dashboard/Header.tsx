'use client';

import React from 'react';
import { Search, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
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
          <div className="relative">
            <button className="p-2 rounded-xl bg-gray-100/80 hover:bg-gray-200/80 transition-colors">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
              3
            </Badge>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-100/80 rounded-xl px-2 sm:px-4 py-2">
            <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-xs sm:text-sm">
                {userName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="font-medium text-gray-800 text-sm">{userName}</p>
              <p className="text-xs text-gray-600">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
