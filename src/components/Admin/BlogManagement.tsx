import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
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
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
  tags: string[];
  blog_categories?: { name: string };
  published: boolean;
  published_at: string | null;
  seo_title?: string;
  seo_description?: string;
  author_id?: string;
  reading_time?: number;
  category_id?: string;
  featured_image_url?: string;
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
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const { toast } = useToast();
  const viewedPosts = useRef<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [totalPosts, setTotalPosts] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
  });

  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchStats();
  }, [currentPage, searchQuery, selectedCategory, statusFilter, sortBy]);

  const fetchStats = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("blog_posts")
        .select(
          "views, likes, id, title, created_at, excerpt, featured_image_url, reading_time, published, blog_categories (name)",
        );

      if (postsError) throw postsError;

      const totalPostsCount = postsData?.length || 0;
      const totalViews =
        postsData?.reduce((sum, post) => sum + (post.views || 0), 0) || 0;
      const totalLikes =
        postsData?.reduce((sum, post) => sum + (post.likes || 0), 0) || 0;

      setStats({
        totalPosts: totalPostsCount,
        totalViews,
        totalLikes,
        totalComments: 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Set default stats on error
      setStats({
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
      });
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);

      let query = supabase.from("blog_posts").select(
        `
          *,
          blog_categories (
            name
          )
        `,
        { count: "exact" },
      );

      // Apply filters
      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`,
        );
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
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "title":
          query = query.order("title", { ascending: true });
          break;
        case "views":
          query = query.order("views", { ascending: false });
          break;
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Ensure data is always an array
      setPosts(Array.isArray(data) ? data : []);
      setTotalPosts(count || 0);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch blog posts",
        variant: "destructive",
      });
      // Set empty array on error
      setPosts([]);
      setTotalPosts(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      // Ensure categories is always an array
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
      // Set empty array on error
      setCategories([]);
    }
  };

  const incrementViewCount = async (postId: string) => {
    if (viewedPosts.current.has(postId)) return;

    try {
      const { data: currentPost, error: fetchError } = await supabase
        .from("blog_posts")
        .select("views")
        .eq("id", postId)
        .single();

      if (fetchError) throw fetchError;

      const newViews = (currentPost?.views || 0) + 1;

      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({ views: newViews })
        .eq("id", postId);

      if (updateError) throw updateError;

      viewedPosts.current.add(postId);

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, views: newViews } : post,
        ),
      );
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
      fetchPosts();
      fetchStats();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      });
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setShowEditor(true);
    incrementViewCount(post.id);
  };

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

  const filteredPosts = Array.isArray(posts) ? posts.filter((post) => {
    const matchesSearch =
      post?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post?.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      post?.blog_categories?.name === selectedCategory;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" ? post?.published : !post?.published);
    return matchesSearch && matchesCategory && matchesStatus;
  }) : [];

  const totalPagesCalculated = Math.ceil(totalPosts / ITEMS_PER_PAGE);
  const currentPosts = Array.isArray(posts) ? posts : []; // Already paginated from the query

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
          searchTerm={searchQuery}
          setSearchTerm={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onCreatePost={handleCreatePost}
          categories={categories || []}
        />

        {/* Blog Posts List */}
        <BlogList
          posts={currentPosts}
          loading={loading}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
        />

        {/* Pagination */}
        {currentPosts.length > 0 && totalPagesCalculated > 1 && (
          <BlogPagination
            currentPage={currentPage}
            totalPages={totalPagesCalculated}
            onPageChange={setCurrentPage}
            totalPosts={totalPosts}
            postsPerPage={ITEMS_PER_PAGE}
          />
        )}

        {/* Empty State */}
        {filteredPosts.length === 0 && !loading && (
          <Card className="border-0 bg-card shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-3">
                {searchQuery ||
                selectedCategory !== "all" ||
                statusFilter !== "all"
                  ? "No posts found"
                  : "No blog posts yet"}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 sm:mb-6 max-w-md leading-relaxed">
                {searchQuery ||
                selectedCategory !== "all" ||
                statusFilter !== "all"
                  ? "Try adjusting your search criteria or filters to find what you're looking for"
                  : "Start creating engaging content for your audience. Your first blog post is just a click away!"}
              </p>
              {!searchQuery &&
                selectedCategory === "all" &&
                statusFilter === "all" && (
                  <Button
                    onClick={handleCreatePost}
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