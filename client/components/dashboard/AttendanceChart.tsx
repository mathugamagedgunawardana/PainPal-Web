'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface AttendanceData {
  date: string;
  attendance: number;
  total: number;
  percentage: number;
}

interface AttendanceChartProps {
  data?: AttendanceData[];
}

const mockData: AttendanceData[] = [
  { date: 'Mon', attendance: 42, total: 45, percentage: 93 },
  { date: 'Tue', attendance: 40, total: 45, percentage: 89 },
  { date: 'Wed', attendance: 44, total: 45, percentage: 98 },
  { date: 'Thu', attendance: 38, total: 45, percentage: 84 },
  { date: 'Fri', attendance: 41, total: 45, percentage: 91 },
  { date: 'Sat', attendance: 35, total: 40, percentage: 88 },
  { date: 'Sun', attendance: 30, total: 35, percentage: 86 },
];

const chartConfig = {
  percentage: {
    label: 'Attendance %',
    color: 'hsl(var(--chart-1))',
  },
};

export default function AttendanceChart({ data = mockData }: AttendanceChartProps) {
  const averageAttendance = data.reduce((sum, item) => sum + item.percentage, 0) / data.length;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
      <CardHeader className="pb-2 md:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle className="text-base md:text-lg font-semibold text-gray-800">
            Total Attendance Report
          </CardTitle>
          <div className="text-left sm:text-right">
            <p className="text-xl md:text-2xl font-bold text-gray-800">{averageAttendance.toFixed(1)}%</p>
            <p className="text-xs text-gray-600">Weekly Average</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                domain={[70, 100]}
                width={30}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                labelFormatter={(label) => `${label}`}
                formatter={(value, name) => [
                  `${value}%`,
                  'Attendance'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="percentage" 
                stroke="url(#attendanceGradient)"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: '#1D4ED8' }}
              />
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm md:text-lg font-semibold text-green-600">
              {Math.max(...data.map(d => d.percentage))}%
            </p>
            <p className="text-xs text-gray-600">Highest</p>
          </div>
          <div className="text-center">
            <p className="text-sm md:text-lg font-semibold text-red-500">
              {Math.min(...data.map(d => d.percentage))}%
            </p>
            <p className="text-xs text-gray-600">Lowest</p>
          </div>
          <div className="text-center">
            <p className="text-sm md:text-lg font-semibold text-blue-600">
              {data.reduce((sum, item) => sum + item.attendance, 0)}
            </p>
            <p className="text-xs text-gray-600">Total Present</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
