
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Trash2, Mail, Phone, Building, MapPin, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  project_type?: string;
  area_size?: string;
  budget_range?: string;
  read: boolean;
}

const ContactNotifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Fetch contact submissions
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['contact-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ContactSubmission[];
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ read: true, status: 'read' })
        .eq('id', submissionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      toast({
        title: "Success",
        description: "Message marked as read",
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

  // Delete submission mutation
  const deleteSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', submissionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      toast({
        title: "Success",
        description: "Message deleted successfully",
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

  const handleMarkAsRead = (submissionId: string) => {
    markAsReadMutation.mutate(submissionId);
  };

  const handleDelete = (submissionId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteSubmissionMutation.mutate(submissionId);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'unread') return !submission.read;
    if (filter === 'read') return submission.read;
    return true;
  });

  const unreadCount = submissions.filter(s => !s.read).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'read': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'resolved': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <div>
            <h2 className="text-2xl font-bold">Contact Notifications</h2>
            <p className="text-muted-foreground">
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({submissions.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === 'read' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('read')}
          >
            Read ({submissions.length - unreadCount})
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div>Loading notifications...</div>
        ) : filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No messages found for the selected filter.
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card key={submission.id} className={`${!submission.read ? 'border-blue-200 bg-blue-50/50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{submission.name}</CardTitle>
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                      {!submission.read && (
                        <Badge variant="secondary">New</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {submission.email}
                      </div>
                      {submission.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {submission.phone}
                        </div>
                      )}
                      {submission.company && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {submission.company}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(submission.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!submission.read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(submission.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark Read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(submission.id)}
                      disabled={deleteSubmissionMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Project Details */}
                  {(submission.project_type || submission.area_size || submission.budget_range) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                      {submission.project_type && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Type:</span>
                          <span>{submission.project_type}</span>
                        </div>
                      )}
                      {submission.area_size && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Area:</span>
                          <span>{submission.area_size}</span>
                        </div>
                      )}
                      {submission.budget_range && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Budget:</span>
                          <span>{submission.budget_range}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Message */}
                  <div>
                    <h4 className="font-medium mb-2">Message:</h4>
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {submission.message}
                      </p>
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

export default ContactNotifications;
