
import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Users, FileText, ShoppingCart, Calendar, Mail, Settings } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';

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
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Real-time subscription setup
  useEffect(() => {
    const channels: any[] = [];
    
    console.log('Setting up notification subscriptions...');

    try {
      // Subscribe to contact submissions
      const contactChannel = supabase
        .channel('contact_submissions_notifications')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'contact_submissions' },
          (payload) => {
            console.log('Contact submission received:', payload);
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
        .subscribe((status) => {
          console.log('Contact subscription status:', status);
        });

      // Subscribe to quotes
      const quoteChannel = supabase
        .channel('quotes_notifications')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'quotes' },
          (payload) => {
            console.log('Quote created:', payload);
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
        .subscribe((status) => {
          console.log('Quote subscription status:', status);
        });

      // Subscribe to M-Pesa transactions
      const mpesaChannel = supabase
        .channel('mpesa_notifications')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'mpesa_transactions' },
          (payload) => {
            console.log('M-Pesa transaction received:', payload);
            try {
              const amount = payload.new.amount || 0;
              addNotification('mpesa_transaction', {
                title: 'Payment Received',
                message: `M-Pesa payment of KES ${amount.toLocaleString()} received from ${payload.new.phone_number}`,
                data: payload.new
              });
            } catch (error) {
              console.error('Error processing M-Pesa transaction notification:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log('M-Pesa subscription status:', status);
        });

      // Subscribe to invoices
      const invoiceChannel = supabase
        .channel('invoice_notifications')
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
        .subscribe((status) => {
          console.log('Invoice subscription status:', status);
        });

      // Subscribe to customers
      const customerChannel = supabase
        .channel('customer_notifications')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'customers' },
          (payload) => {
            console.log('Customer created:', payload);
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
        .subscribe((status) => {
          console.log('Customer subscription status:', status);
        });

      // Subscribe to projects
      const projectChannel = supabase
        .channel('project_notifications')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'projects' },
          (payload) => {
            console.log('Project created:', payload);
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
        .subscribe((status) => {
          console.log('Project subscription status:', status);
        });

      channels.push(
        contactChannel, 
        quoteChannel, 
        mpesaChannel, 
        invoiceChannel, 
        customerChannel, 
        projectChannel
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

  const addNotification = (type: string, { title, message, data }: { title: string; message: string; data?: any }) => {
    console.log('Adding notification:', { type, title, message });
    const newNotification: Notification = {
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
      
      // Show toast notification
      toast({
        title: title,
        description: message,
      });
      
      return updated;
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
      document: Settings
    };
    
    const IconComponent = iconMap[type as keyof typeof iconMap] || AlertCircle;
    return <IconComponent className="w-5 h-5" />;
  };

  const getNotificationColor = (type: string) => {
    const colorMap = {
      contact_submission: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
      quote: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
      mpesa_transaction: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
      invoice: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
      customer: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
      project: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
      blog_post: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
      success_story: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300',
      video: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
      document: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300'
    };
    
    return colorMap[type as keyof typeof colorMap] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Test function to manually add a notification
  const testNotification = () => {
    addNotification('contact_submission', {
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

  const formatTimeAgo = (timestamp: Date) => {
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
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {filterOption}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Mark all as read
              </button>
            )}

            {/* Test button */}
            <button
              onClick={testNotification}
              className="mt-2 ml-4 text-sm text-green-600 hover:text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900 px-2 py-1 rounded"
            >
              Test Notification
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {loading ? 'Loading notifications...' : 'No notifications found'}
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Delete notification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
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
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
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
