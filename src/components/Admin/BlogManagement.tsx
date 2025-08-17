import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Editor } from '@tinymce/tinymce-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText,
  Eye,
  Calendar,
  Tag,
  Upload,
  X,
  Clock,
  Globe,
  BookOpen,
  TrendingUp,
  Filter,
  ArrowLeft,
  ArrowRight
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  featured_image_url: string;
  category_id: string;
  tags: string[];
  published: boolean;
  published_at: string | null;
  seo_title?: string;
  seo_description?: string;
  author_id?: string;
  reading_time?: number;
  views: number;
  created_at: string;
  blog_categories: {
    name: string;
  };
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

const BlogManagement = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const { toast } = useToast();
  const editorRef = useRef<any>(null);
  const viewedPosts = useRef<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category_id: "",
    tags: "",
    published: false,
    seo_title: "",
    seo_description: "",
    featured_image_url: ""
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch blog posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive"
      });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const images = content.match(/<img[^>]+>/gi)?.length || 0;
    const words = content
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/).length;
    
    const imageTimeSeconds = images > 0 
      ? Array.from({ length: images }, (_, i) => Math.max(12 - i, 3)).reduce((a, b) => a + b, 0)
      : 0;
    
    const wordTimeMinutes = words / wordsPerMinute;
    const totalTimeMinutes = wordTimeMinutes + (imageTimeSeconds / 60);
    
    return Math.ceil(totalTimeMinutes);
  };

  const incrementViewCount = async (postId: string) => {
    if (viewedPosts.current.has(postId)) return;

    try {
      const { data: currentPost, error: fetchError } = await supabase
        .from('blog_posts')
        .select('views')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      const newViews = (currentPost.views || 0) + 1;

      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ views: newViews })
        .eq('id', postId);

      if (updateError) throw updateError;

      viewedPosts.current.add(postId);
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId ? { ...post, views: newViews } : post
        )
      );
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `blog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        featured_image_url: data.publicUrl
      }));

      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const slug = formData.slug || generateSlug(formData.title);
      const content = editorRef.current?.getContent() || formData.content;
      const readingTime = calculateReadingTime(content);
      
      const postData = {
        ...formData,
        content,
        slug,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        reading_time: readingTime,
        views: editingPost ? editingPost.views : 0,
        published_at: formData.published ? new Date().toISOString() : null
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Blog post updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Blog post created successfully"
        });
      }

      resetForm();
      fetchPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "Failed to save blog post",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Blog post deleted successfully"
      });
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content || "",
      category_id: post.category_id || "",
      tags: post.tags?.join(', ') || "",
      published: post.published,
      seo_title: post.seo_title || "",
      seo_description: post.seo_description || "",
      featured_image_url: post.featured_image_url || ""
    });
    setShowAddForm(true);
    incrementViewCount(post.id);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category_id: "",
      tags: "",
      published: false,
      seo_title: "",
      seo_description: "",
      featured_image_url: ""
    });
    setEditingPost(null);
    setShowAddForm(false);
    if (editorRef.current) {
      editorRef.current.setContent('');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || post.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.published).length;
  const draftPosts = posts.filter(p => !p.published).length;
  const totalViews = posts.reduce((acc, post) => acc + post.views, 0);

  // Pagination Logic
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const MobilePagination = () => (
    <div className="flex flex-col items-center gap-4 mt-6">
      <div className="text-sm text-muted-foreground text-center">
        Showing {indexOfFirstPost + 1} to {Math.min(indexOfLastPost, filteredPosts.length)} of {filteredPosts.length} posts
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={currentPage === 1}
          className="disabled:opacity-50 h-8"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="hidden xs:inline">Previous</span>
        </Button>
        
        <div className="flex items-center gap-1 max-w-xs overflow-x-auto">
          {totalPages > 1 && (
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => paginate(1)}
              className="w-8 h-8 flex-shrink-0"
            >
              1
            </Button>
          )}
          
          {currentPage > 3 && totalPages > 5 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
          
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => {
              if (totalPages <= 5) return page > 1 && page < totalPages;
              return page > 1 && page < totalPages && Math.abs(page - currentPage) <= 1;
            })
            .map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => paginate(page)}
                className="w-8 h-8 flex-shrink-0"
              >
                {page}
              </Button>
            ))}
          
          {currentPage < totalPages - 2 && totalPages > 5 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
          
          {totalPages > 1 && (
            <Button
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => paginate(totalPages)}
              className="w-8 h-8 flex-shrink-0"
            >
              {totalPages}
            </Button>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="disabled:opacity-50 h-8"
        >
          <span className="hidden xs:inline">Next</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );

  const DesktopPagination = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Showing {indexOfFirstPost + 1} to {Math.min(indexOfLastPost, filteredPosts.length)} of {filteredPosts.length} posts
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={currentPage === 1}
          className="disabled:opacity-50 h-9"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 7) {
              pageNumber = i + 1;
            } else if (currentPage <= 4) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 3) {
              pageNumber = totalPages - 6 + i;
            } else {
              pageNumber = currentPage - 3 + i;
            }
            
            return (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => paginate(pageNumber)}
                className="w-9 h-9"
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="disabled:opacity-50 h-9"
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded-lg w-48 sm:w-64 animate-pulse"></div>
              <div className="h-4 bg-muted/60 rounded w-32 sm:w-48 animate-pulse"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-0 bg-card shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-6 w-6 bg-muted rounded-full animate-pulse"></div>
                    <div className="h-5 bg-muted rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-0 bg-card shadow-lg animate-pulse">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="flex items-center flex-wrap gap-3 sm:gap-4">
                        <div className="h-4 bg-muted rounded w-20"></div>
                        <div className="h-4 bg-muted rounded w-16"></div>
                        <div className="h-5 bg-muted rounded-full w-12"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-8 w-12 bg-muted rounded"></div>
                      <div className="h-8 w-8 bg-muted rounded"></div>
                      <div className="h-8 w-8 bg-muted rounded"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="h-10 bg-muted/40 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              Blog Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create, manage, and publish compelling content
            </p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="relative overflow-hidden border-0 bg-card shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-colors"></div>
            <CardContent className="p-4 sm:p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">
                  Total
                </Badge>
              </div>
              <p className="text-xl sm:text-2xl font-bold">{totalPosts}</p>
              <p className="text-sm text-muted-foreground">Blog Posts</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-card shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent group-hover:from-green-500/20 transition-colors"></div>
            <CardContent className="p-4 sm:p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20">
                  Live
                </Badge>
              </div>
              <p className="text-xl sm:text-2xl font-bold">{publishedPosts}</p>
              <p className="text-sm text-muted-foreground">Published</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-card shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent group-hover:from-amber-500/20 transition-colors"></div>
            <CardContent className="p-4 sm:p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <Edit className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20">
                  Draft
                </Badge>
              </div>
              <p className="text-xl sm:text-2xl font-bold">{draftPosts}</p>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-card shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent group-hover:from-purple-500/20 transition-colors"></div>
            <CardContent className="p-4 sm:p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20">
                  Views
                </Badge>
              </div>
              <p className="text-xl sm:text-2xl font-bold">{totalViews.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="border-0 bg-card shadow-lg">
            <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-xl sm:text-2xl">
                {editingPost ? "✨ Edit Blog Post" : "✨ Create New Blog Post"}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {editingPost ? "Update your blog post with the latest changes" : "Craft a compelling story that engages your audience"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title and Slug */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="title" className="text-sm sm:text-base font-medium">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setFormData({ 
                          ...formData, 
                          title,
                          slug: generateSlug(title)
                        });
                      }}
                      placeholder="Enter your compelling blog post title"
                      required
                      className="mt-2 h-10 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="slug" className="text-sm sm:text-base font-medium">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="url-friendly-slug"
                      className="mt-2 h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category" className="text-sm sm:text-base font-medium">Category</Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                      <SelectTrigger className="mt-2 h-10 sm:h-11 text-sm sm:text-base">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <Label htmlFor="excerpt" className="text-sm sm:text-base font-medium">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Write a compelling summary that draws readers in..."
                    rows={3}
                    className="mt-2 text-sm sm:text-base resize-none"
                  />
                </div>

                {/* Content Editor */}
                <div>
                  <Label htmlFor="content" className="text-sm sm:text-base font-medium">Content *</Label>
                  <div className="mt-2 border border-border rounded-lg overflow-hidden">
                    <Editor
                      onInit={(evt, editor) => editorRef.current = editor}
                      initialValue={formData.content}
                      init={{
                        height: '300px',
                        menubar: false,
                        plugins: [
                          'advlist autolink lists link image charmap print preview anchor',
                          'searchreplace visualblocks code fullscreen',
                          'insertdatetime media table paste code help wordcount'
                        ],
                        toolbar:
                          'undo redo | formatselect | bold italic backcolor | \
                          alignleft aligncenter alignright alignjustify | \
                          bullist numlist outdent indent | removeformat | help',
                        content_style: `
                          body { font-size: 14px; }
                          @media (min-width: 640px) { body { font-size: 16px; } }
                        `
                      }}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags" className="text-sm sm:text-base font-medium">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="irrigation, technology, smart farming, innovation"
                    className="mt-2 h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>

                {/* Featured Image */}
                <div className="space-y-3 sm:space-y-4">
                  <Label className="text-sm sm:text-base font-medium">Featured Image</Label>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" disabled={uploading} className="h-10 sm:h-11 border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
                        <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        {uploading ? "Uploading..." : "Upload Image"}
                      </Button>
                    </Label>
                  </div>

                  {formData.featured_image_url && (
                    <div className="relative group w-32 sm:w-48">
                      <img
                        src={formData.featured_image_url}
                        alt="Featured image"
                        className="w-full h-24 sm:h-32 object-cover rounded-lg border shadow-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        onClick={() => setFormData({ ...formData, featured_image_url: "" })}
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* SEO Settings */}
                <div className="p-4 sm:p-6 bg-muted/10 rounded-lg border">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                    <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    SEO Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="seo_title" className="text-sm font-medium">SEO Title</Label>
                      <Input
                        id="seo_title"
                        value={formData.seo_title}
                        onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                        placeholder="SEO optimized title"
                        className="mt-1 h-10 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_description" className="text-sm font-medium">SEO Description</Label>
                      <Input
                        id="seo_description"
                        value={formData.seo_description}
                        onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                        placeholder="SEO meta description"
                        className="mt-1 h-10 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Publish Toggle */}
                <div className="flex items-center space-x-3 p-3 sm:p-4 bg-primary/5 rounded-lg border">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                    className="scale-100 sm:scale-110"
                  />
                  <div>
                    <Label htmlFor="published" className="text-sm sm:text-base font-medium cursor-pointer">
                      {formData.published ? "Publish immediately" : "Save as draft"}
                    </Label>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {formData.published ? "This post will be visible to readers" : "Keep this post private until you're ready"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
                  <Button type="button" variant="outline" onClick={resetForm} size="sm" className="h-10 sm:h-11 px-6 sm:px-8">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-10 sm:h-11 px-6 sm:px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300">
                    {editingPost ? "Update Post" : "Create Post"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
            <Input
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 sm:h-12 text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Blog Posts List */}
        <div className="space-y-4 sm:space-y-6">
          {currentPosts.map((post, index) => (
            <Card 
              key={post.id} 
              className="group hover:shadow-xl transition-all duration-300 border-0 bg-card shadow-lg"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                  <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {post.featured_image_url && (
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border shadow-md flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          {new Date(post.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          {post.views.toLocaleString()} views
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          {post.reading_time} min read
                        </div>
                        {post.blog_categories && (
                          <Badge variant="secondary" className="text-xs sm:text-sm bg-primary/10 text-primary border-primary/20">
                            {post.blog_categories.name}
                          </Badge>
                        )}
                      </div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center flex-wrap gap-2">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          {post.tags.slice(0, 3).map((tag, tagIndex) => (
                            <Badge 
                              key={tagIndex} 
                              variant="outline" 
                              className="text-xs hover:bg-primary/10 transition-colors cursor-default"
                            >
                              #{tag}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      variant={post.published ? "default" : "secondary"}
                      className={post.published ? 
                        "bg-gradient-to-r from-green-500 to-green-600 text-xs sm:text-sm" : 
                        "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs sm:text-sm"
                      }
                    >
                      {post.published ? (
                        <>
                          <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Published
                        </>
                      ) : (
                        <>
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Draft
                        </>
                      )}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleEdit(post)}
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-2">
                  {post.excerpt || "No excerpt available"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {currentPosts.length > 0 && (
          <div>
            <div className="block sm:hidden">
              <MobilePagination />
            </div>
            <div className="hidden sm:block">
              <DesktopPagination />
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <Card className="border-0 bg-card shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-3">
                {searchTerm || selectedCategory !== "all" ? "No posts found" : "No blog posts yet"}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 sm:mb-6 max-w-md leading-relaxed">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search criteria or filters to find what you're looking for" 
                  : "Start creating engaging content for your audience. Your first blog post is just a click away!"}
              </p>
              {!searchTerm && selectedCategory === "all" && (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="h-10 sm:h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Create Your First Post
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BlogManagement;