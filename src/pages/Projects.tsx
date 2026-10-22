import { useState, useEffect, useMemo, useCallback } from "react";
import { dataService } from "@/services/dataService";
import {
  Calendar,
  MapPin,
  Droplets,
  ArrowLeft,
  Award,
  Target,
  Search,
  Filter,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  Grid,
  List,
} from "lucide-react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import SEOHead from "@/components/common/SEOHead";
import Breadcrumbs from "@/components/Layout/Breadcrumbs";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import { isIrrigationRelatedContent } from "@/lib/irrigationContent";

// Types
interface Project {
  id: string;
  name: string;
  project_type?: string;
  status?: string;
  location?: string;
  created_at: string;
  completion_date?: string;
  area_covered?: number;
  water_saved?: number;
  project_images?: string[];
  after_images?: string[];
  before_images?: string[];
  customer_id?: string;
  featured?: boolean;
  testimonial?: string;
  yield_improvement?: number;
}

interface Filters {
  status: string;
  projectType: string;
  location: string;
}



interface FilterOptions {
  types: string[];
  statuses: string[];
  locations: string[];
}

// Constants
const ITEMS_PER_PAGE = 9;
const MAX_PAGES_TO_SHOW = 7;
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name", label: "Name A-Z" },
] as const;

// Utility Functions
const getStatusIcon = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return <CheckCircle className="h-3 w-3" />;
    case "in_progress":
      return <Clock className="h-3 w-3" />;
    case "planned":
      return <AlertCircle className="h-3 w-3" />;
    default:
      return null;
  }
};

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "planned":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-muted text-foreground border-border";
  }
};

// Components
const ProjectHero = ({ onGoBack }: { onGoBack: () => void }) => (
  <section className="relative isolate overflow-hidden bg-[hsl(var(--dt-green-900))] text-white">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20">
      <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full border border-[hsl(var(--dt-gold-400))] sm:h-[28rem] sm:w-[28rem]" />
      <div className="absolute -right-2 -top-10 h-64 w-64 rounded-full border border-white/20 sm:h-96 sm:w-96" />
      <div className="absolute bottom-0 left-0 h-1 w-40 bg-[hsl(var(--dt-gold-400))]" />
    </div>
    <div className="dt-container relative py-12 sm:py-16 lg:py-20">
      <Button variant="outline" onClick={onGoBack} aria-label="Go back to previous page" className="mb-10 border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="max-w-4xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--dt-gold-400)/0.5)] bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[hsl(var(--dt-gold-400))]">
          <Award className="h-4 w-4" /> Field work. Real results.
        </div>
        <h1 className="storefront-heading max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-7xl">
          Irrigation built for <span className="text-[hsl(var(--dt-gold-400))]">real farms.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">Explore selected DripTech Eco-Flow installations, from efficient drip systems to tailored farm irrigation solutions across Kenya.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/70">
          <span className="inline-flex items-center gap-2"><Droplets className="h-4 w-4 text-[hsl(var(--dt-gold-400))]" /> Water-smart systems</span>
          <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" />
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[hsl(var(--dt-gold-400))]" /> Projects across Kenya</span>
        </div>
      </div>
    </div>
  </section>
);

interface ProjectCardProps {
  project: Project;
  viewMode: "grid" | "list";
  index: number;
}

