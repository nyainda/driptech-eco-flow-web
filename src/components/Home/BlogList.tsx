import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    queryKey: ["published-blog-posts", limit],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select(
          `
          *,
          blog_categories (
            name,
            slug
          )
        `,
        )
        .eq("published", true)
        .order("published_at", { ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getExcerpt = (post: BlogPost) => {
    if (post.excerpt) return post.excerpt;
    const plainText = post.content
      .replace(/<[^>]*>/g, "")
      .replace(/[#*`_~]/g, "")
      .replace(/\n+/g, " ")
      .trim();
    return plainText.length > 150
      ? plainText.substring(0, 150) + "..."
      : plainText;
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-background border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: limit || 6 }).map((_, index) => (
              <Card
                key={index}
                className="animate-pulse bg-background border-border shadow-md"
              >
                <div className="aspect-video bg-muted rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-5/6 mt-2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (blogPosts.length === 0) {
    return (
      <section className="py-20 bg-background border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center bg-background shadow-md rounded-xl p-6">
            <User className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Posts Available
            </h3>
            <p className="text-muted-foreground">
              Check back later for new blog posts!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-4 bg-muted text-foreground border-border">
            <User className="w-4 h-4 mr-2" />
            Blog Posts
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Latest <span className="text-primary">Insights</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Discover expert tips, industry trends, and insights on irrigation
            solutions from the DripTech team.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Card
              key={post.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-background border-border"
            >
              {post.featured_image_url && (
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {post.blog_categories && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-muted text-foreground border-border">
                        {post.blog_categories.name}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              <CardHeader className="flex-1">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar
                      className="h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                    {formatDate(post.published_at || post.created_at)}
                  </div>
                  {post.reading_time && (
                    <div className="flex items-center gap-1">
                      <Clock
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />
                      {post.reading_time} min read
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-primary" aria-hidden="true" />
                    {post.views.toLocaleString()} views
                  </div>
                </div>

                <CardTitle className="text-xl text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground line-clamp-3 flex-1">
                  {getExcerpt(post)}
                </CardDescription>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        className="text-xs bg-muted/30 border-border text-foreground"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                <Button
                  className="w-full text-sm bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300 rounded-xl shadow-md group"
                  asChild
                >
                  <Link to={`/blog/${post.slug}`}>
                    Read Full Article
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Divider */}
        <hr className="border-border w-full max-w-3xl mx-auto mt-12" />
      </div>
    </section>
  );
};

export default BlogList;
