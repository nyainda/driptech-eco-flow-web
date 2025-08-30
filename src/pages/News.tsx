
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, ArrowRight, Newspaper, TrendingUp, Users, Lightbulb, Search, Filter, Eye, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  tags: string[];
  reading_time?: number;
  views: number;
  published: boolean;
  created_at: string;
  author?: string;
}

const ARTICLES_PER_PAGE = 9;

const News = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: newsData = { articles: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['news-articles', searchQuery, sortBy, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('news_articles')
        .select('*', { count: 'exact' })
        .eq('published', true);

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order('created_at', { ascending: false });
          break;
        case "oldest":
          query = query.order('created_at', { ascending: true });
          break;
        case "popular":
          query = query.order('views', { ascending: false });
          break;
        case "title":
          query = query.order('title', { ascending: true });
          break;
      }

      // Apply pagination
      const from = (currentPage - 1) * ARTICLES_PER_PAGE;
      const to = from + ARTICLES_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      
      if (error) throw error;
      return {
        articles: data as NewsArticle[],
        total: count || 0
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const totalPages = Math.ceil(newsData.total / ARTICLES_PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 sm:pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <Badge variant="secondary" className="mb-3 sm:mb-4">
              <Newspaper className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Latest Updates
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              News & <span className="text-primary">Updates</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Stay informed about the latest developments in irrigation technology, industry trends, and DripTech company updates.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8 sm:mb-12">
            <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search news and updates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="title">Alphabetical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : newsData.articles.length === 0 ? (
            <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8 sm:p-12 lg:p-16 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Newspaper className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3">No News Found</h3>
                <p className="text-muted-foreground mb-4 sm:mb-6">
                  {searchQuery 
                    ? "Try adjusting your search terms to find what you're looking for" 
                    : "We haven't published any news yet. Check back soon for updates!"}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Featured Article - First Article */}
              {newsData.articles.length > 0 && (
                <Card className="mb-8 sm:mb-12 overflow-hidden group hover:shadow-xl transition-shadow">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    <div className="relative aspect-video lg:aspect-auto overflow-hidden order-2 lg:order-1">
                      {newsData.articles[0].featured_image_url ? (
                        <img
                          src={newsData.articles[0].featured_image_url}
                          alt={newsData.articles[0].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <div className="text-center p-4 sm:p-8">
                            <Newspaper className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-4" />
                            <p className="text-muted-foreground">Featured News</p>
                          </div>
                        </div>
                      )}
                      {/* Featured Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg text-xs sm:text-sm">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          FEATURED
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col justify-center order-1 lg:order-2">
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 group-hover:text-primary transition-colors">
                        {newsData.articles[0].title}
                      </h2>
                      <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg">
                        {newsData.articles[0].excerpt || 
                         newsData.articles[0].content.replace(/<[^>]*>/g, '').substring(0, 200) + '...'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          {formatDistanceToNow(new Date(newsData.articles[0].created_at), { addSuffix: true })}
                        </div>
                        {newsData.articles[0].reading_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            {newsData.articles[0].reading_time} min read
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          {newsData.articles[0].views} views
                        </div>
                      </div>
                      <Link to={`/news/${newsData.articles[0].slug}`}>
                        <Button className="w-fit text-sm sm:text-base">
                          Read Full Article
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </div>
                </Card>
              )}

              {/* News Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
                {newsData.articles.slice(1).map((article) => (
                  <Card key={article.id} className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <div className="relative aspect-video overflow-hidden">
                      {article.featured_image_url ? (
                        <img
                          src={article.featured_image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                          <Newspaper className="h-6 w-6 sm:h-8 sm:w-8 text-primary/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* News Badge */}
                      <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg text-xs">
                          NEWS
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {article.reading_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {article.reading_time}min
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.views}
                          </div>
                        </div>
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors line-clamp-2 text-base sm:text-lg">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3 text-sm">
                        {article.excerpt || article.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
                        {article.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="h-2 w-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <Link to={`/news/${article.slug}`}>
                        <Button variant="outline" className="w-full group/btn text-sm">
                          Read Article
                          <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    size="sm"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (page > totalPages) return null;
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 sm:w-10 sm:h-10"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Newsletter Signup */}
          <Card className="mt-12 sm:mt-16">
            <CardContent className="p-6 sm:p-8 text-center">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Stay Updated</h3>
              <p className="text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto text-sm sm:text-base">
                Subscribe to our newsletter for the latest irrigation technology updates, farming tips, and exclusive offers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 sm:px-4 py-2 border border-input rounded-lg text-sm sm:text-base"
                />
                <Button className="text-sm sm:text-base">Subscribe</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default News;
