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
        // Take only first 3 projects
        setProjects((data || []).slice(0, 3));
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

  // Helper function to format area
  const formatArea = (area: number | null) => {
    if (!area) return null;
    if (area >= 1000) {
      return `${(area / 1000).toFixed(1)}k ha`;
    }
    return `${area} ha`;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
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
          <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-14">
            <div className="mb-3 inline-flex items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-full border-border bg-muted px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-foreground"
              >
                <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                Featured Projects
              </Badge>
            </div>
            <h2 className="font-heading text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              <span className="block mb-1 sm:mb-2">Better water use on</span>
              <span className="block text-primary">real Kenyan farms</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              See how farmers and businesses are using practical irrigation systems to grow with less water and less guesswork.
            </p>
          </div>
        )}

        {/* Projects Grid */}
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 sm:mb-10 overflow-x-auto pb-6 md:pb-0 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {projects.map((project) => {
            const projectImage = getProjectImage(project);
            const formattedArea = formatArea(project.area_covered);

            return (
              <Card
                key={project.id}
                className="group relative flex h-full flex-shrink-0 snap-center overflow-hidden rounded-[14px] border border-[hsl(var(--dt-stone-200))] bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-[hsl(var(--dt-green-300))] hover:shadow-md w-[85vw] sm:w-[320px] md:w-auto min-w-[260px] md:min-w-0"
              >
                <CardContent className="p-0">
                  {/* Project Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[hsl(var(--dt-stone-100))]">
                    {projectImage ? (
                      <img
                        src={projectImage}
                        alt={project.name}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-[3/2] bg-muted flex items-center justify-center">
                        <Droplets className="h-16 w-16 text-primary" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="rounded-full border-border bg-muted px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-foreground"
                      >
                        {project.project_type || "Irrigation Project"}
                      </Badge>
                      {project.status && (
                        <Badge
                          variant="outline"
                          className="rounded-full border-border bg-background px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
                        >
                          {formatStatus(project.status)}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-heading text-lg font-bold leading-snug tracking-tight text-foreground line-clamp-2">
                      {project.name}
                    </h3>

                    {/* Location + Date row — visible on all screens */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {project.location && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <span className="text-xs sm:text-sm truncate max-w-[130px] sm:max-w-none">
                            {project.location}
                          </span>
                        </div>
                      )}
                      {project.completion_date && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <span className="text-xs sm:text-sm">
                            {new Date(project.completion_date).toLocaleDateString("en-KE", { year: "numeric", month: "short" })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Project Stats grid — visible on all screens */}
                    {(formattedArea || project.water_saved || project.yield_improvement) && (
                      <div className="grid grid-cols-3 gap-1.5">
                        {formattedArea && (
                          <div className="rounded-lg border border-border bg-[hsl(var(--dt-stone-50)/0.55)] p-2 text-center">
                            <div className="text-sm sm:text-base font-bold text-foreground">{formattedArea}</div>
                            <div className="text-[9px] sm:text-xs text-muted-foreground mt-0.5">Area</div>
                          </div>
                        )}
                        {project.water_saved && (
                          <div className="text-center p-2.5 bg-muted/40 rounded-xl border border-border">
                            <div className="text-sm sm:text-base font-bold text-foreground">{project.water_saved}%</div>
                            <div className="text-[9px] sm:text-xs text-muted-foreground mt-0.5">Water Saved</div>
                          </div>
                        )}
                        {project.yield_improvement && (
                          <div className="text-center p-2.5 bg-muted/40 rounded-xl border border-border">
                            <div className="text-sm sm:text-base font-bold text-primary">+{project.yield_improvement}%</div>
                            <div className="text-[9px] sm:text-xs text-muted-foreground mt-0.5">Yield Up</div>
                          </div>
                        )}
                      </div>
                    )}

                    {project.testimonial && (
                      <blockquote className="text-xs sm:text-sm text-muted-foreground italic border-l-2 border-primary/40 pl-3 py-1 line-clamp-2">
                        "{project.testimonial}"
                      </blockquote>
                    )}
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
