import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Edit, Plus, Play, X, Upload, FileVideo, Link, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  category: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  views: number;
  duration?: number;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

interface VideoFormData {
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  duration: number;
  video_file?: File;
  thumbnail_file?: File;
}

const VideoManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [newTag, setNewTag] = useState("");
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const thumbnailFileRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<VideoFormData>({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    category: "irrigation",
    tags: [],
    published: false,
    featured: false,
    duration: 0
  });

  // Fetch videos
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Video[];
    }
  });

  // Upload file to Supabase Storage
  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return publicUrl;
  };

  // Get video duration (client-side)
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };
      
      video.onerror = () => {
        resolve(0);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  // Save video mutation with upload support
  const saveVideoMutation = useMutation({
    mutationFn: async (video: VideoFormData) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      let videoUrl = video.video_url;
      let thumbnailUrl = video.thumbnail_url;
      let duration = video.duration;
      let fileSize = 0;

      try {
        // Handle video file upload
        if (video.video_file && uploadMode === 'file') {
          const timestamp = Date.now();
          const videoPath = `videos/${timestamp}_${video.video_file.name}`;
          
          setUploadProgress(25);
          videoUrl = await uploadFile(video.video_file, 'videos', videoPath);
          fileSize = video.video_file.size;
          
          // Get video duration if not provided
          if (!duration) {
            duration = await getVideoDuration(video.video_file);
          }
          
          setUploadProgress(50);
        }

        // Handle thumbnail file upload
        if (video.thumbnail_file) {
          const timestamp = Date.now();
          const thumbnailPath = `thumbnails/${timestamp}_${video.thumbnail_file.name}`;
          
          setUploadProgress(75);
          thumbnailUrl = await uploadFile(video.thumbnail_file, 'thumbnails', thumbnailPath);
        }

        setUploadProgress(90);

        if (editingVideo) {
          // Update existing video
          const { data, error } = await supabase
            .from('videos')
            .update({
              title: video.title,
              description: video.description,
              video_url: videoUrl,
              thumbnail_url: thumbnailUrl,
              category: video.category,
              tags: video.tags,
              published: video.published,
              featured: video.featured,
              duration: duration,
              file_size: fileSize || editingVideo.file_size,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingVideo.id)
            .select()
            .single();
          
          if (error) throw error;
          setUploadProgress(100);
          return data;
        } else {
          // Create new video
          const { data, error } = await supabase
            .from('videos')
            .insert({
              title: video.title,
              description: video.description,
              video_url: videoUrl,
              thumbnail_url: thumbnailUrl,
              category: video.category,
              tags: video.tags,
              published: video.published,
              featured: video.featured,
              duration: duration,
              file_size: fileSize,
              views: 0
            })
            .select()
            .single();
          
          if (error) throw error;
          setUploadProgress(100);
          return data;
        }
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      resetForm();
      toast({
        title: "Success",
        description: "Video saved successfully",
      });
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (video: Video) => {
      // Delete video file from storage if it exists
      if (video.video_url?.includes('supabase')) {
        const urlParts = video.video_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage
          .from('videos')
          .remove([`videos/${fileName}`]);
      }

      // Delete thumbnail file from storage if it exists
      if (video.thumbnail_url?.includes('supabase')) {
        const urlParts = video.thumbnail_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage
          .from('thumbnails')
          .remove([`thumbnails/${fileName}`]);
      }

      // Delete video record from database
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      category: "irrigation",
      tags: [],
      published: false,
      featured: false,
      duration: 0
    });
    setEditingVideo(null);
    setShowForm(false);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadMode('file');
    if (videoFileRef.current) videoFileRef.current.value = '';
    if (thumbnailFileRef.current) thumbnailFileRef.current.value = '';
  };

  const handleEdit = (video: Video) => {
    setFormData({
      title: video.title,
      description: video.description || "",
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || "",
      category: video.category,
      tags: video.tags,
      published: video.published,
      featured: video.featured,
      duration: video.duration || 0
    });
    setEditingVideo(video);
    setShowForm(true);
    setUploadMode('url'); // Default to URL mode for editing
  };

  const handleDelete = (video: Video) => {
    if (confirm('Are you sure you want to delete this video? This will also delete the video file from storage.')) {
      deleteVideoMutation.mutate(video);
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (uploadMode === 'file' && !formData.video_file && !editingVideo) {
      toast({
        title: "Error",
        description: "Please select a video file to upload",
        variant: "destructive",
      });
      return;
    }

    if (uploadMode === 'url' && !formData.video_url) {
      toast({
        title: "Error",
        description: "Video URL is required",
        variant: "destructive",
      });
      return;
    }

    saveVideoMutation.mutate(formData);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Error",
          description: "Please select a valid video file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Video file size must be less than 100MB",
          variant: "destructive",
        });
        return;
      }

      setFormData(prev => ({ ...prev, video_file: file }));
      
      // Auto-fill title if empty
      if (!formData.title) {
        const fileName = file.name.split('.')[0];
        setFormData(prev => ({ ...prev, title: fileName }));
      }
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Thumbnail file size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setFormData(prev => ({ ...prev, thumbnail_file: file }));
    }
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            {editingVideo ? 'Edit Video' : 'Add New Video'}
          </h3>
          <Button variant="outline" onClick={resetForm} disabled={isUploading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Upload Progress</Label>
                    <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Video Source Selection */}
              <div>
                <Label>Video Source</Label>
                <Tabs value={uploadMode} onValueChange={(value) => setUploadMode(value as 'file' | 'url')} className="mt-2">
                  <TabsList>
                    <TabsTrigger value="file" disabled={isUploading}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="url" disabled={isUploading}>
                      <Link className="h-4 w-4 mr-2" />
                      Video URL
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="file" className="space-y-4">
                    <div>
                      <Label htmlFor="video_file">Select Video File *</Label>
                      <Input
                        id="video_file"
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileChange}
                        ref={videoFileRef}
                        disabled={isUploading}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Supported formats: MP4, WebM, AVI, MOV (Max: 100MB)
                      </p>
                      {formData.video_file && (
                        <div className="mt-2 p-2 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <FileVideo className="h-4 w-4" />
                            <span className="text-sm">{formData.video_file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({formatFileSize(formData.video_file.size)})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <Label htmlFor="video_url">Video URL *</Label>
                      <Input
                        id="video_url"
                        value={formData.video_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                        placeholder="https://youtube.com/watch?v=... or direct video URL"
                        disabled={isUploading}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Video title"
                    disabled={isUploading}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    disabled={isUploading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="irrigation">Irrigation</SelectItem>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="testimonial">Testimonial</SelectItem>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Video description"
                  rows={3}
                  disabled={isUploading}
                />
              </div>

              {/* Thumbnail Section */}
              <div>
                <Label>Thumbnail</Label>
                <Tabs defaultValue="file" className="mt-2">
                  <TabsList>
                    <TabsTrigger value="file" disabled={isUploading}>
                      <Image className="h-4 w-4 mr-2" />
                      Upload Image
                    </TabsTrigger>
                    <TabsTrigger value="url" disabled={isUploading}>
                      <Link className="h-4 w-4 mr-2" />
                      Image URL
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="file" className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailFileChange}
                      ref={thumbnailFileRef}
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPG, PNG, WebP (Max: 5MB)
                    </p>
                    {formData.thumbnail_file && (
                      <div className="mt-2 p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          <span className="text-sm">{formData.thumbnail_file.name}</span>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="url">
                    <Input
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                      placeholder="https://example.com/thumbnail.jpg"
                      disabled={isUploading}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  placeholder="Video duration in seconds (auto-detected for uploads)"
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for auto-detection when uploading files
                </p>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    disabled={isUploading}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} disabled={isUploading}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => !isUploading && removeTag(tag)}>
                      {tag} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Publish Settings */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                    disabled={isUploading}
                  />
                  <Label htmlFor="published">Published</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                    disabled={isUploading}
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
              </div>

              <Button type="button" onClick={handleSubmit} disabled={saveVideoMutation.isPending || isUploading}>
                {isUploading ? 'Uploading...' : (saveVideoMutation.isPending ? 'Saving...' : 'Save Video')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Video Management</h2>
          <p className="text-muted-foreground">Manage irrigation videos and tutorials</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Video
        </Button>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileVideo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
              <p className="text-muted-foreground mb-4">Start by adding your first irrigation video</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Video
              </Button>
            </CardContent>
          </Card>
        ) : (
          videos.map((video) => (
            <Card key={video.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {video.thumbnail_url && (
                    <div className="flex-shrink-0">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-32 h-20 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{video.title}</h3>
                        {video.description && (
                          <p className="text-muted-foreground mt-1 line-clamp-2">{video.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Views: {video.views?.toLocaleString() || 0}</span>
                          {video.duration && <span>Duration: {formatDuration(video.duration)}</span>}
                          {video.file_size && <span>Size: {formatFileSize(video.file_size)}</span>}
                          <span>Category: {video.category}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {video.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={video.published ? "default" : "secondary"}>
                          {video.published ? "Published" : "Draft"}
                        </Badge>
                        {video.featured && (
                          <Badge variant="outline">Featured</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button size="sm" variant="outline" asChild>
                        <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                          <Play className="h-4 w-4 mr-1" />
                          Watch
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(video)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(video)}
                        disabled={deleteVideoMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deleteVideoMutation.isPending ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default VideoManagement;