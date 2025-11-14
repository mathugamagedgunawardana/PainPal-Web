'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  time: string;
  subject: string;
  type: 'class' | 'meeting' | 'exam' | 'event';
  location?: string;
}

interface CalendarWidgetProps {
  events?: Event[];
}

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Math Quiz',
    time: '10:00 AM',
    subject: 'Mathematics',
    type: 'exam'
  },
  {
    id: '2',
    title: 'Parent-Teacher Meeting',
    time: '02:00 PM',
    subject: 'General',
    type: 'meeting',
    location: 'Conference Room'
  },
  {
    id: '3',
    title: 'Science Fair Setup',
    time: '04:00 PM',
    subject: 'Science',
    type: 'event',
    location: 'Gymnasium'
  }
];

export default function CalendarWidget({ events = mockEvents }: CalendarWidgetProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'class':
        return 'bg-blue-100 text-blue-800';
      case 'meeting':
        return 'bg-green-100 text-green-800';
      case 'exam':
        return 'bg-red-100 text-red-800';
      case 'event':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold text-gray-800">Calendar</h3>
        <Badge variant="secondary" className="text-xs">
          {events.length} events today
        </Badge>
      </div>

      {/* Calendar */}
      <div className="mb-4 md:mb-6">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border-0 w-full"
          classNames={{
            months: "flex flex-col space-y-4 w-full",
            month: "space-y-4 w-full",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex w-full",
            head_cell: "text-gray-500 rounded-md w-full font-normal text-xs flex-1 text-center",
            row: "flex w-full mt-2",
            cell: "text-center text-sm relative p-0 focus-within:relative focus-within:z-20 flex-1",
            day: "h-8 w-full p-0 font-normal rounded-md hover:bg-gray-100",
            day_selected: "bg-blue-500 text-white hover:bg-blue-600",
            day_today: "bg-gray-100 text-gray-900",
            day_outside: "text-gray-400 opacity-50",
          }}
        />
      </div>

      {/* Today's Events */}
      <div>
        <h4 className="text-sm font-medium text-gray-800 mb-3">Today's Events</h4>
        <div className="space-y-2 md:space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1">
                  <h5 className="font-medium text-gray-800 text-sm truncate">{event.title}</h5>
                  <Badge className={`text-xs ${getEventTypeColor(event.type)} w-fit mt-1 sm:mt-0`}>
                    {event.type}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-gray-600 space-y-1 sm:space-y-0">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{event.time}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
