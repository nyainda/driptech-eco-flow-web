import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns,
  Compass,
  Droplets,
  Eye,
  FileText,
  Grid3X3,
  Images,
  List,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Quote,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { dataService } from "@/services/dataService";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import { isIrrigationRelatedContent } from "@/lib/irrigationContent";
import {
  computeProjectPortfolioStats,
  formatAreaCoveredValue,
  formatWaterSavedValue,
} from "@/lib/projectMetrics";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Breadcrumbs from "@/components/Layout/Breadcrumbs";
import SEOHead from "@/components/common/SEOHead";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
import QuoteModal from "@/components/Home/QuoteModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Project {
  id: string;
  name: string;
  project_type?: string | null;
  status?: string | null;
  location?: string | null;
  created_at: string;
  completion_date?: string | null;
  area_covered?: number | null;
  water_saved?: number | null;
  project_images?: string[] | null;
  after_images?: string[] | null;
  before_images?: string[] | null;
  customer_id?: string | null;
  featured?: boolean | null;
  testimonial?: string | null;
  yield_improvement?: number | null;
}

interface Filters {
  status: string;
  projectType: string;
  location: string;
}

type SortOption = "featured" | "newest" | "largest" | "name";

const ITEMS_PER_PAGE = 9;
const MAX_PAGES_TO_SHOW = 7;

const getProjectGallery = (project: Project): string[] => {
  const merged = [
    ...(project.project_images || []),
    ...(project.after_images || []),
    ...(project.before_images || []),
  ].filter((url): url is string => Boolean(url && url.trim()));
  return Array.from(new Set(merged));
};

const getValidCompletionDate = (project: Project): string | null => {
  if (!project.completion_date || project.status?.toLowerCase() !== "completed") {
    return null;
  }
  const ts = new Date(project.completion_date).getTime();
  if (!Number.isFinite(ts) || ts > Date.now()) return null;
  return new Date(ts).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
  });
};

const getStatusBadgeMeta = (status?: string | null) => {
  const normalized = (status || "completed").toLowerCase();
  switch (normalized) {
    case "completed":
      return {
        label: "Completed",
        icon: <CheckCircle2 className="h-3 w-3" />,
        className:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      };
    case "in_progress":
      return {
        label: "In Progress",
        icon: <Clock className="h-3 w-3" />,
        className:
          "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
      };
    case "planned":
      return {
        label: "Planned",
        icon: <AlertCircle className="h-3 w-3" />,
        className:
          "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300",
      };
    default:
      return {
        label: (status || "Active").replace(/_/g, " "),
        icon: null,
        className: "border-border bg-muted text-muted-foreground",
      };
  }
};

const openProjectWhatsApp = (project: Project, source = "project inquiry") => {
  const msg = encodeURIComponent(
    `Hi DripTech! I viewed the "${project.name}" irrigation project${
      project.location ? ` in ${project.location}` : ""
    } and would like pricing and design advice for a similar farm setup.`,
  );
  openTrackedWhatsApp(`https://wa.me/254723407849?text=${msg}`, source);
};

interface ProjectMetricsStripProps {
  project: Project;
  compact?: boolean;
}

const ProjectMetricsStrip: React.FC<ProjectMetricsStripProps> = ({
  project,
  compact = false,
}) => {
  const areaDisplay = formatAreaCoveredValue(project.area_covered);
  const waterDisplay = formatWaterSavedValue(project.water_saved);
  const yieldDisplay = project.yield_improvement
    ? `+${project.yield_improvement}%`
    : null;

  if (!areaDisplay && !waterDisplay && !yieldDisplay) return null;

  return (
    <div
      className={`grid grid-cols-3 gap-2 rounded-xl border border-border/80 bg-muted/35 ${
        compact ? "p-2.5" : "p-3.5"
      } text-center`}
    >
      <div className="min-w-0">
        <p className={`font-mono font-black text-foreground truncate ${compact ? "text-xs" : "text-lg"}`}>
          {areaDisplay || "Custom"}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Area
        </p>
      </div>
      <div className="min-w-0 border-x border-border/80 px-1">
        <p className={`font-mono font-black text-primary truncate ${compact ? "text-xs" : "text-lg"}`}>
          {waterDisplay || "Metered"}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Water Saved
        </p>
      </div>
      <div className="min-w-0">
        <p
          className={`font-mono font-black text-emerald-600 dark:text-emerald-400 truncate ${
            compact ? "text-xs" : "text-lg"
          }`}
        >
          {yieldDisplay || "Targeted"}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Yield Lift
        </p>
      </div>
    </div>
  );
};

const FeaturedProjectSpotlight: React.FC<{
  project: Project;
  onSelect: (p: Project) => void;
}> = ({ project, onSelect }) => {
  const gallery = getProjectGallery(project);
  const coverImage = gallery[0];
  const statusMeta = getStatusBadgeMeta(project.status);
  const completionDate = getValidCompletionDate(project);
  const hasBeforeAfter = Boolean(
    project.before_images?.length && project.after_images?.length,
  );

  return (
    <Card className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div
          onClick={() => onSelect(project)}
          className="relative lg:col-span-7 aspect-[16/10] lg:aspect-auto lg:min-h-[340px] cursor-pointer overflow-hidden bg-muted"
        >
          {coverImage ? (
            <img
              src={coverImage}
              alt={`${project.name} flagship irrigation installation`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--dt-green-900))]">
              <Droplets className="h-16 w-16 text-[hsl(var(--dt-gold-400))]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <Badge className="bg-[hsl(var(--dt-gold-400))] text-slate-950 font-extrabold border-none gap-1">
              <Sparkles className="h-3 w-3" />
              Featured Installation
            </Badge>
            {hasBeforeAfter && (
              <Badge className="bg-black/70 text-white border border-white/20 backdrop-blur-sm gap-1">
                <Columns className="h-3 w-3 text-[hsl(var(--dt-gold-400))]" />
                Before & After
              </Badge>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <Images className="h-3.5 w-3.5 text-[hsl(var(--dt-gold-400))]" />
              {gallery.length} Site Photos
            </div>
          )}
        </div>

        <CardContent className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 space-y-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-semibold">
                <Target className="h-3 w-3 mr-1 text-primary" />
                {project.project_type || "Irrigation System"}
              </Badge>
              <Badge variant="outline" className={statusMeta.className}>
                {statusMeta.icon}
                <span className="ml-1">{statusMeta.label}</span>
              </Badge>
            </div>

            <div>
              <h2
                onClick={() => onSelect(project)}
                className="cursor-pointer font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors"
              >
                {project.name}
              </h2>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {project.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {project.location}
                  </span>
                )}
                {completionDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    Completed {completionDate}
                  </span>
                )}
              </div>
            </div>

            <ProjectMetricsStrip project={project} />

            {project.testimonial && (
              <blockquote className="rounded-xl border-l-4 border-primary bg-primary/5 px-4 py-3 text-sm italic text-foreground/90 leading-relaxed line-clamp-3">
                "{project.testimonial}"
              </blockquote>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <Button
              type="button"
              onClick={() => onSelect(project)}
              className="flex-1 sm:flex-none rounded-xl font-bold"
            >
              <Eye className="mr-1.5 h-4 w-4" />
              Inspect Project Details
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => openProjectWhatsApp(project, "featured spotlight inquiry")}
              className="flex-1 sm:flex-none dt-btn-whatsapp rounded-xl font-bold border-none"
            >
              <MessageCircle className="mr-1.5 h-4 w-4" />
              Quote Similar Setup
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

interface ProjectCardProps {
  project: Project;
  viewMode: "grid" | "list";
  onSelectProject: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  viewMode,
  onSelectProject,
}) => {
  const gallery = getProjectGallery(project);
  const coverImage = gallery[0];
  const statusMeta = getStatusBadgeMeta(project.status);
  const completionDate = getValidCompletionDate(project);
  const hasBeforeAfter = Boolean(
    project.before_images?.length && project.after_images?.length,
  );

  return (
    <Card
      className={`group overflow-hidden rounded-2xl border border-border bg-card shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:border-[hsl(var(--dt-green-300))] hover:shadow-[var(--shadow-float)] ${
        viewMode === "list" ? "flex flex-col sm:flex-row" : "flex flex-col"
      }`}
    >
      <div
        onClick={() => onSelectProject(project)}
        className={`relative cursor-pointer overflow-hidden bg-muted ${
          viewMode === "list"
            ? "aspect-[16/10] sm:w-72 sm:aspect-auto sm:min-h-[210px] shrink-0"
            : "aspect-[5/4]"
        }`}
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={`${project.name} irrigation system`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--dt-green-50))] dark:bg-[hsl(var(--dt-green-900))]">
            <Droplets className="h-14 w-14 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {project.featured && (
            <Badge className="bg-[hsl(var(--dt-gold-400))] text-slate-950 border-none font-bold text-[11px]">
              Featured
            </Badge>
          )}
          {hasBeforeAfter && (
            <Badge className="bg-black/70 text-white border border-white/20 backdrop-blur-sm text-[10px] gap-1">
              <Columns className="h-3 w-3 text-[hsl(var(--dt-gold-400))]" />
              B/A
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <Badge variant="outline" className={`${statusMeta.className} backdrop-blur-sm bg-background/85 text-[11px]`}>
            {statusMeta.icon}
            <span className="ml-1">{statusMeta.label}</span>
          </Badge>
        </div>

        {gallery.length > 1 && (
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <Images className="h-3 w-3 text-[hsl(var(--dt-gold-400))]" />
            {gallery.length}
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <Badge variant="secondary" className="text-xs font-medium">
            <Target className="h-3 w-3 mr-1 text-primary" />
            {project.project_type || "Irrigation Project"}
          </Badge>
          {completionDate && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 text-primary" />
              {completionDate}
            </span>
          )}
        </div>

        <h3
          onClick={() => onSelectProject(project)}
          className="cursor-pointer font-heading text-lg sm:text-xl font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2"
        >
          {project.name}
        </h3>

        {project.location && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{project.location}</span>
          </div>
        )}

        <div className="mb-3.5">
          <ProjectMetricsStrip project={project} compact />
        </div>

        {project.testimonial && (
          <p className="mb-4 line-clamp-2 rounded-lg border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs italic text-muted-foreground">
            "{project.testimonial}"
          </p>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSelectProject(project)}
            className="rounded-xl text-xs font-bold"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Details
          </Button>
          <Button
            type="button"
            onClick={() => openProjectWhatsApp(project)}
            className="dt-btn-whatsapp rounded-xl shadow-none text-xs font-bold"
          >
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
            Similar Quote
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  setCurrentPage,
}) => {
  const pages = useMemo(() => {
    const items: Array<number | "ellipsis"> = [];
    const startPage = Math.max(1, currentPage - Math.floor(MAX_PAGES_TO_SHOW / 2));
    const endPage = Math.min(totalPages, startPage + MAX_PAGES_TO_SHOW - 1);

    if (startPage > 1) items.push("ellipsis");
    for (let i = startPage; i <= endPage; i++) items.push(i);
    if (endPage < totalPages) items.push("ellipsis");
    return items;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="rounded-xl"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex gap-1">
        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <Button
              key={`ellipsis-${index}`}
              type="button"
              variant="ghost"
              size="sm"
              disabled
              className="rounded-xl"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              key={page}
              type="button"
              size="sm"
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
              className="rounded-xl w-9 px-0"
              aria-label={`Go to page ${page}`}
            >
              {page}
            </Button>
          ),
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="rounded-xl"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

const Projects: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    projectType: "all",
    location: "all",
  });
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await dataService.getProjects();
        const irrigationProjects = ((data || []) as Project[]).filter((project) =>
          isIrrigationRelatedContent(project.name, project.project_type),
        );
        irrigationProjects.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setProjects(irrigationProjects);

        const deepLinkId = searchParams.get("project");
        if (deepLinkId) {
          const found = irrigationProjects.find((p) => p.id === deepLinkId);
          if (found) {
            setSelectedProject(found);
            setActivePhotoIndex(0);
          }
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again shortly.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const portfolioStats = useMemo(
    () => computeProjectPortfolioStats(projects),
    [projects],
  );

  const filterOptions = useMemo(() => {
    const types = Array.from(
      new Set(projects.map((p) => p.project_type?.trim()).filter((x): x is string => Boolean(x))),
    ).sort();
    const statuses = Array.from(
      new Set(projects.map((p) => p.status?.trim()).filter((x): x is string => Boolean(x))),
    );
    const locations = Array.from(
      new Set(projects.map((p) => p.location?.trim()).filter((x): x is string => Boolean(x))),
    ).sort();
    return { types, statuses, locations };
  }, [projects]);

  const filteredAndSortedProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = projects.filter((project) => {
      if (
        q &&
        !(
          project.name.toLowerCase().includes(q) ||
          (project.location || "").toLowerCase().includes(q) ||
          (project.project_type || "").toLowerCase().includes(q) ||
          (project.testimonial || "").toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      if (filters.status !== "all" && project.status !== filters.status) return false;
      if (filters.projectType !== "all" && project.project_type !== filters.projectType) {
        return false;
      }
      if (filters.location !== "all" && project.location !== filters.location) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "featured") {
        const featDiff = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        if (featDiff !== 0) return featDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "largest") {
        return (b.area_covered || 0) - (a.area_covered || 0);
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [projects, searchQuery, filters, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  const isUnfilteredFirstPage =
    !searchQuery.trim() &&
    filters.status === "all" &&
    filters.projectType === "all" &&
    filters.location === "all" &&
    currentPage === 1;

  const spotlightProject = useMemo(() => {
    if (!isUnfilteredFirstPage || filteredAndSortedProjects.length < 2) return null;
    return filteredAndSortedProjects.find((p) => p.featured) || filteredAndSortedProjects[0];
  }, [isUnfilteredFirstPage, filteredAndSortedProjects]);

  const gridSource = useMemo(() => {
    if (!spotlightProject) return filteredAndSortedProjects;
    return filteredAndSortedProjects.filter((p) => p.id !== spotlightProject.id);
  }, [filteredAndSortedProjects, spotlightProject]);

  const totalPages = Math.max(1, Math.ceil(gridSource.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProjects = gridSource.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    filters.status !== "all" ||
    filters.projectType !== "all" ||
    filters.location !== "all";

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setFilters({ status: "all", projectType: "all", location: "all" });
    setSortBy("featured");
    setCurrentPage(1);
  }, []);

  const openProjectModal = useCallback((project: Project) => {
    setSelectedProject(project);
    setActivePhotoIndex(0);
  }, []);

  const closeProjectModal = useCallback(() => {
    setSelectedProject(null);
    if (searchParams.has("project")) {
      searchParams.delete("project");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const activeGallery = selectedProject ? getProjectGallery(selectedProject) : [];
  const hasBeforeAfterPair = Boolean(
    selectedProject &&
      (selectedProject.before_images?.length || selectedProject.after_images?.length),
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background flex flex-col">
      <SEOHead
        title="Irrigation Projects & Installations Kenya | DripTech"
        description="Explore verified irrigation projects across Kenya including drip irrigation, sprinklers, solar borehole pumping, and greenhouse installations by DripTech."
      />
      <Header />

      <div className="dt-container w-full pt-4 pb-2">
        <Breadcrumbs />
      </div>

      <main className="flex-1 w-full overflow-x-hidden">
        {/* Hero */}
        <section className="relative w-full isolate overflow-hidden bg-[hsl(var(--dt-green-900))] text-white">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border border-[hsl(var(--dt-gold-400))] sm:h-[28rem] sm:w-[28rem]" />
            <div className="absolute -right-4 -top-10 h-64 w-64 rounded-full border border-white/25 sm:h-96 sm:w-96" />
            <div className="absolute bottom-0 left-0 h-1 w-48 bg-[hsl(var(--dt-gold-400))]" />
          </div>

          <div className="dt-container relative py-12 sm:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-8">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--dt-gold-400)/0.5)] bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--dt-gold-400))]">
                  <Award className="h-3.5 w-3.5" />
                  Verified Field Installations · Kenya
                </div>
                <h1 className="storefront-heading text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Irrigation built for{" "}
                  <span className="text-[hsl(var(--dt-gold-400))]">real Kenyan farms.</span>
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                  Browse commercial drip estates, solar borehole pumping stations, sprinkler blocks, and greenhouse fertigation installations engineered across Kenya.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <QuoteModal>
                    <Button className="h-11 rounded-xl bg-[hsl(var(--dt-gold-400))] px-5 text-sm font-bold text-slate-950 hover:bg-[hsl(var(--dt-gold-400)/0.9)]">
                      <FileText className="mr-2 h-4 w-4" />
                      Request Project BOQ
                    </Button>
                  </QuoteModal>

                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl border-white/25 bg-white/10 px-5 text-sm font-bold text-white hover:bg-white/20 hover:text-white"
                  >
                    <Link to="/pump-solar-sizing">
                      <Compass className="mr-2 h-4 w-4 text-[hsl(var(--dt-gold-400))]" />
                      Pump & Solar Sizer
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="ghost"
                    className="h-11 rounded-xl px-4 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white"
                  >
                    <Link to="/case-studies">
                      Full Case Studies
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Portfolio Telemetry Summary */}
              {!loading && projects.length > 0 && (
                <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                    <p className="text-2xl font-bold font-mono text-[hsl(var(--dt-gold-400))]">
                      {portfolioStats.total}
                    </p>
                    <p className="text-xs text-white/75 mt-0.5">Documented Projects</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                    <p className="text-2xl font-bold font-mono text-white">
                      {portfolioStats.completed}
                    </p>
                    <p className="text-xs text-white/75 mt-0.5">Completed Sites</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                    <p className="text-2xl font-bold font-mono text-white">
                      {portfolioStats.totalAcres > 0
                        ? `${portfolioStats.totalAcres.toLocaleString("en-KE")} ac`
                        : filterOptions.types.length}
                    </p>
                    <p className="text-xs text-white/75 mt-0.5">
                      {portfolioStats.totalAcres > 0 ? "Logged Area" : "System Types"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                    <p className="text-2xl font-bold font-mono text-emerald-300">
                      {portfolioStats.avgWaterSavedPct
                        ? `${portfolioStats.avgWaterSavedPct}%`
                        : portfolioStats.locationsCount}
                    </p>
                    <p className="text-xs text-white/75 mt-0.5">
                      {portfolioStats.avgWaterSavedPct ? "Avg Water Saved" : "Active Regions"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Main Portfolio Workspace */}
        <section className="py-10 sm:py-14">
          <div className="dt-container space-y-6">
            {/* Search & Multi-Filter Command Bar */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by project name, county/town, system type, or farmer note..."
                      className="pl-10 pr-9 h-10 rounded-xl"
                      aria-label="Search projects"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5">
                    <Select
                      value={filters.status}
                      onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
                    >
                      <SelectTrigger className="w-full sm:w-36 h-10 rounded-xl">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {filterOptions.statuses.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {filterOptions.locations.length > 0 && (
                      <Select
                        value={filters.location}
                        onValueChange={(v) => setFilters((f) => ({ ...f, location: v }))}
                      >
                        <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
                          <SelectValue placeholder="All Locations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          {filterOptions.locations.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Select
                      value={sortBy}
                      onValueChange={(v) => setSortBy(v as SortOption)}
                    >
                      <SelectTrigger className="w-full sm:w-40 h-10 rounded-xl">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="featured">Featured First</SelectItem>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="largest">Largest Acreage</SelectItem>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        onClick={() => setViewMode("grid")}
                        className="h-8 px-2.5 rounded-lg"
                        aria-label="Grid view"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        onClick={() => setViewMode("list")}
                        className="h-8 px-2.5 rounded-lg"
                        aria-label="List view"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* System Type Quick Chips + Result Count */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={filters.projectType === "all" ? "default" : "outline"}
                      onClick={() => setFilters((f) => ({ ...f, projectType: "all" }))}
                      className="h-8 rounded-full text-xs"
                    >
                      All Systems ({projects.length})
                    </Button>
                    {filterOptions.types.map((type) => (
                      <Button
                        key={type}
                        type="button"
                        size="sm"
                        variant={filters.projectType === type ? "default" : "outline"}
                        onClick={() => setFilters((f) => ({ ...f, projectType: type }))}
                        className="h-8 rounded-full text-xs"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Showing <strong className="text-foreground">{filteredAndSortedProjects.length}</strong> of{" "}
                      {projects.length} projects
                    </span>
                    {hasActiveFilters && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={clearAllFilters}
                        className="h-7 px-2 text-xs text-primary"
                      >
                        <X className="mr-1 h-3 w-3" />
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Area */}
            {error ? (
              <Card className="rounded-2xl border-border">
                <CardContent className="py-16 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground">Unable to Load Projects</h3>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </CardContent>
              </Card>
            ) : loading ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden rounded-2xl border-border animate-pulse">
                    <div className="aspect-[5/4] bg-muted" />
                    <CardContent className="p-6 space-y-3">
                      <div className="h-5 w-24 rounded-full bg-muted" />
                      <div className="h-6 w-3/4 rounded bg-muted" />
                      <div className="h-4 w-1/2 rounded bg-muted" />
                      <div className="h-14 rounded-xl bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAndSortedProjects.length === 0 ? (
              <Card className="rounded-2xl border-border">
                <CardContent className="py-16 text-center">
                  <Droplets className="h-12 w-12 text-primary/40 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground">No Projects Found</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-5">
                    Try clearing your search or selecting a different county or system filter.
                  </p>
                  <Button type="button" onClick={clearAllFilters} className="rounded-xl">
                    <X className="mr-1.5 h-4 w-4" />
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {spotlightProject && (
                  <FeaturedProjectSpotlight
                    project={spotlightProject}
                    onSelect={openProjectModal}
                  />
                )}

                {paginatedProjects.length > 0 && (
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                        : "space-y-5"
                    }
                  >
                    {paginatedProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        viewMode={viewMode}
                        onSelectProject={openProjectModal}
                      />
                    ))}
                  </div>
                )}

                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                />
              </>
            )}

            {/* Bottom Consultation CTA Band */}
            <Card className="mt-10 overflow-hidden rounded-3xl border border-[hsl(var(--dt-green-700)/0.25)] bg-[hsl(var(--dt-green-900))] text-white">
              <CardContent className="p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-2xl space-y-2">
                  <Badge className="bg-[hsl(var(--dt-gold-400))] text-slate-950 font-bold border-none">
                    Custom Irrigation & Solar Design
                  </Badge>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                    Planning a similar installation on your farm?
                  </h2>
                  <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                    Estimate your borehole pump TDH & solar array online, or request an itemized engineering BOQ tailored to your plot size, crop water demand, and elevation.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white font-semibold"
                  >
                    <Link to="/solar-panel-pump-battery-sizing-kenya">
                      <TrendingUp className="mr-2 h-4 w-4 text-[hsl(var(--dt-gold-400))]" />
                      Solar & Pump Calculator
                    </Link>
                  </Button>
                  <QuoteModal>
                    <Button className="h-11 rounded-xl bg-[hsl(var(--dt-gold-400))] px-5 text-sm font-bold text-slate-950 hover:bg-[hsl(var(--dt-gold-400)/0.9)]">
                      <FileText className="mr-2 h-4 w-4" />
                      Request Farm BOQ
                    </Button>
                  </QuoteModal>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Project Dossier Modal */}
        <Dialog open={Boolean(selectedProject)} onOpenChange={(open) => !open && closeProjectModal()}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedProject && (
              <>
                <DialogHeader>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      {selectedProject.project_type || "Irrigation Installation"}
                    </Badge>
                    {selectedProject.status && (
                      <Badge
                        variant="outline"
                        className={getStatusBadgeMeta(selectedProject.status).className}
                      >
                        {getStatusBadgeMeta(selectedProject.status).icon}
                        <span className="ml-1">{getStatusBadgeMeta(selectedProject.status).label}</span>
                      </Badge>
                    )}
                    {selectedProject.featured && (
                      <Badge className="bg-[hsl(var(--dt-gold-400))] text-slate-950 border-none">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="text-2xl font-bold text-foreground leading-snug">
                    {selectedProject.name}
                  </DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground pt-1">
                    {selectedProject.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {selectedProject.location}
                      </span>
                    )}
                    {getValidCompletionDate(selectedProject) && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-primary" />
                        Completed {getValidCompletionDate(selectedProject)}
                      </span>
                    )}
                  </DialogDescription>
                </DialogHeader>

                {hasBeforeAfterPair ? (
                  <Tabs defaultValue="gallery" className="mt-2 space-y-3">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="gallery">
                        Site Photos ({activeGallery.length})
                      </TabsTrigger>
                      <TabsTrigger value="compare">
                        Before & After Comparison
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="gallery" className="space-y-3">
                      {activeGallery.length > 0 && (
                        <>
                          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
                            <img
                              src={activeGallery[activePhotoIndex] || activeGallery[0]}
                              alt={`${selectedProject.name} view`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          {activeGallery.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {activeGallery.map((img, i) => (
                                <button
                                  key={img + i}
                                  type="button"
                                  onClick={() => setActivePhotoIndex(i)}
                                  className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                                    i === activePhotoIndex
                                      ? "border-primary ring-2 ring-primary/30"
                                      : "border-border opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  <img
                                    src={img}
                                    alt={`Thumbnail ${i + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>

                    <TabsContent value="compare">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Badge variant="outline">Before Installation</Badge>
                          <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted flex items-center justify-center">
                            {selectedProject.before_images?.[0] ? (
                              <img
                                src={selectedProject.before_images[0]}
                                alt="Before site installation"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">No Before Photo</span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Badge className="bg-emerald-600 text-white">After Commissioning</Badge>
                          <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted flex items-center justify-center">
                            {selectedProject.after_images?.[0] || selectedProject.project_images?.[0] ? (
                              <img
                                src={selectedProject.after_images?.[0] || selectedProject.project_images?.[0] || ""}
                                alt="After system commissioning"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">No After Photo</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : activeGallery.length > 0 ? (
                  <div className="space-y-3 mt-2">
                    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
                      <img
                        src={activeGallery[activePhotoIndex] || activeGallery[0]}
                        alt={`${selectedProject.name} view`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {activeGallery.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {activeGallery.map((img, i) => (
                          <button
                            key={img + i}
                            type="button"
                            onClick={() => setActivePhotoIndex(i)}
                            className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                              i === activePhotoIndex
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-border opacity-75 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${i + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="mt-4">
                  <ProjectMetricsStrip project={selectedProject} />
                </div>

                {selectedProject.testimonial && (
                  <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-2.5">
                      <Quote className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      <p className="text-sm italic text-foreground leading-relaxed">
                        "{selectedProject.testimonial}"
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <Button asChild variant="ghost" size="sm" className="text-xs">
                    <Link to="/pump-solar-sizing">
                      <Compass className="mr-1.5 h-3.5 w-3.5 text-primary" />
                      Estimate Pump & Solar Size
                    </Link>
                  </Button>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <QuoteModal>
                      <Button variant="outline" className="rounded-xl font-bold">
                        <FileText className="mr-2 h-4 w-4 text-primary" />
                        Request Similar System BOQ
                      </Button>
                    </QuoteModal>
                    <Button
                      type="button"
                      onClick={() => openProjectWhatsApp(selectedProject, "project modal inquiry")}
                      className="dt-btn-whatsapp rounded-xl font-bold"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat with Project Engineer
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <IrrigationKeywords />
      <Footer />
    </div>
  );
};

export default Projects;
