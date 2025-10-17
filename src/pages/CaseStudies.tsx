import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  TrendingUp,
  Droplets,
  DollarSign,
  Calendar,
  MapPin,
  BarChart3,
  Users,
  Leaf,
  Award,
  ArrowRight,
  Download,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { useToast } from "@/hooks/use-toast";

const CaseStudies = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [successStories, setSuccessStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      // Fetch completed projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select(
          `
          *,
          customers (
            company_name,
            contact_person,
            city,
            country
          )
        `,
        )
        .eq("status", "completed")
        .eq("featured", true)
        .order("completion_date", { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch success stories
      const { data: storiesData, error: storiesError } = await supabase
        .from("success_stories")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false });

      if (storiesError) throw storiesError;

      setProjects(projectsData || []);
      setSuccessStories(storiesData || []);
    } catch (error) {
      console.error("Error fetching case studies:", error);
      toast({
        title: "Error",
        description: "Failed to fetch case studies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "drip_irrigation", label: "Drip Irrigation" },
    { value: "sprinkler_systems", label: "Sprinkler Systems" },
    { value: "filtration_systems", label: "Filtration Systems" },
    { value: "control_systems", label: "Smart Controls" },
    { value: "commercial", label: "Commercial Farming" },
    { value: "residential", label: "Residential" },
    { value: "greenhouse", label: "Greenhouse" },
  ];

  const regions = [
    { value: "all", label: "All Regions" },
    { value: "nairobi", label: "Nairobi" },
    { value: "central", label: "Central Kenya" },
    { value: "rift_valley", label: "Rift Valley" },
    { value: "eastern", label: "Eastern Kenya" },
    { value: "western", label: "Western Kenya" },
    { value: "coast", label: "Coast Region" },
    { value: "northern", label: "Northern Kenya" },
  ];

  const impactStats = [
    {
      icon: Droplets,
      title: "Water Saved",
      value: "2.5M",
      unit: "Liters",
      description: "Annual water conservation across all projects",
    },
    {
      icon: TrendingUp,
      title: "Yield Increase",
      value: "45%",
      unit: "Average",
      description: "Crop yield improvement across projects",
    },
    {
      icon: DollarSign,
      title: "Cost Savings",
      value: "35%",
      unit: "Average",
      description: "Reduction in irrigation costs",
    },
    {
      icon: Leaf,
      title: "Farms Transformed",
      value: "500+",
      unit: "Projects",
      description: "Successful installations completed",
    },
  ];

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.customers?.company_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      project.project_type
        ?.toLowerCase()
        .includes(selectedCategory.toLowerCase());

    const matchesRegion =
      selectedRegion === "all" ||
      project.location?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
      project.customers?.city
        ?.toLowerCase()
        .includes(selectedRegion.toLowerCase());

    return matchesSearch && matchesCategory && matchesRegion;
  });

  const filteredStories = successStories.filter(
    (story) =>
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.client_company?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-20">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              📊 Real Results
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Case <span className="text-primary">Studies</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover how our irrigation solutions have transformed farms and
              businesses across Kenya. Real projects, real results, real impact.
            </p>
          </div>

          {/* Impact Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {impactStats.map((stat, index) => (
              <Card
                key={index}
                className="text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
              >
                <CardContent className="p-6">
                  <div className="inline-flex p-3 bg-primary/10 rounded-xl mb-4">
                    <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-primary">
                        {stat.value}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {stat.unit}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">
                      {stat.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8 p-6 bg-muted/30 rounded-2xl">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search case studies by name, location, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full lg:w-64">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-48 bg-muted rounded-lg"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-6 bg-muted rounded"></div>
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Project Case Studies */}
              {filteredProjects.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Featured Project Case Studies
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                      <Card
                        key={project.id}
                        className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      >
                        <CardContent className="p-0">
                          {/* Project Images */}
                          <div className="relative aspect-video bg-muted/50 overflow-hidden rounded-t-lg">
                            {project.project_images &&
                            project.project_images.length > 0 ? (
                              <img
                                src={project.project_images[0]}
                                alt={project.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <BarChart3 className="h-16 w-16 text-muted-foreground/50" />
                              </div>
                            )}

                            {/* Project Type Badge */}
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-white/90 text-foreground">
                                {project.project_type || "Irrigation Project"}
                              </Badge>
                            </div>

                            {/* Completion Status */}
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-green-500 text-white">
                                <Award className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            </div>
                          </div>

                          {/* Project Details */}
                          <div className="p-6 space-y-4">
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-1">
                                {project.name}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{project.location}</span>
                                {project.completion_date && (
                                  <>
                                    <span>•</span>
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {new Date(
                                        project.completion_date,
                                      ).getFullYear()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Client Information */}
                            {project.customers && (
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {project.customers.company_name ||
                                    project.customers.contact_person}
                                </span>
                              </div>
                            )}

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-4 py-4 border-t border-b">
                              {project.area_covered && (
                                <div className="text-center">
                                  <p className="text-lg font-bold text-primary">
                                    {project.area_covered}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Hectares Covered
                                  </p>
                                </div>
                              )}
                              {project.water_saved && (
                                <div className="text-center">
                                  <p className="text-lg font-bold text-blue-600">
                                    {project.water_saved}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Water Saved
                                  </p>
                                </div>
                              )}
                              {project.yield_improvement && (
                                <div className="text-center">
                                  <p className="text-lg font-bold text-green-600">
                                    +{project.yield_improvement}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Yield Increase
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Testimonial Preview */}
                            {project.testimonial && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-sm text-muted-foreground italic line-clamp-2">
                                  "{project.testimonial}"
                                </p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              <Button size="sm" className="flex-1">
                                <Download className="h-4 w-4 mr-1" />
                                Download PDF
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Stories */}
              {filteredStories.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Success Stories
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredStories.map((story) => (
                      <Card
                        key={story.id}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            {story.image_url && (
                              <div className="flex-shrink-0">
                                <img
                                  src={story.image_url}
                                  alt={story.client_name}
                                  className="w-16 h-16 rounded-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-1">
                                {story.title}
                              </h3>
                              <p className="text-sm text-primary mb-2">
                                {story.client_name}
                                {story.client_company &&
                                  ` - ${story.client_company}`}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                {story.description}
                              </p>
                              {story.results && (
                                <div className="bg-green-50 rounded-lg p-3 mb-4">
                                  <h4 className="text-sm font-medium text-green-800 mb-1">
                                    Results Achieved:
                                  </h4>
                                  <p className="text-sm text-green-700">
                                    {story.results}
                                  </p>
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-0 h-auto"
                              >
                                Read Full Story
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {filteredProjects.length === 0 &&
                filteredStories.length === 0 &&
                !loading && (
                  <div className="text-center py-16">
                    <div className="mb-4">
                      <Search className="h-16 w-16 text-muted-foreground/50 mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      No Case Studies Found
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your search terms or filters to find what
                      you're looking for.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("all");
                        setSelectedRegion("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
            </>
          )}

          {/* CTA Section */}
          <div className="mt-16 text-center bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Create Your Success Story?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of satisfied customers who have transformed their
              agricultural operations with our irrigation solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">Start Your Project</Button>
              <Button variant="outline" size="lg">
                Consult Our Experts
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CaseStudies;
