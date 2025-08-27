
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Eye, 
  Clock, 
  TrendingUp, 
  Monitor, 
  Smartphone, 
  Tablet,
  Globe,
  MousePointer,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState('7d');
  const [refreshKey, setRefreshKey] = useState(0);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case '1d':
        start.setDate(start.getDate() - 1);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  };

  // Fetch visitor sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['visitor-sessions', dateRange, refreshKey],
    queryFn: async () => {
      const { start, end } = getDateRange();
      const { data, error } = await supabase
        .from('visitor_sessions')
        .select('*')
        .gte('session_start', start)
        .lte('session_start', end)
        .order('session_start', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch page views
  const { data: pageViews, isLoading: pageViewsLoading } = useQuery({
    queryKey: ['page-views', dateRange, refreshKey],
    queryFn: async () => {
      const { start, end } = getDateRange();
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .gte('timestamp', start)
        .lte('timestamp', end)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch product interactions
  const { data: productInteractions, isLoading: productInteractionsLoading } = useQuery({
    queryKey: ['product-interactions', dateRange, refreshKey],
    queryFn: async () => {
      const { start, end } = getDateRange();
      const { data, error } = await supabase
        .from('product_interactions')
        .select('*')
        .gte('timestamp', start)
        .lte('timestamp', end)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const isLoading = sessionsLoading || pageViewsLoading || productInteractionsLoading;

  // Calculate analytics
  const analytics = React.useMemo(() => {
    if (!sessions || !pageViews || !productInteractions) return null;

    const totalSessions = sessions.length;
    const totalPageViews = pageViews.length;
    const uniqueVisitors = new Set(sessions.map(s => s.visitor_id)).size;
    
    const avgSessionDuration = sessions.reduce((acc, session) => {
      return acc + (session.total_duration || 0);
    }, 0) / (totalSessions || 1);

    const bounceRate = sessions.filter(s => s.page_views <= 1).length / (totalSessions || 1) * 100;

    // Device breakdown
    const deviceBreakdown = sessions.reduce((acc, session) => {
      const device = session.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top pages
    const pageStats = pageViews.reduce((acc, pv) => {
      const key = pv.page_path;
      if (!acc[key]) {
        acc[key] = { path: key, title: pv.page_title, views: 0, visitors: new Set() };
      }
      acc[key].views++;
      acc[key].visitors.add(pv.visitor_id);
      return acc;
    }, {} as Record<string, any>);

    const topPages = Object.values(pageStats)
      .map((page: any) => ({
        ...page,
        unique_visitors: page.visitors.size
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Top products
    const productStats = productInteractions.reduce((acc, pi) => {
      const key = pi.product_name;
      if (!acc[key]) {
        acc[key] = { 
          name: key, 
          category: pi.product_category,
          interactions: 0, 
          views: 0, 
          clicks: 0,
          visitors: new Set()
        };
      }
      acc[key].interactions++;
      acc[key].visitors.add(pi.visitor_id);
      if (pi.interaction_type === 'view') acc[key].views++;
      if (pi.interaction_type === 'click') acc[key].clicks++;
      return acc;
    }, {} as Record<string, any>);

    const topProducts = Object.values(productStats)
      .map((product: any) => ({
        ...product,
        unique_visitors: product.visitors.size
      }))
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 10);

    // Hourly activity
    const hourlyActivity = pageViews.reduce((acc, pv) => {
      const hour = new Date(pv.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalSessions,
      totalPageViews,
      uniqueVisitors,
      avgSessionDuration: Math.round(avgSessionDuration),
      bounceRate: Math.round(bounceRate),
      deviceBreakdown,
      topPages,
      topProducts,
      hourlyActivity
    };
  }, [sessions, pageViews, productInteractions]);

  const deviceColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Website Analytics</h2>
          <div className="flex gap-4">
            <div className="w-32 h-10 bg-muted animate-pulse rounded"></div>
            <div className="w-24 h-10 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({length: 4}).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="w-16 h-4 bg-muted animate-pulse rounded"></div>
                  <div className="w-24 h-8 bg-muted animate-pulse rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Website Analytics</h2>
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Visitors</p>
                <p className="text-2xl font-bold">{analytics.uniqueVisitors.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Page Views</p>
                <p className="text-2xl font-bold">{analytics.totalPageViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Session</p>
                <p className="text-2xl font-bold">{Math.floor(analytics.avgSessionDuration / 60)}m {analytics.avgSessionDuration % 60}s</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
                <p className="text-2xl font-bold">{analytics.bounceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Device Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.deviceBreakdown).map(([device, count]) => ({
                      name: device.charAt(0).toUpperCase() + device.slice(1),
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.entries(analytics.deviceBreakdown).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={deviceColors[index % deviceColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Hourly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Array.from({length: 24}, (_, hour) => ({
                  hour: `${hour}:00`,
                  views: analytics.hourlyActivity[hour] || 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPages.map((page, index) => (
                <div key={page.path} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{page.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{page.path}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{page.views} views</Badge>
                    <Badge variant="outline">{page.unique_visitors} visitors</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{product.views} views</Badge>
                    <Badge variant="outline">{product.clicks} clicks</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
