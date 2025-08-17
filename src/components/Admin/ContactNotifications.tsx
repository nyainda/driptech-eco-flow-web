import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Trash2, Mail, Phone, Building, MapPin, Calendar, DollarSign, Filter, Search, MoreVertical, Archive, Star, Reply, Clock, User, Eye, EyeOff, ArrowUpDown, ChevronDown, MessageSquare } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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

  const handleSort = (column: 'created_at' | 'name' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedAndFilteredSubmissions = submissions
    .filter(submission => {
      if (filter === 'unread') return !submission.read;
      if (filter === 'read') return submission.read;
      return true;
    })
    .filter(submission => 
      searchQuery === '' || 
      submission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

  const unreadCount = submissions.filter(s => !s.read).length;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'new': return { color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', label: 'New' };
      case 'read': return { color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', label: 'Read' };
      case 'pending': return { color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50', label: 'Pending' };
      case 'resolved': return { color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50', label: 'Resolved' };
      default: return { color: 'bg-slate-500', textColor: 'text-slate-700', bgColor: 'bg-slate-50', label: status };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const parseMessage = (message: string) => {
    // Split message by common patterns like "Field:" or "Field :"
    const lines = message.split(/\n/).filter(line => line.trim());
    const parsed = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Check if line contains a field pattern like "Field:" or "Field :"
      const fieldMatch = trimmedLine.match(/^([^:]+):\s*(.*)$/);
      if (fieldMatch) {
        const [, field, value] = fieldMatch;
        parsed.push({
          type: 'field',
          field: field.trim(),
          value: value.trim() || 'Not specified'
        });
      } else {
        // Regular text line
        parsed.push({
          type: 'text',
          content: trimmedLine
        });
      }
    }
    
    return parsed.length > 0 ? parsed : [{ type: 'text', content: message }];
  };

  const toggleRowExpansion = (submissionId: string) => {
    setExpandedRow(expandedRow === submissionId ? null : submissionId);
  };

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className=" rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{unreadCount}</span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contact Messages</h1>
                <p className="text-slate-600 dark:text-slate-400">{submissions.length} total • {unreadCount} unread</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-80 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
            {[
              { key: 'all', label: 'All', count: submissions.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'read', label: 'Read', count: submissions.length - unreadCount }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className=" rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-slate-600 dark:text-slate-400">Loading...</span>
            </div>
          ) : sortedAndFilteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No messages found</h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchQuery ? 'Try adjusting your search terms' : 'No messages match the selected filter'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button 
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white"
                      >
                        Contact
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button 
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white"
                      >
                        Status
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700 dark:text-gray-300">Project Details</th>
                    <th className="px-6 py-4 text-left">
                      <button 
                        onClick={() => handleSort('created_at')}
                        className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white"
                      >
                        Date
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-slate-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                  {sortedAndFilteredSubmissions.map((submission) => {
                    const statusConfig = getStatusConfig(submission.status);
                    const isExpanded = expandedRow === submission.id;
                    
                    return (
                      <>
                        <tr 
                          key={submission.id}
                          className={`hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors ${
                            !submission.read ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                                !submission.read ? 'bg-blue-500' : 'bg-slate-400'
                              }`}>
                                {submission.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-slate-900 dark:text-white truncate">
                                    {submission.name}
                                  </p>
                                  {!submission.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {submission.email}
                                  </span>
                                  {submission.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {submission.phone}
                                    </span>
                                  )}
                                </div>
                                {submission.company && (
                                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                    <Building className="h-3 w-3" />
                                    {submission.company}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <Badge className={`${statusConfig.color} text-white px-2 py-1`}>
                              {statusConfig.label}
                            </Badge>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="space-y-1 text-sm">
                              {submission.project_type && (
                                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                  <MapPin className="h-3 w-3" />
                                  {submission.project_type}
                                </div>
                              )}
                              {submission.budget_range && (
                                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                  <DollarSign className="h-3 w-3" />
                                  {submission.budget_range}
                                </div>
                              )}
                              {submission.area_size && (
                                <div className="text-slate-500 dark:text-slate-500 text-xs">
                                  Area: {submission.area_size}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                              <Calendar className="h-3 w-3" />
                              {formatDate(submission.created_at)}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleRowExpansion(submission.id)}
                                className="p-2"
                              >
                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </Button>
                              {!submission.read && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMarkAsRead(submission.id)}
                                  disabled={markAsReadMutation.isPending}
                                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(submission.id)}
                                disabled={deleteSubmissionMutation.isPending}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="px-6 py-0">
                              <div className="bg-slate-50 dark:bg-gray-800 -mx-6 px-6 py-6 border-t border-slate-200 dark:border-gray-700">
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                    <MessageSquare className="h-5 w-5 text-blue-500" />
                                    Message Details
                                  </h4>
                                  <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-600 shadow-sm">
                                    {parseMessage(submission.message).map((item, index) => {
                                      if (item.type === 'field') {
                                        return (
                                          <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-2 py-2 border-b border-slate-100 dark:border-gray-700 last:border-b-0">
                                            <div className="sm:w-1/3">
                                              <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full">
                                                {item.field}
                                              </span>
                                            </div>
                                            <div className="sm:w-2/3">
                                              <span className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed">
                                                {item.value === '' || item.value === 'Not specified' ? (
                                                  <span className="text-slate-400 dark:text-gray-500 italic">Not specified</span>
                                                ) : (
                                                  item.value
                                                )}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div key={index} className="py-2">
                                            <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed">
                                              {item.content}
                                            </p>
                                          </div>
                                        );
                                      }
                                    })}
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-gray-400 pt-3 border-t border-slate-200 dark:border-gray-700">
                                    <span className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      Message ID: <code className="bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{submission.id.slice(-8)}</code>
                                    </span>
                                    <span>Received: {new Date(submission.created_at).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactNotifications;