import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Users, FileText, ShoppingCart, Calendar, Mail, Settings } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  // Real-time subscription setup
  useEffect(() => {
    const channels = [];
    
    console.log('Setting up notification subscriptions...');

    try {
      // Subscribe to contact submissions
      const contactChannel = supabase
        .channel('contact_submissions')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'contact_submissions' },
          (payload) => {
            try {
              addNotification('contact_submission', {
                title: 'New Contact Submission',
                message: `${payload.new.name || 'Someone'} submitted a contact form`,
                data: payload.new
              });
            } catch (error) {
              console.error('Error processing contact submission notification:', error);
            }
          }
        )
        .subscribe();

      // Subscribe to quotes
      const quoteChannel = supabase
        .channel('quotes')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'quotes' },
          (payload) => {
            try {
              addNotification('quote', {
                title: 'New Quote Created',
                message: `Quote ${payload.new.quote_number || 'New Quote'} has been created`,
                data: payload.new
              });
            } catch (error) {
              console.error('Error processing quote creation notification:', error);
            }
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'quotes' },
          (payload) => {
            try {
              if (payload.new.status !== payload.old.status) {
                addNotification('quote', {
                  title: 'Quote Status Updated',
                  message: `Quote ${payload.new.quote_number || 'Quote'} status changed to ${payload.new.status}`,
                  data: payload.new
                });
              }
            } catch (error) {
              console.error('Error processing quote update notification:', error);
            }
          }
        )
        .subscribe();

      // Subscribe to M-Pesa transactions
      const mpesaChannel = supabase
        .channel('mpesa_transactions')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'mpesa_transactions' },
          (payload) => {
            try {
              const amount = payload.new.amount || 0;
              addNotification('mpesa_transaction', {
                title: 'Payment Received',
                message: `M-Pesa payment of KES ${amount.toLocaleString()} received`,
                data: payload.new
              });
            } catch (error) {
              console.error('Error processing M-Pesa transaction notification:', error);
            }
          }
        )
        .subscribe();

      // Subscribe to invoices
      const invoiceChannel = supabase
        .channel('invoices')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'invoices' },
          (payload) => {
            console.log('Invoice INSERT received:', payload);
            try {
              addNotification('invoice', {
                title: 'New Invoice Created',
                message: `Invoice ${payload.new.invoice_number || 'New Invoice'} has been created`,
                data: payload.new
              });
            } catch (error) {
              console.error('Error processing invoice creation notification:', error);
            }
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'invoices' },
          (payload) => {
            console.log('Invoice UPDATE received:', payload);
            try {
              if (payload.new.status === 'paid' && payload.old.status !== 'paid') {
                addNotification('invoice', {
                  title: 'Invoice Paid',
                  message: `Invoice ${payload.new.invoice_number || 'Invoice'} has been paid`,
                  data: payload.new
                });
              }
            } catch (error) {
              console.error('Error processing invoice payment notification:', error);
            }
          }
        )
        .subscribe((status, err) => {
          console.log('Invoice subscription status:', status, err);
        });

      // Subscribe to customers
      const customerChannel = supabase
        .channel('customers')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'customers' },
          (payload) => {
            try {
              const customerName = payload.new.contact_person || 'New Customer';
              const companyName = payload.new.company_name || 'Individual';
              addNotification('customer', {
                title: 'New Customer Registered',
                message: `${customerName} from ${companyName} registered`,
                data: payload.new
              });
            } catch (error) {
              console.error('Error processing customer registration notification:', error);
            }
          }
        )
        .subscribe();

      // Subscribe to projects
      const projectChannel = supabase
        .channel('projects')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'projects' },
          (payload) => {
            try {
              addNotification('project', {
                title: 'New Project Created',
                message: `Project "${payload.new.name || 'Unnamed Project'}" has been created`,
                data: payload.new
              });
            } catch (error) {
              console.error('Error processing project creation notification:', error);
            }
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'projects' },
          (payload) => {
            try {
              if (payload.new.status !== payload.old.status) {
                addNotification('project', {
                  title: 'Project Status Updated',
                  message: `Project "${payload.new.name || 'Project'}" status changed to ${payload.new.status}`,
                  data: payload.new
                });
              }
            } catch (error) {
              console.error('Error processing project update notification:', error);
            }
          }
        )
        .subscribe();

      // Subscribe to blog posts
      const blogChannel = supabase
        .channel('blog_posts')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'blog_posts' },
          (payload) => {
            try {
              if (payload.new.published) {
                addNotification('blog_post', {
                  title: 'New Blog Post Published',
                  message: `"${payload.new.title || 'New Post'}" has been published`,
                  data: payload.new
                });
              }
            } catch (error) {
              console.error('Error processing blog post notification:', error);
            }
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'blog_posts' },
          (payload) => {
            try {
              if (payload.new.published && !payload.old.published) {
                addNotification('blog_post', {
                  title: 'Blog Post Published',
                  message: `"${payload.new.title || 'Blog Post'}" has been published`,
                  data: payload.new
                });
              }
            } catch (error) {
              console.error('Error processing blog post publish notification:', error);
            }
          }
        )
        .subscribe();

      // Subscribe to success stories
      const successStoriesChannel = supabase
        .channel('success_stories')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'success_stories' },
          (payload) => {
            try {
              addNotification('success_story', {
                title: 'New Success Story Added',
                message: `Success story "${payload.new.title || 'New Story'}" has been added`,
                data: payload.new
              });
            } catch (error) {
              console.error('Error processing success story notification:', error);
            }
          }
        )
        .subscribe();

      // Subscribe to videos
      const videosChannel = supabase
        .channel('videos')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'videos' },
          (payload) => {
            try {
              if (payload.new.published) {
                addNotification('video', {
                  title: 'New Video Published',
                  message: `Video "${payload.new.title || 'New Video'}" has been published`,
                  data: payload.new
                });
              }
            } catch (error) {
              console.error('Error processing video notification:', error);
            }
          }
        )
        .subscribe();

      // Subscribe to documents
      const documentsChannel = supabase
        .channel('documents')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'documents' },
          (payload) => {
            try {
              addNotification('document', {
                title: 'New Document Added',
                message: `Document "${payload.new.title || 'New Document'}" has been added`,
                data: payload.new
              });
            } catch (error) {
              console.error('Error processing document notification:', error);
            }
          }
        )
        .subscribe();

      channels.push(
        contactChannel, 
        quoteChannel, 
        mpesaChannel, 
        invoiceChannel, 
        customerChannel, 
        projectChannel, 
        blogChannel, 
        successStoriesChannel, 
        videosChannel, 
        documentsChannel
      );

      setLoading(false);
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      setLoading(false);
    }

    return () => {
      try {
        channels.forEach(channel => supabase.removeChannel(channel));
      } catch (error) {
        console.error('Error cleaning up subscriptions:', error);
      }
    };
  }, []);

  const addNotification = (type, { title, message, data }) => {
    console.log('Adding notification:', { type, title, message });
    const newNotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      data
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50);
      console.log('Updated notifications:', updated.length);
      return updated;
    });
  };

  const getNotificationIcon = (type) => {
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
      document: Settings
    };
    
    const IconComponent = iconMap[type] || AlertCircle;
    return <IconComponent className="w-5 h-5" />;
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      contact_submission: 'bg-blue-100 text-blue-600',
      quote: 'bg-purple-100 text-purple-600',
      mpesa_transaction: 'bg-green-100 text-green-600',
      invoice: 'bg-orange-100 text-orange-600',
      customer: 'bg-indigo-100 text-indigo-600',
      project: 'bg-yellow-100 text-yellow-600',
      blog_post: 'bg-gray-100 text-gray-600',
      success_story: 'bg-emerald-100 text-emerald-600',
      video: 'bg-red-100 text-red-600',
      document: 'bg-cyan-100 text-cyan-600'
    };
    
    return colorMap[type] || 'bg-gray-100 text-gray-600';
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Test function to manually add a notification (remove in production)
  const testNotification = () => {
    addNotification('invoice', {
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working',
      data: { test: true }
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const timestampDate = new Date(timestamp);
    const diff = now.getTime() - timestampDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Filter buttons */}
            <div className="flex space-x-2 mt-3">
              {['all', 'unread', 'read'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-3 py-1 text-sm rounded-full capitalize ${
                    filter === filterOption
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {filterOption}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Mark all as read
              </button>
            )}

            {/* Test button - remove in production */}
            <button
              onClick={testNotification}
              className="mt-2 text-sm text-green-600 hover:text-green-700 bg-green-50 px-2 py-1 rounded"
            >
              Test Notification
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {loading ? 'Loading notifications...' : 'No notifications found'}
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Delete notification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        {formatTimeAgo(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;