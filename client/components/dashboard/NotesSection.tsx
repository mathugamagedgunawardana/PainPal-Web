'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  tag: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  createdAt: Date;
}

interface NotesSectionProps {
  notes?: Note[];
}

const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Student Progress Review',
    content: 'Need to schedule individual meetings with underperforming students.',
    tag: 'Important',
    color: 'red',
    createdAt: new Date('2024-11-08T10:00:00')
  },
  {
    id: '2',
    title: 'Lesson Plan Update',
    content: 'Add more interactive activities to the math curriculum.',
    tag: 'Teaching',
    color: 'blue',
    createdAt: new Date('2024-11-08T14:30:00')
  },
  {
    id: '3',
    title: 'Parent Meeting',
    content: 'Discuss Emma\'s excellent progress in science class.',
    tag: 'Meeting',
    color: 'green',
    createdAt: new Date('2024-11-08T16:00:00')
  }
];

export default function NotesSection({ notes = mockNotes }: NotesSectionProps) {
  const [notesList, setNotesList] = useState(notes);

  const getTagColor = (color: Note['color']) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      purple: 'bg-purple-100 text-purple-800',
    };
    return colors[color];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: 'Add your note content here...',
      tag: 'General',
      color: 'blue',
      createdAt: new Date()
    };
    setNotesList([...notesList, newNote]);
  };

  const deleteNote = (id: string) => {
    setNotesList(notesList.filter(note => note.id !== id));
  };

  return (
    <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold text-gray-800">Quick Notes</h3>
        <Button 
          size="sm" 
          onClick={addNote}
          className="bg-blue-500 hover:bg-blue-600 text-white h-8 px-2 md:px-3"
        >
          <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1" />
          <span className="hidden sm:inline">Add Note</span>
        </Button>
      </div>

      <div className="space-y-2 md:space-y-3 max-h-80 md:max-h-96 overflow-y-auto">
        {notesList.map((note) => (
          <div key={note.id} className="p-3 md:p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors group">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1">
                  <h4 className="font-medium text-gray-800 text-sm truncate">{note.title}</h4>
                  <Badge className={`text-xs ${getTagColor(note.color)} w-fit mt-1 sm:mt-0`}>
                    {note.tag}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2">{formatTime(note.createdAt)}</p>
              </div>
              <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-blue-100"
                >
                  <Edit className="w-3 h-3 text-blue-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-red-100"
                  onClick={() => deleteNote(note.id)}
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
          </div>
        ))}
      </div>

      {notesList.length === 0 && (
        <div className="text-center py-6 md:py-8">
          <p className="text-gray-500 text-sm mb-2">No notes yet</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={addNote}
            className="text-gray-600 border-dashed"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create your first note
          </Button>
        </div>
      )}
    </Card>
  );
}
