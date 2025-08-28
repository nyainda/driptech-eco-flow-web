
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  ThumbsUp, 
  MessageCircle, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Globe,
  FileText
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  status: 'draft' | 'published';
  views: number;
  likes: number;
  comments_count: number;
  author_name: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

interface BlogListProps {
  posts: BlogPost[];
  loading: boolean;
  onEdit: (post: BlogPost) => void;
  onDelete: (postId: string) => void;
}

const BlogList: React.FC<BlogListProps> = ({ posts, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-0 bg-card shadow-lg animate-pulse">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-32 h-20 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="border-0 bg-card shadow-lg">
        <CardContent className="p-8 sm:p-12 text-center">
          <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mx-auto mb-4" />
          <CardTitle className="text-lg sm:text-xl mb-2 text-foreground">
            No blog posts found
          </CardTitle>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            Create your first blog post to get started with content management.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6">
      {posts.map((post) => (
        <Card key={post.id} className="border-0 bg-card shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Featured Image */}
              <div className="w-full sm:w-32 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg overflow-hidden flex-shrink-0">
                {post.featured_image ? (
                  <img 
                    src={post.featured_image} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-base sm:text-lg line-clamp-2 mb-1">
                      {post.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                    <Badge 
                      variant={post.status === 'published' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {post.status === 'published' ? (
                        <>
                          <Globe className="h-3 w-3 mr-1" />
                          Published
                        </>
                      ) : (
                        'Draft'
                      )}
                    </Badge>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{post.author_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Stats and Actions */}
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{post.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{post.comments_count}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(post)}
                      className="text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(post.id)}
                      className="text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BlogList;
