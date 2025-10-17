import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import {
  Play,
  Clock,
  Eye,
  AlertTriangle,
  Star,
  X,
  ExternalLink,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
} from "lucide-react";

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

const VideosPage = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const videosPerPage = 12;

  const {
    data: videos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["all-videos", searchTerm, selectedCategory, sortBy],
    queryFn: async () => {
      let query = supabase.from("videos").select("*").eq("published", true);

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      if (searchTerm) {
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`,
        );
      }

      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "most-viewed":
          query = query.order("views", { ascending: false });
          break;
        case "least-viewed":
          query = query.order("views", { ascending: true });
          break;
        case "featured":
          query = query
            .order("featured", { ascending: false })
            .order("created_at", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Video[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["video-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("category")
        .eq("published", true);

      if (error) throw error;
      const uniqueCategories = [...new Set(data.map((item) => item.category))];
      return uniqueCategories;
    },
  });

  const totalPages = Math.ceil(videos.length / videosPerPage);
  const startIndex = (currentPage - 1) * videosPerPage;
  const endIndex = startIndex + videosPerPage;
  const currentVideos = videos.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy]);

  const formatDuration = (seconds: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regex =
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : null;
  };

  const isYouTubeVideo = (url: string) => {
    return url && (url.includes("youtube.com") || url.includes("youtu.be"));
  };

  const getEmbedUrl = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    return url;
  };

  const incrementViews = async (videoId: string) => {
    try {
      const video = videos.find((v) => v.id === videoId);
      await supabase
        .from("videos")
        .update({ views: (video?.views || 0) + 1 })
        .eq("id", videoId);

      refetch();
    } catch (error) {
      console.error("Failed to increment views:", error);
    }
  };

  const handleWatchVideo = async (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);

    const related = videos
      .filter(
        (v) =>
          v.id !== video.id &&
          (v.category === video.category ||
            v.tags.some((tag) => video.tags.includes(tag))),
      )
      .slice(0, 6);
    setRelatedVideos(related);

    incrementViews(video.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
    setRelatedVideos([]);
  };

  const formatViewCount = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const getShareableUrl = (video: Video) => {
    return `${window.location.origin}/videos/${video.id}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main>
          <section className="py-12 sm:py-16 lg:py-20 bg-background border-b border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-background shadow-md rounded-xl p-6">
                <div className="text-center mb-8 sm:mb-12">
                  <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
                  <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
                </div>

                <div className="mb-8 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="h-10 bg-muted rounded flex-1"></div>
                    <div className="h-10 bg-muted rounded w-48"></div>
                    <div className="h-10 bg-muted rounded w-40"></div>
                    <div className="h-10 bg-muted rounded w-24"></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: videosPerPage }).map((_, i) => (
                    <Card
                      key={i}
                      className="animate-pulse bg-background border-border shadow-md"
                    >
                      <div className="aspect-video bg-muted rounded-t-lg"></div>
                      <CardContent className="p-4">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main>
          <section className="py-12 sm:py-16 lg:py-20 bg-background border-b border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center bg-background shadow-md rounded-xl p-6">
                <AlertTriangle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  Error Loading Videos
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base mb-4">
                  {error?.message ||
                    "Failed to load videos. Please try again later."}
                </p>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                  onClick={() => refetch()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main>
        <section className="py-12 sm:py-16 lg:py-20 bg-background border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12">
              <Badge className="mb-4 bg-muted text-foreground border-border">
                <Play className="w-4 h-4 mr-2" />
                Video Library
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                Irrigation <span className="text-primary">Video Library</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Comprehensive collection of irrigation tutorials, system
                demonstrations, and expert guides
              </p>
            </div>

            <div className="mb-8 sm:mb-12 bg-background shadow-md rounded-xl border border-border p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 bg-background border-border hover:bg-muted/30 rounded-xl text-sm sm:text-base transition-colors"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4 text-primary" />
                    </Button>
                  )}
                </div>

                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full sm:w-48 bg-background border-border hover:bg-muted/30 rounded-xl text-sm sm:text-base transition-colors">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category}
                        value={category}
                        className="capitalize"
                      >
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-40 bg-background border-border hover:bg-muted/30 rounded-xl text-sm sm:text-base transition-colors">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="most-viewed">Most Viewed</SelectItem>
                    <SelectItem value="least-viewed">Least Viewed</SelectItem>
                    <SelectItem value="featured">Featured First</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border border-border rounded-xl bg-muted/30 overflow-hidden">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8 p-0 bg-muted/30 hover:bg-accent hover:text-accent-foreground rounded-l-full"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-8 w-8 p-0 bg-muted/30 hover:bg-accent hover:text-accent-foreground rounded-r-full"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
                <span>
                  Showing {startIndex + 1}-{Math.min(endIndex, videos.length)}{" "}
                  of {videos.length} videos
                </span>
                <span>{searchTerm && `Results for "${searchTerm}"`}</span>
              </div>
            </div>

            {currentVideos.length === 0 ? (
              <div className="text-center py-12 bg-background shadow-md rounded-xl p-6">
                <Play className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  No Videos Found
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base mb-6">
                  {searchTerm || selectedCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "No videos are available at the moment"}
                </p>
                {(searchTerm || selectedCategory !== "all") && (
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12"
                      : "space-y-6 mb-12"
                  }
                >
                  {currentVideos.map((video) => {
                    const thumbnailUrl =
                      video.thumbnail_url ||
                      getYouTubeThumbnail(video.video_url) ||
                      "/fallback-thumbnail.jpg";

                    if (viewMode === "list") {
                      return (
                        <Card
                          key={video.id}
                          className="group overflow-hidden bg-background border-border shadow-md hover:shadow-xl hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                        >
                          <div className="flex flex-col sm:flex-row">
                            <div
                              className="relative w-full sm:w-80 aspect-video overflow-hidden cursor-pointer"
                              onClick={() => handleWatchVideo(video)}
                            >
                              <img
                                src={thumbnailUrl}
                                alt={video.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "/fallback-thumbnail.jpg";
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                                  <Play className="h-6 w-6 text-primary ml-1" />
                                </div>
                              </div>

                              <div className="absolute top-2 left-2">
                                <Badge className="capitalize text-xs bg-muted/30 border-border text-foreground">
                                  {video.category}
                                </Badge>
                              </div>
                              {video.featured && (
                                <div className="absolute top-2 right-2">
                                  <Badge className="text-xs bg-muted/30 border-border text-foreground">
                                    <Star className="h-3 w-3 mr-1" />
                                    Featured
                                  </Badge>
                                </div>
                              )}
                              {video.duration && (
                                <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(video.duration)}
                                </div>
                              )}
                            </div>

                            <CardContent className="flex-1 p-4 sm:p-6">
                              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {video.title}
                              </h3>

                              {video.description && (
                                <p className="text-sm sm:text-base text-muted-foreground mb-3 line-clamp-2">
                                  {video.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
                                  {formatViewCount(video.views)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
                                  {formatDate(video.created_at)}
                                </div>
                              </div>

                              {video.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                                  {video.tags.slice(0, 4).map((tag) => (
                                    <Badge
                                      key={tag}
                                      className="text-xs bg-muted/30 border-border text-foreground"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {video.tags.length > 4 && (
                                    <Badge className="text-xs bg-muted/30 border-border text-foreground">
                                      +{video.tags.length - 4}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                                  onClick={() => handleWatchVideo(video)}
                                >
                                  <Play className="h-3 w-3 mr-2" />
                                  Watch
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      getShareableUrl(video),
                                    );
                                  }}
                                  title="Copy shareable link"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      );
                    }

                    return (
                      <Card
                        key={video.id}
                        className="group overflow-hidden bg-background border-border shadow-md hover:shadow-xl hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                      >
                        <div
                          className="relative aspect-video overflow-hidden cursor-pointer"
                          onClick={() => handleWatchVideo(video)}
                        >
                          <img
                            src={thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = "/fallback-thumbnail.jpg";
                            }}
                          />

                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/90 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                              <Play className="h-4 w-4 sm:h-6 sm:w-6 text-primary ml-1" />
                            </div>
                          </div>

                          <div className="absolute top-2 left-2">
                            <Badge className="capitalize text-xs bg-muted/30 border-border text-foreground">
                              {video.category}
                            </Badge>
                          </div>

                          {video.featured && (
                            <div className="absolute top-2 right-2">
                              <Badge className="text-xs bg-muted/30 border-border text-foreground">
                                <Star className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">
                                  Featured
                                </span>
                              </Badge>
                            </div>
                          )}

                          {video.duration && (
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(video.duration)}
                            </div>
                          )}
                        </div>

                        <CardContent className="p-4 sm:p-6">
                          <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {video.title}
                          </h3>

                          {video.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                              {video.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
                                {formatViewCount(video.views)}
                              </div>
                            </div>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {formatDate(video.created_at)}
                            </span>
                          </div>

                          {video.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                              {video.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag}
                                  className="text-xs bg-muted/30 border-border text-foreground"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {video.tags.length > 2 && (
                                <Badge className="text-xs bg-muted/30 border-border text-foreground">
                                  +{video.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                              onClick={() => handleWatchVideo(video)}
                            >
                              <Play className="h-3 w-3 mr-2" />
                              Watch
                            </Button>

                            <Button
                              size="sm"
                              className="bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(
                                  getShareableUrl(video),
                                );
                              }}
                              title="Copy shareable link"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-12">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {Array.from(
                        { length: Math.min(totalPages, 7) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (currentPage <= 4) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 3) {
                            pageNum = totalPages - 6 + i;
                          } else {
                            pageNum = currentPage - 3 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-10 h-10 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                            >
                              {pageNum}
                            </Button>
                          );
                        },
                      )}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
            <hr className="border-border w-full max-w-3xl mx-auto mt-12" />
          </div>
        </section>
      </main>
      <Footer />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xs sm:max-w-2xl lg:max-w-4xl w-[95vw] sm:w-full p-0 max-h-[90vh] overflow-auto bg-background border-border shadow-md rounded-xl">
          <DialogHeader className="p-4 sm:p-6 pb-0">
            <div className="flex items-start justify-between">
              <DialogTitle className="text-base sm:text-xl font-semibold text-foreground pr-8 line-clamp-2">
                {selectedVideo?.title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeModal}
                className="absolute right-2 top-2 sm:right-4 sm:top-4 bg-muted/30 hover:bg-accent hover:text-accent-foreground rounded-full"
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
                    className="w-full h-full rounded-t-xl"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedVideo.title}
                  />
                ) : (
                  <video
                    src={selectedVideo.video_url}
                    className="w-full h-full object-contain bg-black rounded-t-xl"
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
                <Eye className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
                {selectedVideo?.views.toLocaleString()} views
              </div>
              {selectedVideo?.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
                  {formatDuration(selectedVideo.duration)}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
                {selectedVideo && formatDate(selectedVideo.created_at)}
              </div>
              <Badge className="capitalize text-xs sm:text-sm bg-muted/30 border-border text-foreground">
                {selectedVideo?.category}
              </Badge>
            </div>

            {selectedVideo?.tags && selectedVideo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {selectedVideo.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="text-xs bg-muted/30 border-border text-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideosPage;
