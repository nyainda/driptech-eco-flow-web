
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Play, FileVideo } from "lucide-react";

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

interface VideoListProps {
  videos: Video[];
  isLoading: boolean;
  onEdit: (video: Video) => void;
  onDelete: (video: Video) => void;
  onShowForm: () => void;
  isDeleting: boolean;
}

const VideoList = ({ videos, isLoading, onEdit, onDelete, onShowForm, isDeleting }: VideoListProps) => {
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

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading videos...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileVideo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
          <p className="text-muted-foreground mb-4">Start by adding your first irrigation video</p>
          <Button onClick={onShowForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Video
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {videos.map((video) => (
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
                  <Button size="sm" variant="outline" onClick={() => onEdit(video)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onDelete(video)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VideoList;
