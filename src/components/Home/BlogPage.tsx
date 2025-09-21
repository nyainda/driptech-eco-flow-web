import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, ArrowRight, Search, Filter, ChevronLeft, ChevronRight, Grid, List } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  tags: string[];
  reading_time?: number;
  views: number;
  published_at?: string;
  created_at: string;
  blog_categories?: {
    name: string;
    slug: string;
  } | null;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

const POSTS_PER_PAGE = 9;

const BlogPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: categories = [] } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as BlogCategory[];
    }
  });

  const { data: blogData, isLoading } = useQuery({
    queryKey: ['blog-posts-filtered', currentPage, searchTerm, selectedCategory, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (
            name,
            slug
          )
        `, { count: 'exact' })
        .eq('published', true);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
      }

      if (selectedCategory !== "all") {
        query = query.eq('blog_categories.slug', selectedCategory);
      }

      switch (sortBy) {
        case 'newest':
          query = query.order('published_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('published_at', { ascending: true });
          break;
        case 'popular':
          query = query.order('views', { ascending: false });
          break;
        case 'alphabetical':
          query = query.order('title', { ascending: true });
          break;
      }

      const from = (currentPage - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      
      if (error) throw error;
      return {
        posts: data as BlogPost[],
        totalCount: count || 0
      };
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getExcerpt = (post: BlogPost) => {
    if (post.excerpt) return post.excerpt;
    
    const plainText = post.content
      .replace(/<[^>]*>/g, '')
      .replace(/[#*`_~]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    
    return plainText.length > 150 
      ? plainText.substring(0, 150) + '...'
      : plainText;
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil((blogData?.totalCount || 0) / POSTS_PER_PAGE);
  const posts = blogData?.posts || [];

  const BlogCard = ({ post }: { post: BlogPost }) => {
    if (viewMode === "list") {
      return (
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-background border-border shadow-md">
          <div className="flex flex-col sm:flex-row">
            {post.featured_image_url && (
              <div className="sm:w-64 md:w-80 aspect-video sm:aspect-square overflow-hidden">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <div className="flex-1 p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
                {post.blog_categories && (
                  <Badge className="bg-muted text-foreground border-border">
                    {post.blog_categories.name}
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
                  {formatDate(post.published_at || post.created_at)}
                </div>
                {post.reading_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
                    {post.reading_time} min read
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <User className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
                  {post.views.toLocaleString()} views
                </div>
              </div>

              <CardTitle className="text-lg sm:text-2xl text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </CardTitle>
              
              <CardDescription className="text-sm sm:text-base text-muted-foreground line-clamp-3 mb-4">
                {getExcerpt(post)}
              </CardDescription>

              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} className="text-xs bg-muted/30 border-border text-foreground">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Button 
                className="w-full text-sm sm:text-base bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300 rounded-xl shadow-md group"
                asChild
              >
                <Link to={`/blog/${post.slug}`}>
                  Read Full Article
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-background border-border shadow-md">
        {post.featured_image_url && (
          <div className="relative aspect-video overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {post.blog_categories && (
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                <Badge className="bg-muted text-foreground border-border text-xs sm:text-sm">
                  {post.blog_categories.name}
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardHeader className="flex-1 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
              {formatDate(post.published_at || post.created_at)}
            </div>
            
            {post.reading_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
                {post.reading_time} min read
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <User className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
              {post.views.toLocaleString()} views
            </div>
          </div>

          <CardTitle className="text-lg sm:text-xl text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
          
          <CardDescription className="text-sm sm:text-base text-muted-foreground line-clamp-3 flex-1">
            {getExcerpt(post)}
          </CardDescription>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} className="text-xs bg-muted/30 border-border text-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <Button 
            className="w-full text-sm sm:text-base bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300 rounded-xl shadow-md group"
            asChild
          >
            <Link to={`/blog/${post.slug}`}>
              Read Full Article
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main>
        <section className="bg-background border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
            {/* Header */}
            <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
              <Badge className="mb-4 bg-muted text-foreground border-border">
                <User className="w-4 h-4 mr-2" />
                Our Blog
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                Latest <span className="text-primary">Insights</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover insights, tips, and the latest trends in irrigation and agriculture from the DripTech team.
              </p>
            </div>

            {/* Filters and Search */}
            <div className="mb-8 sm:mb-12 space-y-6">
              {/* Search Bar */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-background border-border hover:bg-muted/30 text-sm sm:text-base transition-colors"
                />
              </div>

              {/* Filters and View Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Filter by:</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="w-full sm:w-48 bg-background border-border hover:bg-muted/30 text-sm sm:text-base transition-colors">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.slug}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-full sm:w-48 bg-background border-border hover:bg-muted/30 text-sm sm:text-base transition-colors">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 bg-muted/30 border border-border p-1 rounded-xl">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8 p-0 bg-muted/30 hover:bg-accent hover:text-accent-foreground rounded-full"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-8 w-8 p-0 bg-muted/30 hover:bg-accent hover:text-accent-foreground rounded-full"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Results count */}
              <div className="text-center text-sm text-muted-foreground">
                {isLoading ? (
                  "Loading..."
                ) : (
                  `Showing ${posts.length} of ${blogData?.totalCount || 0} articles`
                )}
              </div>
            </div>

            {/* Blog Posts */}
            {isLoading ? (
              <div className="bg-background shadow-md rounded-xl p-6">
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
                  : "space-y-4 sm:space-y-6"
                }>
                  {Array.from({ length: POSTS_PER_PAGE }).map((_, index) => (
                    <Card key={index} className="animate-pulse bg-background border-border shadow-md">
                      <div className="aspect-video bg-muted rounded-t-lg"></div>
                      <CardContent className="p-4 sm:p-6">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-muted rounded w-full"></div>
                        <div className="h-3 bg-muted rounded w-5/6 mt-2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-background shadow-md rounded-xl p-6">
                <User className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No Articles Found</h3>
                <p className="text-muted-foreground text-sm sm:text-base">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <>
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12" 
                  : "space-y-4 sm:space-y-6 mb-8 sm:mb-12"
                }>
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-12">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                            className="w-10 h-10 bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base bg-muted/30 border-border hover:bg-accent hover:text-accent-foreground rounded-xl shadow-md"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Divider */}
                <hr className="border-border w-full max-w-3xl mx-auto mt-12" />
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;