'use client';

import React, { useState } from 'react';
import { 
  Upload, 
  Video, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Play,
  Clock,
  Users,
  BookOpen,
  BarChart3
} from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import VideoUploadModal from '@/components/lms/VideoUploadModal';
import VideoCard from '@/components/lms/VideoCard';

interface LMSVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  subject: string;
  class: string;
  thumbnailUrl: string;
  videoUrl: string;
  uploadDate: string;
  views: number;
  status: 'published' | 'draft' | 'private';
  tags: string[];
}

const mockVideos: LMSVideo[] = [
  {
    id: '1',
    title: 'Introduction to Algebra',
    description: 'Learn the basics of algebraic equations and problem-solving techniques.',
    duration: '25:30',
    subject: 'Mathematics',
    class: '10A',
    thumbnailUrl: '/api/placeholder/320/180',
    videoUrl: '/videos/algebra-intro.mp4',
    uploadDate: '2024-11-08',
    views: 156,
    status: 'published',
    tags: ['algebra', 'mathematics', 'basics']
  },
  {
    id: '2',
    title: 'Chemical Reactions',
    description: 'Understanding different types of chemical reactions with practical examples.',
    duration: '18:45',
    subject: 'Chemistry',
    class: '10B',
    thumbnailUrl: '/api/placeholder/320/180',
    videoUrl: '/videos/chemical-reactions.mp4',
    uploadDate: '2024-11-07',
    views: 89,
    status: 'published',
    tags: ['chemistry', 'reactions', 'science']
  },
  {
    id: '3',
    title: 'World War II Timeline',
    description: 'A comprehensive overview of major events during World War II.',
    duration: '32:15',
    subject: 'History',
    class: '10C',
    thumbnailUrl: '/api/placeholder/320/180',
    videoUrl: '/videos/wwii-timeline.mp4',
    uploadDate: '2024-11-06',
    views: 203,
    status: 'published',
    tags: ['history', 'world war', 'timeline']
  },
  {
    id: '4',
    title: 'Grammar Fundamentals',
    description: 'Essential English grammar rules and usage examples.',
    duration: '22:10',
    subject: 'English',
    class: '10A',
    thumbnailUrl: '/api/placeholder/320/180',
    videoUrl: '/videos/grammar-basics.mp4',
    uploadDate: '2024-11-05',
    views: 127,
    status: 'draft',
    tags: ['english', 'grammar', 'language']
  }
];

export default function TeacherLMSPage() {
  const [videos, setVideos] = useState<LMSVideo[]>(mockVideos);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter videos based on search and filters
  const filteredVideos = videos.filter(video => {
    const matchesSearch = 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = filterSubject === 'all' || video.subject === filterSubject;
    const matchesStatus = filterStatus === 'all' || video.status === filterStatus;
    
    return matchesSearch && matchesSubject && matchesStatus;
  });

  const handleVideoUpload = (videoData: any) => {
    const newVideo: LMSVideo = {
      id: Date.now().toString(),
      ...videoData,
      uploadDate: new Date().toISOString().split('T')[0],
      views: 0
    };
    setVideos([newVideo, ...videos]);
    setIsUploadModalOpen(false);
  };

  const handleDeleteVideo = (id: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      setVideos(videos.filter(video => video.id !== id));
    }
  };

  // Get unique subjects for filter
  const uniqueSubjects = Array.from(new Set(videos.map(video => video.subject)));

  // Calculate stats
  const totalVideos = videos.length;
  const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
  const publishedVideos = videos.filter(video => video.status === 'published').length;
  const draftVideos = videos.filter(video => video.status === 'draft').length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar activeItem="lms" />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header />

          {/* Page Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Learning Management System</h1>
                  <p className="text-gray-600 mt-1">Upload and manage educational videos for your students</p>
                </div>
                <Button 
                  onClick={() => setIsUploadModalOpen(true)} 
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-1">Total Videos</p>
                      <p className="text-2xl font-bold text-gray-800">{totalVideos}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                      <Video className="w-6 h-6" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-1">Total Views</p>
                      <p className="text-2xl font-bold text-gray-800">{totalViews}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-50 text-green-600">
                      <Eye className="w-6 h-6" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-1">Published</p>
                      <p className="text-2xl font-bold text-gray-800">{publishedVideos}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                      <BookOpen className="w-6 h-6" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-1">Drafts</p>
                      <p className="text-2xl font-bold text-gray-800">{draftVideos}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                      <Edit className="w-6 h-6" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Filters and Search */}
              <Card className="p-4 md:p-6 mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search videos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Subject Filter */}
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Subjects</option>
                      {uniqueSubjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Videos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onDelete={handleDeleteVideo}
                    isTeacher={true}
                  />
                ))}
              </div>

              {filteredVideos.length === 0 && (
                <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
                    <p className="text-gray-500">No videos match your current search and filter criteria.</p>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Video Upload Modal */}
      {isUploadModalOpen && (
        <VideoUploadModal
          onUpload={handleVideoUpload}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </div>
  );
}