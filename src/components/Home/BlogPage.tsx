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

// Interface definitions remain unchanged
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

  // Query hooks remain unchanged
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
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border bg-card">
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
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {post.blog_categories.name}
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 sm:h-4 w-3 sm:w-4" />
                  {formatDate(post.published_at || post.created_at)}
                </div>
                {post.reading_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 sm:h-4 w-3 sm:w-4" />
                    {post.reading_time} min read
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <User className="h-3 sm:h-4 w-3 sm:w-4" />
                  {post.views} views
                </div>
              </div>

              <CardTitle className="text-lg sm:text-2xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </CardTitle>
              
              <CardDescription className="text-sm sm:text-base line-clamp-3 mb-4">
                {getExcerpt(post)}
              </CardDescription>

              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Button 
                variant="ghost" 
                className="justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-sm sm:text-base"
                asChild
              >
                <Link to={`/blog/${post.slug}`}>
                  Read Full Article
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col border-border bg-card">
        {post.featured_image_url && (
          <div className="relative aspect-video overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {post.blog_categories && (
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                <Badge variant="secondary" className="bg-white/90 dark:bg-gray-900/90 text-primary text-xs sm:text-sm">
                  {post.blog_categories.name}
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardHeader className="flex-1 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 sm:h-4 w-3 sm:w-4" />
              {formatDate(post.published_at || post.created_at)}
            </div>
            
            {post.reading_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 sm:h-4 w-3 sm:w-4" />
                {post.reading_time} min read
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <User className="h-3 sm:h-4 w-3 sm:w-4" />
              {post.views} views
            </div>
          </div>

          <CardTitle className="text-lg sm:text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
          
          <CardDescription className="text-sm sm:text-base line-clamp-3 flex-1">
            {getExcerpt(post)}
          </CardDescription>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <Button 
            variant="ghost" 
            className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-sm sm:text-base"
            asChild
          >
            <Link to={`/blog/${post.slug}`}>
              Read Full Article
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              Our Blog
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover insights, tips, and the latest trends in irrigation and agriculture
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Filters and Search */}
        <div className="mb-8 sm:mb-12 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-background border-border text-sm sm:text-base"
            />
          </div>

          {/* Filters and View Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter by:</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full sm:w-48 bg-background border-border text-sm sm:text-base">
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
                  <SelectTrigger className="w-full sm:w-48 bg-background border-border text-sm sm:text-base">
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
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0"
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
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No articles found</h3>
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
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base"
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
                        className="w-10 h-10"
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
                  className="flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogPage;