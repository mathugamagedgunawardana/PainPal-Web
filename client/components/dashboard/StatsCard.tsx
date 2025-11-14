'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = 'text-blue-500',
  change,
  changeType = 'neutral'
}: StatsCardProps) {
  return (
    <Card className="p-3 sm:p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1 truncate">{title}</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{value}</p>
          {change && (
            <p className={`text-xs mt-1 truncate ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl bg-gray-50 ${iconColor} shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </div>
      </div>
    </Card>
  );
}
