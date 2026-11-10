import React, { useState, useEffect } from "react";
import GSCAnalytics from "./GSCAnalytics";
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
  Activity,
  Globe,
  Calendar,
  ArrowUpRight,
  Database,
  BarChart4,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- Types ---

interface LifetimeStats {
  totalVisitors: number;
  totalSessions: number;
  totalPageViews: number;
}

interface PeriodStats {
  visitors: number;
  lifetimeVisitors: number;
  visitorsOutsidePeriod: number;
  whatsappClicks: number;
  uniqueWhatsappVisitors: number;
  pageViews: number;
  sessions: number;
  avgDuration: number;
  bounceRate: number;
  pagesPerSession: number;
  engagementRate: number;
  newVisitors: number;
  returningVisitors: number;
  peakHour: number;
  peakDay: string;
  avgTimeOnSite: number;
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

const AnalyticsDashboard: React.FC = () => {
  const [lifetimeData, setLifetimeData] =
    useState<LifetimeStats | null>(null);
  const [periodData, setPeriodData] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Auto-update the "seconds ago" counter every second
  useEffect(() => {
    if (!lastUpdated) return;

    const interval = setInterval(() => {
      setSecondsAgo(
        Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Auto-refresh every 90 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 90000);

    return () => clearInterval(interval);
  }, []);

  // --- Fetch Logic ---

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      setFetchError(null);

      // 1. Lifetime Stats — use exact COUNT queries (bypasses row limits)
      const [sessionCountRes, pageViewCountRes] = await Promise.all([
        supabase
          .from("visitor_sessions")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("page_views")
          .select("*", { count: "exact", head: true }),
      ]);

      // Fetch visitor_ids in pages to correctly count unique visitors
      // Supabase REST default is 1000 rows — we page through to get all
      let allSessions: Array<{
        visitor_id: string;
        session_start: string;
      }> = [];

      let pageOffset = 0;
      const PAGE_SIZE = 5000;
      let hasMore = true;

      while (hasMore) {
        const { data: page, error: pageError } = await supabase
          .from("visitor_sessions")
          .select("visitor_id, session_start")
          .order("session_start", { ascending: true })
          .range(pageOffset, pageOffset + PAGE_SIZE - 1);

        if (pageError) {
          throw new Error(
            `Unable to read visitor sessions: ${pageError.message}`
          );
        }

        if (!page || page.length === 0) {
          hasMore = false;
        } else {
          allSessions = allSessions.concat(page);
          pageOffset += PAGE_SIZE;

          if (page.length < PAGE_SIZE) {
            hasMore = false;
          }
        }
      }

      if (sessionCountRes.error) {
        throw new Error(
          `Unable to count sessions: ${sessionCountRes.error.message}`
        );
      }

      if (pageViewCountRes.error) {
        throw new Error(
          `Unable to count page views: ${pageViewCountRes.error.message}`
        );
      }

      const realTotalVisitors = new Set(
        allSessions.map((session) => session.visitor_id)
      ).size;

      const lifetimeStats: LifetimeStats = {
        totalVisitors: realTotalVisitors,
        totalSessions: sessionCountRes.count || 0,
        totalPageViews: pageViewCountRes.count || 0,
      };

      setLifetimeData(lifetimeStats);

      // 2. Period Stats
      const visitorFirstSeen = new Map<string, string>();

      allSessions.forEach((session) => {
        if (!visitorFirstSeen.has(session.visitor_id)) {
          visitorFirstSeen.set(
            session.visitor_id,
            session.session_start
          );
        }
      });

      const stats = await fetchPeriodStats(
        dateRange,
        visitorFirstSeen
      );

      setPeriodData(stats);

      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (error: any) {
      setFetchError(
        error?.message || "Unknown error fetching analytics"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPeriodStats = async (
    range: string,
    visitorFirstSeen: Map<string, string>
  ): Promise<PeriodStats> => {
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
        startDate.setFullYear(endDate.getFullYear(), 0, 1);
        break;

      case "all":
        isAllTime = true;
        break;
    }

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Use paginated fetches — Supabase REST API caps at 1000 rows by default.
    // Without explicit pagination, queries silently truncate and stats look "frozen".
    const fetchAllPages = async (
      table: string,
      dateColumn: string,
      selectCols: string = "*"
    ): Promise<any[]> => {
      const CHUNK = 5000;

      let results: any[] = [];
      let offset = 0;
      let more = true;

      while (more) {
        // A stable order is required when paging.
        // Without it, new inserts can shift rows between offsets
        // and make a refresh miss or double-count data.
        let q = supabase
          .from(table)
          .select(selectCols)
          .order(dateColumn, { ascending: true })
          .order("id", { ascending: true })
          .range(offset, offset + CHUNK - 1);

        if (!isAllTime) {
          q = q
            .gte(dateColumn, startDateStr)
            .lte(dateColumn, endDateStr);
        }

        const { data, error } = await q;

        if (error) {
          throw new Error(
            `Unable to read ${table}: ${error.message}`
          );
        }

        if (!data || data.length === 0) {
          more = false;
        } else {
          results = results.concat(data);
          offset += CHUNK;

          if (data.length < CHUNK) {
            more = false;
          }
        }
      }

      return results;
    };

    const [
      sessions,
      pageViews,
      interactions,
      whatsappClicks,
    ] = await Promise.all([
      fetchAllPages("visitor_sessions", "session_start"),
      fetchAllPages("page_views", "timestamp"),
      fetchAllPages("product_interactions", "timestamp"),
      fetchAllPages("whatsapp_click_events", "clicked_at"),
    ]);

    return processPeriodData(
      sessions,
      pageViews,
      interactions,
      whatsappClicks,
      range,
      visitorFirstSeen
    );
  };

  const processPeriodData = (
    sessions: any[],
    pageViews: any[],
    interactions: any[],
    whatsappClicks: any[],
    range: string,
    visitorFirstSeen: Map<string, string>
  ): PeriodStats => {
    const uniqueVisitors = new Set(
      sessions.map((s) => s.visitor_id)
    ).size;

    const periodVisitorIds = new Set(
      sessions.map((s) => s.visitor_id)
    );

    const lifetimeVisitors = visitorFirstSeen.size;

    const visitorsOutsidePeriod = Array.from(
      visitorFirstSeen.keys()
    ).filter(
      (visitorId) => !periodVisitorIds.has(visitorId)
    ).length;

    const totalSessions = sessions.length;
    const totalPageViews = pageViews.length;

    // Avg Duration
    const validSessions = sessions.filter(
      (s) => s.total_duration > 0
    );

    const avgDuration =
      validSessions.length > 0
        ? validSessions.reduce(
            (acc, s) => acc + s.total_duration,
            0
          ) / validSessions.length
        : 0;

    // Bounce Rate
    const sessionPageCounts: Record<string, number> =
      Object.fromEntries(
        sessions.map((session) => [session.id, 0])
      );

    pageViews.forEach((pv) => {
      sessionPageCounts[pv.session_id] =
        (sessionPageCounts[pv.session_id] || 0) + 1;
    });

    const bounces = Object.values(sessionPageCounts).filter(
      (count) => count <= 1
    ).length;

    const bounceRate =
      totalSessions > 0
        ? (bounces / totalSessions) * 100
        : 0;

    // Pages
    const pageGroups: Record<string, any> = {};

    pageViews.forEach((pv) => {
      if (!pageGroups[pv.page_path]) {
        pageGroups[pv.page_path] = {
          path: pv.page_path,
          title: pv.page_title || pv.page_path,
          views: 0,
          visitors: new Set(),
          timeForAvg: [],
        };
      }

      pageGroups[pv.page_path].views++;

      pageGroups[pv.page_path].visitors.add(
        pv.visitor_id
      );

      if (pv.time_spent) {
        pageGroups[pv.page_path].timeForAvg.push(
          pv.time_spent
        );
      }
    });

    const topPages = Object.values(pageGroups)
      .map((group: any) => ({
        page_path: group.path,
        page_title: group.title,
        total_views: group.views,
        unique_visitors: group.visitors.size,
        avg_time_spent:
          group.timeForAvg.length > 0
            ? group.timeForAvg.reduce(
                (a: number, b: number) => a + b,
                0
              ) / group.timeForAvg.length
            : 0,
      }))
      .sort(
        (a, b) => b.total_views - a.total_views
      )
      .slice(0, 10);

    // Products
    const prodGroups: Record<string, any> = {};

    interactions.forEach((int) => {
      if (!prodGroups[int.product_name]) {
        prodGroups[int.product_name] = {
          name: int.product_name,
          count: 0,
          visitors: new Set(),
          type: int.interaction_type,
        };
      }

      prodGroups[int.product_name].count++;

      prodGroups[int.product_name].visitors.add(
        int.visitor_id
      );
    });

    const topProducts = Object.values(prodGroups)
      .map((group: any) => ({
        product_name: group.name,
        interaction_count: group.count,
        interaction_type: group.type,
        unique_visitors: group.visitors.size,
      }))
      .sort(
        (a, b) =>
          b.interaction_count - a.interaction_count
      )
      .slice(0, 10);

    // Daily Activity
    const dailyMap: Record<
      string,
      {
        date: string;
        visitors: Set<string>;
        page_views: number;
        sessions: number;
      }
    > = {};

    // Initialize last N days to 0
    const daysToMap =
      range === "1d"
        ? 1
        : range === "7d"
        ? 7
        : range === "30d"
        ? 30
        : range === "90d"
        ? 90
        : 12;

    // Only fill zeros for fixed ranges
    if (
      ["1d", "7d", "30d", "90d"].includes(range)
    ) {
      for (let i = 0; i < daysToMap; i++) {
        const d = new Date();

        d.setDate(d.getDate() - i);

        const dStr = d
          .toISOString()
          .split("T")[0];

        dailyMap[dStr] = {
          date: dStr,
          visitors: new Set(),
          page_views: 0,
          sessions: 0,
        };
      }
    }

    sessions.forEach((s) => {
      const dStr = s.session_start.split("T")[0];

      if (!dailyMap[dStr]) {
        dailyMap[dStr] = {
          date: dStr,
          visitors: new Set(),
          page_views: 0,
          sessions: 0,
        };
      }

      dailyMap[dStr].sessions++;
      dailyMap[dStr].visitors.add(s.visitor_id);
    });

    pageViews.forEach((pv) => {
      const dStr = pv.timestamp.split("T")[0];

      if (!dailyMap[dStr]) {
        dailyMap[dStr] = {
          date: dStr,
          visitors: new Set(),
          page_views: 0,
          sessions: 0,
        };
      }

      dailyMap[dStr].page_views++;
    });

    const dailyActivity = Object.values(dailyMap)
      .map((d) => ({
        ...d,
        visitors: d.visitors.size,
      }))
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );

    // Hourly
    const hourlyGroups = Array.from(
      { length: 24 },
      (_, hour) => ({
        hour,
        page_views: 0,
        sessions: 0,
      })
    );

    sessions.forEach((session) => {
      const hour = new Date(
        session.session_start
      ).getHours();

      hourlyGroups[hour].sessions++;
    });

    pageViews.forEach((pageView) => {
      const hour = new Date(
        pageView.timestamp
      ).getHours();

      hourlyGroups[hour].page_views++;
    });

    // Devices
    const devMap: Record<
      string,
      {
        sessions: Set<string>;
        visitors: Set<string>;
      }
    > = {};

    sessions.forEach((s) => {
      const type = s.device_type || "Unknown";

      if (!devMap[type]) {
        devMap[type] = {
          sessions: new Set(),
          visitors: new Set(),
        };
      }

      devMap[type].sessions.add(s.id);
      devMap[type].visitors.add(s.visitor_id);
    });

    const deviceBreakdown = Object.entries(
      devMap
    ).map(([type, values]) => ({
      device_type: type,
      total_sessions: values.sessions.size,
      unique_visitors: values.visitors.size,
    }));

    // Browsers
    const browserMap: Record<string, number> = {};

    sessions.forEach((s) => {
      const browser = s.browser || "Unknown";

      browserMap[browser] =
        (browserMap[browser] || 0) + 1;
    });

    const browserStats = Object.entries(
      browserMap
    ).map(([browser, count]) => ({
      browser,
      sessions: count,
      percentage:
        totalSessions > 0
          ? Math.round(
              (count / totalSessions) * 100
            )
          : 0,
    }));

    // === ENHANCED METRICS ===

    // Pages Per Session
    const pagesPerSession =
      totalSessions > 0
        ? totalPageViews / totalSessions
        : 0;

    // Engagement Rate
    // Sessions with more than 1 page view
    const engagedSessions = Object.values(
      sessionPageCounts
    ).filter((count) => count > 1).length;

    const engagementRate =
      Object.keys(sessionPageCounts).length > 0
        ? (engagedSessions /
            Object.keys(sessionPageCounts).length) *
          100
        : 0;

    // New vs Returning Visitors
    const newVisitorSessions = sessions.filter(
      (session) =>
        session.session_start ===
        visitorFirstSeen.get(session.visitor_id)
    );

    const newVisitors = new Set(
      newVisitorSessions.map(
        (s) => s.visitor_id
      )
    ).size;

    const returningVisitors =
      uniqueVisitors - newVisitors;

    // Peak Activity Hour
    const hourCounts = new Array(24).fill(0);

    sessions.forEach((s) => {
      const hour = new Date(
        s.session_start
      ).getHours();

      hourCounts[hour]++;
    });

    const peakHour = hourCounts.indexOf(
      Math.max(...hourCounts)
    );

    // Peak Day
    const dayMap: Record<string, number> = {};

    sessions.forEach((s) => {
      const dayStr =
        s.session_start.split("T")[0];

      dayMap[dayStr] =
        (dayMap[dayStr] || 0) + 1;
    });

    const peakDay =
      Object.entries(dayMap).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0] || "N/A";

    // Average Time on Site
    const avgTimeOnSite = avgDuration;

    return {
      visitors: uniqueVisitors,
      lifetimeVisitors,
      visitorsOutsidePeriod,

      // WhatsApp metrics
      whatsappClicks: whatsappClicks.length,
      uniqueWhatsappVisitors: new Set(
        whatsappClicks.map(
          (click) => click.visitor_id
        )
      ).size,

      pageViews: totalPageViews,
      sessions: totalSessions,
      avgDuration,
      bounceRate,
      pagesPerSession,
      engagementRate,
      newVisitors,
      returningVisitors,
      peakHour,
      peakDay,
      avgTimeOnSite,
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
  }, [dateRange, refreshTrigger]);

  // --- Render ---

  if (loading && !lifetimeData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCw className="h-12 w-12 animate-spin text-primary" />

        <p className="text-muted-foreground animate-pulse">
          Loading analytics data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-[1600px] mx-auto bg-slate-50/50 dark:bg-slate-950/50 min-h-screen">

      {/* Header Section */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Analytics Dashboard
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-muted-foreground">
              Comprehensive overview of system performance and user engagement.
            </p>

            {lastUpdated && !refreshing && (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />

                Updated{" "}
                {secondsAgo < 5
                  ? "just now"
                  : `${secondsAgo}s ago`}
              </span>
            )}

            {refreshing && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                <RefreshCw className="h-3 w-3 animate-spin" />

                Fetching live data…
              </span>
            )}
          </div>

          {fetchError && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-3 py-1.5">
              Data error: {fetchError} — some figures may be incomplete.
              Check RLS policies or run the analytics migration.
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <Button
            onClick={() =>
              setRefreshTrigger((prev) => prev + 1)
            }
            disabled={refreshing}
            variant="outline"
            className="shadow-sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                refreshing ? "animate-spin" : ""
              }`}
            />

            {refreshing
              ? "Refreshing…"
              : "Refresh Now"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Auto-refreshes every 90 seconds
          </p>
        </div>
      </div>

      {/* Lifetime Stats */}

      {lifetimeData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />

              <h2 className="text-xl font-semibold">
                Lifetime Performance
              </h2>
            </div>

            {lastUpdated && (
              <p className="text-xs text-muted-foreground hidden sm:block">
                Data as of{" "}
                {lastUpdated.toLocaleTimeString(
                  "en-KE",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }
                )}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

            {/* Visitors */}

            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-indigo-100 flex items-center gap-2">
                  <Users className="h-4 w-4" />

                  Total Unique Visitors
                </CardDescription>

                <CardTitle className="text-4xl font-bold">
                  {refreshing ? (
                    <RefreshCw className="h-8 w-8 animate-spin opacity-60" />
                  ) : (
                    lifetimeData.totalVisitors.toLocaleString()
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-1">
                <div className="text-xs text-indigo-100 bg-white/10 inline-block px-2 py-1 rounded-full">
                  Unique browser IDs · all-time
                </div>

                <p className="text-xs text-indigo-200">
                  {lifetimeData.totalSessions > 0 &&
                  lifetimeData.totalVisitors > 0
                    ? `${(
                        lifetimeData.totalSessions /
                        lifetimeData.totalVisitors
                      ).toFixed(
                        1
                      )} sessions per visitor`
                    : "No session data yet"}
                </p>
              </CardContent>
            </Card>

            {/* Page Views */}

            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-emerald-100 flex items-center gap-2">
                  <Eye className="h-4 w-4" />

                  Total Page Views
                </CardDescription>

                <CardTitle className="text-4xl font-bold">
                  {refreshing ? (
                    <RefreshCw className="h-8 w-8 animate-spin opacity-60" />
                  ) : (
                    lifetimeData.totalPageViews.toLocaleString()
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-1">
                <div className="text-xs text-emerald-100 bg-white/10 inline-block px-2 py-1 rounded-full">
                  All pages tracked · all-time
                </div>

                <p className="text-xs text-emerald-200">
                  {lifetimeData.totalSessions > 0
                    ? `${(
                        lifetimeData.totalPageViews /
                        lifetimeData.totalSessions
                      ).toFixed(
                        1
                      )} pages per session`
                    : "No session data yet"}
                </p>
              </CardContent>
            </Card>

            {/* Sessions */}

            <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-none shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-blue-100 flex items-center gap-2">
                  <Activity className="h-4 w-4" />

                  Total Sessions
                </CardDescription>

                <CardTitle className="text-4xl font-bold">
                  {refreshing ? (
                    <RefreshCw className="h-8 w-8 animate-spin opacity-60" />
                  ) : (
                    lifetimeData.totalSessions.toLocaleString()
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-1">
                <div className="text-xs text-blue-100 bg-white/10 inline-block px-2 py-1 rounded-full">
                  Browser sessions · all-time
                </div>

                <p className="text-xs text-blue-200">
                  Exact count · not sampling
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="border-t border-border/50 my-8" />

      {/* Period Analysis */}

      {periodData && (
        <div className="space-y-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />

              <h2 className="text-xl font-semibold">
                Period Analysis
              </h2>
            </div>

            <Select
              value={dateRange}
              onValueChange={setDateRange}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-background">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="1d">
                  Last 24 Hours
                </SelectItem>

                <SelectItem value="7d">
                  Last 7 Days
                </SelectItem>

                <SelectItem value="30d">
                  Last 30 Days
                </SelectItem>

                <SelectItem value="90d">
                  Last 90 Days
                </SelectItem>

                <SelectItem value="year">
                  Running This Year
                </SelectItem>

                <SelectItem value="all">
                  All Time History
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateRange !== "all" && lifetimeData && (
            <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                How visitor totals reconcile:
              </span>{" "}
              {periodData.visitors.toLocaleString()} of{" "}
              {periodData.lifetimeVisitors.toLocaleString()} lifetime
              unique browser IDs had at least one session in this
              selected window.{" "}
              {periodData.visitorsOutsidePeriod.toLocaleString()} lifetime
              visitors had no session in it, so period unique-visitor
              totals are not added together.
            </p>
          )}

          {/* Basic Metrics */}

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Visitors
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold">
                  {periodData.visitors.toLocaleString()}
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Unique browser IDs in selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Page Views
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold">
                  {periodData.pageViews.toLocaleString()}
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  In selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Duration
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.floor(
                    periodData.avgDuration / 60
                  )}
                  m{" "}
                  {Math.round(
                    periodData.avgDuration % 60
                  )}
                  s
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Per session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bounce Rate
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold">
                  {periodData.bounceRate.toFixed(1)}%
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Single page sessions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* WhatsApp */}

          <Card className="border-l-4 border-l-[hsl(var(--dt-whatsapp))]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MessageCircle className="h-4 w-4 text-[hsl(var(--dt-whatsapp))]" />

                WhatsApp Contact Starts
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-bold">
                {periodData.whatsappClicks.toLocaleString()}
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {periodData.uniqueWhatsappVisitors.toLocaleString()}{" "}
                unique visitors opened a DripTech WhatsApp chat from
                this site in the selected period.
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                This records the successful website click that opens
                WhatsApp. Sending or delivering a message happens
                inside WhatsApp and requires a WhatsApp Business API
                webhook to verify.
              </p>
            </CardContent>
          </Card>

          {/* Enhanced Metrics */}

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart4 className="h-4 w-4 text-purple-500" />

                  Pages/Session
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold">
                  {periodData.pagesPerSession.toFixed(2)}
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Average depth
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />

                  Engagement
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold">
                  {periodData.engagementRate.toFixed(1)}%
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Multi-page sessions
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />

                  New vs Returning
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-xl font-bold text-green-600">
                    {periodData.newVisitors}
                  </div>

                  <span className="text-xs text-muted-foreground">
                    /
                  </span>

                  <div className="text-xl font-bold text-blue-600">
                    {periodData.returningVisitors}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  New / Returning
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />

                  Peak Activity
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold">
                  {periodData.peakHour}:00
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Busiest hour
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}

          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>
                Traffic Trends
              </CardTitle>

              <CardDescription>
                Visualizing visitors and page views over the selected range.
              </CardDescription>
            </CardHeader>

            <CardContent className="pl-0">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[300px]">
                  <ResponsiveContainer
                    width="100%"
                    height={350}
                  >
                    <AreaChart
                      data={periodData.dailyActivity}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="colorPv"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.9}
                          />

                          <stop
                            offset="95%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.1}
                          />
                        </linearGradient>

                        <linearGradient
                          id="colorUv"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.9}
                          />

                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>

                      <XAxis
                        dataKey="date"
                        tickFormatter={(str) => {
                          const d = new Date(str);

                          return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                        stroke="#94a3b8"
                      />

                      <YAxis stroke="#94a3b8" />

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                        opacity={0.5}
                      />

                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow:
                            "0 4px 20px rgba(0,0,0,0.15)",
                          padding: "12px",
                        }}
                      />

                      <Area
                        type="natural"
                        dataKey="page_views"
                        stroke="#8b5cf6"
                        fillOpacity={1}
                        fill="url(#colorPv)"
                        name="Page Views"
                        strokeWidth={3}
                        animationDuration={1500}
                      />

                      <Area
                        type="natural"
                        dataKey="visitors"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorUv)"
                        name="Visitors"
                        strokeWidth={3}
                        animationDuration={1500}
                      />

                      <Legend
                        wrapperStyle={{
                          paddingTop: "20px",
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Tabs */}

          <Tabs
            defaultValue="pages"
            className="w-full"
          >
            <TabsList className="w-full justify-start bg-muted/50 p-1 mb-4 rounded-xl">
              <TabsTrigger
                value="pages"
                className="rounded-lg px-6"
              >
                Top Pages
              </TabsTrigger>

              <TabsTrigger
                value="products"
                className="rounded-lg px-6"
              >
                Products Interactions
              </TabsTrigger>

              <TabsTrigger
                value="tech"
                className="rounded-lg px-6"
              >
                Technographics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="seo"><GSCAnalytics /></TabsContent>

            {/* Pages */}

            <TabsContent value="pages">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5" />

                    Most Visited Pages
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {periodData.topPages.map(
                      (page, i) => (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                        >
                          <div className="flex items-center gap-3 mb-2 sm:mb-0">
                            <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center font-bold text-sm border shadow-sm text-muted-foreground">
                              {i + 1}
                            </div>

                            <div>
                              <div className="font-semibold text-foreground">
                                {page.page_title}
                              </div>

                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Globe className="h-3 w-3" />

                                {page.page_path}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-6 text-right">
                            <div className="bg-background px-3 py-1 rounded shadow-sm border">
                              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                Views
                              </div>

                              <div className="font-bold text-lg">
                                {page.total_views}
                              </div>
                            </div>

                            <div className="bg-background px-3 py-1 rounded shadow-sm border">
                              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                Avg Time
                              </div>

                              <div className="font-bold text-lg">
                                {Math.round(
                                  page.avg_time_spent
                                )}
                                s
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products */}

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />

                    Product Interest
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {periodData.topProducts.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        No product interactions recorded in this period.
                      </div>
                    ) : (
                      periodData.topProducts.map(
                        (prod, i) => (
                          <div
                            key={i}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/30 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                {i + 1}
                              </div>

                              <div className="font-semibold">
                                {prod.product_name}
                              </div>
                            </div>

                            <div className="mt-2 sm:mt-0">
                              <Badge
                                variant="secondary"
                                className="text-sm py-1 px-3"
                              >
                                {prod.interaction_count}{" "}
                                Interactions
                              </Badge>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Technographics */}

            <TabsContent value="tech">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                {/* Devices */}

                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-primary" />

                      Device Breakdown
                    </CardTitle>

                    <CardDescription>
                      Sessions by device type
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {periodData.deviceBreakdown.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No device data available
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {periodData.deviceBreakdown.map(
                          (device, index) => {
                            const totalDeviceSessions =
                              periodData.deviceBreakdown.reduce(
                                (sum, d) =>
                                  sum +
                                  d.total_sessions,
                                0
                              );

                            const percentage =
                              totalDeviceSessions > 0
                                ? Math.round(
                                    (device.total_sessions /
                                      totalDeviceSessions) *
                                      100
                                  )
                                : 0;

                            // Determine device icon
                            const DeviceIcon =
                              device.device_type
                                .toLowerCase()
                                .includes("mobile") ||
                              device.device_type
                                .toLowerCase()
                                .includes("phone")
                                ? Smartphone
                                : device.device_type
                                    .toLowerCase()
                                    .includes(
                                      "tablet"
                                    )
                                ? Tablet
                                : Monitor;

                            // Determine color
                            const color =
                              index === 0
                                ? "bg-blue-500"
                                : index === 1
                                ? "bg-green-500"
                                : index === 2
                                ? "bg-purple-500"
                                : "bg-orange-500";

                            return (
                              <div
                                key={index}
                                className="group"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`p-2 rounded-lg ${color} bg-opacity-10`}
                                    >
                                      <DeviceIcon
                                        className={`h-4 w-4 ${color.replace(
                                          "bg-",
                                          "text-"
                                        )}`}
                                      />
                                    </div>

                                    <div>
                                      <div className="font-semibold text-sm capitalize">
                                        {device.device_type ||
                                          "Unknown"}
                                      </div>

                                      <div className="text-xs text-muted-foreground">
                                        {device.total_sessions.toLocaleString()}{" "}
                                        sessions
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <Badge
                                      variant="secondary"
                                      className="font-bold"
                                    >
                                      {percentage}%
                                    </Badge>
                                  </div>
                                </div>

                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${color} transition-all duration-500 ease-out`}
                                    style={{
                                      width: `${percentage}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Browsers */}

                <Card>
                  <CardHeader>
                    <CardTitle>
                      Browser Usage
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {periodData.browserStats.map(
                        (browser, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />

                              <span>
                                {browser.browser}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 flex-1 max-w-[200px] ml-4">
                              <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary"
                                  style={{
                                    width: `${browser.percentage}%`,
                                  }}
                                />
                              </div>

                              <span className="text-sm font-medium w-8 text-right">
                                {browser.percentage}%
                              </span>
                            </div>
                          </div>
                        )
                      )}
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
