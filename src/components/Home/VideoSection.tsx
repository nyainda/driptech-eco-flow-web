import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Clock, Eye, AlertTriangle, Star, X, ExternalLink, Download } from "lucide-react";

// Define types for video
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

// Utility function to format duration
const formatDuration = (seconds?: number) => {
  if (!seconds) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Utility function to extract YouTube video ID
const getYouTubeVideoId = (url: string): string => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
};

// Skeleton component for loading state
const VideoSkeleton = () => (
  <Card className="animate-pulse bg-background border-border">
    <div className="aspect-video bg-muted rounded-t-lg" />
    <CardContent className="p-4 sm:p-6">
      <div className="h-4 bg-muted rounded mb-2" />
      <div className="h-3 bg-muted rounded w-3/4" />
    </CardContent>
  </Card>
);

// Error state component
const ErrorState = ({ error, onRetry }: { error: Error | null; onRetry: () => void }) => (
  <div className="text-center py-16">
    <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-4" />
    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Error Loading Videos</h3>
    <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
      {error?.message || "Failed to load videos. Please try again later."}
    </p>
    <Button
      variant="outline"
      className="border-border hover:bg-accent hover:text-accent-foreground"
      onClick={onRetry}
    >
      Retry
    </Button>
  </div>
);

// Empty state component
const EmptyState = () => (
  <div className="text-center py-16">
    <Play className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-4" />
    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No Videos Available</h3>
    <p className="text-sm sm:text-base text-muted-foreground">Check back later for new tutorials!</p>
  </div>
);

