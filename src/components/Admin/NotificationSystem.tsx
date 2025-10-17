import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Mail,
  FileText,
  ShoppingCart,
  Users,
  Calendar,
  Settings,
  AlertCircle,
  X,
  MarkAsUnreadIcon,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Initialize notifications from existing data
  const initializeNotifications = async () => {
    try {
      setLoading(true);

      // Fetch recent contact submissions
      const { data: contacts, error: contactsError } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (
        contactsError &&
        !contactsError.message.includes(
          'relation "contact_submissions" does not exist',
        )
      ) {
        console.error("Error fetching contacts:", contactsError);
      }

      // Fetch recent quotes
      const { data: quotes, error: quotesError } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (
        quotesError &&
        !quotesError.message.includes('relation "quotes" does not exist')
      ) {
        console.error("Error fetching quotes:", quotesError);
      }

      // Fetch recent projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (
        projectsError &&
        !projectsError.message.includes('relation "projects" does not exist')
      ) {
        console.error("Error fetching projects:", projectsError);
      }

      // Fetch recent blog posts
      const { data: blogs, error: blogsError } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (
        blogsError &&
        !blogsError.message.includes('relation "blog_posts" does not exist')
      ) {
        console.error("Error fetching blogs:", blogsError);
      }

      // Convert data to notifications
      const allNotifications: Notification[] = [];

      // Add contact submission notifications
      (contacts || []).forEach((contact) => {
        allNotifications.push({
          id: `contact_${contact.id}`,
          type: "contact_submission",
          title: "New Contact Submission",
          message: `${contact.name || "Someone"} submitted a contact form: ${contact.subject || "No subject"}`,
          timestamp: new Date(contact.created_at),
          read: false,
          data: contact,
        });
      });

      // Add quote notifications
      (quotes || []).forEach((quote) => {
        allNotifications.push({
          id: `quote_${quote.id}`,
          type: "quote",
          title: "New Quote Request",
          message: `Quote #${quote.quote_number} for ${quote.customer_name || "Unknown customer"} - ${quote.project_type || "General"}`,
          timestamp: new Date(quote.created_at),
          read: false,
          data: quote,
        });
      });

      // Add project notifications
      (projects || []).forEach((project) => {
        allNotifications.push({
          id: `project_${project.id}`,
          type: "project",
          title: "Project Update",
          message: `Project "${project.name}" status: ${project.status || "Active"}`,
          timestamp: new Date(project.created_at),
          read: false,
          data: project,
        });
      });

      // Add blog notifications
      (blogs || []).forEach((blog) => {
        allNotifications.push({
          id: `blog_${blog.id}`,
          type: "blog_post",
          title: "New Blog Post",
          message: `New blog post published: "${blog.title}"`,
          timestamp: new Date(blog.created_at),
          read: false,
          data: blog,
        });
      });

      // Sort by timestamp and limit to 50
      const sortedNotifications = allNotifications
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 50);

      setNotifications(sortedNotifications);
    } catch (error) {
      console.error("Error initializing notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    const channels: any[] = [];

    console.log("Setting up notification subscriptions...");

    try {
      // Subscribe to contact submissions
      const contactChannel = supabase
        .channel("contact_submissions")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "contact_submissions" },
          (payload) => {
            try {
              addNotification("contact_submission", {
                title: "New Contact Submission",
                message: `${payload.new.name || "Someone"} submitted a contact form: ${payload.new.subject || "No subject"}`,
                data: payload.new,
              });
            } catch (error) {
              console.error(
                "Error processing contact submission notification:",
                error,
              );
            }
          },
        )
        .subscribe();

      channels.push(contactChannel);

      // Subscribe to quotes
      const quoteChannel = supabase
        .channel("quotes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "quotes" },
          (payload) => {
            try {
              addNotification("quote", {
                title: "New Quote Request",
                message: `Quote #${payload.new.quote_number} for ${payload.new.customer_name || "Unknown customer"}`,
                data: payload.new,
              });
            } catch (error) {
              console.error("Error processing quote notification:", error);
            }
          },
        )
        .subscribe();

      channels.push(quoteChannel);

      // Subscribe to projects
      const projectChannel = supabase
        .channel("projects")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "projects" },
          (payload) => {
            try {
              const eventType = payload.eventType;
              const title =
                eventType === "INSERT"
                  ? "New Project Created"
                  : "Project Updated";
              const message = `Project "${payload.new.name}" ${eventType === "INSERT" ? "created" : "updated"}`;

              addNotification("project", {
                title,
                message,
                data: payload.new,
              });
            } catch (error) {
              console.error("Error processing project notification:", error);
            }
          },
        )
        .subscribe();

      channels.push(projectChannel);

      // Subscribe to blog posts
      const blogChannel = supabase
        .channel("blog_posts")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "blog_posts" },
          (payload) => {
            try {
              addNotification("blog_post", {
                title: "New Blog Post",
                message: `New blog post published: "${payload.new.title}"`,
                data: payload.new,
              });
            } catch (error) {
              console.error("Error processing blog notification:", error);
            }
          },
        )
        .subscribe();

      channels.push(blogChannel);

      console.log(`Set up ${channels.length} notification channels`);
    } catch (error) {
      console.error("Error setting up subscriptions:", error);
    }

    // Initialize notifications
    initializeNotifications();

    // Cleanup subscriptions
    return () => {
      console.log("Cleaning up notification subscriptions...");
      channels.forEach((channel) => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error("Error removing channel:", error);
        }
      });
    };
  }, []);

  const addNotification = (
    type: string,
    { title, message, data }: { title: string; message: string; data?: any },
  ) => {
    console.log("Adding notification:", { type, title, message });
    const newNotification: Notification = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      data,
    };

    setNotifications((prev) => {
      const updated = [newNotification, ...prev].slice(0, 50);
      console.log("Updated notifications:", updated.length);
      return updated;
    });

    // Show toast notification
    toast({
      title: title,
      description: message,
      duration: 5000,
    });
  };

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      contact_submission: Mail,
      quote: FileText,
      mpesa_transaction: ShoppingCart,
      invoice: FileText,
      customer: Users,
      project: Calendar,
      blog_post: Settings,
      success_story: Settings,
      video: Settings,
      document: Settings,
    };

    const IconComponent = iconMap[type as keyof typeof iconMap] || AlertCircle;
    return <IconComponent className="w-5 h-5" />;
  };

  const getNotificationColor = (type: string) => {
    const colorMap = {
      contact_submission: "bg-blue-100 text-blue-800",
      quote: "bg-green-100 text-green-800",
      mpesa_transaction: "bg-yellow-100 text-yellow-800",
      invoice: "bg-purple-100 text-purple-800",
      customer: "bg-indigo-100 text-indigo-800",
      project: "bg-orange-100 text-orange-800",
      blog_post: "bg-pink-100 text-pink-800",
      success_story: "bg-teal-100 text-teal-800",
      video: "bg-red-100 text-red-800",
      document: "bg-gray-100 text-gray-800",
    };

    return (
      colorMap[type as keyof typeof colorMap] || "bg-gray-100 text-gray-800"
    );
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowDropdown(false);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="relative">
        <Button variant="ghost" size="sm" disabled>
          <Bell className="h-4 w-4 animate-pulse" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {showDropdown && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-[500px] z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Notifications ({notifications.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-xs"
                >
                  Mark all read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDropdown(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              {["all", "unread", "read"].map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                  className="text-xs capitalize"
                >
                  {filterType}
                  {filterType === "unread" && unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {filteredNotifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                          !notification.read ? "bg-muted/30" : ""
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-1 rounded-full ${getNotificationColor(notification.type)}`}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium truncate">
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="outline" className="text-xs">
                                {notification.type.replace("_", " ")}
                              </Badge>

                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < filteredNotifications.length - 1 && (
                        <Separator />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {notifications.length > 0 && (
              <>
                <Separator />
                <div className="p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="w-full text-xs"
                  >
                    Clear all notifications
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationSystem;
