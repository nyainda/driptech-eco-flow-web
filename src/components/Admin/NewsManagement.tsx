import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileText, Plus, Search, Filter, Calendar, TrendingUp, Users, Eye, MessageSquare, MoreHorizontal, Edit, Trash2, Clock, Tag, Upload, Image, Star, Globe, BookOpen, PenTool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  published: boolean;
  featured_image_url?: string;
  tags: string[];
  views: number;
  likes: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  reading_time: number;
  author?: string;
  slug: string;
}

const ITEMS_PER_PAGE = 10;

const NewsManagement = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    excerpt: "",
    published: false,
    featured_image_url: "",
    tags: [] as string[],
    author: "",
  });
  const [newTag, setNewTag] = useState("");

  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    totalViews: 0,
    totalLikes: 0,
  });

  useEffect(() => {
    fetchArticles();
    fetchStats();
  }, [currentPage, searchQuery, statusFilter, sortBy]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `news/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      setNewArticle(prev => ({
        ...prev,
        featured_image_url: publicUrl
      }));

      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("news_articles")
        .select("views, likes, published, title");

      if (error) throw error;

      const total = data?.length || 0;
      const published = data?.filter(article => article.published).length || 0;
      const totalViews = data?.reduce((sum, article) => sum + (article.views || 0), 0) || 0;
      const totalLikes = data?.reduce((sum, article) => sum + (article.likes || 0), 0) || 0;

      setStats({
        totalArticles: total,
        publishedArticles: published,
        totalViews,
        totalLikes,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('news_articles')
        .select('*', { count: "exact" });

      // Apply filters
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
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

      setArticles(data || []);
      setTotalArticles(count || 0);
    } catch (error) {
      console.error('Error fetching news articles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch news articles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateArticle = async () => {
    try {
      if (!newArticle.title || !newArticle.content) {
        toast({
          title: "Error",
          description: "Title and content are required",
          variant: "destructive"
        });
        return;
      }

      // Calculate reading time
      const wordCount = newArticle.content.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      const slug = generateSlug(newArticle.title);

      const articleData = {
        title: newArticle.title,
        content: newArticle.content,
        excerpt: newArticle.excerpt || newArticle.content.substring(0, 200),
        published: newArticle.published,
        featured_image_url: newArticle.featured_image_url,
        tags: newArticle.tags,
        reading_time: readingTime,
        author: newArticle.author || "Admin",
        slug: slug,
      };

      if (editingArticle) {
        // Update existing article
        const { error } = await supabase
          .from('news_articles')
          .update(articleData)
          .eq('id', editingArticle.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "News article updated successfully"
        });
      } else {
        // Create new article
        const { error } = await supabase
          .from('news_articles')
          .insert({
            ...articleData,
            views: 0,
            likes: 0,
            comments_count: 0
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "News article created successfully"
        });
      }

      setShowCreateModal(false);
      setEditingArticle(null);
      resetForm();
      fetchArticles();
      fetchStats();
    } catch (error) {
      console.error('Error creating/updating article:', error);
      toast({
        title: "Error",
        description: "Failed to save news article",
        variant: "destructive"
      });
    }
  };

  const handleEditArticle = (article: NewsArticle) => {
    setEditingArticle(article);
    setNewArticle({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      published: article.published,
      featured_image_url: article.featured_image_url || "",
      tags: article.tags,
      author: article.author || "",
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setNewArticle({
      title: "",
      content: "",
      excerpt: "",
      published: false,
      featured_image_url: "",
      tags: [],
      author: "",
    });
    setNewTag("");
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('news_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "News article deleted successfully"
      });

      fetchArticles();
      fetchStats();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Error",
        description: "Failed to delete news article",
        variant: "destructive"
      });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !newArticle.tags.includes(newTag.trim())) {
      setNewArticle(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewArticle(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const totalPages = Math.ceil(totalArticles / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  News Management
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create and manage news articles with powerful tools
                </p>
              </div>
            </div>
          </div>
          <Dialog open={showCreateModal} onOpenChange={(open) => {
            setShowCreateModal(open);
            if (!open) {
              setEditingArticle(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 transform hover:scale-105">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Article</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {editingArticle ? "Edit Article" : "Create New Article"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                    <Input
                      id="title"
                      value={newArticle.title}
                      onChange={(e) => setNewArticle(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter article title"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="sm:col-span-1">
                    <Label htmlFor="author" className="text-sm font-medium">Author</Label>
                    <Input
                      id="author"
                      value={newArticle.author}
                      onChange={(e) => setNewArticle(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Author name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="sm:col-span-1">
                    <Label className="text-sm font-medium">Featured Image</Label>
                    <div className="space-y-3 mt-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full border-dashed border-2 h-12"
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-b-2 border-primary mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Image
                          </>
                        )}
                      </Button>
                      {newArticle.featured_image_url && (
                        <div className="relative rounded-lg overflow-hidden">
                          <img 
                            src={newArticle.featured_image_url} 
                            alt="Preview" 
                            className="w-full h-32 object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setNewArticle(prev => ({ ...prev, featured_image_url: "" }))}
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="excerpt" className="text-sm font-medium">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={newArticle.excerpt}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief description of the article"
                    rows={3}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="content" className="text-sm font-medium">Content</Label>
                  <Textarea
                    id="content"
                    value={newArticle.content}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your news content here..."
                    rows={8}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex gap-2 mt-1 mb-3">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newArticle.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="px-3 py-1">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-destructive text-lg leading-none"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <Switch
                    id="published"
                    checked={newArticle.published}
                    onCheckedChange={(checked) => setNewArticle(prev => ({ ...prev, published: checked }))}
                  />
                  <div>
                    <Label htmlFor="published" className="text-sm font-medium">Published</Label>
                    <p className="text-xs text-muted-foreground">Make this article visible to readers</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOrUpdateArticle} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    {editingArticle ? "Update Article" : "Create Article"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <div className="p-2 rounded-lg bg-blue-600/10">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.totalArticles}</div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-600/10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <div className="p-2 rounded-lg bg-green-600/10">
                <Globe className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.publishedArticles}</div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950/50 dark:to-violet-950/50 border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-violet-600/10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <div className="p-2 rounded-lg bg-purple-600/10">
                <Eye className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.totalViews.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950/50 dark:to-red-950/50 border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <div className="p-2 rounded-lg bg-orange-600/10">
                <Star className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{stats.totalLikes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="title">By Title</SelectItem>
                    <SelectItem value="views">Most Viewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading articles...</p>
              </CardContent>
            </Card>
          ) : articles.length === 0 ? (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/50">
              <CardContent className="p-12 text-center">
                <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/50 w-fit mx-auto mb-4">
                  <FileText className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search criteria" 
                    : "Start by creating your first news article"}
                </p>
                {(!searchQuery && statusFilter === "all") && (
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Article
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            articles.map((article, index) => (
              <Card key={article.id} className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex flex-wrap items-start gap-3">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-blue-600 transition-colors line-clamp-2">{article.title}</h3>
                        <Badge variant={article.published ? "default" : "secondary"} className={article.published ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-400" : ""}>
                          {article.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      
                      {article.featured_image_url && (
                        <div className="w-full h-32 lg:w-48 lg:h-28 rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={article.featured_image_url} 
                            alt={article.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{article.excerpt}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(article.created_at))} ago
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {article.reading_time} min read
                        </span>
                        <span className="flex items-center gap-1">
                          <PenTool className="h-4 w-4" />
                          {article.author || "Admin"}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400">
                            #{tag}
                          </Badge>
                        ))}
                        {article.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{article.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditArticle(article)}
                        className="hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteArticle(article.id)}
                        className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 text-muted-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              size="sm"
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm"
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    onClick={() => setCurrentPage(pageNum)}
                    size="sm"
                    className={currentPage === pageNum 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600" 
                      : "bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              size="sm"
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm"
            >
              Next
            </Button>
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>Showing {articles.length} of {totalArticles} articles</p>
        </div>
      </div>
    </div>
  );
};

export default NewsManagement;