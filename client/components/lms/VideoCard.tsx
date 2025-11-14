'use client';

import React from 'react';
import { Play, Clock, Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

interface VideoCardProps {
  video: LMSVideo;
  onDelete?: (id: string) => void;
  onPlay?: (video: LMSVideo) => void;
  isTeacher?: boolean;
}

export default function VideoCard({ video, onDelete, onPlay, isTeacher = false }: VideoCardProps) {
  const getStatusColor = (status: LMSVideo['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'private':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePlayClick = () => {
    if (onPlay) {
      onPlay(video);
    }
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
            onClick={handlePlayClick}
          >
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-gray-800 ml-1" />
            </div>
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {video.duration}
          </div>

          {/* Status badge */}
          {isTeacher && (
            <div className="absolute top-2 left-2">
              <Badge className={getStatusColor(video.status)}>
                {video.status}
              </Badge>
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

        {/* Subject and Class */}
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {video.subject}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Class {video.class}
          </Badge>
        </div>

        {/* Tags */}
        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                #{tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                +{video.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>{video.views} views</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(video.uploadDate)}</span>
            </div>
          </div>

          {/* Teacher Actions */}
          {isTeacher && (
            <div className="flex items-center space-x-1">
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
                onClick={() => onDelete && onDelete(video.id)}
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </Button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-2">
          <Button 
            onClick={handlePlayClick}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-9"
          >
            <Play className="w-4 h-4 mr-2" />
            {isTeacher ? 'Preview' : 'Watch Now'}
          </Button>
          
          {!isTeacher && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
