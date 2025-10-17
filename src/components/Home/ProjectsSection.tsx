import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setError(null);
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("featured", true)
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;
        setProjects(data || []);
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
                  <div className="p-6 space-y-4">
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
    <section className="py-24 bg-background border-t border-border relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 mb-8">
            <Badge
              variant="secondary"
              className="px-5 py-2.5 text-sm font-semibold bg-muted text-foreground border-border rounded-full"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Featured Projects
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6 lg:mb-8 leading-tight tracking-tight">
            <span className="block mb-1 sm:mb-2">Empowering Kenyan Farms,</span>
            <span className="block text-primary">Transforming Agriculture</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Discover how our innovative irrigation solutions, rooted in Kenyan
            expertise, enable farmers and businesses to thrive sustainably.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {projects.map((project) => {
            const projectImage = getProjectImage(project);
            const formattedArea = formatArea(project.area_covered);

            return (
              <Card
                key={project.id}
                className="group relative overflow-hidden bg-background border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-0">
                  {/* Project Image */}
                  <div className="relative aspect-[3/2] overflow-hidden">
                    {projectImage ? (
                      <img
                        src={projectImage}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
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
                        className="bg-muted text-foreground border-border font-medium"
                      >
                        {project.project_type || "Irrigation Project"}
                      </Badge>
                      {project.status && (
                        <Badge
                          variant="outline"
                          className="font-medium bg-muted text-foreground border-border"
                        >
                          {formatStatus(project.status)}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-foreground line-clamp-2 leading-tight">
                      {project.name}
                    </h3>

                    {project.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm truncate">
                          {project.location}
                        </span>
                      </div>
                    )}

                    {project.completion_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm">
                          Completed:{" "}
                          {new Date(
                            project.completion_date,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {/* Project Stats */}
                    {(formattedArea || project.water_saved) && (
                      <div className="grid grid-cols-2 gap-3">
                        {formattedArea && (
                          <div className="text-center p-4 bg-muted/30 rounded-xl border border-border">
                            <div className="text-lg font-bold text-foreground">
                              {formattedArea}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Area Covered
                            </div>
                          </div>
                        )}
                        {project.water_saved && (
                          <div className="text-center p-4 bg-muted/30 rounded-xl border border-border">
                            <div className="text-lg font-bold text-foreground">
                              {project.water_saved}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Water Saved
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {project.yield_improvement && (
                      <div className="text-center p-4 bg-muted/30 rounded-xl border border-border">
                        <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
                          <TrendingUp className="h-4 w-4 text-primary" />+
                          {project.yield_improvement}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Yield Improvement
                        </div>
                      </div>
                    )}

                    {project.testimonial && (
                      <blockquote className="text-sm text-muted-foreground italic border-l-4 border-border pl-3 py-1 line-clamp-3">
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
        <div className="text-center">
          <Link to="/projects">
            <Button
              size="lg"
              className="px-8 py-6 text-lg rounded-2xl bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300"
            >
              View All Projects
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
