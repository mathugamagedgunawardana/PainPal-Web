'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Play, 
  Clock, 
  BookOpen, 
  Star, 
  Bookmark,
  Download,
  Share2,
  Grid,
  List,
  ChevronDown,
  User,
  Calendar
} from 'lucide-react';
import Sidebar from '@/components/dashboard/StudentSidebar';
import Header from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  teacher: string;
  rating: number;
  isBookmarked?: boolean;
  progress?: number; // 0-100
}

const mockStudentVideos: LMSVideo[] = [
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
    tags: ['algebra', 'mathematics', 'basics'],
    teacher: 'Prof. Sarah Johnson',
    rating: 4.8,
    isBookmarked: true,
    progress: 75
  },
  {
    id: '2',
    title: 'Chemical Reactions',
    description: 'Understanding different types of chemical reactions with practical examples.',
    duration: '18:45',
    subject: 'Chemistry',
    class: '10A',
    thumbnailUrl: '/api/placeholder/320/180',
    videoUrl: '/videos/chemical-reactions.mp4',
    uploadDate: '2024-11-07',
    views: 89,
    status: 'published',
    tags: ['chemistry', 'reactions', 'science'],
    teacher: 'Dr. Michael Chen',
    rating: 4.6,
    isBookmarked: false,
    progress: 30
  },
  {
    id: '3',
    title: 'World War II Timeline',
    description: 'A comprehensive overview of major events during World War II.',
    duration: '32:15',
    subject: 'History',
    class: '10A',
    thumbnailUrl: '/api/placeholder/320/180',
    videoUrl: '/videos/wwii-timeline.mp4',
    uploadDate: '2024-11-06',
    views: 203,
    status: 'published',
    tags: ['history', 'world war', 'timeline'],
    teacher: 'Prof. Emma Davis',
    rating: 4.9,
    isBookmarked: true,
    progress: 100
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
    status: 'published',
    tags: ['english', 'grammar', 'language'],
    teacher: 'Ms. Lisa Williams',
    rating: 4.7,
    isBookmarked: false,
    progress: 0
  },
  {
    id: '5',
    title: 'Physics - Motion and Forces',
    description: 'Understanding Newton\'s laws of motion with real-world applications.',
    duration: '28:20',
    subject: 'Physics',
    class: '10A',
    thumbnailUrl: '/api/placeholder/320/180',
    videoUrl: '/videos/motion-forces.mp4',
    uploadDate: '2024-11-04',
    views: 178,
    status: 'published',
    tags: ['physics', 'motion', 'forces', 'newton'],
    teacher: 'Dr. Robert Taylor',
    rating: 4.5,
    isBookmarked: false,
    progress: 45
  },
  {
    id: '6',
    title: 'Cell Biology Basics',
    description: 'Explore the structure and function of plant and animal cells.',
    duration: '20:15',
    subject: 'Biology',
    class: '10A',
    thumbnailUrl: '/api/placeholder/320/180',
    videoUrl: '/videos/cell-biology.mp4',
    uploadDate: '2024-11-03',
    views: 134,
    status: 'published',
    tags: ['biology', 'cells', 'structure'],
    teacher: 'Dr. Maria Rodriguez',
    rating: 4.8,
    isBookmarked: true,
    progress: 60
  }
];

