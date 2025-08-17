<<<<<<< HEAD
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Share2, 
  Tag, 
  ChevronRight, 
  BookOpen, 
  Eye, 
  ArrowRight,
  Heart,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  likes: number;
  published_at?: string;
  created_at: string;
  blog_categories?: {
    name: string;
    slug: string;
  } | null;
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewsUpdated, setViewsUpdated] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
=======

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';

const BlogPostPage = () => {
  const { slug } = useParams();
>>>>>>> cbb33a1 (Run M-Pesa SQL script)

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
<<<<<<< HEAD
      return data as BlogPost;
=======
      return data;
>>>>>>> cbb33a1 (Run M-Pesa SQL script)
    },
    enabled: !!slug
  });

<<<<<<< HEAD
  // Related posts query
  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['related-posts', post?.blog_categories?.slug, post?.id],
    queryFn: async () => {
      if (!post) return [];
      
      let query = supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          content,
          featured_image_url,
          reading_time,
          views,
          likes,
          published_at,
          created_at,
          blog_categories (
            name,
            slug
          )
        `)
        .eq('published', true)
        .neq('id', post.id)
        .limit(3);

      // Try to get posts from same category first
      if (post.blog_categories?.slug) {
        query = query.eq('blog_categories.slug', post.blog_categories.slug);
      }

      const { data, error } = await query.order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    },
    enabled: !!post
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!post) throw new Error('No post available');
      
      // Get current liked posts from localStorage
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
      const hasLiked = likedPosts.includes(post.id);
      
      // Prevent multiple likes from same user
      if (hasLiked && !isLiked) {
        throw new Error('You have already liked this post');
      }
      
      const newLikeCount = isLiked ? post.likes - 1 : post.likes + 1;
      
      const { error } = await supabase
        .from('blog_posts')
        .update({ likes: Math.max(0, newLikeCount) }) // Ensure likes never go below 0
        .eq('id', post.id);
      
      if (error) throw error;
      return { newLikeCount, wasLiked: isLiked };
    },
    onSuccess: ({ newLikeCount, wasLiked }) => {
      const newIsLiked = !wasLiked;
      setIsLiked(newIsLiked);
      
      // Update localStorage
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
      if (newIsLiked && !likedPosts.includes(post!.id)) {
        likedPosts.push(post!.id);
      } else if (!newIsLiked && likedPosts.includes(post!.id)) {
        const index = likedPosts.indexOf(post!.id);
        likedPosts.splice(index, 1);
      }
      localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
      
      // Update the cached post data
      queryClient.setQueryData(['blog-post', slug], (oldData: BlogPost | undefined) => 
        oldData ? { ...oldData, likes: newLikeCount } : oldData
      );
      
      toast({
        title: newIsLiked ? "Post liked! ❤️" : "Like removed",
        description: newIsLiked ? "Thanks for liking this post" : "Removed from your liked posts",
      });
    },
    onError: (error) => {
      console.error('Like error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update like status. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update view count
  useEffect(() => {
    if (post && !viewsUpdated) {
      const updateViews = async () => {
        await supabase
          .from('blog_posts')
          .update({ views: post.views + 1 })
          .eq('id', post.id);
        setViewsUpdated(true);
      };
      updateViews();
    }
  }, [post, viewsUpdated]);

  // Check if user has liked this post (using localStorage as a simple solution)
  useEffect(() => {
    if (post) {
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
      setIsLiked(likedPosts.includes(post.id));
    }
  }, [post]);

  // Sync localStorage with isLiked state on component mount
  useEffect(() => {
    if (post) {
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
      const hasLiked = likedPosts.includes(post.id);
      setIsLiked(hasLiked);
    }
  }, [post?.id]); // Only depend on post.id to avoid unnecessary re-runs

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((paragraph, index) => {
        if (paragraph.trim() === '') return null;
        
        // Handle different heading levels
        if (paragraph.startsWith('# ')) {
          return (
            <h2 key={index} className="text-3xl font-bold mt-12 mb-6 first:mt-0 text-foreground">
              {paragraph.substring(2)}
            </h2>
          );
        }
        if (paragraph.startsWith('## ')) {
          return (
            <h3 key={index} className="text-2xl font-semibold mt-10 mb-4 text-foreground">
              {paragraph.substring(3)}
            </h3>
          );
        }
        if (paragraph.startsWith('### ')) {
          return (
            <h4 key={index} className="text-xl font-medium mt-8 mb-3 text-foreground">
              {paragraph.substring(4)}
            </h4>
          );
        }
        if (paragraph.startsWith('#### ')) {
          return (
            <h5 key={index} className="text-lg font-medium mt-6 mb-2 text-foreground">
              {paragraph.substring(5)}
            </h5>
          );
        }
        
        // Handle lists
        if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
          return (
            <ul key={index} className="mb-6 ml-6 space-y-2">
              <li className="text-muted-foreground leading-relaxed list-disc">
                {paragraph.substring(2)}
              </li>
            </ul>
          );
        }
        
        if (/^\d+\.\s/.test(paragraph)) {
          return (
            <ol key={index} className="mb-6 ml-6 space-y-2">
              <li className="text-muted-foreground leading-relaxed list-decimal">
                {paragraph.replace(/^\d+\.\s/, '')}
              </li>
            </ol>
          );
        }
        
        // Handle blockquotes
        if (paragraph.startsWith('> ')) {
          return (
            <blockquote key={index} className="border-l-4 border-primary pl-6 my-6 italic text-muted-foreground bg-muted/50 py-4 rounded-r-lg">
              {paragraph.substring(2)}
            </blockquote>
          );
        }
        
        // Regular paragraphs
        return (
          <p key={index} className="mb-6 leading-relaxed text-muted-foreground text-lg">
            {paragraph}
          </p>
        );
      })
      .filter(Boolean);
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

  const handleLike = () => {
    // Prevent spam clicking
    if (likeMutation.isPending) return;
    
    likeMutation.mutate();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast({
        title: "Link copied!",
        description: "The article link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const shareToSocial = (platform: string) => {
    if (!post) return;
    
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);
    const description = encodeURIComponent(getExcerpt(post));
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (!post) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: getExcerpt(post),
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error occurred, fallback to copy
        if (error instanceof Error && error.name !== 'AbortError') {
          copyToClipboard(window.location.href);
        }
      }
    } else {
      copyToClipboard(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
=======
  // Update view count when post is loaded
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-muted rounded mb-2 w-1/4"></div>
              <div className="h-64 bg-muted rounded mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
              </div>
            </div>
>>>>>>> cbb33a1 (Run M-Pesa SQL script)
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/blog')} className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
=======
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
>>>>>>> cbb33a1 (Run M-Pesa SQL script)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background">
      {/* Header with breadcrumb */}
      <div className="bg-background border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-background/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="breadcrumb-container overflow-x-auto">
              <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap min-w-max">
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                {post.blog_categories && (
                  <>
                    <span className="hover:text-primary transition-colors">{post.blog_categories.name}</span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  </>
                )}
                <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">{post.title}</span>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/blog')}
              className="hidden md:inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Mobile back button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/blog')}
            className="mb-6 md:hidden inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Button>

          {/* Article header */}
          <article className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
            {/* Featured image */}
            {post.featured_image_url && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
=======
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>

          <article>
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                {post.blog_categories && (
                  <Badge variant="secondary">
                    {post.blog_categories.name}
                  </Badge>
                )}
                {post.tags && post.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-6">
                  {post.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {post.published_at 
                      ? formatDate(post.published_at)
                      : formatDate(post.created_at)
                    }
                  </span>
                </div>
                
                {post.reading_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{post.reading_time} min read</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>DripTech Team</span>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {post.featured_image_url && (
              <div className="mb-8">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-96 object-cover rounded-lg"
>>>>>>> cbb33a1 (Run M-Pesa SQL script)
                />
              </div>
            )}

<<<<<<< HEAD
            <div className="p-6 sm:p-8 md:p-12">
              {/* Category badge */}
              {post.blog_categories && (
                <Badge variant="secondary" className="mb-4 sm:mb-6 bg-primary/10 text-primary border-primary/20">
                  <Tag className="h-3 w-3 mr-1" />
                  {post.blog_categories.name}
                </Badge>
              )}

              {/* Article title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 leading-tight text-foreground">
                {post.title}
              </h1>

              {/* Article meta */}
              <div className="space-y-4 mb-8 pb-8 border-b border-border">
                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-muted-foreground text-sm sm:text-base">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="font-medium">
                      {formatDate(post.published_at || post.created_at)}
                    </span>
                  </div>
                  
                  {post.reading_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="font-medium">{post.reading_time} min read</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="font-medium">{post.views + 1} views</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Heart className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isLiked ? 'text-red-500 fill-red-500' : 'text-primary'}`} />
                    <span className="font-medium">{post.likes} likes</span>
                  </div>
                </div>

                {/* Action buttons row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
                  {/* Like button */}
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    disabled={likeMutation.isPending}
                    className={`flex-1 sm:flex-none transition-all duration-200 ${
                      isLiked 
                        ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-lg' 
                        : 'border-primary/20 hover:bg-primary/10 hover:border-red-300'
                    } ${likeMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Heart className={`h-4 w-4 mr-2 transition-all duration-200 ${
                      isLiked ? 'fill-current scale-110' : 'hover:scale-105'
                    }`} />
                    <span className="hidden xs:inline">
                      {likeMutation.isPending ? 'Updating...' : (isLiked ? 'Liked' : 'Like')}
                    </span>
                    <span className="xs:hidden">
                      {likeMutation.isPending ? '...' : (isLiked ? '❤️' : '🤍')}
                    </span>
                  </Button>

                  {/* Share dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none border-primary/20 hover:bg-primary/10"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        <span className="hidden xs:inline">Share</span>
                        <span className="xs:hidden">📤</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleNativeShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Quick Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => shareToSocial('facebook')}>
                        <Facebook className="h-4 w-4 mr-2" />
                        Facebook
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => shareToSocial('twitter')}>
                        <Twitter className="h-4 w-4 mr-2" />
                        Twitter
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => shareToSocial('linkedin')}>
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyToClipboard(window.location.href)}>
                        {copiedUrl ? (
                          <>
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Article content */}
              <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
                <div className="text-foreground">
                  {formatContent(post.content)}
                </div>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-16 pt-8 border-t border-border">
                  <div className="flex items-center gap-2 mb-6">
                    <Tag className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground text-lg">Related Topics:</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="px-4 py-2 text-sm border-primary/20 hover:bg-primary/10 transition-colors">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons at bottom */}
              <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    onClick={handleLike}
                    disabled={likeMutation.isPending}
                    size="lg"
                    className={`flex-1 sm:flex-none transition-all duration-200 ${
                      isLiked 
                        ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-lg' 
                        : 'border-primary/20 hover:bg-primary/10 hover:border-red-300'
                    } ${likeMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Heart className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 transition-all duration-200 ${
                      isLiked ? 'fill-current scale-110' : 'hover:scale-105'
                    }`} />
                    <span className="text-sm sm:text-base">
                      {likeMutation.isPending 
                        ? 'Updating...' 
                        : (isLiked ? `Liked (${post.likes})` : `Like (${post.likes})`)
                      }
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleNativeShare}
                    size="lg"
                    className="flex-1 sm:flex-none border-primary/20 hover:bg-primary/10"
                  >
                    <Share2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="text-sm sm:text-base">Share Article</span>
                  </Button>
                </div>
              </div>
            </div>
          </article>

          {/* Related articles */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 sm:mt-20">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Related Articles</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {relatedPosts.map((relatedPost) => (
                  <Card key={relatedPost.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border bg-card h-full flex flex-col">
                    {relatedPost.featured_image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={relatedPost.featured_image_url}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <CardHeader className="flex-1 p-4 sm:p-6">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">
                          {formatDate(relatedPost.published_at || relatedPost.created_at)}
                        </span>
                      </div>
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors text-base sm:text-lg leading-tight">
                        {relatedPost.title}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 flex-1 mt-2">
                        {getExcerpt(relatedPost)}
                      </p>
                      
                      {/* Stats for related posts */}
                      <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{relatedPost.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{relatedPost.likes || 0}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 p-4 sm:p-6">
                      <Button variant="ghost" asChild className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-sm">
                        <Link to={`/blog/${relatedPost.slug}`}>
                          Read More
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* View all articles CTA */}
              <div className="text-center mt-8 sm:mt-12">
                <Button size="lg" variant="outline" asChild className="px-6 sm:px-8">
                  <Link to="/blog">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="text-sm sm:text-base">Explore All Articles</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
=======
            {/* Content */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {post.tags && post.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {post.views > 0 && (
                    <span>{post.views.toLocaleString()} views</span>
                  )}
                </div>
              </div>
            </footer>
          </article>
>>>>>>> cbb33a1 (Run M-Pesa SQL script)
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;