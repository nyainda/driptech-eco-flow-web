import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import BlogEditor from "./BlogEditor";
import BlogStats from "./Blog/BlogStats";
import BlogFilters from "./Blog/BlogFilters";
import BlogList from "./Blog/BlogList";
import BlogPagination from "./Blog/BlogPagination";

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
  blog_categories?: { name: string }
  published: boolean;
  published_at: string | null;
  seo_title?: string;
  seo_description?: string;
  author_id?: string;
  reading_time?: number;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}


const ITEMS_PER_PAGE = 10;

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [totalPosts, setTotalPosts] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0
  });


  const fetchStats = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("blog_posts")
        .select("views, likes, comments_count, id, title, status, created_at, excerpt, featured_image_url, reading_time, blog_categories (name)");

      if (postsError) throw postsError;

      const totalPostsCount = postsData?.length || 0;
      const totalViews = postsData?.reduce((sum, post) => sum + (post.views || 0), 0) || 0;
      const totalLikes = postsData?.reduce((sum, post) => sum + (post.likes || 0), 0) || 0;
      const totalComments = postsData?.reduce((sum, post) => sum + (post.comments_count || 0), 0) || 0;

      setStats({
        totalPosts: totalPostsCount,
        totalViews,
        totalLikes,
        totalComments
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };


  const fetchPosts = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (
            name
          )
        `, { count: "exact" });

      // Apply filters
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }
      if (statusFilter !== "all") {
        query = query.eq("published", statusFilter === "published");
      }


      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order('created_at', { ascending: false });
          break;
        case "oldest":
          query = query.order('created_at', { ascending: true });
          break;
        case "title":
          query = query.order('title', { ascending: true });
          break;
        case "views":
          query = query.order('views', { ascending: false });
          break;
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);


      const { data, error, count } = await query;

      if (error) throw error;

      setPosts(data || []);
      setTotalPosts(count || 0);
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
      fetchStats();
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "Failed to save blog post",
        variant: "destructive"
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Blog post deleted successfully"
      });
      fetchPosts();
      fetchStats();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive"
      });
    }
  };

  const handleEditPost = (post: BlogPost) => {
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
    const matchesCategory = selectedCategory === "all" || post.blog_categories?.name === selectedCategory;
    const matchesStatus = statusFilter === "all" || (statusFilter === "published" ? post.published : !post.published);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPostsCount = posts.length;
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

  const handleCreatePost = () => {
    setEditingPost(null);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingPost(null);
    fetchPosts();
    fetchStats();
  };


  const totalPagesCalculated = Math.ceil(totalPosts / ITEMS_PER_PAGE);

  if (showEditor) {
    return (
      <BlogEditor
        post={editingPost}
        onClose={handleEditorClose}
        onSave={handleEditorClose}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              Blog Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create, manage, and publish compelling content
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <BlogStats stats={stats} />

        {/* Search and Filter Bar */}
        <BlogFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onCreatePost={handleCreatePost}
          categories={categories}
        />

        {/* Blog Posts List */}
        <BlogList
          posts={currentPosts}
          loading={loading}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
        />

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
        {filteredPosts.length === 0 && !loading && (
          <Card className="border-0 bg-card shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-3">
                {searchTerm || selectedCategory !== "all" || statusFilter !== "all" ? "No posts found" : "No blog posts yet"}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 sm:mb-6 max-w-md leading-relaxed">
                {searchTerm || selectedCategory !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search criteria or filters to find what you're looking for" 
                  : "Start creating engaging content for your audience. Your first blog post is just a click away!"}
              </p>
              {(!searchTerm && selectedCategory === "all" && statusFilter === "all") && (
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