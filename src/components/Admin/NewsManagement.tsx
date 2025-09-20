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
      
      const fileExt = file.name.split('.').pop();
      const fileName = `news/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (error) throw error;

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
        .from("news_articles" as any)
        .select("views, likes, published, title");

      if (error) throw error;

        if (!error && Array.isArray(data)) {
        const articlesArray = data.filter(
          (item: any) =>
            typeof item === "object" &&
            item !== null &&
            "published" in item &&
            "views" in item &&
            "likes" in item &&
            "title" in item
        ) as NewsArticle[];
        const total = articlesArray.length;
        const published = articlesArray.filter(article => article.published).length;
        const totalViews = articlesArray.reduce((sum, article) => sum + (article.views || 0), 0);
        const totalLikes = articlesArray.reduce((sum, article) => sum + (article.likes || 0), 0);

        setStats({
          totalArticles: total,
          publishedArticles: published,
          totalViews,
          totalLikes,
        });
      } else {
        setStats({
          totalArticles: 0,
          publishedArticles: 0,
          totalViews: 0,
          totalLikes: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('news_articles' as any)
        .select('*', { count: "exact" });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("published", statusFilter === "published");
      }

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
    <div className="min-h-screen bg-background">
      <div className="p-2 sm:p-4 lg:p-6 xl:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="p-2 rounded-xl bg-muted border border-border w-fit">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground">
                    News Management
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
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
                <Button className="w-full sm:w-auto gap-2 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 transform hover:scale-105">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Article</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </DialogTrigger>
              
              <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-background border-border">
                <div className="flex flex-col max-h-[90vh]">
                  <DialogHeader className="p-4 sm:p-6 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground">
                      {editingArticle ? "Edit Article" : "Create New Article"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="overflow-y-auto flex-1 p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <div className="lg:col-span-2">
                          <Label htmlFor="title" className="text-sm font-medium text-foreground">Title</Label>
                          <Input
                            id="title"
                            value={newArticle.title}
                            onChange={(e) => setNewArticle(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter article title"
                            className="mt-1 bg-background border-border text-foreground placeholder-muted-foreground"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="author" className="text-sm font-medium text-foreground">Author</Label>
                          <Input
                            id="author"
                            value={newArticle.author}
                            onChange={(e) => setNewArticle(prev => ({ ...prev, author: e.target.value }))}
                            placeholder="Author name"
                            className="mt-1 bg-background border-border text-foreground placeholder-muted-foreground"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-foreground">Featured Image</Label>
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
                              className="w-full border-dashed border-2 border-border h-12 text-muted-foreground hover:bg-muted"
                            >
                              {uploading ? (
                                <>
                                  <div className="animate-spin h-4 w-4 border-b-2 border-primary mr-2"></div>
                                  <span className="hidden sm:inline">Uploading...</span>
                                  <span className="sm:hidden">...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  <span className="hidden sm:inline">Upload Image</span>
                                  <span className="sm:hidden">Upload</span>
                                </>
                              )}
                            </Button>
                            {newArticle.featured_image_url && (
                              <div className="relative rounded-lg overflow-hidden border border-border">
                                <img 
                                  src={newArticle.featured_image_url} 
                                  alt="Preview" 
                                  className="w-full h-32 object-cover"
                                  onError={(e) => {
                                    console.error('Image failed to load:', newArticle.featured_image_url);
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDIwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4K';
                                  }}
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
                        <Label htmlFor="excerpt" className="text-sm font-medium text-foreground">Excerpt</Label>
                        <Textarea
                          id="excerpt"
                          value={newArticle.excerpt}
                          onChange={(e) => setNewArticle(prev => ({ ...prev, excerpt: e.target.value }))}
                          placeholder="Brief description of the article"
                          rows={3}
                          className="mt-1 resize-none bg-background border-border text-foreground placeholder-muted-foreground"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="content" className="text-sm font-medium text-foreground">Content</Label>
                        <Textarea
                          id="content"
                          value={newArticle.content}
                          onChange={(e) => setNewArticle(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Write your news content here..."
                          rows={6}
                          className="mt-1 resize-none bg-background border-border text-foreground placeholder-muted-foreground"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-foreground">Tags</Label>
                        <div className="flex flex-col sm:flex-row gap-2 mt-1 mb-3">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add a tag"
                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                            className="flex-1 bg-background border-border text-foreground placeholder-muted-foreground"
                          />
                          <Button type="button" onClick={addTag} variant="outline" className="w-full sm:w-auto border-border text-muted-foreground hover:bg-muted">
                            <Tag className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Add</span>
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {newArticle.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="px-3 py-1 bg-muted text-muted-foreground">
                              <span className="text-xs">{tag}</span>
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
                      
                      <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border border-border">
                        <Switch
                          id="published"
                          checked={newArticle.published}
                          onCheckedChange={(checked) => setNewArticle(prev => ({ ...prev, published: checked }))}
                        />
                        <div className="flex-1">
                          <Label htmlFor="published" className="text-sm font-medium text-foreground">Published</Label>
                          <p className="text-xs text-muted-foreground">Make this article visible to readers</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 sm:p-6 border-t border-border flex-shrink-0">
                    <Button variant="outline" onClick={() => setShowCreateModal(false)} className="order-2 sm:order-1 border-border text-muted-foreground hover:bg-muted">
                      Cancel
                    </Button>
                    <Button onClick={handleCreateOrUpdateArticle} className="order-1 sm:order-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                      {editingArticle ? "Update Article" : "Create Article"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="relative overflow-hidden bg-background border-border shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Articles</CardTitle>
                <div className="p-1.5 sm:p-2 rounded-lg bg-muted flex-shrink-0">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-lg sm:text-2xl font-bold text-foreground">{stats.totalArticles}</div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden bg-background border-border shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Published</CardTitle>
                <div className="p-1.5 sm:p-2 rounded-lg bg-muted flex-shrink-0">
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-lg sm:text-2xl font-bold text-foreground">{stats.publishedArticles}</div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden bg-background border-border shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Views</CardTitle>
                <div className="p-1.5 sm:p-2 rounded-lg bg-muted flex-shrink-0">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-lg sm:text-2xl font-bold text-foreground">{stats.totalViews.toLocaleString()}</div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden bg-background border-border shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Likes</CardTitle>
                <div className="p-1.5 sm:p-2 rounded-lg bg-muted flex-shrink-0">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-lg sm:text-2xl font-bold text-foreground">{stats.totalLikes}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-background border-border shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-36 bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-36 bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground">
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

          <div className="space-y-4">
            {loading ? (
              <Card className="bg-background border-border shadow-lg">
                <CardContent className="p-8 sm:p-12 text-center">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading articles...</p>
                </CardContent>
              </Card>
            ) : articles.length === 0 ? (
              <Card className="bg-background border-border shadow-lg">
                <CardContent className="p-8 sm:p-12 text-center">
                  <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                    <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No articles found</h3>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your search criteria" 
                      : "Start by creating your first news article"}
                  </p>
                  {(!searchQuery && statusFilter === "all") && (
                    <Button 
                      onClick={() => setShowCreateModal(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Article
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              articles.map((article, index) => (
                <Card key={article.id} className="bg-background border-border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 space-y-3 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
                              {article.title}
                            </h3>
                            <Badge 
                              variant={article.published ? "default" : "outline"} 
                              className={`w-fit flex-shrink-0 border-border text-muted-foreground ${article.published ? "bg-primary text-primary-foreground" : ""}`}
                            >
                              {article.published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          
                          {article.featured_image_url && (
                            <div className="w-full sm:max-w-xs h-32 sm:h-28 rounded-lg overflow-hidden bg-muted border border-border">
                              <img 
                                src={article.featured_image_url} 
                                alt={article.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                onLoad={(e) => {
                                  e.currentTarget.style.display = 'block';
                                }}
                              />
                            </div>
                          )}
                          
                          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{article.excerpt}</p>
                          
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{formatDistanceToNow(new Date(article.created_at))} ago</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              {article.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              {article.reading_time} min
                            </span>
                            <span className="flex items-center gap-1">
                              <PenTool className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{article.author || "Admin"}</span>
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {article.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                                #{tag}
                              </Badge>
                            ))}
                            {article.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                                +{article.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0 sm:flex-col sm:items-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              console.log('Editing article:', article);
                              handleEditArticle(article);
                            }}
                            className="hover:bg-muted hover:text-primary w-full sm:w-auto"
                          >
                            <Edit className="h-4 w-4 sm:mr-0 mr-2" />
                            <span className="sm:hidden">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this article?')) {
                                handleDeleteArticle(article.id);
                              }
                            }}
                            className="hover:bg-muted hover:text-destructive text-muted-foreground w-full sm:w-auto"
                          >
                            <Trash2 className="h-4 w-4 sm:mr-0 mr-2" />
                            <span className="sm:hidden">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <div className="flex gap-2 order-2 sm:order-1">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  size="sm"
                  className="bg-background border-border text-muted-foreground hover:bg-muted"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  size="sm"
                  className="bg-background border-border text-muted-foreground hover:bg-muted"
                >
                  Next
                </Button>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 order-1 sm:order-2">
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
                        ? "bg-primary text-primary-foreground" 
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <div className="sm:hidden text-sm text-muted-foreground order-1">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}

          <div className="text-center text-xs sm:text-sm text-muted-foreground py-4">
            <p>Showing {articles.length} of {totalArticles} articles</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsManagement;