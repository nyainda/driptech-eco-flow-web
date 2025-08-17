
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Code, 
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category_id?: string;
  tags: string[];
  published: boolean;
  featured_image_url?: string;
  seo_title?: string;
  seo_description?: string;
  reading_time?: number;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

interface BlogEditorProps {
  post?: BlogPost;
  categories: BlogCategory[];
  onSave: (post: BlogPost) => void;
  onCancel: () => void;
}

const BlogEditor = ({ post, categories, onSave, onCancel }: BlogEditorProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<BlogPost>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    tags: [],
    published: false,
    ...post
  });
  const [newTag, setNewTag] = useState("");
  const [preview, setPreview] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !post?.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, post?.slug]);

  // Calculate reading time
  useEffect(() => {
    const wordCount = formData.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average 200 words per minute
    setFormData(prev => ({ ...prev, reading_time: readingTime }));
  }, [formData.content]);

  const insertText = (before: string, after: string = "") => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = before + selectedText + after;
    
    const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    setFormData(prev => ({ ...prev, content: newValue }));
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    onSave(formData);
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertText("**", "**"), title: "Bold" },
    { icon: Italic, action: () => insertText("*", "*"), title: "Italic" },
    { icon: Underline, action: () => insertText("<u>", "</u>"), title: "Underline" },
    { icon: Heading1, action: () => insertText("# "), title: "Heading 1" },
    { icon: Heading2, action: () => insertText("## "), title: "Heading 2" },
    { icon: Heading3, action: () => insertText("### "), title: "Heading 3" },
    { icon: List, action: () => insertText("- "), title: "Bullet List" },
    { icon: ListOrdered, action: () => insertText("1. "), title: "Numbered List" },
    { icon: Quote, action: () => insertText("> "), title: "Quote" },
    { icon: Code, action: () => insertText("`", "`"), title: "Inline Code" },
    { icon: Link, action: () => insertText("[", "](url)"), title: "Link" },
    { icon: Image, action: () => insertText("![alt text](", ")"), title: "Image" },
  ];

  const renderPreview = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mb-2">$1</h3>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic">$1</blockquote>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto" />')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {post ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreview(!preview)}>
            <Eye className="h-4 w-4 mr-2" />
            {preview ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={handleSubmit}>Save Post</Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter blog post title"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="url-friendly-slug"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Brief description of the post"
              rows={3}
            />
          </div>

          {!preview ? (
            <div>
              <Label htmlFor="content">Content *</Label>
              <div className="border rounded-md">
                {/* Toolbar */}
                <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
                  {toolbarButtons.map((button, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={button.action}
                      title={button.title}
                    >
                      <button.icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
                
                {/* Editor */}
                <Textarea
                  id="content-editor"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your blog post content here. Use markdown formatting."
                  rows={20}
                  className="border-0 focus:ring-0 resize-none"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Reading time: ~{formData.reading_time} minutes
              </p>
            </div>
          ) : (
            <div>
              <Label>Preview</Label>
              <Card>
                <CardContent className="p-6">
                  <h1 className="text-3xl font-bold mb-4">{formData.title}</h1>
                  {formData.excerpt && (
                    <p className="text-lg text-muted-foreground mb-6">{formData.excerpt}</p>
                  )}
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderPreview(formData.content) }}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="featured-image">Featured Image URL</Label>
              <Input
                id="featured-image"
                value={formData.featured_image_url || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, featured_image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button onClick={addTag}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
            />
            <Label htmlFor="published">Published</Label>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <div>
            <Label htmlFor="seo-title">SEO Title</Label>
            <Input
              id="seo-title"
              value={formData.seo_title || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
              placeholder="SEO optimized title"
              maxLength={60}
            />
            <p className="text-sm text-muted-foreground">
              {(formData.seo_title || "").length}/60 characters
            </p>
          </div>

          <div>
            <Label htmlFor="seo-description">SEO Description</Label>
            <Textarea
              id="seo-description"
              value={formData.seo_description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
              placeholder="Brief description for search engines"
              rows={3}
              maxLength={160}
            />
            <p className="text-sm text-muted-foreground">
              {(formData.seo_description || "").length}/160 characters
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogEditor;
