import { useState, useEffect } from "react";
import { dataService } from "@/services/dataService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  MapPin,
  Droplets,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { isIrrigationRelatedContent } from "@/lib/irrigationContent";
import {
  formatAreaCoveredValue,
  formatWaterSavedValue,
} from "@/lib/projectMetrics";

// Type definition based on your schema
interface Project {
  id: string;
  name: string;
  location: string | null;
  project_type: string | null;
  status: string | null;
  area_covered: number | null;
  water_saved: number | null;
  yield_improvement: number | null;
  completion_date: string | null;
  start_date: string | null;
  testimonial: string | null;
  project_images: string[] | null;
  before_images: string[] | null;
  after_images: string[] | null;
  featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  customer_id: string | null;
  quote_id: string | null;
}


interface ProjectsSectionProps {
  hideHeader?: boolean;
  hideCTA?: boolean;
  compact?: boolean;
}

const ProjectsSection = ({
  hideHeader = false,
  hideCTA = false,
  compact = false,
}: ProjectsSectionProps = {}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setError(null);
        const data = await dataService.getProjects({ featured: true });
        // Public project highlights should describe irrigation work, not unrelated demo records.
        const irrigationProjects = (data || []).filter((project) =>
          isIrrigationRelatedContent(project.name, project.project_type),
        );
        setProjects(irrigationProjects.slice(0, 4));
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Helper function to get project image
  const getProjectImage = (project: Project) => {
    const images =
      project.project_images || project.after_images || project.before_images;
    return images && images.length > 0 ? images[0] : null;
  };

  // Helper function to format status text
  const formatStatus = (status: string | null) => {
    if (!status) return "Unknown";
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <section className="py-24 bg-background border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="h-6 bg-muted rounded w-32 mx-auto mb-4 animate-pulse"></div>
            <div className="h-12 bg-muted rounded w-96 mx-auto mb-6 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-full animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={index}
                className="animate-pulse overflow-hidden bg-background border-border"
              >
                <CardContent className="p-0">
                  <div className="aspect-[3/2] bg-muted rounded-t-lg"></div>
                  <div className="flex flex-1 flex-col space-y-3 p-4 sm:p-5">
                    <div className="flex gap-2">
                      <div className="h-6 bg-muted rounded w-20"></div>
                      <div className="h-6 bg-muted rounded w-16"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-16 bg-muted rounded"></div>
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-24 bg-background border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-md mx-auto">
            <div className="text-foreground mb-4 text-lg font-medium">
              {error}
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-border hover:bg-accent hover:text-accent-foreground"
            >
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  return (
    <section className={`${compact ? "py-12 sm:py-16" : "py-24 border-t"} bg-background border-border relative`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        {!hideHeader && (
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <Badge
                variant="secondary"
                className="rounded-full border-border bg-muted px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-foreground w-fit"
              >
                <TrendingUp className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Featured Projects
              </Badge>
              <h2 className="font-heading text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Selected irrigation <span className="text-primary">installations</span>
              </h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Explore real irrigation project records across Kenya—drip estates, greenhouses, and solar borehole pumping setups.
              </p>
            </div>

            <Link
              to="/projects"
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-extrabold text-primary hover:underline"
            >
              View all projects <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Projects Grid */}
        <div
          className={`flex md:grid ${
            projects.length === 1
              ? "md:grid-cols-1 max-w-md"
              : projects.length === 2
                ? "md:grid-cols-2"
                : projects.length === 3
                  ? "md:grid-cols-2 lg:grid-cols-3"
                  : "md:grid-cols-2 lg:grid-cols-4"
          } gap-4 md:gap-6 mb-8 sm:mb-10 overflow-x-auto pb-6 md:pb-0 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide`}
        >
          {projects.map((project) => {
            const projectImage = getProjectImage(project);
            const areaText = formatAreaCoveredValue(project.area_covered);
            const waterText = formatWaterSavedValue(project.water_saved);

            return (
              <Card
                key={project.id}
                className="group relative flex h-full flex-shrink-0 snap-center overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-[hsl(var(--dt-green-300))] hover:shadow-md w-[82vw] sm:w-[300px] md:w-auto min-w-[250px] md:min-w-0"
              >
                <CardContent className="p-0 flex flex-col w-full">
                  {/* Project Image */}
                  <Link
                    to={`/projects?project=${project.id}`}
                    className="relative aspect-[16/10] overflow-hidden bg-muted block"
                  >
                    {projectImage ? (
                      <img
                        src={projectImage}
                        alt={project.name}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Droplets className="h-14 w-14 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                  </Link>

                  <div className="flex flex-1 flex-col space-y-3 p-4 sm:p-5">
                    <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden min-h-[24px]">
                      <Badge
                        variant="secondary"
                        className="rounded-full border-border bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-foreground truncate max-w-[155px]"
                      >
                        {project.project_type || "Irrigation Project"}
                      </Badge>
                      {project.status && (
                        <Badge
                          variant="outline"
                          className="rounded-full border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground shrink-0"
                        >
                          {formatStatus(project.status)}
                        </Badge>
                      )}
                    </div>

                    <Link to={`/projects?project=${project.id}`} className="block">
                      <h3 className="font-heading text-base sm:text-lg font-bold leading-snug tracking-tight text-foreground line-clamp-2 min-h-[3.1rem] group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                    </Link>

                    {/* Location + Date row */}
                    <div className="flex items-center gap-3 flex-wrap min-h-[20px]">
                      {project.location && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <span className="text-xs truncate max-w-[130px] sm:max-w-none">
                            {project.location}
                          </span>
                        </div>
                      )}
                      {project.completion_date &&
                        project.status?.toLowerCase() === "completed" &&
                        Number.isFinite(new Date(project.completion_date).getTime()) &&
                        new Date(project.completion_date).getTime() <= Date.now() && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <span className="text-xs">
                            {new Date(project.completion_date).toLocaleDateString("en-KE", { year: "numeric", month: "short" })}
                          </span>
                        </div>
                      )}
                    </div>

                    {(areaText || waterText) && (
                      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-muted/35 p-2 text-center">
                        <div className="min-w-0">
                          <span className="block font-mono text-xs font-bold text-foreground truncate">
                            {areaText || "Custom"}
                          </span>
                          <span className="text-[9px] uppercase text-muted-foreground font-semibold">Area</span>
                        </div>
                        <div className="min-w-0 border-l border-border/70 px-1">
                          <span className="block font-mono text-xs font-bold text-primary truncate">
                            {waterText || "Metered"}
                          </span>
                          <span className="text-[9px] uppercase text-muted-foreground font-semibold">Water Saved</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-1">
                      <Link
                        to={`/projects?project=${project.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        View installation dossier <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        {!hideCTA && (
          <div className="text-center">
            <Link to="/projects">
              <Button
                size="lg"
                className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                View All Projects
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectsSection;
