import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Breadcrumbs from "@/components/Layout/Breadcrumbs";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
import SEOHead from "@/components/common/SEOHead";
import { VideoCard } from "@/components/Video/VideoCard";
import { VideoPlayerModal } from "@/components/Video/VideoPlayerModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { dataService } from "@/services/dataService";
import { buildLocalBusinessSchema, SITE_COMPANY } from "@/config/company";
import {
  buildVideoQuoteHref,
  CF_VIDEO_FALLBACK_THUMBNAIL,
  formatVideoDuration,
  getVideoThumbnailUrl,
  getVideoTopicLabel,
  getYouTubeVideoId,
  inferVideoTopic,
  openVideoWhatsApp,
  VIDEO_TOPIC_FILTERS,
  VideoItem,
  VideoTopicId,
} from "@/lib/videoUtils";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageCircle,
  Play,
  Search,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";

const VIDEOS_PER_PAGE = 12;

const VideosPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<VideoTopicId>(() => {
    const paramTopic = searchParams.get("topic") as VideoTopicId | null;
    return VIDEO_TOPIC_FILTERS.some((t) => t.id === paramTopic)
      ? (paramTopic as VideoTopicId)
      : "all";
  });
  const [sortBy, setSortBy] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: allVideos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["all-videos-library"],
    queryFn: async () => {
      const data = await dataService.getVideos({});
      return (Array.isArray(data) ? data : []) as VideoItem[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Open deep-linked video (?video=<id>) automatically once loaded
  useEffect(() => {
    const deepVideoId = searchParams.get("video");
    if (!deepVideoId || allVideos.length === 0 || isModalOpen) return;
    const match = allVideos.find((v) => v.id === deepVideoId);
    if (match) {
      setSelectedVideo(match);
      setIsModalOpen(true);
    }
  }, [allVideos, searchParams, isModalOpen]);

  const topicCounts = useMemo(() => {
    const counts: Record<VideoTopicId, number> = {
      all: allVideos.length,
      rainhose: 0,
      "dam-liners": 0,
      "drip-emitters": 0,
      sprinklers: 0,
      "foggers-greenhouse": 0,
    };
    for (const v of allVideos) {
      const topic = inferVideoTopic(v);
      if (topic !== "all") counts[topic] += 1;
    }
    return counts;
  }, [allVideos]);

  const filteredVideos = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = allVideos.filter((video) => {
      const matchesTopic =
        selectedTopic === "all" || inferVideoTopic(video) === selectedTopic;
      if (!matchesTopic) return false;
      if (!q) return true;
      const haystack = [
        video.title,
        video.description || "",
        ...(Array.isArray(video.tags) ? video.tags : []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    const sorted = [...list];
    switch (sortBy) {
      case "most-viewed":
        sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime(),
        );
        break;
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime(),
        );
        break;
      case "featured":
      default:
        sorted.sort((a, b) => {
          const featDiff = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
          if (featDiff !== 0) return featDiff;
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
        });
        break;
    }
    return sorted;
  }, [allVideos, searchTerm, selectedTopic, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTopic, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE));
  const startIndex = (currentPage - 1) * VIDEOS_PER_PAGE;
  const currentVideos = filteredVideos.slice(
    startIndex,
    startIndex + VIDEOS_PER_PAGE,
  );

  const spotlightVideo = useMemo(() => {
    if (allVideos.length === 0) return null;
    return (
      allVideos.find((v) => v.featured && /dripline|rainhose|dam/i.test(v.title)) ||
      allVideos.find((v) => v.featured) ||
      allVideos[0]
    );
  }, [allVideos]);

  const handleWatchVideo = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsModalOpen(true);

    void supabase
      .from("videos")
      .update({ views: (video.views || 0) + 1 })
      .eq("id", video.id)
      .then(({ error: updateErr }) => {
        if (updateErr) console.error("Failed to increment views:", updateErr);
      });
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setSelectedVideo(null);
      if (searchParams.has("video")) {
        const next = new URLSearchParams(searchParams);
        next.delete("video");
        setSearchParams(next, { replace: true });
      }
    }
  };

  const relatedVideos = useMemo(() => {
    if (!selectedVideo) return [];
    const selectedTopicKey = inferVideoTopic(selectedVideo);
    return allVideos
      .filter((v) => v.id !== selectedVideo.id)
      .sort((a, b) => {
        const aSame = Number(inferVideoTopic(a) === selectedTopicKey);
        const bSame = Number(inferVideoTopic(b) === selectedTopicKey);
        return bSame - aSame;
      })
      .slice(0, 3);
  }, [selectedVideo, allVideos]);

  const videoListSchema =
    allVideos.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Irrigation videos — DripTech Eco Flow",
          description:
            "Drip irrigation installation guides, product demos and farm tutorials from DripTech Eco Flow Kenya.",
          numberOfItems: Math.min(allVideos.length, 30),
          itemListElement: allVideos.slice(0, 30).map((video, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "VideoObject",
              name: video.title.trim(),
              description:
                video.description ||
                `${video.title.trim()} — field video from DripTech Eco Flow Kenya.`,
              thumbnailUrl:
                video.thumbnail_url ||
                (getYouTubeVideoId(video.video_url)
                  ? `https://img.youtube.com/vi/${getYouTubeVideoId(video.video_url)}/hqdefault.jpg`
                  : undefined),
              contentUrl: video.video_url,
              embedUrl: video.video_url,
              uploadDate: video.created_at || undefined,
              interactionStatistic: {
                "@type": "InteractionCounter",
                interactionType: { "@type": "WatchAction" },
                userInteractionCount: video.views || 0,
              },
              publisher: {
                "@type": "Organization",
                name: SITE_COMPANY.name,
                logo: {
                  "@type": "ImageObject",
                  url: SITE_COMPANY.logo,
                },
              },
            },
          })),
        }
      : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead
        title={`Irrigation Videos & Field Installation Demos Kenya | ${SITE_COMPANY.name}`}
        description={`Watch real Kenyan drip irrigation installations, 32mm rainhose demos, HDPE dam liners, rain guns, and foggers. Call or WhatsApp ${SITE_COMPANY.phonePrimaryDisplay} for equipment quotes.`}
        keywords="drip irrigation video Kenya, rainhose video Kenya, dam liner video Kenya, irrigation installation tutorial, DripTech videos"
        url="https://www.dripstech.co.ke/videos"
        schema={[
          buildLocalBusinessSchema(),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Irrigation Video Library",
            url: "https://www.dripstech.co.ke/videos",
            about: "Drip irrigation and farm water systems",
          },
          ...(videoListSchema ? [videoListSchema] : []),
        ]}
      />
      <Header />

      <div className="dt-container">
        <Breadcrumbs />
      </div>

      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* Editorial Hero + Spotlight Video Card */}
        <section className="pb-10 pt-2 sm:pb-14">
          <div className="dt-container">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7 lg:p-10">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        Real Farm Proof •{" "}
                        {allVideos.length > 0 ? `${allVideos.length} Field Videos` : "Video Library"}
                      </span>
                    </div>

                    <h1 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                      See DripTech Systems{" "}
                      <span className="text-primary">Working in the Field</span>
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                      Short, practical field demonstrations of our driplines, button
                      drippers, 32mm rainhose, HDPE dam liners, gear-drive rain guns,
                      and foggers — ask directly for a quote on anything you see.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {spotlightVideo && (
                      <Button
                        type="button"
                        onClick={() => handleWatchVideo(spotlightVideo)}
                        className="h-11 bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        <Play className="mr-2 h-4 w-4 fill-current" />
                        Watch Spotlight Demo
                      </Button>
                    )}

                    <Link
                      to="/installation-guides"
                      className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <BookOpen className="h-4 w-4 text-primary" />
                      Installation Guides
                    </Link>

                    <Link
                      to="/contact?topic=kits-supply"
                      className="inline-flex h-11 items-center gap-1.5 px-2 text-sm font-bold text-primary hover:underline"
                    >
                      Request a Farm Quote
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Right Spotlight Video Card */}
                {spotlightVideo && (
                  <div className="flex flex-col justify-between border-t border-border bg-muted/25 p-5 sm:p-6 lg:col-span-5 lg:border-l lg:border-t-0">
                    <button
                      type="button"
                      onClick={() => handleWatchVideo(spotlightVideo)}
                      className="group relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black text-left"
                      aria-label={`Play spotlight video: ${spotlightVideo.title.trim()}`}
                    >
                      <img
                        src={getVideoThumbnailUrl(spotlightVideo)}
                        alt={spotlightVideo.title.trim()}
                        onError={(e) => {
                          if (e.currentTarget.src !== CF_VIDEO_FALLBACK_THUMBNAIL) {
                            e.currentTarget.src = CF_VIDEO_FALLBACK_THUMBNAIL;
                          }
                        }}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/25" />
                      <span className="absolute left-3 top-3 rounded-md bg-accent px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-foreground">
                        Featured Field Clip
                      </span>
                      {formatVideoDuration(spotlightVideo.duration) && (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded bg-black/75 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                          <Clock className="h-3 w-3" />
                          {formatVideoDuration(spotlightVideo.duration)}
                        </span>
                      )}
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-primary shadow-xl transition-transform group-hover:scale-110">
                          <Play className="ml-0.5 h-6 w-6 fill-current" />
                        </span>
                      </span>
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                          {getVideoTopicLabel(spotlightVideo)}
                        </p>
                        <p className="mt-0.5 line-clamp-2 font-heading text-base font-bold">
                          {spotlightVideo.title.trim()}
                        </p>
                      </div>
                    </button>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openVideoWhatsApp(
                            spotlightVideo,
                            "video spotlight WhatsApp",
                          )
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--dt-whatsapp))] hover:underline"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Ask price on WhatsApp
                      </button>

                      <Link
                        to={buildVideoQuoteHref(spotlightVideo)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        Quote this setup
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Filter Bar + Video Grid */}
        <section className="border-t border-border bg-muted/20 py-10 sm:py-14">
          <div className="dt-container">
            <Card className="mb-8 border-border bg-card shadow-sm">
              <CardContent className="space-y-4 p-4 sm:p-6">
                {/* Equipment Topic Filter Pills */}
                <div className="flex flex-wrap gap-2">
                  {VIDEO_TOPIC_FILTERS.map((topic) => {
                    const count = topicCounts[topic.id];
                    if (topic.id !== "all" && count === 0 && !isLoading) {
                      return null;
                    }
                    const active = selectedTopic === topic.id;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => setSelectedTopic(topic.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted"
                        }`}
                      >
                        <span>{topic.label}</span>
                        {!isLoading && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                              active
                                ? "bg-white/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Search + Sort Row */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by crop or equipment (e.g., rainhose, dam liner, dripper)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured First</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="most-viewed">Most Viewed</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    Showing{" "}
                    {filteredVideos.length === 0
                      ? 0
                      : `${startIndex + 1}–${Math.min(
                          startIndex + VIDEOS_PER_PAGE,
                          filteredVideos.length,
                        )}`}{" "}
                    of {filteredVideos.length} field videos
                  </span>
                  {(searchTerm || selectedTopic !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedTopic("all");
                      }}
                      className="font-semibold text-primary hover:underline"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="animate-pulse border-border bg-card">
                    <div className="aspect-video bg-muted" />
                    <CardContent className="space-y-3 p-4">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                      <div className="h-9 rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : isError ? (
              <Card className="border-border bg-card p-8 text-center">
                <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-primary" />
                <h2 className="font-heading text-xl font-bold text-foreground">
                  Error Loading Video Library
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error instanceof Error
                    ? error.message
                    : "Unable to load videos right now."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => refetch()}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </Card>
            ) : currentVideos.length === 0 ? (
              <Card className="border-border bg-card p-10 text-center">
                <Play className="mx-auto mb-3 h-10 w-10 text-primary/70" />
                <h2 className="font-heading text-xl font-bold text-foreground">
                  No Matching Videos Found
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Try another search keyword or reset the topic filter to see all
                  field demos.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedTopic("all");
                    }}
                  >
                    Show All Field Videos
                  </Button>
                  <Link
                    to="/contact?topic=kits-supply"
                    className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Ask for a System Demo
                  </Link>
                </div>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {currentVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onWatch={handleWatchVideo}
                      whatsappSource="videos library card"
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-xs font-medium text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Bottom Conversion Strip */}
            <Card className="mt-12 border-border bg-card">
              <CardContent className="flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
                <div className="max-w-xl">
                  <p className="dt-section-label mb-1">From Video to Your Farm</p>
                  <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                    Ready to Install What You Just Watched?
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Browse matching drip kits, dam liners, or rain guns in our store,
                    or book a technician to install cleanly on site.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/products"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    Shop Equipment
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/technician-services"
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    <Wrench className="h-4 w-4 text-primary" />
                    Book Technician
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <IrrigationKeywords />
      <Footer />

      <VideoPlayerModal
        video={selectedVideo}
        open={isModalOpen}
        onOpenChange={handleModalOpenChange}
        relatedVideos={relatedVideos}
        onSelectVideo={handleWatchVideo}
        whatsappSource="videos library modal"
      />
    </div>
  );
};

export default VideosPage;
