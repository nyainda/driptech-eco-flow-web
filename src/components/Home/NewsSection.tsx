import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, ArrowRight, Newspaper, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { SectionHeader } from "@/components/common/SectionHeader";

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
  published_at?: string;
  created_at: string;
  blog_categories?: {
    name: string;
    slug: string;
  } | null;
}

const NewsSection = () => {
  const { data: newsArticles = [], isLoading } = useQuery({
    queryKey: ['published-news-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (
            name,
            slug
          )
        `)
        .eq('published', true)
        .or("tags.cs.{\"news\"},category_id.in.(select id from blog_categories where name ilike '%news%')")
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (error) throw error;
      return data as NewsArticle[];
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 dark:from-slate-900/50 dark:via-slate-800 dark:to-blue-950/30">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Latest News & Updates"
            subtitle="Stay informed with the latest developments in irrigation technology, company news, and industry insights"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4 mb-4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (newsArticles.length === 0) {
    return null; // Don't show the section if there are no news articles
  }

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 dark:from-slate-900/50 dark:via-slate-800 dark:to-blue-950/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          title="Latest News & Updates"
          subtitle="Stay informed with the latest developments in irrigation technology, company news, and industry insights"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {newsArticles.map((article, index) => (
            <Card 
              key={article.id} 
              className={`group overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm ${
                index === 0 ? 'md:col-span-2 lg:col-span-2' : ''
              }`}
            >
              {/* Featured Image */}
              <div className={`relative overflow-hidden ${index === 0 ? 'aspect-video' : 'aspect-square'}`}>
                {article.featured_image_url ? (
                  <img
                    src={article.featured_image_url}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Newspaper className="h-12 w-12 text-primary/60" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* News Badge */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    NEWS
                  </Badge>
                </div>

                {/* Quick Stats */}
                <div className="absolute bottom-4 left-4 flex items-center gap-3 text-white text-sm">
                  <span className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-1 backdrop-blur-sm">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                  </span>
                  {article.reading_time && (
                    <span className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-1 backdrop-blur-sm">
                      <Clock className="h-3 w-3" />
                      {article.reading_time}min
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-6">
                <div className="space-y-3">
                  {/* Category */}
                  {article.blog_categories?.name && (
                    <Badge variant="outline" className="text-xs">
                      {article.blog_categories.name}
                    </Badge>
                  )}

                  {/* Title */}
                  <h3 className={`font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors ${
                    index === 0 ? 'text-xl lg:text-2xl' : 'text-lg'
                  }`}>
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p className={`text-slate-600 dark:text-slate-300 leading-relaxed ${
                    index === 0 ? 'line-clamp-3' : 'line-clamp-2'
                  }`}>
                    {article.excerpt || article.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Read More Link */}
                  <Link to={`/blog/${article.slug}`} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors group/link">
                    Read Full Article
                    <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All News Button */}
        <div className="text-center">
          <Link to="/news">
            <Button 
              variant="outline" 
              size="lg" 
              className="group bg-white/50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 backdrop-blur-sm border-primary/20 hover:border-primary/40 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Newspaper className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              View All News
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;