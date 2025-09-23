import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import VideoForm from "./Video/VideoForm";
import VideoList from "./Video/VideoList";
import VideoStats from "./Video/VideoStats";

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

  // Check if storage buckets exist and are accessible
  useEffect(() => {
    const checkStorageBuckets = async () => {
      try {
        // Check videos bucket
        const { data: videosBucket, error: videosError } = await supabase.storage
          .getBucket('videos');
        
        if (videosError) {
          console.warn('Videos bucket not accessible:', videosError);
          toast({
            title: "Storage Warning",
            description: "Videos storage bucket is not configured. Please create 'videos' and 'thumbnails' buckets in Supabase.",
            variant: "destructive",
          });
        }

        // Check thumbnails bucket
        const { data: thumbnailsBucket, error: thumbnailsError } = await supabase.storage
          .getBucket('thumbnails');
        
        if (thumbnailsError) {
          console.warn('Thumbnails bucket not accessible:', thumbnailsError);
        }

      } catch (error) {
        console.warn('Storage bucket check failed:', error);
      }
    };

    checkStorageBuckets();
  }, [toast]);
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

  // Upload file to Supabase Storage with progress tracking
  const uploadFile = async (file: File, bucket: string, path: string, onProgress?: (progress: number) => void) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Simulate progress for the standard upload since we can't track real progress
        let currentProgress = 0;
        const progressInterval = setInterval(() => {
          currentProgress += Math.random() * 20;
          if (currentProgress > 95) {
            currentProgress = 95;
          }
          if (onProgress) {
            onProgress(Math.round(currentProgress));
          }
        }, 200);

        try {
          // Use Supabase's standard upload method
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
              cacheControl: '3600',
              upsert: false
            });

          clearInterval(progressInterval);
          
          if (error) {
            throw error;
          }

          // Complete progress
          if (onProgress) {
            onProgress(100);
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

          resolve(publicUrl);

        } catch (uploadError) {
          clearInterval(progressInterval);
          throw uploadError;
        }

      } catch (error) {
        reject(error);
      }
    });
  };

  // Simple upload function as fallback
  const uploadFileSimple = async (file: File, bucket: string, path: string) => {
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

  // Generate thumbnail from video file
  const generateVideoThumbnail = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.addEventListener('loadeddata', () => {
        // Set canvas dimensions to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Seek to 10% of video duration for a good thumbnail
        video.currentTime = video.duration * 0.1;
      });
      
      video.addEventListener('seeked', () => {
        // Draw video frame to canvas
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to blob
          canvas.toBlob((blob) => {
            window.URL.revokeObjectURL(video.src);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          }, 'image/jpeg', 0.8);
        } else {
          reject(new Error('Canvas context not available'));
        }
      });
      
      video.addEventListener('error', () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video for thumbnail generation'));
      });
      
      video.src = URL.createObjectURL(file);
      video.load();
    });
  };

  // Updated saveVideoMutation with thumbnail generation
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
          fileSize = video.video_file.size;
          
          console.log(`Starting video upload: ${video.video_file.name} (${(fileSize / 1024 / 1024).toFixed(1)}MB)`);
          
          // For large files (>25MB), show a different progress approach
          if (fileSize > 25 * 1024 * 1024) {
            console.log('Large file detected, using simulated progress...');
            
            // Show initial progress
            setUploadProgress(5);
            
            // Upload with simulated progress
            videoUrl = await uploadFile(video.video_file, 'videos', videoPath, (progress) => {
              // Video upload takes 60% of total progress
              const adjustedProgress = Math.round(progress * 0.6);
              setUploadProgress(adjustedProgress);
              console.log(`Video upload progress: ${progress}% (adjusted: ${adjustedProgress}%)`);
            });
          } else {
            // For smaller files, use standard upload
            videoUrl = await uploadFileSimple(video.video_file, 'videos', videoPath);
            setUploadProgress(60);
          }

          console.log('Video upload completed, getting duration...');
          
          // Get video duration if not provided
          if (!duration) {
            duration = await getVideoDuration(video.video_file);
          }
          
          setUploadProgress(65);

          // Generate thumbnail if no custom thumbnail provided
          if (!video.thumbnail_file && !thumbnailUrl) {
            console.log('Generating thumbnail from video...');
            try {
              const thumbnailBlob = await generateVideoThumbnail(video.video_file);
              const thumbnailPath = `thumbnails/${timestamp}_thumbnail.jpg`;
              
              // Create a File object from the blob
              const thumbnailFile = new File([thumbnailBlob], `${timestamp}_thumbnail.jpg`, { type: 'image/jpeg' });
              
              // Upload generated thumbnail
              thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails', thumbnailPath, (progress) => {
                const adjustedProgress = Math.round(65 + (progress * 0.15));
                setUploadProgress(adjustedProgress);
              });
              
              setUploadProgress(80);
              console.log('Auto-generated thumbnail uploaded');
            } catch (error) {
              console.warn('Failed to generate thumbnail:', error);
              setUploadProgress(80);
            }
          }
        }

        // Handle custom thumbnail file upload
        if (video.thumbnail_file) {
          const timestamp = Date.now();
          const thumbnailPath = `thumbnails/${timestamp}_${video.thumbnail_file.name}`;
          
          console.log('Starting custom thumbnail upload...');
          
          // Upload custom thumbnail (remaining progress allocation)
          thumbnailUrl = await uploadFile(video.thumbnail_file, 'thumbnails', thumbnailPath, (progress) => {
            const baseProgress = video.video_file ? 80 : 0;
            const adjustedProgress = Math.round(baseProgress + (progress * 0.15));
            setUploadProgress(adjustedProgress);
          });
          
          setUploadProgress(95);
          console.log('Custom thumbnail uploaded');
        }

        console.log('Saving to database...');

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
          console.log('Video updated successfully');
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
          console.log('Video created successfully');
          return data;
        }
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      } finally {
        // Keep the upload state for a moment to show 100% completion
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 1000);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      resetForm();
      toast({
        title: "Success",
        description: "Video uploaded and saved successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Save video error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video. Please try again.",
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

  // Updated handleSubmit with large file warning
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

    // Show warning for large files
    if (formData.video_file && formData.video_file.size > 50 * 1024 * 1024) {
      const fileSizeMB = (formData.video_file.size / 1024 / 1024).toFixed(1);
      toast({
        title: "Large File Detected",
        description: `Uploading ${fileSizeMB}MB file. This may take several minutes. Please don't close the browser.`,
      });
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

  // Calculate stats for VideoStats component
  const videoStats = {
    totalVideos: videos.length,
    totalViews: videos.reduce((sum, video) => sum + (video.views || 0), 0),
    totalLikes: videos.reduce((sum, video) => sum + (video.featured ? 1 : 0), 0), // Using featured as likes
    totalDuration: Math.floor(videos.reduce((sum, video) => sum + (video.duration || 0), 0) / 60)
  };

  if (showForm) {
    return (
      <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8">
        <VideoForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
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
          newTag={newTag}
          setNewTag={setNewTag}
          addTag={addTag}
          removeTag={removeTag}
          isSaving={saveVideoMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      {/* Container with responsive padding */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header Section - Responsive flex layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Video Management
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage irrigation videos and tutorials
            </p>
          </div>
          
          {/* Add Video Button - Full width on mobile, auto on larger screens */}
          <Button 
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base"
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Add Video</span>
          </Button>
        </div>

        {/* Video Stats Section - Responsive grid */}
        <div className="w-full">
          <VideoStats stats={videoStats} />
        </div>
        
        {/* Video List Section - Full width with responsive layout */}
        <div className="w-full">
          <VideoList
            videos={videos}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShowForm={() => setShowForm(true)}
            isDeleting={deleteVideoMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoManagement;