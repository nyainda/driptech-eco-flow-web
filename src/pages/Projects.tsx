import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  MapPin, 
  Droplets, 
  ArrowLeft, 
  Award, 
  Target, 
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

const Projects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('featured', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const types = [...new Set(projects.map(p => p.project_type).filter(Boolean))];
    const statuses = [...new Set(projects.map(p => p.status).filter(Boolean))];
    const locations = [...new Set(projects.map(p => p.location).filter(Boolean))];
    
    return { types, statuses, locations };
  }, [projects]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      const matchesSearch = 
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.project_type?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = selectedFilter === "all" || 
        project.status === selectedFilter ||
        project.project_type === selectedFilter ||
        project.location === selectedFilter;

      return matchesSearch && matchesFilter;
    });

    // Sort projects
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        case "area":
          return (parseInt(b.area_covered) || 0) - (parseInt(a.area_covered) || 0);
        case "water_saved":
          return (parseInt(b.water_saved) || 0) - (parseInt(a.water_saved) || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, searchQuery, selectedFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage);
  const paginatedProjects = filteredAndSortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter, sortBy]);

  const handleGoBack = () => {
    window.history.back();
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
      case "planned":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-primary/10 via-secondary/5 to-background overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto px-4 relative">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={handleGoBack}
              className="mb-6 hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>

            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2 mb-6">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Our Success Stories</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight">
                Transforming
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Agriculture
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Discover how our innovative irrigation solutions have revolutionized farming operations across diverse landscapes and climates.
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-8 bg-card/30 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Controls Row */}
              <div className="flex flex-wrap items-center gap-4 justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Filter Toggle */}
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`${showFilters ? 'bg-primary/10 border-primary/20' : ''}`}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {(selectedFilter !== "all" || searchQuery) && (
                      <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                        {filteredAndSortedProjects.length}
                      </Badge>
                    )}
                  </Button>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Name A-Z</option>
                    <option value="area">Largest Area</option>
                    <option value="water_saved">Most Water Saved</option>
                  </select>

                  {/* Clear Filters */}
                  {(selectedFilter !== "all" || searchQuery || sortBy !== "newest") && (
                    <Button variant="ghost" onClick={clearAllFilters} className="text-muted-foreground">
                      <X className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Results Count */}
                  <span className="text-sm text-muted-foreground">
                    {filteredAndSortedProjects.length} of {projects.length} projects
                  </span>

                  {/* View Mode Toggle */}
                  <div className="flex border border-border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-none"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expandable Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg border animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={selectedFilter.startsWith('status:') ? selectedFilter.split(':')[1] : 'all'}
                      onChange={(e) => setSelectedFilter(e.target.value === 'all' ? 'all' : e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <option value="all">All Statuses</option>
                      {filterOptions.statuses.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Project Type</label>
                    <select
                      value={filterOptions.types.includes(selectedFilter) ? selectedFilter : 'all'}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <option value="all">All Types</option>
                      {filterOptions.types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <select
                      value={filterOptions.locations.includes(selectedFilter) ? selectedFilter : 'all'}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <option value="all">All Locations</option>
                      {filterOptions.locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" 
                : "space-y-6"
              }>
                {Array.from({ length: itemsPerPage }).map((_, index) => (
                  <Card key={index} className="overflow-hidden border-0 shadow-lg animate-pulse">
                    {viewMode === "grid" ? (
                      <>
                        <div className="aspect-[4/3] bg-muted"></div>
                        <CardContent className="p-6">
                          <div className="flex gap-2 mb-4">
                            <div className="h-6 bg-muted rounded-full w-20"></div>
                            <div className="h-6 bg-muted rounded-full w-16"></div>
                          </div>
                          <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                          <div className="h-4 bg-muted rounded w-2/3"></div>
                        </CardContent>
                      </>
                    ) : (
                      <div className="flex gap-4 p-6">
                        <div className="w-32 h-24 bg-muted rounded-lg flex-shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-6 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                          <div className="h-4 bg-muted rounded w-2/3"></div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : filteredAndSortedProjects.length > 0 ? (
              <>
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" 
                  : "space-y-6"
                }>
                  {paginatedProjects.map((project, index) => (
                    <Card 
                      key={project.id} 
                      className={`group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-card/50 backdrop-blur-sm ${
                        viewMode === "list" ? "flex" : ""
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {viewMode === "grid" ? (
                        <>
                          {/* Grid View */}
                          <div className="relative aspect-[4/3] overflow-hidden">
                            {project.project_images && project.project_images.length > 0 ? (
                              <img 
                                src={project.project_images[0]} 
                                alt={project.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 flex items-center justify-center">
                                <Droplets className="h-16 w-16 text-primary/60" />
                              </div>
                            )}
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="absolute top-4 right-4">
                              <Badge className={`${getStatusColor(project.status)} border`}>
                                {getStatusIcon(project.status)}
                                <span className="ml-1">{project.status}</span>
                              </Badge>
                            </div>
                          </div>

                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                                <Target className="h-3 w-3 mr-1" />
                                {project.project_type || 'Irrigation Project'}
                              </Badge>
                            </div>

                            <h3 className="text-xl font-bold mb-3 leading-tight group-hover:text-primary transition-colors">
                              {project.name}
                            </h3>

                            <div className="space-y-2 mb-4">
                              {project.location && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-sm">{project.location}</span>
                                </div>
                              )}

                              {project.completion_date && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-sm">
                                    Completed {new Date(project.completion_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {(project.area_covered || project.water_saved) && (
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                {project.area_covered && (
                                  <div className="text-center p-3 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-primary/10">
                                    <div className="text-lg font-black text-primary">{project.area_covered}</div>
                                    <div className="text-xs text-muted-foreground font-medium">Area Covered</div>
                                  </div>
                                )}
                                {project.water_saved && (
                                  <div className="text-center p-3 bg-gradient-to-br from-secondary/5 to-primary/5 rounded-xl border border-secondary/10">
                                    <div className="text-lg font-black text-secondary">{project.water_saved}%</div>
                                    <div className="text-xs text-muted-foreground font-medium">Water Saved</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {project.testimonial && (
                              <div className="mb-4 p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
                                <p className="text-sm text-muted-foreground italic leading-relaxed">
                                  "{project.testimonial}"
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </>
                      ) : (
                        /* List View */
                        <div className="flex w-full">
                          <div className="relative w-48 flex-shrink-0 overflow-hidden">
                            {project.project_images && project.project_images.length > 0 ? (
                              <img 
                                src={project.project_images[0]} 
                                alt={project.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 flex items-center justify-center">
                                <Droplets className="h-12 w-12 text-primary/60" />
                              </div>
                            )}
                          </div>

                          <CardContent className="flex-1 p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                                    <Target className="h-3 w-3 mr-1" />
                                    {project.project_type || 'Irrigation Project'}
                                  </Badge>
                                  <Badge className={`${getStatusColor(project.status)} border`}>
                                    {getStatusIcon(project.status)}
                                    <span className="ml-1">{project.status}</span>
                                  </Badge>
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                  {project.name}
                                </h3>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                {project.location && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm">{project.location}</span>
                                  </div>
                                )}

                                {project.completion_date && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm">
                                      Completed {new Date(project.completion_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {(project.area_covered || project.water_saved) && (
                                <div className="flex gap-4">
                                  {project.area_covered && (
                                    <div className="text-center p-2 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-primary/10 flex-1">
                                      <div className="text-sm font-bold text-primary">{project.area_covered}</div>
                                      <div className="text-xs text-muted-foreground">Area</div>
                                    </div>
                                  )}
                                  {project.water_saved && (
                                    <div className="text-center p-2 bg-gradient-to-br from-secondary/5 to-primary/5 rounded-lg border border-secondary/10 flex-1">
                                      <div className="text-sm font-bold text-secondary">{project.water_saved}%</div>
                                      <div className="text-xs text-muted-foreground">Water Saved</div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {project.testimonial && (
                              <div className="mt-4 p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
                                <p className="text-sm text-muted-foreground italic leading-relaxed line-clamp-2">
                                  "{project.testimonial}"
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
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

                        if (pageNum === currentPage - 2 && currentPage > 4 && totalPages > 7) {
                          return (
                            <Button key="ellipsis1" variant="ghost" disabled className="px-3">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          );
                        }
                        
                        if (pageNum === currentPage + 2 && currentPage < totalPages - 3 && totalPages > 7) {
                          return (
                            <Button key="ellipsis2" variant="ghost" disabled className="px-3">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          );
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            onClick={() => setCurrentPage(pageNum)}
                            className="px-3"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center">
                    <Search className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">
                    {searchQuery || selectedFilter !== "all" ? "No Projects Found" : "No Projects Yet"}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {searchQuery || selectedFilter !== "all" 
                      ? "Try adjusting your search or filter criteria to find more projects."
                      : "Our featured projects will appear here once they're added through the admin dashboard."
                    }
                  </p>
                  {(searchQuery || selectedFilter !== "all") && (
                    <Button onClick={clearAllFilters} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Projects;