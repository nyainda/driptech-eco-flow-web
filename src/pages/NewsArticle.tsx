import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, Eye, Tag, ArrowLeft, Newspaper, User, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
  comments_count: number;
  published: boolean;
  author: string;
  created_at: string;
  updated_at: string;
}

const NewsArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['news-article', slug],
    queryFn: async () => {
      console.log('Query function called with slug:', slug);
      
      if (!slug) {
        console.error('No slug provided');
        throw new Error('No slug provided');
      }
      
      try {
        // Query the correct table: news_articles instead of blog_posts
        const { data, error } = await supabase
          .from('news_articles')
          .select('*')
          .eq('slug', slug)
          .eq('published', true) // Use 'published' boolean instead of status
          .single();

        console.log('Supabase query result:', { data, error });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        if (!data) {
          console.error('No data returned from query');
          throw new Error('Article not found');
        }

        // Increment view count
        const { error: updateError } = await supabase
          .from('news_articles')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', data.id);

        if (updateError) {
          console.warn('Error updating view count:', updateError);
        }

        return data as NewsArticle;
      } catch (err) {
        console.error('Error in query function:', err);
        throw err;
      }
    },
    retry: false,
    enabled: !!slug, // Only run query if slug exists
  });

  // Query for related articles
  const { data: relatedArticles = [] } = useQuery({
    queryKey: ['related-news-articles', article?.id],
    queryFn: async () => {
      if (!article) return [];
      
      const { data } = await supabase
        .from('news_articles')
        .select('id, title, slug, excerpt, featured_image_url, created_at, views, reading_time, author')
        .eq('published', true)
        .neq('id', article.id)
        .order('created_at', { ascending: false })
        .limit(3);

      return data || [];
    },
    enabled: !!article
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 sm:pt-20 pb-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-32 mb-4"></div>
              <div className="h-10 bg-muted rounded mb-6"></div>
              <div className="aspect-video bg-muted rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 sm:pt-20 pb-8">
          <div className="container mx-auto px-4 max-w-4xl text-center py-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Newspaper className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-4">News Article Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The news article you're looking for doesn't exist or hasn't been published yet.
            </p>
            <div className="bg-muted p-4 rounded-lg mb-6 text-left max-w-md mx-auto">
              <p className="text-sm"><strong>Debug Info:</strong></p>
              <p className="text-sm">Slug: {slug || 'No slug provided'}</p>
              <p className="text-sm">Error: {error?.message || 'Article not found'}</p>
              <p className="text-sm">URL: {window.location.pathname}</p>
            </div>
            <div className="space-y-2">
              <Button onClick={() => navigate('/news')} className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to News
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 sm:pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 max-w-4xl mx-auto">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/news" className="hover:text-foreground transition-colors">
              News
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground truncate">{article.title}</span>
          </nav>

          <article className="max-w-4xl mx-auto">
            {/* Article Header */}
            <header className="mb-8 lg:mb-12">
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/news')}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to News
                </Button>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="text-lg sm:text-xl text-muted-foreground mb-6 leading-relaxed">
                  {article.excerpt}
                </p>
              )}

              {/* Article Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>By {article.author}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}</span>
                </div>

                {article.reading_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{article.reading_time} min read</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{article.views} views</span>
                </div>
              </div>

              {/* Featured Image */}
              {article.featured_image_url && (
                <div className="relative aspect-video rounded-lg overflow-hidden mb-8 shadow-lg">
                  <img
                    src={article.featured_image_url}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </header>

            {/* Article Content */}
            <div className="mb-12">
              <div 
                className="prose prose-lg max-w-none text-foreground leading-relaxed overflow-hidden"
                style={{
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  maxHeight: 'none'
                }}
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-semibold mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <Badge key={`${tag}-${index}`} variant="secondary" className="px-3 py-1">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <section className="border-t border-border pt-12">
                <h2 className="text-2xl font-bold mb-8">Related News</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedArticles.map((relatedArticle) => (
                    <Card key={relatedArticle.id} className="group hover:shadow-lg transition-shadow">
                      <div className="relative aspect-video overflow-hidden rounded-t-lg">
                        {relatedArticle.featured_image_url ? (
                          <img
                            src={relatedArticle.featured_image_url}
                            alt={relatedArticle.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                            <Newspaper className="h-8 w-8 text-primary/30" />
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedArticle.title}
                        </h3>
                        
                        {relatedArticle.excerpt && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {relatedArticle.excerpt}
                          </p>
                        )}

                        <div className="text-xs text-muted-foreground mb-2">
                          By {relatedArticle.author}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span>{formatDistanceToNow(new Date(relatedArticle.created_at), { addSuffix: true })}</span>
                          {relatedArticle.reading_time && <span>{relatedArticle.reading_time}m read</span>}
                        </div>

                        <div className="flex items-center text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {relatedArticle.views} views
                          </span>
                        </div>
                        
                        <Link to={`/news/${relatedArticle.slug}`}>
                          <Button variant="ghost" size="sm" className="w-full text-primary">
                            Read Article
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewsArticle;