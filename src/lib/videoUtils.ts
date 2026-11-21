import { SITE_COMPANY } from "@/config/company";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";

export interface VideoItem {
  id: string;
  title: string;
  description?: string | null;
  video_url: string;
  thumbnail_url?: string | null;
  category?: string | null;
  tags?: string[] | null;
  views?: number | null;
  duration?: number | null;
  created_at?: string | null;
  featured?: boolean | null;
}

export type VideoTopicId =
  | "all"
  | "rainhose"
  | "dam-liners"
  | "drip-emitters"
  | "sprinklers"
  | "foggers-greenhouse";

export const VIDEO_TOPIC_FILTERS: ReadonlyArray<{
  id: VideoTopicId;
  label: string;
}> = [
  { id: "all", label: "All Systems" },
  { id: "drip-emitters", label: "Driplines & Emitters" },
  { id: "rainhose", label: "Rainhose" },
  { id: "dam-liners", label: "HDPE Dam Liners" },
  { id: "sprinklers", label: "Rain Guns & Sprinklers" },
  { id: "foggers-greenhouse", label: "Foggers & Misting" },
];

export const CF_VIDEO_FALLBACK_THUMBNAIL =
  "https://cnvtnxesywbzwsxwpejw.supabase.co/storage/v1/object/public/thumbnails/thumbnails/1759396729438_thumbnail.jpg";

export function isValidHttpUrl(url?: string | null): url is string {
  if (!url || typeof url !== "string") return false;
  return /^https?:\/\//i.test(url.trim());
}

export function inferVideoTopic(video: Pick<VideoItem, "title" | "description" | "tags">): VideoTopicId {
  const haystack = [
    video.title || "",
    video.description || "",
    ...(Array.isArray(video.tags) ? video.tags : []),
  ]
    .join(" ")
    .toLowerCase();

  if (/\bdam\s*liner|\bliner\b/.test(haystack)) return "dam-liners";
  if (/rain\s*hose|rainhose/.test(haystack)) return "rainhose";
  if (/fogger|mist|cooling/.test(haystack)) return "foggers-greenhouse";
  if (/dripline|drip line|button dripper|precision drip/.test(haystack)) {
    return "drip-emitters";
  }
  if (/rain\s*gun|sprink|pop\s*head|gear-type/.test(haystack)) return "sprinklers";
  return "all";
}

export function getVideoTopicLabel(video: Pick<VideoItem, "title" | "description" | "tags">): string {
  const topicId = inferVideoTopic(video);
  return (
    VIDEO_TOPIC_FILTERS.find((item) => item.id === topicId)?.label ||
    "Field Demo"
  );
}

export function formatVideoDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatVideoViews(views?: number | null): string {
  const count = views || 0;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/,
  );
  return match?.[1] || null;
}

export function getTikTokVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  return match?.[1] || null;
}

export function isYouTubeVideo(url?: string | null): boolean {
  return Boolean(url && (url.includes("youtube.com") || url.includes("youtu.be")));
}

export function isTikTokVideo(url?: string | null): boolean {
  return Boolean(url && url.includes("tiktok.com"));
}

export function getVideoEmbedUrl(url: string): string {
  const ytId = getYouTubeVideoId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
  const tkId = getTikTokVideoId(url);
  if (tkId) return `https://www.tiktok.com/embed/v2/${tkId}`;
  return url;
}

export function getVideoThumbnailUrl(video: Pick<VideoItem, "thumbnail_url" | "video_url">): string {
  if (isValidHttpUrl(video.thumbnail_url)) {
    return video.thumbnail_url.trim();
  }
  const ytId = getYouTubeVideoId(video.video_url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return CF_VIDEO_FALLBACK_THUMBNAIL;
}

export function getVideoShareUrl(videoId: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : SITE_COMPANY.url;
  return `${origin}/videos?video=${encodeURIComponent(videoId)}`;
}

export function buildVideoQuoteHref(video: Pick<VideoItem, "title">): string {
  const cleanTitle = video.title.trim();
  const topic = /liner|greenhouse|design/.test(cleanTitle.toLowerCase())
    ? "install-liners"
    : "kits-supply";
  return `/contact?topic=${topic}&subject=${encodeURIComponent(
    `Quote Inquiry: ${cleanTitle}`,
  )}`;
}

export function openVideoWhatsApp(
  video: Pick<VideoItem, "title">,
  source = "video library player",
): void {
  const number = SITE_COMPANY.phonePrimary.replace(/\D/g, "");
  const message = `Hi DripTech Eco Flow! I watched your video "${video.title.trim()}" and would like pricing, sizing, and delivery details.`;
  openTrackedWhatsApp(
    `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
    source,
  );
}
