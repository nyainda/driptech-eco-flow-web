import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dataService } from "@/services/dataService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/Video/VideoCard";
import { VideoPlayerModal } from "@/components/Video/VideoPlayerModal";
import { VideoItem } from "@/lib/videoUtils";
import { AlertTriangle, ArrowRight, BookOpen, Play } from "lucide-react";

interface VideoSectionProps {
  compact?: boolean;
}

const VideoSection = ({ compact = false }: VideoSectionProps) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const maxItems = compact ? 4 : 6;

  const {
    data: videos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["published-videos", maxItems],
    queryFn: async () => {
      const data = await dataService.getVideos({
        sortBy: "featured",
        limit: maxItems,
      });
      return (Array.isArray(data) ? data : []) as VideoItem[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleWatchVideo = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsModalOpen(true);

    void supabase
      .from("videos")
      .update({ views: (video.views || 0) + 1 })
      .eq("id", video.id)
      .then(({ error: updateErr }) => {
        if (updateErr) {
          console.error("Failed to increment views:", updateErr);
        }
      });
  };

  if (!isLoading && !isError && videos.length === 0) {
    return null;
  }

  return (
    <section
      className={`${
        compact ? "py-12 sm:py-16" : "py-16 sm:py-20"
      } border-t border-border bg-muted/25`}
      aria-labelledby="video-section-heading"
    >
      <div className="dt-container">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="dt-section-label mb-2 flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Field Video Library
            </p>
            <h2
              id="video-section-heading"
              className="font-heading text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl"
            >
              Watch Our Irrigation Systems{" "}
              <span className="text-primary">in Action</span>
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Real field demonstrations of DripTech driplines, 32mm rainhose, HDPE
              dam liners, rain guns, and foggers working on Kenyan farms.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/installation-guides"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:text-sm"
            >
              <BookOpen className="h-4 w-4" />
              Installation Guides
            </Link>
            <Link
              to="/videos"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold text-primary transition-colors hover:border-primary/50 hover:bg-muted sm:text-sm"
            >
              Explore Video Library
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: maxItems }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="aspect-video bg-muted" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                  <div className="h-9 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h3 className="font-heading text-lg font-bold text-foreground">
              Unable to Load Field Videos
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Please try again shortly."}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${
              compact ? "lg:grid-cols-4" : "lg:grid-cols-3"
            }`}
          >
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                compact
                onWatch={handleWatchVideo}
                whatsappSource="homepage video card"
              />
            ))}
          </div>
        )}
      </div>

      <VideoPlayerModal
        video={selectedVideo}
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setSelectedVideo(null);
        }}
        relatedVideos={
          selectedVideo
            ? videos.filter((v) => v.id !== selectedVideo.id).slice(0, 3)
            : []
        }
        onSelectVideo={handleWatchVideo}
        whatsappSource="homepage video modal"
      />
    </section>
  );
};

export default VideoSection;
