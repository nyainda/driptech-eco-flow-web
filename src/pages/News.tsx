import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, ArrowRight, Newspaper, TrendingUp, Users, Lightbulb, Search, Filter, Eye, Tag, Sparkles, Zap, BookOpen, Star, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  tags: string[];
  reading_time?: number;
  views: number;
  likes: number;
  comments_count: number;
  published: boolean;
  author: string;
  created_at: string;
  updated_at: string;
}

const ARTICLES_PER_PAGE = 9;

const News = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: newsData = { articles: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['news-articles', searchQuery, sortBy, currentPage],
    queryFn: async () => {
      console.log('Fetching news articles...');
      
      let query = supabase
        .from('news_articles') // Changed from 'blog_posts' to 'news_articles'
        .select('*', { count: 'exact' })
        .eq('published', true); // Changed from status = 'published' to published = true

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order('created_at', { ascending: false }); // Changed from published_at
          break;
        case "oldest":
          query = query.order('created_at', { ascending: true }); // Changed from published_at
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
      
      console.log('Query result:', { data, error, count });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      return {
        articles: data || [],
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
        {/* Hero Section with Search */}
        <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-2">
                <Newspaper className="w-4 h-4 mr-2" />
                Latest News & Insights
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 tracking-tight">
                Stay <span className="text-primary">Informed</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Discover the latest in irrigation technology, sustainable farming practices, and industry innovations.
              </p>
              
              {/* Integrated Search */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-14 text-lg bg-card/50 border-0 shadow-lg backdrop-blur-sm"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-48 h-14 bg-card/50 border-0 shadow-lg backdrop-blur-sm">
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
              
              {/* Quick Stats */}
              <div className="flex justify-center items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{newsData.total} Articles</span>
                </div>
                <div className="w-px h-4 bg-border"></div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{newsData.articles.reduce((sum, article) => sum + article.views, 0).toLocaleString()} Views</span>
                </div>
                <div className="w-px h-4 bg-border"></div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span>{newsData.articles.reduce((sum, article) => sum + article.likes, 0).toLocaleString()} Likes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="space-y-8">
              {/* Featured article skeleton */}
              <Card className="overflow-hidden">
                <div className="aspect-[21/9] bg-muted animate-pulse"></div>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="h-8 bg-muted rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Grid skeletons */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-video bg-muted animate-pulse"></div>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-6 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : newsData.articles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Newspaper className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">No Articles Found</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {searchQuery 
                  ? "Try adjusting your search terms or explore our latest content." 
                  : "We're working on bringing you the latest news. Check back soon!"}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              )}
              
              {/* Debug info */}
              <div className="mt-8 p-4 bg-muted rounded-lg max-w-md mx-auto text-left">
                <p className="text-sm font-medium mb-2">Debug Information:</p>
                <p className="text-xs">Total articles: {newsData.total}</p>
                <p className="text-xs">Search query: {searchQuery || 'None'}</p>
                <p className="text-xs">Sort by: {sortBy}</p>
                <p className="text-xs">Current page: {currentPage}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-12 lg:space-y-16">
              {/* Featured Article - Large Hero Style */}
              {newsData.articles.length > 0 && (
                <article className="group">
                  <Card className="overflow-hidden border-0 shadow-2xl bg-card">
                    <div className="relative">
                      {/* Large Hero Image */}
                      <div className="relative aspect-[21/9] overflow-hidden">
                        {newsData.articles[0].featured_image_url ? (
                          <img
                            src={newsData.articles[0].featured_image_url}
                            alt={newsData.articles[0].title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <Newspaper className="h-16 w-16 text-primary/50" />
                          </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        
                        {/* Featured Badge */}
                        <div className="absolute top-6 left-6">
                          <Badge className="bg-red-500 text-white px-4 py-2 text-sm font-medium">
                            <Star className="h-4 w-4 mr-2" />
                            FEATURED
                          </Badge>
                        </div>
                        
                        {/* Article Info Overlay */}
                        <div className="absolute bottom-6 left-6 right-6 text-white">
                          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                              <Calendar className="h-4 w-4" />
                              {formatDistanceToNow(new Date(newsData.articles[0].created_at), { addSuffix: true })}
                            </div>
                            {newsData.articles[0].reading_time && (
                              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                                <Clock className="h-4 w-4" />
                                {newsData.articles[0].reading_time} min read
                              </div>
                            )}
                            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                              <Eye className="h-4 w-4" />
                              {newsData.articles[0].views.toLocaleString()} views
                            </div>
                            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                              <Heart className="h-4 w-4" />
                              {newsData.articles[0].likes} likes
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-300 mb-2">
                            By {newsData.articles[0].author}
                          </div>
                          
                          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                            {newsData.articles[0].title}
                          </h2>
                          
                          <p className="text-lg text-gray-200 mb-6 max-w-2xl">
                            {newsData.articles[0].excerpt || 
                             newsData.articles[0].content.replace(/<[^>]*>/g, '').substring(0, 200) + '...'}
                          </p>
                          
                          <Link to={`/news/${newsData.articles[0].slug}`}>
                            <Button className="bg-white text-black hover:bg-gray-100 px-6 py-3 text-base font-medium">
                              Read Full Article
                              <ArrowRight className="h-5 w-5 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                </article>
              )}

              {/* Secondary Featured Articles - Magazine Style */}
              {newsData.articles.length > 1 && (
                <section>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {newsData.articles.slice(1, 3).map((article, index) => (
                      <article key={article.id} className="group">
                        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="relative aspect-[4/3] overflow-hidden">
                            {article.featured_image_url ? (
                              <img
                                src={article.featured_image_url}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                                <Newspaper className="h-12 w-12 text-primary/40" />
                              </div>
                            )}
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            
                            <div className="absolute top-4 left-4">
                              <Badge className={`${index === 0 ? 'bg-blue-500' : 'bg-green-500'} text-white px-3 py-1 text-xs`}>
                                {index === 0 ? 'TRENDING' : 'LATEST'}
                              </Badge>
                            </div>
                            
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                              <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {article.title}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-gray-300">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {article.views}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {article.likes}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <CardContent className="p-6">
                            <div className="text-sm text-muted-foreground mb-2">
                              By {article.author}
                            </div>
                            
                            <p className="text-muted-foreground mb-4 line-clamp-3">
                              {article.excerpt || article.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-2">
                                {article.tags.slice(0, 2).map((tag, tagIndex) => (
                                  <Badge key={`${tag}-${tagIndex}`} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              
                              <Link to={`/news/${article.slug}`}>
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                                  Read More
                                  <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Regular Articles Grid */}
              {newsData.articles.length > 3 && (
                <section>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold">More Stories</h2>
                    <div className="h-px bg-border flex-1 ml-6"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {newsData.articles.slice(3).map((article) => (
                      <article key={article.id} className="group">
                        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                          <div className="relative aspect-video overflow-hidden">
                            {article.featured_image_url ? (
                              <img
                                src={article.featured_image_url}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                                <Newspaper className="h-8 w-8 text-primary/30" />
                              </div>
                            )}
                            
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-purple-500 text-white px-2 py-1 text-xs">
                                NEWS
                              </Badge>
                            </div>
                          </div>
                          
                          <CardContent className="p-6 flex flex-col flex-1">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                              </div>
                              {article.reading_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {article.reading_time}m
                                </div>
                              )}
                            </div>
                            
                            <h3 className="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </h3>
                            
                            <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                              {article.excerpt || article.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...'}
                            </p>
                            
                            <div className="text-sm text-muted-foreground mb-3">
                              By {article.author}
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-border">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{article.views}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  <span>{article.likes}</span>
                                </div>
                              </div>
                              
                              <Link to={`/news/${article.slug}`}> {/* Fixed: changed from /blog/ to /news/ */}
                                <Button variant="ghost" size="sm" className="text-primary p-0 h-auto font-medium">
                                  Read Article
                                  <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (page > totalPages) return null;
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10 h-10"
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
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Newsletter Section */}
          <section className="mt-16">
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-0">
              <CardContent className="p-8 text-center">
                <div className="max-w-2xl mx-auto">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-4">Stay in the Loop</h3>
                  <p className="text-muted-foreground mb-6">
                    Get weekly updates on the latest irrigation technology, farming tips, and industry news delivered straight to your inbox.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <Input placeholder="Enter your email" className="flex-1" />
                    <Button>
                      Subscribe
                      <Sparkles className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default News;