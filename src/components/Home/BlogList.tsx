// components/BlogList.tsx
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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

interface BlogListProps {
  limit?: number;
}

const BlogList = ({ limit }: BlogListProps) => {
  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ['published-blog-posts', limit],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (
            name,
            slug
          )
        `)
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getExcerpt = (post: BlogPost) => {
    if (post.excerpt) return post.excerpt;
    const plainText = post.content
      .replace(/<[^>]*>/g, '')
      .replace(/[#*`_~]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  };

  if (isLoading) return <div className="text-center text-muted-foreground">Loading posts...</div>;
  if (blogPosts.length === 0) return <div className="text-center text-muted-foreground">No posts available.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {blogPosts.map((post) => (
        <Card key={post.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
          {post.featured_image_url && (
            <div className="relative aspect-video overflow-hidden">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {post.blog_categories && (
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-white/90 text-primary">
                    {post.blog_categories.name}
                  </Badge>
                </div>
              )}
            </div>
          )}

          <CardHeader className="flex-1">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {formatDate(post.published_at || post.created_at)}
              </div>
              {post.reading_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {post.reading_time} min read
                </div>
              )}
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" aria-hidden="true" />
                {post.views} views
              </div>
            </div>

            <CardTitle className="text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">
              {post.title}
            </CardTitle>
            <CardDescription className="text-base line-clamp-3 flex-1">
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

          <CardContent className="pt-0">
            <Button
              variant="ghost"
              className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              asChild
            >
              <Link to={`/blog/${post.slug}`}>
                Read Full Article
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BlogList;