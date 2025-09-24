import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import VideoForm from "./Video/VideoForm";
import VideoList from "./Video/VideoList";
import VideoStats from "./Video/VideoStats";

// TypeScript interfaces for better type safety
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
  const [formData, setFormData] = useState<VideoFormData>({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    category: "irrigation",
    tags: [],
    published: false,
    featured: false,
    duration: 0,
  });
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const thumbnailFileRef = useRef<HTMLInputElement>(null);

  // Check storage buckets on mount
  useEffect(() => {
    const checkStorageBuckets = async () => {
      try {
        const [videosBucket, thumbnailsBucket] = await Promise.all([
          supabase.storage.getBucket("videos"),
          supabase.storage.getBucket("thumbnails"),
        ]);

        if (videosBucket.error || thumbnailsBucket.error) {
          throw new Error("Storage buckets not accessible");
        }
      } catch (error) {
        toast({
          title: "Storage Warning",
          description:
            "Storage buckets are not configured correctly. Please create 'videos' and 'thumbnails' buckets in Supabase.",
          variant: "destructive",
        });
      }
    };

    checkStorageBuckets();
  }, [toast]);

  // Fetch videos
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Video[];
    },
  });

  // Upload file to Supabase with progress tracking
  const uploadFile = useCallback(
    async (
      file: File,
      bucket: string,
      path: string,
      onProgress?: (progress: number) => void
    ) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);

      // Simulate progress for mobile devices
      if (onProgress) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress > 95) progress = 95;
          onProgress(Math.round(progress));
        }, 200);

        setTimeout(() => {
          clearInterval(interval);
          onProgress(100);
        }, 1000);
      }

      return publicUrl;
    },
    []
  );

  // Get video duration
  const getVideoDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };

      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });
  }, []);

  // Generate thumbnail from video
  const generateVideoThumbnail = useCallback((file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.addEventListener("loadeddata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = video.duration * 0.1;
      });

      video.addEventListener("seeked", () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              window.URL.revokeObjectURL(video.src);
              if (blob) {
                resolve(new File([blob], `${Date.now()}_thumbnail.jpg`, { type: "image/jpeg" }));
              } else {
                reject(new Error("Failed to generate thumbnail"));
              }
            },
            "image/jpeg",
            0.8
          );
        } else {
          reject(new Error("Canvas context not available"));
        }
      });

      video.addEventListener("error", () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error("Failed to load video for thumbnail generation"));
      });

      video.src = URL.createObjectURL(file);
      video.load();
    });
  }, []);

  // Save video mutation
  const saveVideoMutation = useMutation({
    mutationFn: async (video: VideoFormData) => {
      setIsUploading(true);
      setUploadProgress(0);

      let videoUrl = video.video_url;
      let thumbnailUrl = video.thumbnail_url;
      let duration = video.duration;
      let fileSize = 0;

      try {
        if (video.video_file && uploadMode === "file") {
          const timestamp = Date.now();
          const videoPath = `videos/${timestamp}_${video.video_file.name}`;
          fileSize = video.video_file.size;

          videoUrl = await uploadFile(video.video_file, "videos", videoPath, (progress) =>
            setUploadProgress(Math.round(progress * 0.6))
          );

          if (!duration) {
            duration = await getVideoDuration(video.video_file);
          }

          if (!video.thumbnail_file && !thumbnailUrl) {
            try {
              const thumbnailFile = await generateVideoThumbnail(video.video_file);
              const thumbnailPath = `thumbnails/${timestamp}_thumbnail.jpg`;
              thumbnailUrl = await uploadFile(thumbnailFile, "thumbnails", thumbnailPath, (progress) =>
                setUploadProgress(Math.round(65 + progress * 0.15))
              );
            } catch (error) {
              console.warn("Failed to generate thumbnail:", error);
            }
          }
        }

        if (video.thumbnail_file) {
          const timestamp = Date.now();
          const thumbnailPath = `thumbnails/${timestamp}_${video.thumbnail_file.name}`;
          thumbnailUrl = await uploadFile(video.thumbnail_file, "thumbnails", thumbnailPath, (progress) =>
            setUploadProgress(Math.round(80 + progress * 0.15))
          );
        }

        const videoData = {
          title: video.title,
          description: video.description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          category: video.category,
          tags: video.tags,
          published: video.published,
          featured: video.featured,
          duration,
          file_size: fileSize || editingVideo?.file_size,
          updated_at: new Date().toISOString(),
          ...(editingVideo ? {} : { views: 0 }),
        };

        const { data, error } = editingVideo
          ? await supabase.from("videos").update(videoData).eq("id", editingVideo.id).select().single()
          : await supabase.from("videos").insert(videoData).select().single();

        if (error) throw error;
        return data;
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 1000);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      resetForm();
      toast({ title: "Success", description: "Video saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Upload Failed", description: error.message || "Failed to upload video.", variant: "destructive" });
    },
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (video: Video) => {
      if (video.video_url?.includes("supabase")) {
        const fileName = video.video_url.split("/").pop();
        await supabase.storage.from("videos").remove([`videos/${fileName}`]);
      }

      if (video.thumbnail_url?.includes("supabase")) {
        const fileName = video.thumbnail_url.split("/").pop();
        await supabase.storage.from("thumbnails").remove([`thumbnails/${fileName}`]);
      }

      const { error } = await supabase.from("videos").delete().eq("id", video.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({ title: "Success", description: "Video deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      category: "irrigation",
      tags: [],
      published: false,
      featured: false,
      duration: 0,
    });
    setEditingVideo(null);
    setShowForm(false);
    setUploadMode("file");
    videoFileRef.current && (videoFileRef.current.value = "");
    thumbnailFileRef.current && (thumbnailFileRef.current.value = "");
  }, []);

  const handleEdit = useCallback((video: Video) => {
    setFormData({
      title: video.title,
      description: video.description || "",
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || "",
      category: video.category,
      tags: video.tags,
      published: video.published,
      featured: video.featured,
      duration: video.duration || 0,
    });
    setEditingVideo(video);
    setShowForm(true);
    setUploadMode("url");
  }, []);

  const handleDelete = useCallback((video: Video) => {
    if (confirm("Are you sure you want to delete this video?")) {
      deleteVideoMutation.mutate(video);
    }
  }, [deleteVideoMutation]);

  const handleVideoFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("video/")) {
        toast({ title: "Error", description: "Please select a valid video file", variant: "destructive" });
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        toast({ title: "Error", description: "Video file size must be less than 100MB", variant: "destructive" });
        return;
      }

      setFormData((prev) => ({
        ...prev,
        video_file: file,
        title: prev.title || file.name.split(".")[0],
      }));
    },
    [toast]
  );

  const handleThumbnailFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({ title: "Error", description: "Please select a valid image file", variant: "destructive" });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "Thumbnail file size must be less than 5MB", variant: "destructive" });
        return;
      }

      setFormData((prev) => ({ ...prev, thumbnail_file: file }));
    },
    [toast]
  );

  const videoStats = {
    totalVideos: videos.length,
    totalViews: videos.reduce((sum, video) => sum + (video.views || 0), 0),
    totalLikes: videos.reduce((sum, video) => sum + (video.featured ? 1 : 0), 0),
    totalDuration: Math.floor(videos.reduce((sum, video) => sum + (video.duration || 0), 0) / 60),
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {showForm ? (
        <VideoForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={(e) => {
            e.preventDefault();
            if (!formData.title) {
              toast({ title: "Error", description: "Title is required", variant: "destructive" });
              return;
            }
            if (uploadMode === "file" && !formData.video_file && !editingVideo) {
              toast({ title: "Error", description: "Please select a video file", variant: "destructive" });
              return;
            }
            if (uploadMode === "url" && !formData.video_url) {
              toast({ title: "Error", description: "Video URL is required", variant: "destructive" });
              return;
            }
            saveVideoMutation.mutate(formData);
          }}
          onCancel={resetForm}
          editingVideo={editingVideo}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadMode={uploadMode}
          setUploadMode={setUploadMode}
          videoFileRef={videoFileRef}
          thumbnailFileRef={thumbnailFileRef}
          onVideoFileChange={handleVideoFileChange}
          onThumbnailFileChange={handleThumbnailFileChange}
          isSaving={saveVideoMutation.isPending}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Video Management</h2>
              <p className="text-muted-foreground">Manage irrigation videos and tutorials</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </div>
          <VideoStats stats={videoStats} />
          <VideoList
            videos={videos}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShowForm={() => setShowForm(true)}
            isDeleting={deleteVideoMutation.isPending}
          />
        </div>
      )}
    </div>
  );
};

export default VideoManagement;