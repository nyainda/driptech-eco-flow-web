
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Upload, Link, Image, FileVideo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  editingVideo: any;
  isUploading: boolean;
  uploadProgress: number;
  uploadMode: 'file' | 'url';
  setUploadMode: (mode: 'file' | 'url') => void;
  videoFileRef: React.RefObject<HTMLInputElement>;
  thumbnailFileRef: React.RefObject<HTMLInputElement>;
  onVideoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onThumbnailFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  newTag: string;
  setNewTag: (tag: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  isSaving: boolean;
}

const VideoForm = ({
  formData, setFormData, onSubmit, onCancel, editingVideo, isUploading,
  uploadProgress, uploadMode, setUploadMode, videoFileRef, thumbnailFileRef,
  onVideoFileChange, onThumbnailFileChange, newTag, setNewTag, addTag, removeTag, isSaving
}: VideoFormProps) => {
  const formatFileSize = (bytes: number) => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {editingVideo ? 'Edit Video' : 'Add New Video'}
        </h3>
        <Button variant="outline" onClick={onCancel} disabled={isUploading}>
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
                      onChange={onVideoFileChange}
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

            <Button type="button" onClick={onSubmit} disabled={isSaving || isUploading}>
              {isUploading ? 'Uploading...' : (isSaving ? 'Saving...' : 'Save Video')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoForm;
