import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CF_VIDEO_FALLBACK_THUMBNAIL,
  formatVideoDuration,
  formatVideoViews,
  getVideoShareUrl,
  getVideoThumbnailUrl,
  getVideoTopicLabel,
  openVideoWhatsApp,
  VideoItem,
} from "@/lib/videoUtils";
import { useToast } from "@/hooks/use-toast";
import { Clock, Eye, MessageCircle, Play, Share2, Star } from "lucide-react";

interface VideoCardProps {
  video: VideoItem;
  onWatch: (video: VideoItem) => void;
  compact?: boolean;
  whatsappSource?: string;
}

export function VideoCard({
  video,
  onWatch,
  compact = false,
  whatsappSource = "video card WhatsApp",
}: VideoCardProps) {
  const { toast } = useToast();
  const durationLabel = formatVideoDuration(video.duration);
  const topicLabel = getVideoTopicLabel(video);

  const handleCopyShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getVideoShareUrl(video.id);
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Video link copied to clipboard.",
      });
    } catch {
      toast({ title: "Video Link", description: url });
    }
  };

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      {/* Thumbnail Stage */}
      <button
        type="button"
        onClick={() => onWatch(video)}
        className="relative aspect-video w-full overflow-hidden bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Play video: ${video.title.trim()}`}
      >
        <img
          src={getVideoThumbnailUrl(video)}
          alt={video.title.trim()}
          loading="lazy"
          onError={(e) => {
            if (e.currentTarget.src !== CF_VIDEO_FALLBACK_THUMBNAIL) {
              e.currentTarget.src = CF_VIDEO_FALLBACK_THUMBNAIL;
            }
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/25 transition-opacity group-hover:from-black/65" />

        {/* Play Button */}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg transition-transform duration-200 group-hover:scale-110">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </span>

        {/* Top-left topic badge */}
        <span className="absolute left-2.5 top-2.5 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {topicLabel}
        </span>

        {/* Top-right featured badge */}
        {video.featured && (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-accent-foreground shadow-sm">
            <Star className="h-2.5 w-2.5 fill-current" />
            Featured
          </span>
        )}

        {/* Bottom-right duration pill */}
        {durationLabel && (
          <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded bg-black/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
            <Clock className="h-3 w-3" />
            {durationLabel}
          </span>
        )}
      </button>

      {/* Body */}
      <CardContent className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <button
            type="button"
            onClick={() => onWatch(video)}
            className="text-left focus-visible:outline-none"
          >
            <h3 className="line-clamp-2 font-heading text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
              {video.title.trim()}
            </h3>
          </button>

          {!compact && video.description?.trim() && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {video.description.trim()}
            </p>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5 text-primary" />
              {formatVideoViews(video.views)} views
            </span>
            {video.created_at && (
              <span>
                {new Date(video.created_at).toLocaleDateString("en-KE", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => onWatch(video)}
              className="flex-1 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Watch Demo
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openVideoWhatsApp(video, whatsappSource)}
              title="Ask about this equipment on WhatsApp"
              aria-label={`Ask about ${video.title.trim()} on WhatsApp`}
              className="border-[hsl(var(--dt-whatsapp)/0.45)] px-2.5 text-[hsl(var(--dt-whatsapp))] hover:border-[hsl(var(--dt-whatsapp))] hover:bg-[hsl(var(--dt-whatsapp)/0.1)] hover:text-[hsl(var(--dt-whatsapp))]"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>

            {!compact && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyShare}
                title="Copy share link"
                aria-label={`Copy share link for ${video.title.trim()}`}
                className="px-2.5"
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