export default function StudentLMSPage() {
  const [videos, setVideos] = useState<LMSVideo[]>(mockStudentVideos);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterProgress, setFilterProgress] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showBookmarked, setShowBookmarked] = useState(false);

  // Filter videos based on search and filters
  const filteredVideos = videos.filter(video => {
    const matchesSearch = 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = filterSubject === 'all' || video.subject === filterSubject;
    
    const matchesProgress = filterProgress === 'all' || 
      (filterProgress === 'not-started' && (video.progress || 0) === 0) ||
      (filterProgress === 'in-progress' && (video.progress || 0) > 0 && (video.progress || 0) < 100) ||
      (filterProgress === 'completed' && (video.progress || 0) === 100);
    
    const matchesBookmarked = !showBookmarked || video.isBookmarked;
    
    return matchesSearch && matchesSubject && matchesProgress && matchesBookmarked;
  });

  // Sort videos
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      case 'rating':
        return b.rating - a.rating;
      case 'duration':
        const getDuration = (duration: string) => {
          const [minutes, seconds] = duration.split(':').map(Number);
          return minutes * 60 + seconds;
        };
        return getDuration(a.duration) - getDuration(b.duration);
      case 'progress':
        return (b.progress || 0) - (a.progress || 0);
      default:
        return 0;
    }
  });

  const handleVideoPlay = (video: LMSVideo) => {
    console.log('Playing video:', video.title);
    // Here you would implement video player logic
  };

  const handleBookmark = (id: string) => {
    setVideos(videos.map(video => 
      video.id === id 
        ? { ...video, isBookmarked: !video.isBookmarked }
        : video
    ));
  };

  // Get unique subjects for filter
  const uniqueSubjects = Array.from(new Set(videos.map(video => video.subject)));

  // Calculate stats
  const totalVideos = videos.length;
  const completedVideos = videos.filter(video => (video.progress || 0) === 100).length;
  const inProgressVideos = videos.filter(video => (video.progress || 0) > 0 && (video.progress || 0) < 100).length;
  const bookmarkedVideos = videos.filter(video => video.isBookmarked).length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar activeItem="lms" />

        {/* Main Content */}
        <div className="flex-1 ml-0 lg:ml-64">
          <Header />
          
          <main className="p-4 md:p-6 lg:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Learning Center</h1>
                <p className="text-gray-600">Access your course videos and track your learning progress</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Total Videos</p>
                    <p className="text-2xl font-bold text-gray-800">{totalVideos}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    <Play className="w-6 h-6" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Completed</p>
                    <p className="text-2xl font-bold text-gray-800">{completedVideos}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50 text-green-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">In Progress</p>
                    <p className="text-2xl font-bold text-gray-800">{inProgressVideos}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Bookmarked</p>
                    <p className="text-2xl font-bold text-gray-800">{bookmarkedVideos}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                    <Bookmark className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Filters and Controls */}
            <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
              <div className="space-y-4">
                {/* Top Row */}
                <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search videos, teachers, or subjects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
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

                  {/* Progress Filter */}
                  <div>
                    <select
                      value={filterProgress}
                      onChange={(e) => setFilterProgress(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Progress</option>
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="rating">Highest Rated</option>
                      <option value="duration">Shortest First</option>
                      <option value="progress">Most Progress</option>
                    </select>
                  </div>

                  {/* Bookmarked Toggle */}
                  <div>
                    <Button
                      variant={showBookmarked ? "default" : "outline"}
                      onClick={() => setShowBookmarked(!showBookmarked)}
                      className="h-10"
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      Bookmarked
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Videos Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedVideos.map((video) => (
                  <StudentVideoCard
                    key={video.id}
                    video={video}
                    onPlay={handleVideoPlay}
                    onBookmark={handleBookmark}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedVideos.map((video) => (
                  <StudentVideoListItem
                    key={video.id}
                    video={video}
                    onPlay={handleVideoPlay}
                    onBookmark={handleBookmark}
                  />
                ))}
              </div>
            )}

            {sortedVideos.length === 0 && (
              <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
                  <p className="text-gray-500">No videos match your current search and filter criteria.</p>
                </div>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// Student Video Card Component
interface StudentVideoCardProps {
  video: LMSVideo;
  onPlay: (video: LMSVideo) => void;
  onBookmark: (id: string) => void;
}

function StudentVideoCard({ video, onPlay, onBookmark }: StudentVideoCardProps) {
  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200';
    if (progress === 100) return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
      {/* Video Thumbnail */}
      <div className="relative group">
        <div className="aspect-video bg-gray-200 relative overflow-hidden">
          {/* Placeholder for video thumbnail */}
          <div className="w-full h-full bg-linear-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <Play className="w-12 h-12 text-white opacity-60" />
          </div>
          
          {/* Play overlay */}
          <div 
            className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => onPlay(video)}
          >
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-gray-800 ml-1" />
            </div>
          </div>

          {/* Duration and Progress */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {video.duration}
          </div>

          {/* Bookmark button */}
          <button
            onClick={() => onBookmark(video.id)}
            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          >
            <Bookmark 
              className={`w-4 h-4 ${
                video.isBookmarked 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-white'
              }`} 
            />
          </button>

          {/* Progress bar */}
          {(video.progress || 0) > 0 && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-300">
              <div 
                className={`h-full ${getProgressColor(video.progress || 0)}`}
                style={{ width: `${video.progress || 0}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4 space-y-3">
        {/* Title and Description */}
        <div>
          <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1">
            {video.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {video.description}
          </p>
        </div>

        {/* Teacher */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="w-3 h-3" />
          <span>{video.teacher}</span>
        </div>

        {/* Subject and Rating */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {video.subject}
          </Badge>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-600">{video.rating}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={() => onPlay(video)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white h-9"
        >
          <Play className="w-4 h-4 mr-2" />
          {(video.progress || 0) === 0 ? 'Start Learning' : 
           (video.progress || 0) === 100 ? 'Rewatch' : 'Continue'}
        </Button>
      </div>
    </Card>
  );
}

// Student Video List Item Component
function StudentVideoListItem({ video, onPlay, onBookmark }: StudentVideoCardProps) {
  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200';
    if (progress === 100) return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start space-x-4">
          {/* Thumbnail */}
          <div className="relative group shrink-0">
            <div className="w-32 h-20 bg-linear-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-white opacity-60" />
            </div>
            <button
              onClick={() => onPlay(video)}
              className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            >
              <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                <Play className="w-3 h-3 text-gray-800 ml-0.5" />
              </div>
            </button>
            <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
              {video.duration}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-semibold text-gray-800 truncate mb-1">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {video.description}
                </p>
                
                {/* Meta info */}
                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{video.teacher}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span>{video.rating}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {video.subject}
                  </Badge>
                  {(video.progress || 0) > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {video.progress || 0}% Complete
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onBookmark(video.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bookmark 
                    className={`w-4 h-4 ${
                      video.isBookmarked 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-400'
                    }`} 
                  />
                </button>
                
                <Button
                  onClick={() => onPlay(video)}
                  className="bg-blue-500 hover:bg-blue-600 text-white h-8 px-4"
                >
                  <Play className="w-3 h-3 mr-1" />
                  {(video.progress || 0) === 0 ? 'Start' : 
                   (video.progress || 0) === 100 ? 'Rewatch' : 'Continue'}
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            {(video.progress || 0) > 0 && (
              <div className="mt-3">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getProgressColor(video.progress || 0)} transition-all duration-300`}
                    style={{ width: `${video.progress || 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}