const ProjectCard = ({ project, viewMode, index }: ProjectCardProps) => (
  <Card
    className={`group overflow-hidden rounded-2xl border border-border bg-card shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-[hsl(var(--dt-green-300))] hover:shadow-[var(--shadow-float)] ${viewMode === "list" ? "flex" : ""
      }`}
    style={{ animationDelay: `${index * 100}ms` }}
  >
    {viewMode === "grid" ? (
      <>
        <div className="relative aspect-[5/4] overflow-hidden bg-muted">
          {project.project_images?.length ? (
            <img
              src={project.project_images[0]}
              alt={`Image of ${project.name} project`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex h-full w-full items-center justify-center bg-[hsl(var(--dt-green-50))] dark:bg-[hsl(var(--dt-green-900))]">
              <Droplets className="h-16 w-16 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          <div className="absolute top-4 right-4">
            <Badge className={getStatusColor(project.status)}>
              {getStatusIcon(project.status)}
              <span className="ml-1">{project.status}</span>
            </Badge>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-muted/30 border-border text-foreground">
              <Target className="h-3 w-3 mr-1" />
              {project.project_type || "Irrigation Project"}
            </Badge>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-3 leading-tight group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          <div className="space-y-2 mb-4">
            {project.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-sm">{project.location}</span>
              </div>
            )}
            {project.completion_date &&
                project.status?.toLowerCase() === "completed" &&
                Number.isFinite(new Date(project.completion_date).getTime()) &&
                new Date(project.completion_date).getTime() <= Date.now() && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-sm">
                  Completed{" "}
                  {new Date(project.completion_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
                    {/* WhatsApp Inquiry Button */}
          <Button
            onClick={() => {
              const message = encodeURIComponent(
                `Hi DripTech! I'm interested in the "${project.name}" project${project.location ? ` in ${project.location}` : ''}. Can you share more details?`
              );
              openTrackedWhatsApp(`https://wa.me/254723407849?text=${message}`, "project inquiry");
            }}
            className="w-full dt-btn-whatsapp w-full rounded-xl shadow-none transition-all hover:-translate-y-0.5 text-sm"
          >
            <span className="mr-2 text-lg">💬</span>
            Inquire About This Project
          </Button>
        </CardContent>
      </>
    ) : (
      <div className="flex w-full">
        <div className="relative w-48 flex-shrink-0 overflow-hidden">
          {project.project_images?.length ? (
            <img
              src={project.project_images[0]}
              alt={`Image of ${project.name} project`}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Droplets className="h-12 w-12 text-primary/60" />
            </div>
          )}
        </div>
        <CardContent className="flex-1 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-muted/30 border-border text-foreground">
                  <Target className="h-3 w-3 mr-1" />
                  {project.project_type || "Irrigation Project"}
                </Badge>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusIcon(project.status)}
                  <span className="ml-1">{project.status}</span>
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {project.name}
              </h3>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {project.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-sm">{project.location}</span>
                </div>
              )}
              {project.completion_date &&
                project.status?.toLowerCase() === "completed" &&
                Number.isFinite(new Date(project.completion_date).getTime()) &&
                new Date(project.completion_date).getTime() <= Date.now() && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-sm">
                    Completed{" "}
                    {new Date(project.completion_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* WhatsApp Inquiry Button */}
          <Button
            onClick={() => {
              const message = encodeURIComponent(
                `Hi DripTech! I'm interested in the "${project.name}" project${project.location ? ` in ${project.location}` : ''}. Can you share more details?`
              );
              openTrackedWhatsApp(`https://wa.me/254723407849?text=${message}`, "project inquiry");
            }}
            className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all text-sm font-semibold py-3"
          >
            <span className="mr-2 text-lg">💬</span>
            Inquire About This Project
          </Button>
        </CardContent>
      </div>
    )}
  </Card>
);

interface FilterControlsProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  filterOptions: FilterOptions;
  clearAllFilters: () => void;
  totalProjects: number;
  filteredProjectsCount: number;
}

const FilterControls = ({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  showFilters,
  setShowFilters,
  filterOptions,
  clearAllFilters,
  totalProjects,
  filteredProjectsCount,
}: FilterControlsProps) => (
  <section className="py-8 sm:py-12 bg-background shadow-md rounded-xl border border-border mx-4 sm:mx-6 lg:mx-8">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <div className="relative max-w-md mx-auto">
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
          <input
            id="project-search"
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-border rounded-xl bg-background hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm sm:text-base"
            aria-label="Search projects by name, location, or type"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-primary" />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md ${showFilters ? "bg-accent text-accent-foreground" : ""}`}
              aria-expanded={showFilters}
              aria-controls="filter-panel"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(filters.status !== "all" ||
                filters.projectType !== "all" ||
                filters.location !== "all" ||
                searchQuery) && (
                  <Badge className="ml-2 px-1 py-0 text-xs bg-primary text-primary-foreground">
                    {filteredProjectsCount}
                  </Badge>
                )}
            </Button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-border rounded-xl bg-background hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm sm:text-base"
              aria-label="Sort projects"
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {(filters.status !== "all" ||
              filters.projectType !== "all" ||
              filters.location !== "all" ||
              searchQuery ||
              sortBy !== "newest") && (
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                  aria-label="Clear all filters and sorting"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {filteredProjectsCount} of {totalProjects} projects
            </span>
            <div className="flex border border-border rounded-xl bg-muted/30 overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0 bg-muted/30 hover:bg-accent hover:text-accent-foreground rounded-l-full"
                aria-label="Switch to grid view"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0 bg-muted/30 hover:bg-accent hover:text-accent-foreground rounded-r-full"
                aria-label="Switch to list view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {showFilters && (
          <div
            id="filter-panel"
            className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background rounded-xl border border-border shadow-md"
          >
            <div>
              <label
                htmlFor="filter-status"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Status
              </label>
              <select
                id="filter-status"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-xl bg-background hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm sm:text-base"
                aria-label="Filter by project status"
              >
                <option value="all">All Statuses</option>
                {filterOptions.statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="filter-project-type"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Project Type
              </label>
              <select
                id="filter-project-type"
                value={filters.projectType}
                onChange={(e) =>
                  setFilters({ ...filters, projectType: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-xl bg-background hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm sm:text-base"
                aria-label="Filter by project type"
              >
                <option value="all">All Types</option>
                {filterOptions.types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="filter-location"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Location
              </label>
              <select
                id="filter-location"
                value={filters.location}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-xl bg-background hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm sm:text-base"
                aria-label="Filter by project location"
              >
                <option value="all">All Locations</option>
                {filterOptions.locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  </section>
);

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  setCurrentPage,
}: PaginationProps) => {
  const getPageNumbers = useCallback(() => {
    const pages: (number | "ellipsis")[] = [];
    const startPage = Math.max(
      1,
      currentPage - Math.floor(MAX_PAGES_TO_SHOW / 2),
    );
    const endPage = Math.min(totalPages, startPage + MAX_PAGES_TO_SHOW - 1);

    if (startPage > 1) pages.push("ellipsis");
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < totalPages) pages.push("ellipsis");
    return pages;
  }, [currentPage, totalPages]);

  return totalPages > 1 ? (
    <div className="mt-12 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex gap-1">
        {getPageNumbers().map((page, index) =>
          page === "ellipsis" ? (
            <Button
              key={`ellipsis-${index}`}
              variant="ghost"
              disabled
              className="px-3 bg-muted/30 border-border rounded-xl"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
              className="px-3 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
              aria-label={`Go to page ${page}`}
            >
              {page}
            </Button>
          ),
        )}
      </div>
      <Button
        variant="outline"
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  ) : null;
};

interface ProjectsListProps {
  projects: Project[];
  viewMode: "grid" | "list";
  isFiltering: boolean;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  clearAllFilters: () => void;
}

const ProjectsList = ({
  projects,
  viewMode,
  isFiltering,
  loading,
  error,
  currentPage,
  totalPages,
  setCurrentPage,
  clearAllFilters,
}: ProjectsListProps) => (
  <section className="py-12 sm:py-16 lg:py-20 bg-background">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {error ? (
        <div className="text-center py-12 bg-background shadow-md rounded-xl p-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
            Error
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base">{error}</p>
        </div>
      ) : isFiltering ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
          <p className="text-muted-foreground text-sm mt-2">
            Applying filters...
          </p>
        </div>
      ) : loading ? (
        <div className="bg-background shadow-md rounded-xl p-6">
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                : "space-y-6"
            }
          >
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <Card
                key={index}
                className="overflow-hidden bg-background border-border shadow-md animate-pulse"
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="aspect-[4/3] bg-muted rounded-t-lg" />
                    <CardContent className="p-6">
                      <div className="flex gap-2 mb-4">
                        <div className="h-6 bg-muted rounded-full w-20" />
                        <div className="h-6 bg-muted rounded-full w-16" />
                      </div>
                      <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                      <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardContent>
                  </>
                ) : (
                  <div className="flex gap-4 p-6">
                    <div className="w-32 h-24 bg-muted rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ) : projects.length > 0 ? (
        <>
          <div
            className={
              viewMode === "grid"
                ? "mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6"
                : "space-y-6 mb-12"
            }
          >
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                viewMode={viewMode}
                index={index}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </>
      ) : (
        <div className="text-center py-12 bg-background shadow-md rounded-xl p-6">
          <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
            No Projects Found
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base mb-6">
            Try adjusting your search or filter criteria to find more projects.
          </p>
          <Button
            onClick={clearAllFilters}
            className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      )}
      <hr className="border-border w-full max-w-3xl mx-auto mt-12" />
    </div>
  </section>
);

// Main Component
const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    projectType: "all",
    location: "all",
  });
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await dataService.getProjects({ featured: true });
        setProjects(
          (data || []).filter((project) =>
            isIrrigationRelatedContent(project.name, project.project_type),
          ),
        );
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter options
  const filterOptions = useMemo<FilterOptions>(
    () => ({
      types: [
        ...new Set(projects.map((p) => p.project_type).filter(Boolean)),
      ] as string[],
      statuses: [
        ...new Set(projects.map((p) => p.status).filter(Boolean)),
      ] as string[],
      locations: [
        ...new Set(projects.map((p) => p.location).filter(Boolean)),
      ] as string[],
    }),
    [projects],
  );

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.location || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (project.project_type || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        filters.status === "all" || project.status === filters.status;
      const matchesProjectType =
        filters.projectType === "all" ||
        project.project_type === filters.projectType;
      const matchesLocation =
        filters.location === "all" || project.location === filters.location;

      return (
        matchesSearch && matchesStatus && matchesProjectType && matchesLocation
      );
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, searchQuery, filters, sortBy]);

  const totalPages = Math.ceil(
    filteredAndSortedProjects.length / ITEMS_PER_PAGE,
  );
  const paginatedProjects = filteredAndSortedProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Handle filtering animation
  useEffect(() => {
    setIsFiltering(true);
    const timeout = setTimeout(() => setIsFiltering(false), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, filters, sortBy]);

  // Reset page on filter/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  const handleGoBack = useCallback(() => {
    window.history.back();
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setFilters({ status: "all", projectType: "all", location: "all" });
    setSortBy("newest");
    setCurrentPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Irrigation Projects & Success Stories Kenya | DripTech Eco Flow"
        description="View irrigation projects across Kenya and see the systems DripTech Eco Flow supplies and installs for farms."
      />
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs />
      </div>
      <main>
        <ProjectHero onGoBack={handleGoBack} />
        <FilterControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={filters}
          setFilters={setFilters}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          filterOptions={filterOptions}
          clearAllFilters={clearAllFilters}
          totalProjects={projects.length}
          filteredProjectsCount={filteredAndSortedProjects.length}
        />
        <ProjectsList
          projects={paginatedProjects}
          viewMode={viewMode}
          isFiltering={isFiltering}
          loading={loading}
          error={error}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          clearAllFilters={clearAllFilters}
        />
      </main>
      <IrrigationKeywords />

      <Footer />
    </div>
  );
};

export default Projects;
