import { useQuery } from "@tanstack/react-query";
import { dataService } from "@/services/dataService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ArrowRight, BookOpen } from "lucide-react";
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

const BlogSection = () => {
  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ["published-blog-posts"],
    queryFn: async () => {
      const data = await dataService.getBlogPosts({ limit: 6 });
      return data as BlogPost[];
    },
  });

  // Query to get total count for "View All" button
  const { data: totalPosts = 0 } = useQuery({
    queryKey: ["blog-posts-count"],
    queryFn: async () => {
      return await dataService.getBlogPostCount();
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

    // Strip HTML and markdown, then truncate
    const plainText = post.content
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/[#*`_~]/g, "") // Remove markdown formatting
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim();

    return plainText.length > 150
      ? plainText.substring(0, 150) + "..."
      : plainText;
  };

  if (isLoading || blogPosts.length === 0) return null;

  const hasMorePosts = totalPosts > 6;

  return (
    <section className="py-20 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Latest Insights & <span className="text-primary">News</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest irrigation trends, tips, and industry
            insights
          </p>
        </div>

        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 overflow-x-auto pb-6 md:pb-0 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
          {blogPosts.map((post) => (
            <Card
              key={post.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-background border-border min-w-[280px] md:min-w-0 snap-center"
            >
              {post.featured_image_url && (
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Category badge */}
                  {post.blog_categories && (
                    <div className="absolute top-4 left-4">
                      <Badge
                        variant="secondary"
                        className="bg-muted text-foreground border-border"
                      >
                        {post.blog_categories.name}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              <CardHeader className="flex-1">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    {formatDate(post.published_at || post.created_at)}
                  </div>

                  {post.reading_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-primary" />
                      {post.reading_time} min read
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-primary" />
                    {post.views} views
                  </div>
                </div>

                <CardTitle className="text-xl mb-3 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>

                <CardDescription className="text-base line-clamp-3 flex-1 text-muted-foreground hidden md:block">
                  {getExcerpt(post)}
                </CardDescription>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 hidden md:flex">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
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
                  variant="ghost"
                  className="w-full justify-between hover:bg-accent hover:text-accent-foreground transition-colors"
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

        {/* View All Button */}
        {hasMorePosts && (
          <div className="text-center mt-12">
            <Button
              size="lg"
              className="px-8 py-3 bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300"
              asChild
            >
              <Link to="/blog">
                <BookOpen className="h-5 w-5 mr-2" />
                View All Articles ({totalPosts} total)
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;
