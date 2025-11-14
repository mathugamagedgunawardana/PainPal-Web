'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Bell } from 'lucide-react';

interface Lesson {
  id: string;
  time: string;
  name: string;
  duration: string;
  subject: string;
  reminder: boolean;
  status: 'upcoming' | 'in-progress' | 'completed';
}

interface LessonsTableProps {
  lessons?: Lesson[];
}

const mockLessons: Lesson[] = [
  {
    id: '1',
    time: '09:00 AM',
    name: 'Introduction to Algebra',
    duration: '60 min',
    subject: 'Mathematics',
    reminder: true,
    status: 'upcoming'
  },
  {
    id: '2',
    time: '10:30 AM', 
    name: 'World History',
    duration: '45 min',
    subject: 'History',
    reminder: false,
    status: 'upcoming'
  },
  {
    id: '3',
    time: '01:00 PM',
    name: 'Chemistry Lab',
    duration: '90 min',
    subject: 'Science',
    reminder: true,
    status: 'upcoming'
  },
  {
    id: '4',
    time: '02:45 PM',
    name: 'English Literature',
    duration: '50 min',
    subject: 'English',
    reminder: false,
    status: 'upcoming'
  },
  {
    id: '5',
    time: '04:00 PM',
    name: 'Physical Education',
    duration: '60 min',
    subject: 'PE',
    reminder: true,
    status: 'upcoming'
  }
];

export default function LessonsTable({ lessons = mockLessons }: LessonsTableProps) {
  const getSubjectColor = (subject: string) => {
    const colors = {
      'Mathematics': 'bg-blue-100 text-blue-800',
      'History': 'bg-orange-100 text-orange-800',
      'Science': 'bg-green-100 text-green-800',
      'English': 'bg-purple-100 text-purple-800',
      'PE': 'bg-red-100 text-red-800',
    };
    return colors[subject as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-800">Teaching Lessons</h3>
        <Badge variant="secondary" className="text-xs">
          Today's Schedule
        </Badge>
      </div>

      <div className="space-y-2 md:space-y-3">
        {lessons.map((lesson, index) => (
          <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-3 md:p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
            {/* Time and Lesson Info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex items-center space-x-2 shrink-0">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-800">{lesson.time}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <BookOpen className="w-4 h-4 text-gray-500 shrink-0" />
                  <h4 className="font-medium text-gray-800 text-sm truncate">{lesson.name}</h4>
                </div>
                <p className="text-xs text-gray-600">{lesson.duration}</p>
              </div>
            </div>

            {/* Subject Badge and Reminder - Mobile Layout */}
            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
              <Badge className={`text-xs ${getSubjectColor(lesson.subject)}`}>
                {lesson.subject}
              </Badge>

              <Button 
                size="sm" 
                variant={lesson.reminder ? "default" : "outline"}
                className={`h-7 md:h-8 px-2 md:px-3 text-xs ${
                  lesson.reminder 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Bell className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">{lesson.reminder ? 'On' : 'Off'}</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Lesson Button */}
      <Button 
        variant="outline" 
        className="w-full mt-4 border-dashed border-2 border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-400 text-sm"
      >
        + Add New Lesson
      </Button>
    </Card>
  );
}
