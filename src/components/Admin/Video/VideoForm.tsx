import { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { X, Upload, Link, Image, FileVideo, Trash2 } from "lucide-react";

interface VideoFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  editingVideo: any;
  isUploading: boolean;
  uploadProgress: number;
  uploadMode: "file" | "url";
  setUploadMode: (mode: "file" | "url") => void;
  videoFileRef: React.RefObject<HTMLInputElement>;
  thumbnailFileRef: React.RefObject<HTMLInputElement>;
  onVideoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onThumbnailFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving: boolean;
}

const VideoForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  editingVideo,
  isUploading,
  uploadProgress,
  uploadMode,
  setUploadMode,
  videoFileRef,
  thumbnailFileRef,
  onVideoFileChange,
  onThumbnailFileChange,
  isSaving,
}: VideoFormProps) => {
  const formatFileSize = useCallback((bytes: number) => {
    if (!bytes) return "Unknown";
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  const clearThumbnail = useCallback(() => {
    setFormData((prev: any) => ({
      ...prev,
      thumbnail_file: undefined,
      thumbnail_url: "",
    }));
    if (thumbnailFileRef.current) thumbnailFileRef.current.value = "";
  }, [setFormData, thumbnailFileRef]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {editingVideo ? "Edit Video" : "Add New Video"}
        </h3>
        <Button variant="outline" onClick={onCancel} disabled={isUploading}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Upload Progress</Label>
                <span className="text-sm text-muted-foreground">
                  {uploadProgress}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <div>
            <Label>Video Source</Label>
            <Tabs
              value={uploadMode}
              onValueChange={(value) => setUploadMode(value as "file" | "url")}
              className="mt-2"
            >
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
                    accept="video/mp4,video/webm,video/avi,video/mov"
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
                        <span className="text-sm">
                          {formData.video_file.name}
                        </span>
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
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        video_url: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/video.mp4"
                    disabled={isUploading}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Thumbnail/Cover Image</Label>
              {(formData.thumbnail_url || formData.thumbnail_file) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearThumbnail}
                  disabled={isUploading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {(formData.thumbnail_url || formData.thumbnail_file) && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Preview</Label>
                <div className="relative w-48 h-28 border rounded-md overflow-hidden bg-muted">
                  {formData.thumbnail_file ? (
                    <img
                      src={URL.createObjectURL(formData.thumbnail_file)}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    formData.thumbnail_url && (
                      <img
                        src={formData.thumbnail_url}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement?.classList.add(
                            "flex",
                            "items-center",
                            "justify-center",
                          );
                        }}
                      />
                    )
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="thumbnail_file">Upload Custom Thumbnail</Label>
                <Input
                  id="thumbnail_file"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={onThumbnailFileChange}
                  ref={thumbnailFileRef}
                  disabled={isUploading}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG (Max: 5MB)
                </p>
                {formData.thumbnail_file && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      <span className="text-sm">
                        {formData.thumbnail_file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(formData.thumbnail_file.size)})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      thumbnail_url: e.target.value,
                    }))
                  }
                  placeholder="https://example.com/thumbnail.jpg"
                  disabled={isUploading}
                />
              </div>
            </div>

            {uploadMode === "file" &&
              !formData.thumbnail_file &&
              !formData.thumbnail_url && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      A thumbnail will be automatically generated from your
                      video.
                    </p>
                  </div>
                </div>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Video title"
                disabled={isUploading}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev: any) => ({ ...prev, category: value }))
                }
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
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Video description"
              rows={3}
              disabled={isUploading}
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData((prev: any) => ({ ...prev, published: checked }))
                }
                disabled={isUploading}
              />
              <Label htmlFor="published">Published</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData((prev: any) => ({ ...prev, featured: checked }))
                }
                disabled={isUploading}
              />
              <Label htmlFor="featured">Featured</Label>
            </div>
          </div>

          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSaving || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Uploading... {uploadProgress}%
              </>
            ) : isSaving ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {editingVideo ? "Update Video" : "Save Video"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoForm;
