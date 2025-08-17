import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, MapPin, Droplets, TrendingUp } from "lucide-react";
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
          .from('projects')
          .select('*')
          .eq('featured', true)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Helper function to get project image
  const getProjectImage = (project: Project) => {
    const images = project.project_images || project.after_images || project.before_images;
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

  // Helper function to get status color
  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'planning': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'on_hold': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  // Helper function to format status text
  const formatStatus = (status: string | null) => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="h-6 bg-muted rounded w-32 mx-auto mb-4 animate-pulse"></div>
            <div className="h-12 bg-muted rounded w-96 mx-auto mb-6 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-full animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse overflow-hidden">
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
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-md mx-auto">
            <div className="text-destructive mb-4 text-lg font-medium">{error}</div>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="border-primary/20 hover:bg-primary/10"
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
    <section className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge 
            variant="secondary" 
            className="mb-4 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20"
          >
            🏗️ Featured Projects
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Empowering Kenyan Farms,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60"> Transforming Global Agriculture</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Discover how our innovative irrigation solutions, rooted in Kenyan expertise, enable farmers and businesses to thrive sustainably.
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
                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-background/80 backdrop-blur-sm"
              >
                <CardContent className="p-0">
                  {/* Project Image */}
                  <div className="relative aspect-[3/2] overflow-hidden">
                    {projectImage ? (
                      <img 
                        src={projectImage} 
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-[3/2] bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                        <Droplets className="h-16 w-16 text-primary/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 font-medium"
                      >
                        {project.project_type || 'Irrigation Project'}
                      </Badge>
                      {project.status && (
                        <Badge 
                          variant="outline" 
                          className={`font-medium ${getStatusColor(project.status)}`}
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
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm truncate">{project.location}</span>
                      </div>
                    )}

                    {project.completion_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">
                          Completed: {new Date(project.completion_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {/* Project Stats */}
                    {(formattedArea || project.water_saved) && (
                      <div className="grid grid-cols-2 gap-3">
                        {formattedArea && (
                          <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <div className="text-lg font-bold text-primary">{formattedArea}</div>
                            <div className="text-xs text-muted-foreground">Area Covered</div>
                          </div>
                        )}
                        {project.water_saved && (
                          <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <div className="text-lg font-bold text-primary">{project.water_saved}%</div>
                            <div className="text-xs text-muted-foreground">Water Saved</div>
                          </div>
                        )}
                      </div>
                    )}

                    {project.yield_improvement && (
                      <div className="text-center p-4 bg-green-500/5 rounded-xl border border-green-500/10">
                        <div className="flex items-center justify-center gap-1 text-lg font-bold text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          +{project.yield_improvement}%
                        </div>
                        <div className="text-xs text-muted-foreground">Yield Improvement</div>
                      </div>
                    )}

                    {project.testimonial && (
                      <blockquote className="text-sm text-muted-foreground italic border-l-4 border-primary/20 pl-3 py-1 line-clamp-3">
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
              variant="premium" 
              size="lg"
              className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary font-medium px-8"
            >
              <span className="relative z-10 flex items-center">
                View All Projects
                <ArrowRight className="ml-2 h-5 w-5" />
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;