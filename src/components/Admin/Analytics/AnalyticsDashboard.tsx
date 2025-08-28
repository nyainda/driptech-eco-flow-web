import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Eye, 
  Clock, 
  TrendingUp, 
  RefreshCw, 
  Monitor, 
  Smartphone, 
  Tablet,
  MousePointer
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  totalVisitors: number;
  totalPageViews: number;
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{
    page_path: string;
    page_title: string;
    total_views: number;
    unique_visitors: number;
    avg_time_spent: number;
  }>;
  topProducts: Array<{
    product_name: string;
    interaction_count: number;
    interaction_type: string;
    unique_visitors: number;
  }>;
  deviceBreakdown: Array<{
    device_type: string;
    total_sessions: number;
    unique_visitors: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    page_views: number;
    sessions: number;
  }>;
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // For now, provide demo data since visitor tracking tables are being set up
      console.log('Fetching analytics for date range:', startDateStr, 'to', endDateStr);
      
      // Demo analytics data to show the dashboard structure
      const demoData: AnalyticsData = {
        totalVisitors: Math.floor(Math.random() * 1000) + 500,
        totalPageViews: Math.floor(Math.random() * 5000) + 2000,
        totalSessions: Math.floor(Math.random() * 800) + 400,
        averageSessionDuration: Math.floor(Math.random() * 300) + 120,
        bounceRate: Math.random() * 40 + 30,
        topPages: [
          { page_path: '/', page_title: 'Home', total_views: 250, unique_visitors: 180, avg_time_spent: 145 },
          { page_path: '/products', page_title: 'Products', total_views: 180, unique_visitors: 120, avg_time_spent: 200 },
          { page_path: '/about', page_title: 'About Us', total_views: 120, unique_visitors: 85, avg_time_spent: 95 },
          { page_path: '/contact', page_title: 'Contact', total_views: 95, unique_visitors: 70, avg_time_spent: 180 },
          { page_path: '/services', page_title: 'Services', total_views: 75, unique_visitors: 55, avg_time_spent: 165 }
        ],
        topProducts: [
          { product_name: 'Drip Irrigation Kit', interaction_count: 45, interaction_type: 'view', unique_visitors: 32 },
          { product_name: 'Smart Controller', interaction_count: 38, interaction_type: 'click', unique_visitors: 28 },
          { product_name: 'Pressure Filter', interaction_count: 32, interaction_type: 'view', unique_visitors: 24 },
          { product_name: 'Emitter Lines', interaction_count: 28, interaction_type: 'hover', unique_visitors: 20 }
        ],
        deviceBreakdown: [
          { device_type: 'Desktop', total_sessions: Math.floor(Math.random() * 300) + 200, unique_visitors: Math.floor(Math.random() * 250) + 150 },
          { device_type: 'Mobile', total_sessions: Math.floor(Math.random() * 200) + 100, unique_visitors: Math.floor(Math.random() * 150) + 80 },
          { device_type: 'Tablet', total_sessions: Math.floor(Math.random() * 100) + 50, unique_visitors: Math.floor(Math.random() * 80) + 40 }
        ],
        hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          page_views: Math.floor(Math.random() * 50) + (hour >= 8 && hour <= 18 ? 20 : 5),
          sessions: Math.floor(Math.random() * 30) + (hour >= 8 && hour <= 18 ? 10 : 2)
        }))
      };

      setData(demoData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set default empty state
      setData({
        totalVisitors: 0,
        totalPageViews: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        bounceRate: 0,
        topPages: [],
        topProducts: [],
        deviceBreakdown: [
          { device_type: 'Desktop', total_sessions: 0, unique_visitors: 0 },
          { device_type: 'Mobile', total_sessions: 0, unique_visitors: 0 },
          { device_type: 'Tablet', total_sessions: 0, unique_visitors: 0 }
        ],
        hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          page_views: 0,
          sessions: 0
        }))
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Website Analytics</h2>
          <p className="text-muted-foreground">Comprehensive visitor tracking and insights</p>
        </div>
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
          <Button 
            onClick={fetchAnalytics} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalPageViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalSessions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(data?.averageSessionDuration || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.bounceRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Activity</CardTitle>
                <CardDescription>Page views and sessions by hour</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.hourlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="page_views" stroke="hsl(var(--primary))" name="Page Views" />
                    <Line type="monotone" dataKey="sessions" stroke="hsl(var(--secondary))" name="Sessions" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>Sessions by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data?.deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ device_type, percent }) => `${device_type} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total_sessions"
                    >
                      {data?.deviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most visited pages during the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topPages.map((page, index) => (
                  <div key={page.page_path} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{page.page_title}</h3>
                      <p className="text-sm text-muted-foreground">{page.page_path}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{page.total_views}</div>
                        <div className="text-muted-foreground">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{page.unique_visitors}</div>
                        <div className="text-muted-foreground">Visitors</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{formatDuration(page.avg_time_spent)}</div>
                        <div className="text-muted-foreground">Avg. Time</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Interactions</CardTitle>
              <CardDescription>Most interacted products and interaction types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topProducts.map((product, index) => (
                  <div key={`${product.product_name}-${product.interaction_type}`} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{product.product_name}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {product.interaction_type}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{product.interaction_count}</div>
                        <div className="text-muted-foreground">Interactions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{product.unique_visitors}</div>
                        <div className="text-muted-foreground">Visitors</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Device Analytics</CardTitle>
              <CardDescription>Detailed breakdown by device type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.deviceBreakdown.map((device, index) => (
                  <div key={device.device_type} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(device.device_type)}
                      <h3 className="font-medium">{device.device_type}</h3>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{device.total_sessions}</div>
                        <div className="text-muted-foreground">Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{device.unique_visitors}</div>
                        <div className="text-muted-foreground">Visitors</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;