// Video card component
const VideoCard = ({
  video,
  onWatch,
  onCopyLink,
  onDownload,
  isDownloading,
}: {
  video: Video;
  onWatch: (video: Video) => void;
  onCopyLink: (video: Video) => void;
  onDownload: (video: Video) => void;
  isDownloading: boolean;
}) => {
  const isYouTube = video.video_url.includes("youtube.com") || video.video_url.includes("youtu.be");
  const thumbnailUrl =
    video.thumbnail_url ||
    (isYouTube ? `https://img.youtube.com/vi/${getYouTubeVideoId(video.video_url)}/maxresdefault.jpg` : "/fallback-thumbnail.jpg");

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-background border-border">
      <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={() => onWatch(video)}>
        <img
          src={thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => (e.currentTarget.src = "/fallback-thumbnail.jpg")}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted/90 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity duration-300">
            <Play className="h-4 w-4 sm:h-6 sm:w-6 text-primary ml-1" />
          </div>
        </div>
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-muted/30 text-foreground border border-border px-2 py-1 rounded text-xs sm:text-sm flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(video.duration)}
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="capitalize text-xs sm:text-sm bg-muted text-foreground border-border">
            {video.category}
          </Badge>
        </div>
        {video.featured && (
          <div className="absolute top-2 right-2">
            <Badge className="text-xs bg-muted text-foreground border-border">
              <Star className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Featured</span>
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">{video.description}</p>
        )}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="hidden sm:inline">{video.views.toLocaleString()}</span>
              <span className="sm:hidden">{video.views > 999 ? `${Math.floor(video.views / 1000)}K` : video.views}</span>
            </div>
          </div>
        </div>
        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
            {video.tags.slice(0, window.innerWidth < 640 ? 2 : 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs bg-muted/30 border-border text-foreground">
                {tag}
              </Badge>
            ))}
            {video.tags.length > (window.innerWidth < 640 ? 2 : 3) && (
              <Badge variant="outline" className="text-xs bg-muted/30 border-border text-foreground">
                +{video.tags.length - (window.innerWidth < 640 ? 2 : 3)}
              </Badge>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button
            className="w-full text-sm sm:text-base bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
            onClick={() => onWatch(video)}
          >
            <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Watch Video
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
              onClick={() => onCopyLink(video)}
              title="Copy shareable link"
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs sm:text-sm">Share</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
              onClick={() => onDownload(video)}
              disabled={isDownloading}
              title={isYouTube ? "Open YouTube video" : "Download video"}
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs sm:text-sm">{isDownloading ? "..." : isYouTube ? "View" : "Download"}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Video modal component
const VideoModal = ({
  video,
  isOpen,
  onClose,
  onCopyLink,
  onDownload,
  isDownloading,
}: {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  onCopyLink: (video: Video) => void;
  onDownload: (video: Video) => void;
  isDownloading: boolean;
}) => {
  if (!video) return null;
  const isYouTube = video.video_url.includes("youtube.com") || video.video_url.includes("youtu.be");
  const embedUrl = isYouTube
    ? `https://www.youtube.com/embed/${getYouTubeVideoId(video.video_url)}?autoplay=1&rel=0`
    : video.video_url;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs sm:max-w-2xl lg:max-w-4xl w-[95vw] p-0 max-h-[90vh] overflow-auto bg-background border-border">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-base sm:text-xl font-semibold text-foreground pr-8 line-clamp-2">
              {video.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 sm:right-4 sm:top-4 bg-muted/30 hover:bg-accent hover:text-accent-foreground rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="aspect-video w-full">
          {isYouTube ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          ) : (
            <video
              src={embedUrl}
              className="w-full h-full object-contain bg-black"
              controls
              autoPlay
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
        <div className="p-4 sm:p-6">
          {video.description && (
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">{video.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              {video.views.toLocaleString()} views
            </div>
            {video.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                {formatDuration(video.duration)}
              </div>
            )}
            <Badge variant="outline" className="capitalize text-xs sm:text-sm bg-muted/30 border-border text-foreground">
              {video.category}
            </Badge>
          </div>
          {video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
              {video.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs bg-muted/30 border-border text-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button variant="outline" className="flex-1" onClick={() => onCopyLink(video)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Share Video
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onDownload(video)}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Downloading..." : isYouTube ? "View on YouTube" : "Download"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Video section component
const VideoSection = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingVideo, setDownloadingVideo] = useState<string | null>(null);

  const { data: videos = [], isLoading, isError, error } = useQuery({
    queryKey: ["published-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as Video[];
    },
  });

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/;
    return url.match(regex)?.[1] || null;
  };

  const handleCopyLink = async (video: Video) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/watch/${video.id}`);
      // Consider adding a toast notification here
      console.log("Link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleVideoDownload = async (video: Video) => {
    if (video.video_url.includes("youtube.com") || video.video_url.includes("youtu.be")) {
      window.open(video.video_url, "_blank");
      return;
    }

    try {
      setDownloadingVideo(video.id);
      const response = await fetch(video.video_url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${video.title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase()}.${
        video.video_url.split(".").pop()?.split("?")[0] || "mp4"
      }`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(video.video_url, "_blank");
    } finally {
      setDownloadingVideo(null);
    }
  };

  const incrementViews = async (videoId: string) => {
    try {
      const currentVideo = videos.find((v) => v.id === videoId);
      if (currentVideo) {
        await supabase.from("videos").update({ views: currentVideo.views + 1 }).eq("id", videoId);
      }
    } catch (error) {
      console.error("Failed to increment views:", error);
    }
  };

  const handleWatchVideo = (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
    incrementViews(video.id);
  };

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12 xl:mb-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-3 lg:mb-4">
            Irrigation Videos & <span className="text-primary">Tutorials</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Learn from our expert irrigation tutorials and see our systems in action
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <VideoSkeleton key={i} />)
          ) : isError ? (
            <ErrorState error={error} onRetry={() => window.location.reload()} />
          ) : videos.length === 0 ? (
            <EmptyState />
          ) : (
            videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onWatch={handleWatchVideo}
                onCopyLink={handleCopyLink}
                onDownload={handleVideoDownload}
                isDownloading={downloadingVideo === video.id}
              />
            ))
          )}
        </div>

        <div className="text-center mt-8 sm:mt-12 mb-12">
          <Button
            size="lg"
            className="px-10 py-4 text-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-lg hover:scale-105 transition-all duration-300 rounded-xl shadow-md group"
            onClick={() => (window.location.href = "/videos")}
          >
            <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            View All Videos
          </Button>
        </div>

        <hr className="border-border w-full max-w-3xl mx-auto mt-12" />
      </div>

      <VideoModal
        video={selectedVideo}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVideo(null);
        }}
        onCopyLink={handleCopyLink}
        onDownload={handleVideoDownload}
        isDownloading={!!downloadingVideo}
      />
    </section>
  );
};

export default VideoSection;