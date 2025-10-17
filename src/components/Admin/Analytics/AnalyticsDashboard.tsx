import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Eye,
  Clock,
  TrendingUp,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  MousePointer,
  Activity,
  Globe,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

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
  dailyActivity: Array<{
    date: string;
    visitors: number;
    page_views: number;
    sessions: number;
  }>;
  browserStats: Array<{
    browser: string;
    sessions: number;
    percentage: number;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7d");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);

      const endDate = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case "1d":
          startDate.setDate(endDate.getDate() - 1);
          break;
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // Fetch visitor sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("visitor_sessions")
        .select("*")
        .gte("session_start", startDateStr)
        .lte("session_start", endDateStr);

      if (sessionsError) {
        console.error("Error fetching sessions:", sessionsError);
      }

      // Fetch page views
      const { data: pageViews, error: pageViewsError } = await supabase
        .from("page_views")
        .select("*")
        .gte("timestamp", startDateStr)
        .lte("timestamp", endDateStr);

      if (pageViewsError) {
        console.error("Error fetching page views:", pageViewsError);
      }

      // Fetch product interactions
      const { data: interactions, error: interactionsError } = await supabase
        .from("product_interactions")
        .select("*")
        .gte("timestamp", startDateStr)
        .lte("timestamp", endDateStr);

      if (interactionsError) {
        console.error("Error fetching interactions:", interactionsError);
      }

      // Process real data
      const processedData = processAnalyticsData(
        sessions || [],
        pageViews || [],
        interactions || [],
      );
      setData(processedData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processAnalyticsData = (
    sessions: any[],
    pageViews: any[],
    interactions: any[],
  ): AnalyticsData => {
    // Calculate basic metrics
    const totalVisitors = new Set(sessions.map((s) => s.visitor_id)).size;
    const totalPageViews = pageViews.length;
    const totalSessions = sessions.length;

    // Calculate average session duration
    // Since session_end isn't always captured, calculate from current time or use stored duration
    const validSessions = sessions.filter(
      (s) => s.total_duration && s.total_duration > 0,
    );
    let averageSessionDuration = 0;

    if (validSessions.length > 0) {
      averageSessionDuration =
        validSessions.reduce((sum, s) => sum + (s.total_duration || 0), 0) /
        validSessions.length;
    } else {
      // Fallback: Calculate duration from session_start to now for active sessions
      const now = new Date();
      const activeSessions = sessions
        .filter((s) => !s.session_end)
        .slice(0, 50); // Limit to avoid skewing
      if (activeSessions.length > 0) {
        averageSessionDuration =
          activeSessions.reduce((sum, s) => {
            const start = new Date(s.session_start);
            const duration = Math.floor(
              (now.getTime() - start.getTime()) / 1000,
            );
            return sum + (duration > 0 && duration < 3600 ? duration : 0); // Cap at 1 hour
          }, 0) / activeSessions.length;
      }
    }

    // Calculate bounce rate (sessions with only 1 page view)
    const sessionPageViewCounts = sessions.map(
      (s) => pageViews.filter((pv) => pv.session_id === s.id).length,
    );
    const bounceRate =
      sessionPageViewCounts.length > 0
        ? (sessionPageViewCounts.filter((count) => count <= 1).length /
            sessionPageViewCounts.length) *
          100
        : 0;

    // Process top pages
    const pageGroups = pageViews.reduce((acc, pv) => {
      if (!acc[pv.page_path]) {
        acc[pv.page_path] = {
          page_path: pv.page_path,
          page_title: pv.page_title || pv.page_path,
          views: [],
          visitors: new Set(),
        };
      }
      acc[pv.page_path].views.push(pv);
      acc[pv.page_path].visitors.add(pv.visitor_id);
      return acc;
    }, {});

    const topPages = Object.values(pageGroups)
      .map((group: any) => ({
        page_path: group.page_path,
        page_title: group.page_title,
        total_views: group.views.length,
        unique_visitors: group.visitors.size,
        avg_time_spent:
          group.views.reduce((sum, v) => sum + (v.time_spent || 0), 0) /
            group.views.length || 0,
      }))
      .sort((a, b) => b.total_views - a.total_views)
      .slice(0, 10);

    // Process product interactions
    const productGroups = interactions.reduce((acc, interaction) => {
      if (!acc[interaction.product_name]) {
        acc[interaction.product_name] = {
          product_name: interaction.product_name,
          interactions: [],
          visitors: new Set(),
        };
      }
      acc[interaction.product_name].interactions.push(interaction);
      acc[interaction.product_name].visitors.add(interaction.visitor_id);
      return acc;
    }, {});

    const topProducts = Object.values(productGroups)
      .map((group: any) => ({
        product_name: group.product_name,
        interaction_count: group.interactions.length,
        interaction_type: "mixed",
        unique_visitors: group.visitors.size,
      }))
      .sort((a, b) => b.interaction_count - a.interaction_count)
      .slice(0, 10);

    // Device breakdown
    const deviceGroups = sessions.reduce((acc, session) => {
      const deviceType = session.device_type || "Unknown";
      if (!acc[deviceType]) {
        acc[deviceType] = {
          device_type: deviceType,
          sessions: [],
          visitors: new Set(),
        };
      }
      acc[deviceType].sessions.push(session);
      acc[deviceType].visitors.add(session.visitor_id);
      return acc;
    }, {});

    const deviceBreakdown = Object.values(deviceGroups).map((group: any) => ({
      device_type: group.device_type,
      total_sessions: group.sessions.length,
      unique_visitors: group.visitors.size,
    }));

    // Browser stats
    const browserGroups = sessions.reduce((acc, session) => {
      const browser = session.browser || "Unknown";
      if (!acc[browser]) {
        acc[browser] = 0;
      }
      acc[browser]++;
      return acc;
    }, {});

    const browserStats = Object.entries(browserGroups).map(
      ([browser, count]: [string, any]) => ({
        browser,
        sessions: count,
        percentage: Math.round((count / totalSessions) * 100),
      }),
    );

    // Hourly activity
    const hourlyGroups = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      page_views: pageViews.filter(
        (pv) => new Date(pv.timestamp).getHours() === hour,
      ).length,
      sessions: sessions.filter(
        (s) => new Date(s.session_start).getHours() === hour,
      ).length,
    }));

    // Daily activity
    const dailyGroups: {
      [date: string]: {
        date: string;
        visitors: number;
        page_views: number;
        sessions: number;
      };
    } = {};
    const dateRange = 7; // Last 7 days
    for (let i = 0; i < dateRange; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      dailyGroups[dateStr] = {
        date: dateStr,
        visitors: new Set(
          sessions
            .filter((s) => s.session_start.split("T")[0] === dateStr)
            .map((s) => s.visitor_id),
        ).size,
        page_views: pageViews.filter(
          (pv) => pv.timestamp.split("T")[0] === dateStr,
        ).length,
        sessions: sessions.filter(
          (s) => s.session_start.split("T")[0] === dateStr,
        ).length,
      };
    }

    const dailyActivity: {
      date: string;
      visitors: number;
      page_views: number;
      sessions: number;
    }[] = Object.values(dailyGroups).reverse();

    return {
      totalVisitors,
      totalPageViews,
      totalSessions,
      averageSessionDuration: Math.round(averageSessionDuration),
      bounceRate: Math.round(bounceRate * 100) / 100,
      topPages,
      topProducts,
      deviceBreakdown,
      hourlyActivity: hourlyGroups,
      dailyActivity,
      browserStats,
    };
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-6 sm:p-8 w-full max-w-2xl mx-auto">
        <div className="text-center space-y-4">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">No Analytics Data Yet</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Start browsing your website to see analytics data here. Page
              views, sessions, and visitor data will appear once users visit
              your site.
            </p>
          </div>
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Website Analytics</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Real-time visitor tracking and insights
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-32">
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
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Visitors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.totalVisitors.toLocaleString()}
            </div>
            <Badge variant="secondary" className="mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Unique visitors
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.totalPageViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((data.totalPageViews / data.totalVisitors) * 10) / 10}{" "}
              avg per visitor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.totalSessions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((data.totalSessions / data.totalVisitors) * 10) / 10}{" "}
              avg per visitor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {Math.floor(data.averageSessionDuration / 60)}m{" "}
              {data.averageSessionDuration % 60}s
            </div>
            <p className="text-xs text-muted-foreground">Session duration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.bounceRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Single page sessions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap justify-start">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">
            Overview
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex-1 sm:flex-none">
            Top Pages
          </TabsTrigger>
          <TabsTrigger value="products" className="flex-1 sm:flex-none">
            Products
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex-1 sm:flex-none">
            Devices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Daily Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
                <CardDescription>
                  Visitors and page views over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="visitors"
                      stroke="#8884d8"
                      name="Visitors"
                    />
                    <Line
                      type="monotone"
                      dataKey="page_views"
                      stroke="#82ca9d"
                      name="Page Views"
                    />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#ffc658"
                      name="Sessions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Hourly Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Hourly Activity</CardTitle>
                <CardDescription>
                  Activity patterns throughout the day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.hourlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(value) => `${value}:00`}
                    />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => `${value}:00`} />
                    <Legend />
                    <Bar
                      dataKey="page_views"
                      fill="#8884d8"
                      name="Page Views"
                    />
                    <Bar dataKey="sessions" fill="#82ca9d" name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>
                Most visited pages and their performance
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="space-y-4 min-w-[600px] sm:min-w-0">
                {data.topPages.map((page, index) => (
                  <div
                    key={page.page_path}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <h3 className="font-medium text-sm sm:text-base">
                          {page.page_title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {page.page_path}
                      </p>
                    </div>
                    <div className="text-right space-y-1 mt-2 sm:mt-0">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {page.total_views}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Views
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {page.unique_visitors}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Visitors
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {Math.round(page.avg_time_spent)}s
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avg Time
                          </div>
                        </div>
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
              {data.topProducts.length === 0 && (
                <CardDescription className="text-amber-600">
                  No product interactions tracked yet. Make sure ProductTracker
                  components are implemented on product pages.
                </CardDescription>
              )}
              <CardDescription>Most interacted with products</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="space-y-4 min-w-[600px] sm:min-w-0">
                {data.topProducts.map((product, index) => (
                  <div
                    key={product.product_name}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <h3 className="font-medium text-sm sm:text-base">
                          {product.product_name}
                        </h3>
                        <Badge variant="secondary">
                          <MousePointer className="h-3 w-3 mr-1" />
                          {product.interaction_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right mt-2 sm:mt-0">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {product.interaction_count}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Interactions
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {product.unique_visitors}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Visitors
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
                <CardDescription>Sessions by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ device_type, total_sessions }) =>
                        `${device_type}: ${total_sessions}`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total_sessions"
                    >
                      {data.deviceBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {data.deviceBreakdown.map((device, index) => (
                    <div
                      key={device.device_type}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {device.device_type === "Desktop" && (
                          <Monitor className="h-4 w-4" />
                        )}
                        {device.device_type === "Mobile" && (
                          <Smartphone className="h-4 w-4" />
                        )}
                        {device.device_type === "Tablet" && (
                          <Tablet className="h-4 w-4" />
                        )}
                        <span className="text-sm">{device.device_type}</span>
                      </div>
                      <div className="text-sm">
                        {device.total_sessions} sessions (
                        {device.unique_visitors} visitors)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Browser Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Browser Usage</CardTitle>
                <CardDescription>Sessions by browser type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.browserStats.map((browser, index) => (
                    <div key={browser.browser} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {browser.browser}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {browser.sessions} ({browser.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${browser.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
