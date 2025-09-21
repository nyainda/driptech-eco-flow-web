import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';

const BlogPostPage = () => {
  const { slug } = useParams();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (
            name,
            slug
          )
        `)
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  React.useEffect(() => {
    if (post?.id) {
      const updateViews = async () => {
        try {
          await supabase
            .from('blog_posts')
            .update({ views: (post.views || 0) + 1 })
            .eq('id', post.id);
        } catch (error) {
          console.error('Error updating views:', error);
        }
      };
      
      updateViews();
    }
  }, [post?.id, post?.views]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse bg-background shadow-md rounded-xl p-6">
              <div className="h-8 bg-muted rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-muted rounded mb-2 w-1/4"></div>
              <div className="h-64 bg-muted rounded mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center bg-background shadow-md rounded-xl p-6">
            <h1 className="text-3xl font-bold text-foreground mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              className="px-6 py-3 text-base bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-lg hover:scale-105 transition-all duration-300 rounded-xl shadow-md group"
              asChild
            >
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button 
            className="mb-6 px-6 py-3 text-base bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-lg hover:scale-105 transition-all duration-300 rounded-xl shadow-md group"
            asChild
          >
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Blog
            </Link>
          </Button>

          <article>
            {/* Header */}
            <header className="mb-12 bg-background shadow-md rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                {post.blog_categories && (
                  <Badge className="bg-muted text-foreground border-border">
                    {post.blog_categories.name}
                  </Badge>
                )}
                {post.tags && post.tags.map((tag: string, index: number) => (
                  <Badge key={index} className="bg-muted/30 border-border text-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-6">
                  {post.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    {post.published_at 
                      ? formatDate(post.published_at)
                      : formatDate(post.created_at)
                    }
                  </span>
                </div>
                
                {post.reading_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{post.reading_time} min read</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span>DripTech Team</span>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {post.featured_image_url && (
              <div className="mb-12">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full max-h-[500px] sm:max-h-[600px] object-cover rounded-xl shadow-md"
                />
              </div>
            )}

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-accent bg-background p-6 rounded-xl shadow-md"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />

            {/* Footer */}
            <footer className="mt-12 pt-8 bg-background p-6 rounded-xl shadow-md border border-border">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {post.tags && post.tags.map((tag: string, index: number) => (
                    <Badge key={index} className="bg-muted/30 border-border text-foreground">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="text-sm text-foreground">
                  {post.views > 0 && (
                    <span>{post.views.toLocaleString()} views</span>
                  )}
                </div>
              </div>
            </footer>
          </article>

          {/* Divider */}
          <hr className="border-border w-full max-w-3xl mx-auto mt-12" />
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;