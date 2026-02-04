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
  Calendar,
  ArrowUpRight,
  Database,
  BarChart4,
  ShoppingBag
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
  AreaChart,
  Area,
} from "recharts";

// --- Types ---
interface LifetimeStats {
  totalVisitors: number;
  totalSessions: number;
  totalPageViews: number;
}

interface PeriodStats {
  visitors: number;
  pageViews: number;
  sessions: number;
  avgDuration: number;
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

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const AnalyticsDashboard: React.FC = () => {
  const [lifetimeData, setLifetimeData] = useState<LifetimeStats | null>(null);
  const [periodData, setPeriodData] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  // --- Fetch Logic ---

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);

      // 1. Fetch Lifetime Stats (Cumulative)
      const { count: totalVisitors } = await supabase
        .from("visitor_sessions")
        .select("visitor_id", { count: "exact", head: true }); // Approximate unique visitors via sessions is tricky without distinct, using session count as proxy or fetching all IDs. 
      // Better: Select distinct visitor_id if possible, or distinct on client side for smaller datasets. 
      // For scalability, we'll assume filtered unique visitors. 
      // Let's grab raw counts for simple lifetime metrics.

      const { count: totalSessions } = await supabase
        .from("visitor_sessions")
        .select("*", { count: "exact", head: true });

      const { count: totalPageViews } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true });

      // We really want unique visitors count. doing a distinct count is expensive on large tables without RPC. 
      // For now, we will do a rough estimate or fetch distinct visitor_ids for accurate count if dataset is small.
      // Let's improve this by actually fetching distinct visitor_ids in a performant way if we can't trust simple counts.
      // Optimization: We will just set it based on sessions for now or use the stats from the period fetch if range is "all".
      // Actually, we can fetch all visitor_ids only (lightweight) to count unique.
      const { data: allVisitorIds } = await supabase
        .from("visitor_sessions")
        .select("visitor_id");

      const realTotalVisitors = new Set(allVisitorIds?.map(v => v.visitor_id)).size;

      setLifetimeData({
        totalVisitors: realTotalVisitors || 0,
        totalSessions: totalSessions || 0,
        totalPageViews: totalPageViews || 0,
      });

      // 2. Fetch Period Stats
      const stats = await fetchPeriodStats(dateRange);
      setPeriodData(stats);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPeriodStats = async (range: string): Promise<PeriodStats> => {
    const endDate = new Date();
    const startDate = new Date();
    let isAllTime = false;

    switch (range) {
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
      case "year":
        startDate.setFullYear(endDate.getFullYear(), 0, 1); // Start of this year
        break;
      case "all":
        isAllTime = true;
        startDate.setFullYear(2020); // Arbitrary past date
        break;
    }

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Queries
    let sessionsQuery = supabase.from("visitor_sessions").select("*");
    let pageViewsQuery = supabase.from("page_views").select("*");
    let interactionsQuery = supabase.from("product_interactions").select("*");

    if (!isAllTime) {
      sessionsQuery = sessionsQuery.gte("session_start", startDateStr).lte("session_start", endDateStr);
      pageViewsQuery = pageViewsQuery.gte("timestamp", startDateStr).lte("timestamp", endDateStr);
      interactionsQuery = interactionsQuery.gte("timestamp", startDateStr).lte("timestamp", endDateStr);
    }

    const [sessionsRes, pageViewsRes, interactionsRes] = await Promise.all([
      sessionsQuery,
      pageViewsQuery,
      interactionsQuery
    ]);

    const sessions = sessionsRes.data || [];
    const pageViews = pageViewsRes.data || [];
    const interactions = interactionsRes.data || [];

    return processPeriodData(sessions, pageViews, interactions, range);
  };

  const processPeriodData = (sessions: any[], pageViews: any[], interactions: any[], range: string): PeriodStats => {
    const uniqueVisitors = new Set(sessions.map(s => s.visitor_id)).size;
    const totalSessions = sessions.length;
    const totalPageViews = pageViews.length;

    // Avg Duration
    const validSessions = sessions.filter(s => s.total_duration > 0);
    const avgDuration = validSessions.length > 0
      ? validSessions.reduce((acc, s) => acc + s.total_duration, 0) / validSessions.length
      : 0;

    // Bounce Rate
    const sessionPageCounts: Record<string, number> = {};
    pageViews.forEach(pv => {
      sessionPageCounts[pv.session_id] = (sessionPageCounts[pv.session_id] || 0) + 1;
    });
    const bounces = Object.values(sessionPageCounts).filter(c => c === 1).length;
    const bounceRate = Object.keys(sessionPageCounts).length > 0
      ? (bounces / Object.keys(sessionPageCounts).length) * 100
      : 0;

    // Pages
    const pageGroups: Record<string, any> = {};
    pageViews.forEach(pv => {
      if (!pageGroups[pv.page_path]) {
        pageGroups[pv.page_path] = {
          path: pv.page_path,
          title: pv.page_title || pv.page_path,
          views: 0,
          visitors: new Set(),
          timeForAvg: []
        };
      }
      pageGroups[pv.page_path].views++;
      pageGroups[pv.page_path].visitors.add(pv.visitor_id);
      if (pv.time_spent) pageGroups[pv.page_path].timeForAvg.push(pv.time_spent);
    });

    const topPages = Object.values(pageGroups).map(Group => ({
      page_path: Group.path,
      page_title: Group.title,
      total_views: Group.views,
      unique_visitors: Group.visitors.size,
      avg_time_spent: Group.timeForAvg.length > 0
        ? Group.timeForAvg.reduce((a: number, b: number) => a + b, 0) / Group.timeForAvg.length
        : 0
    })).sort((a, b) => b.total_views - a.total_views).slice(0, 10);

    // Products
    const prodGroups: Record<string, any> = {};
    interactions.forEach(int => {
      if (!prodGroups[int.product_name]) {
        prodGroups[int.product_name] = { name: int.product_name, count: 0, visitors: new Set(), type: int.interaction_type };
      }
      prodGroups[int.product_name].count++;
      prodGroups[int.product_name].visitors.add(int.visitor_id);
    });

    const topProducts = Object.values(prodGroups).map(g => ({
      product_name: g.name,
      interaction_count: g.count,
      interaction_type: g.type,
      unique_visitors: g.visitors.size
    })).sort((a, b) => b.interaction_count - a.interaction_count).slice(0, 10);

    // Daily Activity (Dynamic grouping based on range could be implemented, defaulting to daily)
    const dailyMap: Record<string, { date: string, visitors: Set<string>, page_views: number, sessions: number }> = {};

    // Initialize last N days to 0
    const daysToMap = range === '1d' ? 1
      : range === '7d' ? 7
        : range === '30d' ? 30
          : range === '90d' ? 90
            : 12; // default for year/all

    // Only fill zeros for fixed ranges
    if (['1d', '7d', '30d', '90d'].includes(range)) {
      for (let i = 0; i < daysToMap; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        dailyMap[dStr] = { date: dStr, visitors: new Set(), page_views: 0, sessions: 0 };
      }
    }

    sessions.forEach(s => {
      const dStr = s.session_start.split('T')[0];
      if (!dailyMap[dStr]) dailyMap[dStr] = { date: dStr, visitors: new Set(), page_views: 0, sessions: 0 };
      dailyMap[dStr].sessions++;
      dailyMap[dStr].visitors.add(s.visitor_id);
    });

    pageViews.forEach(pv => {
      const dStr = pv.timestamp.split('T')[0];
      if (!dailyMap[dStr]) dailyMap[dStr] = { date: dStr, visitors: new Set(), page_views: 0, sessions: 0 };
      dailyMap[dStr].page_views++;
    });

    const dailyActivity = Object.values(dailyMap)
      .map(d => ({ ...d, visitors: d.visitors.size }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Hourly
    const hourlyGroups = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      page_views: 0,
      sessions: 0
    }));
    // Populate hourly... (simplified for brevity, can enable if needed)

    // Devices
    const devMap: Record<string, Set<string>> = {};
    sessions.forEach(s => {
      const type = s.device_type || 'Unknown';
      if (!devMap[type]) devMap[type] = new Set();
      devMap[type].add(s.id); // Counting sessions
    });
    const deviceBreakdown = Object.entries(devMap).map(([type, set]) => ({
      device_type: type,
      total_sessions: set.size,
      unique_visitors: 0 // placeholder
    }));

    // Browsers
    const browserMap: Record<string, number> = {};
    sessions.forEach(s => {
      const b = s.browser || 'Unknown';
      browserMap[b] = (browserMap[b] || 0) + 1;
    });
    const browserStats = Object.entries(browserMap).map(([b, c]) => ({
      browser: b,
      sessions: c,
      percentage: Math.round((c / totalSessions) * 100)
    }));

    return {
      visitors: uniqueVisitors,
      pageViews: totalPageViews,
      sessions: totalSessions,
      avgDuration,
      bounceRate,
      topPages,
      topProducts,
      deviceBreakdown,
      hourlyActivity: hourlyGroups,
      dailyActivity,
      browserStats
    };
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // --- Render ---

  if (loading && !lifetimeData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCw className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-[1600px] mx-auto bg-slate-50/50 dark:bg-slate-950/50 min-h-screen">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Comprehensive overview of system performance and user engagement.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchAnalytics} disabled={refreshing} variant="outline" className="shadow-sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Lifetime Stats - "Cumulative even after year" */}
      {lifetimeData && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Lifetime Performance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-indigo-100 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Total Unique Visitors
                </CardDescription>
                <CardTitle className="text-4xl font-bold">{lifetimeData.totalVisitors.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-indigo-100 bg-white/10 inline-block px-2 py-1 rounded-full">
                  All-time cumulative
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-emerald-100 flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Total Page Views
                </CardDescription>
                <CardTitle className="text-4xl font-bold">{lifetimeData.totalPageViews.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-emerald-100 bg-white/10 inline-block px-2 py-1 rounded-full">
                  All-time cumulative
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-none shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-blue-100 flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Total Sessions
                </CardDescription>
                <CardTitle className="text-4xl font-bold">{lifetimeData.totalSessions.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-blue-100 bg-white/10 inline-block px-2 py-1 rounded-full">
                  All-time cumulative
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="border-t border-border/50 my-8"></div>

      {/* Period Analysis Section */}
      {periodData && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Period Analysis</h2>
            </div>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="year">Running This Year</SelectItem>
                <SelectItem value="all">All Time History</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Period Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{periodData.visitors.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">In selected period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Page Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{periodData.pageViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">In selected period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.floor(periodData.avgDuration / 60)}m {Math.round(periodData.avgDuration % 60)}s</div>
                <p className="text-xs text-muted-foreground mt-1">Per session</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{periodData.bounceRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Single page sessions</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Traffic Trends</CardTitle>
              <CardDescription>Visualizing visitors and page views over the selected range.</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={periodData.dailyActivity} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={(str) => {
                    const d = new Date(str);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }} />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="page_views" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPv)" name="Page Views" strokeWidth={2} />
                  <Area type="monotone" dataKey="visitors" stroke="#10b981" fillOpacity={1} fill="url(#colorUv)" name="Visitors" strokeWidth={2} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Tabs */}
          <Tabs defaultValue="pages" className="w-full">
            <TabsList className="w-full justify-start bg-muted/50 p-1 mb-4 rounded-xl">
              <TabsTrigger value="pages" className="rounded-lg px-6">Top Pages</TabsTrigger>
              <TabsTrigger value="products" className="rounded-lg px-6">Products Interactions</TabsTrigger>
              <TabsTrigger value="tech" className="rounded-lg px-6">Technographics</TabsTrigger>
            </TabsList>

            <TabsContent value="pages">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ArrowUpRight className="h-5 w-5" /> Most Visited Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {periodData.topPages.map((page, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                          <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center font-bold text-sm border shadow-sm text-muted-foreground">{i + 1}</div>
                          <div>
                            <div className="font-semibold text-foreground">{page.page_title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> {page.page_path}</div>
                          </div>
                        </div>
                        <div className="flex gap-6 text-right">
                          <div className="bg-background px-3 py-1 rounded shadow-sm border">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Views</div>
                            <div className="font-bold text-lg">{page.total_views}</div>
                          </div>
                          <div className="bg-background px-3 py-1 rounded shadow-sm border">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Avg Time</div>
                            <div className="font-bold text-lg">{Math.round(page.avg_time_spent)}s</div>
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
                  <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Product Interest</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {periodData.topProducts.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">No product interactions recorded in this period.</div>
                    ) : periodData.topProducts.map((prod, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/30 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{i + 1}</div>
                          <div className="font-semibold">{prod.product_name}</div>
                        </div>
                        <div className="mt-2 sm:mt-0">
                          <Badge variant="secondary" className="text-sm py-1 px-3">
                            {prod.interaction_count} Interactions
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tech">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Device Breakdown</CardTitle></CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={periodData.deviceBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="total_sessions">
                          {periodData.deviceBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Browser Usage</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {periodData.browserStats.map((b, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span>{b.browser}</span>
                          </div>
                          <div className="flex items-center gap-4 flex-1 max-w-[200px] ml-4">
                            <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${b.percentage}%` }}></div>
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{b.percentage}%</span>
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
      )}
    </div>
  );
};

export default AnalyticsDashboard;
