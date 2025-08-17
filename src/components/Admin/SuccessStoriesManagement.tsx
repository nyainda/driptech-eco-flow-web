import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Trophy, Image } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SuccessStory {
  id: string;
  title: string;
  description: string;
  client_name: string;
  client_company: string;
  image_url: string;
  before_image: string;
  after_image: string;
  results: string;
  featured: boolean;
  created_at: string;
}

const SuccessStoriesManagement = () => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client_name: "",
    client_company: "",
    image_url: "",
    before_image: "",
    after_image: "",
    results: "",
    featured: false
  });

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('success_stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `success-story-${field}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      setFormData({ ...formData, [field]: publicUrl });
      
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingStory) {
        const { error } = await supabase
          .from('success_stories')
          .update(formData)
          .eq('id', editingStory.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Success story updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('success_stories')
          .insert([formData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Success story created successfully"
        });
      }
      
      fetchStories();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this success story?')) return;
    
    try {
      const { error } = await supabase
        .from('success_stories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Success story deleted successfully"
      });
      
      fetchStories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (story: SuccessStory) => {
    setEditingStory(story);
    setFormData({
      title: story.title,
      description: story.description,
      client_name: story.client_name,
      client_company: story.client_company,
      image_url: story.image_url,
      before_image: story.before_image,
      after_image: story.after_image,
      results: story.results,
      featured: story.featured
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      client_name: "",
      client_company: "",
      image_url: "",
      before_image: "",
      after_image: "",
      results: "",
      featured: false
    });
    setEditingStory(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Success Stories
          </h2>
          <p className="text-muted-foreground">Manage your client success stories</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Plus className="mr-2 h-4 w-4" />
              Add Success Story
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStory ? 'Edit Success Story' : 'Add New Success Story'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_name">Client Name *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_company">Client Company</Label>
                  <Input
                    id="client_company"
                    value={formData.client_company}
                    onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="main_image">Main Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="main_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'image_url')}
                    disabled={uploading}
                  />
                  {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                </div>
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="mt-2 h-20 w-32 object-cover rounded"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="before_image">Before Image</Label>
                  <Input
                    id="before_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'before_image')}
                    disabled={uploading}
                  />
                  {formData.before_image && (
                    <img
                      src={formData.before_image}
                      alt="Before Preview"
                      className="mt-2 h-16 w-24 object-cover rounded"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="after_image">After Image</Label>
                  <Input
                    id="after_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'after_image')}
                    disabled={uploading}
                  />
                  {formData.after_image && (
                    <img
                      src={formData.after_image}
                      alt="After Preview"
                      className="mt-2 h-16 w-24 object-cover rounded"
                    />
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="results">Results & Achievements</Label>
                <Textarea
                  id="results"
                  value={formData.results}
                  onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                  rows={3}
                  placeholder="e.g., 40% water savings, 25% yield increase..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured Story</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-primary to-primary/80">
                  {editingStory ? 'Update' : 'Create'} Success Story
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <Card key={story.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              {story.image_url && (
                <img
                  src={story.image_url}
                  alt={story.title}
                  className="w-full h-32 object-cover rounded mb-4"
                />
              )}
              <CardTitle className="text-lg">{story.title}</CardTitle>
              <CardDescription>
                {story.client_name} {story.client_company && `- ${story.client_company}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {story.description}
              </p>
              {story.results && (
                <p className="text-sm font-medium text-green-600 mb-4">
                  {story.results}
                </p>
              )}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {story.featured && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                      Featured
                    </span>
                  )}
                  <div className="flex gap-1">
                    {story.before_image && (
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                        Before
                      </span>
                    )}
                    {story.after_image && (
                      <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                        After
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(story)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(story.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stories.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No success stories yet</h3>
            <p className="text-muted-foreground">
              Start by adding your first client success story.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuccessStoriesManagement;