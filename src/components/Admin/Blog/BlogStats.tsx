import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Eye, ThumbsUp, MessageCircle } from "lucide-react";

interface BlogStatsProps {
  stats: {
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
  };
}

const BlogStats: React.FC<BlogStatsProps> = ({ stats }) => {
  const statItems = [
    {
      title: "Total Posts",
      value: stats.totalPosts,
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Total Views",
      value: stats.totalViews,
      icon: Eye,
      color: "text-green-600",
    },
    {
      title: "Total Likes",
      value: stats.totalLikes,
      icon: ThumbsUp,
      color: "text-pink-600",
    },
    {
      title: "Comments",
      value: stats.totalComments,
      icon: MessageCircle,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {statItems.map((item) => (
        <Card key={item.title} className="border-0 bg-card shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color}`} />
              <span className="text-xl sm:text-2xl font-bold text-foreground">
                {item.value}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {item.title}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BlogStats;
