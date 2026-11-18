import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  buildVideoQuoteHref,
  formatVideoDuration,
  formatVideoViews,
  getVideoEmbedUrl,
  getVideoShareUrl,
  getVideoThumbnailUrl,
  getVideoTopicLabel,
  isTikTokVideo,
  isYouTubeVideo,
  openVideoWhatsApp,
  VideoItem,
} from "@/lib/videoUtils";
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Download,
  ExternalLink,
  Eye,
  MessageCircle,
  Play,
  Share2,
} from "lucide-react";

interface VideoPlayerModalProps {
  video: VideoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatedVideos?: VideoItem[];
  onSelectVideo?: (video: VideoItem) => void;
  whatsappSource?: string;
}

export function VideoPlayerModal({
  video,
  open,
  onOpenChange,
  relatedVideos = [],
  onSelectVideo,
  whatsappSource = "video library modal",
}: VideoPlayerModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!video) return null;

  const isYouTube = isYouTubeVideo(video.video_url);
  const isTikTok = isTikTokVideo(video.video_url);
  const embedUrl = getVideoEmbedUrl(video.video_url);
  const durationLabel = formatVideoDuration(video.duration);
  const topicLabel = getVideoTopicLabel(video);

  const handleCopyShareLink = async () => {
    const shareUrl = getVideoShareUrl(video.id);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Shareable link copied to clipboard.",
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy Link",
        description: shareUrl,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-4xl overflow-y-auto rounded-2xl border-border bg-card p-0">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="dt-badge-primary">{topicLabel}</span>
            {durationLabel && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {durationLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Eye className="h-3.5 w-3.5 text-primary" />
              {formatVideoViews(video.views)} views
            </span>
          </div>
          <DialogTitle className="mt-1.5 font-heading text-lg font-bold text-foreground sm:text-xl">
            {video.title.trim()}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {video.description || `Field video demonstration for ${video.title}`}
          </DialogDescription>
        </DialogHeader>

        {/* Video Stage */}
        <div
          className={
            isTikTok
              ? "flex w-full justify-center bg-black py-4"
              : "aspect-video w-full bg-black"
          }
        >
          {isYouTube ? (
            <iframe
              src={embedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          ) : isTikTok ? (
            <iframe
              src={embedUrl}
              className="h-[540px] max-h-[65vh] w-[320px] max-w-full"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          ) : (
            <video
              key={video.id}
              src={embedUrl}
              poster={getVideoThumbnailUrl(video)}
              className="h-full w-full object-contain"
              controls
              autoPlay
              playsInline
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>
          )}
        </div>

        {/* Details & Customer Conversion Bar */}
        <div className="space-y-5 p-5 sm:p-6">
          {video.description?.trim() && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {video.description.trim()}
            </p>
          )}

          {/* Direct Quote / WhatsApp Actions */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/35 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Need This Setup on Your Farm?
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ask our Sales &amp; Engineering team for pricing, specs, and county delivery.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => openVideoWhatsApp(video, whatsappSource)}
                className="bg-[hsl(var(--dt-whatsapp))] text-white hover:bg-[hsl(var(--dt-whatsapp)/0.9)]"
              >
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                Ask on WhatsApp
              </Button>
              <Link
                to={buildVideoQuoteHref(video)}
                onClick={() => onOpenChange(false)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Request Quote
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Utility Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {video.created_at && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(video.created_at).toLocaleDateString("en-KE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyShareLink}
              >
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5 text-primary" />
                    Copied Link
                  </>
                ) : (
                  <>
                    <Share2 className="mr-1.5 h-3.5 w-3.5" />
                    Share Video
                  </>
                )}
              </Button>

              <a
                href={video.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                {isYouTube || isTikTok ? (
                  <>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Original
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Open MP4
                  </>
                )}
              </a>
            </div>
          </div>

          {/* Related Field Videos */}
          {relatedVideos.length > 0 && onSelectVideo && (
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                More Field Demonstrations
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {relatedVideos.slice(0, 3).map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => onSelectVideo(rel)}
                    className="group flex items-center gap-2.5 rounded-xl border border-border bg-background p-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <img
                        src={getVideoThumbnailUrl(rel)}
                        alt={rel.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-4 w-4 text-white" />
                      </span>
                    </div>
                    <span className="line-clamp-2 text-xs font-semibold text-foreground group-hover:text-primary">
                      {rel.title.trim()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
