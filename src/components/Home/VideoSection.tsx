import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Clock, Eye, AlertTriangle, Star, X, ExternalLink } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  category: string;
  tags: string[];
  views: number;
  duration?: number;
  created_at: string;
  featured?: boolean;
}

const VideoSection = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  

  const { data: videos = [], isLoading, isError, error } = useQuery({
    queryKey: ['published-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('published', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data as Video[];
    },
  });

  const formatDuration = (seconds: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  };

  const isYouTubeVideo = (url: string) => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
  };

  const isDirectVideo = (url: string) => {
    return url && (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg') || url.includes('supabase.co'));
  };

  const getEmbedUrl = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    return url;
  };

  // Increment video views when watching
  const incrementViews = async (videoId: string) => {
    try {
      await supabase
        .from('videos')
        .update({ views: videos.find(v => v.id === videoId)?.views + 1 || 1 })
        .eq('id', videoId);
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  };

  const handleWatchVideo = (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
    incrementViews(video.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  // Generate clean sharing URL
  const getShareableUrl = (video: Video) => {
    // This would be your domain + clean path
    return `${window.location.origin}/watch/${video.id}`;
  };

  // Handle "View All Videos" navigation
  const handleViewAllVideos = () => {
    try {
      // CHOOSE ONE OF THE FOLLOWING METHODS BASED ON YOUR SETUP:
      
      // Method 1: React Router (most common for React apps)
      // navigate('/videos');
      
      // Method 2: Next.js Pages Router
      // router.push('/videos');
      
      // Method 3: Next.js App Router
      // router.push('/videos');
      
      // Method 4: Direct browser navigation (works with any setup)
                  window.location.href = '/videos';
      
      // Method 5: Open in new tab (alternative option)
      // window.open('/videos', '_blank');
      
    } catch (error) {
      console.error('Navigation failed:', error);
      // Fallback: try direct navigation
      window.location.href = '/videos';
    }
  };

  if (isLoading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-lg"></div>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Error Loading Videos</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
            {error?.message || "Failed to load videos. Please try again later."}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Play className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No Videos Available</h3>
          <p className="text-sm sm:text-base text-muted-foreground">Check back later for new tutorials!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Responsive */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Irrigation Videos & Tutorials
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Learn from our expert irrigation tutorials and see our systems in action
          </p>
        </div>

        {/* Video Grid - Fully Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {videos.map((video) => {
            const thumbnailUrl = video.thumbnail_url || getYouTubeThumbnail(video.video_url) || '/fallback-thumbnail.jpg';
            
            return (
              <Card key={video.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={() => handleWatchVideo(video)}>
                  <div className="w-full h-full relative group">
                    <img
                      src={thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/fallback-thumbnail.jpg';
                      }}
                    />
                  </div>
                  
                  {/* Play button overlay - Responsive sizing */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/90 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                      <Play className="h-4 w-4 sm:h-6 sm:w-6 text-primary ml-1" />
                    </div>
                  </div>

                  {/* Duration badge - Responsive */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs sm:text-sm flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(video.duration)}
                    </div>
                  )}

                  {/* Category badge - Responsive */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="capitalize text-xs sm:text-sm">
                      {video.category}
                    </Badge>
                  </div>

                  {/* Featured badge - Responsive */}
                  {video.featured && (
                    <div className="absolute top-2 right-2">
                      <Badge className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Featured</span>
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  
                  {video.description && (
                    <p className="text-muted-foreground text-sm mb-3 sm:mb-4 line-clamp-2">
                      {video.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">{video.views.toLocaleString()}</span>
                        <span className="sm:hidden">{video.views > 999 ? `${Math.floor(video.views/1000)}K` : video.views}</span>
                      </div>
                    </div>
                  </div>

                  {video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                      {video.tags.slice(0, window.innerWidth < 640 ? 2 : 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {video.tags.length > (window.innerWidth < 640 ? 2 : 3) && (
                        <Badge variant="outline" className="text-xs">
                          +{video.tags.length - (window.innerWidth < 640 ? 2 : 3)}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Responsive button layout */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      className="flex-1 text-sm sm:text-base"
                      onClick={() => handleWatchVideo(video)}
                    >
                      <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Watch Video
                    </Button>
                    
                    {/* Share button */}
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="sm:w-auto sm:px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(getShareableUrl(video));
                        // You could show a toast here
                      }}
                      title="Copy shareable link"
                    >
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="ml-2 sm:hidden">Share</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View All Videos Button - Fixed 404 issue */}
        <div className="text-center mt-8 sm:mt-12">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={handleViewAllVideos}
            className="w-full sm:w-auto"
          >
            View All Videos
          </Button>
        </div>
      </div>

      {/* Video Player Modal - Responsive */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xs sm:max-w-2xl lg:max-w-4xl w-[95vw] sm:w-full p-0 max-h-[90vh] overflow-auto">
          <DialogHeader className="p-4 sm:p-6 pb-0">
            <div className="flex items-start justify-between">
              <DialogTitle className="text-base sm:text-xl font-semibold pr-8 line-clamp-2">
                {selectedVideo?.title}
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={closeModal}
                className="absolute right-2 top-2 sm:right-4 sm:top-4 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="aspect-video w-full">
            {selectedVideo && (
              <>
                {isYouTubeVideo(selectedVideo.video_url) ? (
                  <iframe
                    src={getEmbedUrl(selectedVideo.video_url)}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedVideo.title}
                  />
                ) : (
                  <video
                    src={selectedVideo.video_url}
                    className="w-full h-full object-contain bg-black"
                    controls
                    autoPlay
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </>
            )}
          </div>

          <div className="p-4 sm:p-6">
            {selectedVideo?.description && (
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                {selectedVideo.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                {selectedVideo?.views.toLocaleString()} views
              </div>
              {selectedVideo?.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  {formatDuration(selectedVideo.duration)}
                </div>
              )}
              <Badge variant="outline" className="capitalize text-xs sm:text-sm">
                {selectedVideo?.category}
              </Badge>
            </div>

            {selectedVideo?.tags && selectedVideo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {selectedVideo.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default VideoSection;