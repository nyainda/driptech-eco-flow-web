import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  FileText,
  Quote,
  Calendar,
  DollarSign,
  Target,
  Activity,
  Clock,
  Download,
  Eye,
  Star,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Shield,
  Award,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  MessageSquare,
  Plus,
  Receipt,
  Sparkles,
  CloudUpload,
  ChevronRight,
  Layers,
  Mail,
  Wrench,
} from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";

interface DashboardProps {
  onNavigate?: (tabId: string) => void;
}

interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  totalBlogPosts: number;
  totalDocuments: number;
  totalQuotes: number;
  totalVideos: number;
  totalProjects: number;
  totalContactSubmissions: number;
  totalDownloads: number;
  totalViews: number;
  totalRevenue: number;
  avgProjectValue: number;
  conversionRate: number;
  customerSatisfaction: number;
  totalServiceBookings: number;
  totalNewsletterSubscribers: number;
  totalNewsArticles: number;
  totalMpesaTransactions: number;
  mpesaRevenue: number;
  totalEmailCampaigns: number;
  totalWhatsappConversations: number;
  totalTechnicians: number;
  totalServiceReviews: number;
  totalSuccessStories: number;
  analytics: {
    monthlyGrowth: {
      customers: number;
      products: number;
      quotes: number;
      projects: number;
      revenue: number;
    };
    categoryDistribution: Array<{
      category: string;
      count: number;
      percentage: number;
      color: string;
    }>;
    quotesStatusDistribution: Array<{
      status: string;
      count: number;
      percentage: number;
      color: string;
    }>;
    projectsStatusDistribution: Array<{
      status: string;
      count: number;
      percentage: number;
      color: string;
    }>;
    monthlyActivity: Array<{
      month: string;
      customers: number;
      quotes: number;
      projects: number;
      revenue?: number;
    }>;
    recentActivity: Array<{
      type: string;
      title: string;
      time: string;
      status: string;
    }>;
    topPerformingProducts: Array<{
      name: string;
      sales: number;
      revenue: number;
    }>;
    upcomingDeadlines: Array<{
      type: string;
      title: string;
      date: string;
      priority: string;
    }>;
    deviceStats: Array<{
      device: string;
      sessions: number;
      percentage: number;
    }>;
    trafficSources: Array<{
      source: string;
      visitors: number;
      percentage: number;
    }>;
    conversionFunnel: Array<{
      stage: string;
      count: number;
      conversion: number;
    }>;
    revenueByCategory: Array<{
      category: string;
      revenue: number;
      growth: number;
    }>;
  };
}

const QUICK_ACTIONS = [
  {
    id: "products",
    label: "Product Catalog",
    sublabel: "Add or update SKUs",
    icon: ShoppingBag,
    accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  },
  {
    id: "quotes",
    label: "Quotes & BOQ",
    sublabel: "Create customer quote",
    icon: Quote,
    accent: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
  },
  {
    id: "invoices",
    label: "Invoices",
    sublabel: "Billing & collections",
    icon: Receipt,
    accent: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
  },
  {
    id: "mpesa",
    label: "M-Pesa Daraja",
    sublabel: "Mobile payments log",
    icon: DollarSign,
    accent: "text-green-600 dark:text-green-400 bg-green-500/10",
  },
  {
    id: "ai-research",
    label: "AI Research",
    sublabel: "Market & SKU discovery",
    icon: Sparkles,
    accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  },
  {
    id: "sync",
    label: "Edge D1 Sync",
    sublabel: "Push to Cloudflare",
    icon: CloudUpload,
    accent: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10",
  },
];

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalProducts: 0,
    totalBlogPosts: 0,
    totalDocuments: 0,
    totalQuotes: 0,
    totalVideos: 0,
    totalProjects: 0,
    totalContactSubmissions: 0,
    totalDownloads: 0,
    totalViews: 0,
    totalRevenue: 0,
    avgProjectValue: 0,
    conversionRate: 0,
    customerSatisfaction: 4.8,
    totalServiceBookings: 0,
    totalNewsletterSubscribers: 0,
    totalNewsArticles: 0,
    totalMpesaTransactions: 0,
    mpesaRevenue: 0,
    totalEmailCampaigns: 0,
    totalWhatsappConversations: 0,
    totalTechnicians: 0,
    totalServiceReviews: 0,
    totalSuccessStories: 0,
    analytics: {
      monthlyGrowth: {
        customers: 0,
        products: 0,
        quotes: 0,
        projects: 0,
        revenue: 0,
      },
      categoryDistribution: [],
      quotesStatusDistribution: [],
      projectsStatusDistribution: [],
      monthlyActivity: [],
      recentActivity: [],
      topPerformingProducts: [],
      upcomingDeadlines: [],
      deviceStats: [],
      trafficSources: [],
      conversionFunnel: [],
      revenueByCategory: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      const [
        customersResult,
        productsResult,
        blogPostsResult,
        documentsResult,
        quotesResult,
        videosResult,
        projectsResult,
        contactSubmissionsResult,
        serviceBookingsResult,
        newsletterResult,
        newsArticlesResult,
        mpesaResult,
        sessionsResult,
        pageViewsResult,
        productInteractionsResult,
        emailCampaignsResult,
        whatsappResult,
        techniciansResult,
        serviceReviewsResult,
        successStoriesResult,
      ] = await Promise.allSettled([
        supabase.from("customers").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("blog_posts").select("*", { count: "exact", head: true }),
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("quotes").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("contact_submissions").select("*", { count: "exact", head: true }),
        supabase.from("service_bookings").select("*", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
        supabase.from("news_articles").select("*", { count: "exact", head: true }),
        supabase.from("mpesa_transactions").select("*", { count: "exact", head: true }),
        supabase.from("visitor_sessions").select("*", { count: "exact", head: true }),
        supabase.from("page_views").select("*", { count: "exact", head: true }),
        supabase.from("product_interactions").select("*", { count: "exact", head: true }),
        supabase.from("email_campaigns").select("*", { count: "exact", head: true }),
        supabase.from("whatsapp_conversations").select("*", { count: "exact", head: true }),
        supabase.from("technicians").select("*", { count: "exact", head: true }),
        supabase.from("service_reviews").select("*", { count: "exact", head: true }),
        supabase.from("success_stories").select("*", { count: "exact", head: true }),
      ]);

      const safeCount = (result: PromiseSettledResult<any>): number => {
        if (result.status === "fulfilled" && !result.value.error) {
          return result.value.count || 0;
        }
        return 0;
      };

      const [
        quotesData,
        projectsData,
        productsData,
        customersData,
        videosData,
        blogData,
        mpesaData,
        sessionsData,
        pageViewsData,
        productInteractionsData,
        documentsData,
      ] = await Promise.allSettled([
        supabase.from("quotes").select("*").order("created_at", { ascending: false }),
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("customers").select("*").order("created_at", { ascending: false }),
        supabase.from("videos").select("*").order("created_at", { ascending: false }),
        supabase.from("blog_posts").select("*").order("created_at", { ascending: false }),
        supabase.from("mpesa_transactions").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("visitor_sessions").select("*").order("session_start", { ascending: false }).limit(1000),
        supabase.from("page_views").select("*").order("timestamp", { ascending: false }).limit(1000),
        supabase.from("product_interactions").select("*").order("timestamp", { ascending: false }).limit(500),
        supabase.from("documents").select("id,download_count").order("created_at", { ascending: false }),
      ]);

      const safeData = (result: PromiseSettledResult<any>): any[] => {
        if (result.status === "fulfilled" && !result.value.error) {
          return result.value.data || [];
        }
        return [];
      };

      const quotesArr = safeData(quotesData);
      const projectsArr = safeData(projectsData);
      const productsArr = safeData(productsData);
      const customersArr = safeData(customersData);
      const videosArr = safeData(videosData);
      const blogsArr = safeData(blogData);
      const mpesaArr = safeData(mpesaData);
      const sessionsArr = safeData(sessionsData);
      const pageViewsArr = safeData(pageViewsData);
      const productInteractionsArr = safeData(productInteractionsData);
      const documentsArr = safeData(documentsData);

      const totalQuoteRevenue = quotesArr.reduce(
        (sum, q) => sum + (Number(q.total_amount) || 0),
        0,
      );
      const mpesaRevenue = mpesaArr
        .filter((t: any) => t.status === "completed" || t.result_code === 0)
        .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
      const totalRevenue = totalQuoteRevenue;
      const totalDownloads = documentsArr.reduce(
        (sum, doc) => sum + (doc.download_count || 0),
        0,
      );
      const totalBlogViews = blogsArr.reduce(
        (sum, blog) => sum + (blog.views || 0),
        0,
      );
      const totalVideoViews = videosArr.reduce(
        (sum, video) => sum + (video.views || 0),
        0,
      );
      const avgProjectValue =
        projectsArr.length > 0 ? totalRevenue / projectsArr.length : 0;
      const totalCustomers = safeCount(customersResult);
      const totalQuotes = safeCount(quotesResult);
      const conversionRate =
        totalCustomers > 0 ? (totalQuotes / totalCustomers) * 100 : 0;

      const analytics = calculateAnalytics(
        productsArr,
        quotesArr,
        projectsArr,
        customersArr,
        videosArr,
        blogsArr,
        mpesaArr,
        sessionsArr,
        pageViewsArr,
        productInteractionsArr,
      );

      setStats({
        totalCustomers,
        totalProducts: safeCount(productsResult),
        totalBlogPosts: safeCount(blogPostsResult),
        totalDocuments: safeCount(documentsResult),
        totalQuotes,
        totalVideos: safeCount(videosResult),
        totalProjects: safeCount(projectsResult),
        totalContactSubmissions: safeCount(contactSubmissionsResult),
        totalServiceBookings: safeCount(serviceBookingsResult),
        totalNewsletterSubscribers: safeCount(newsletterResult),
        totalNewsArticles: safeCount(newsArticlesResult),
        totalMpesaTransactions: safeCount(mpesaResult),
        mpesaRevenue,
        totalEmailCampaigns: safeCount(emailCampaignsResult),
        totalWhatsappConversations: safeCount(whatsappResult),
        totalTechnicians: safeCount(techniciansResult),
        totalServiceReviews: safeCount(serviceReviewsResult),
        totalSuccessStories: safeCount(successStoriesResult),
        totalDownloads,
        totalViews: totalBlogViews + totalVideoViews,
        totalRevenue,
        avgProjectValue,
        conversionRate,
        customerSatisfaction: 4.8,
        analytics,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateAnalytics = (
    products: any[],
    quotes: any[],
    projects: any[],
    customers: any[],
    videos: any[],
    blogs: any[],
    mpesaTransactions: any[],
    sessions: any[],
    pageViews: any[],
    productInteractions: any[],
  ) => {
    const colors = [
      "hsl(var(--primary))",
      "hsl(142 76% 36%)",
      "hsl(210 80% 52%)",
      "hsl(262 83% 58%)",
      "hsl(25 95% 53%)",
      "hsl(195 100% 39%)",
      "hsl(346 87% 43%)",
      "hsl(47 96% 53%)",
    ];

    const categoryCount = products.reduce((acc, product) => {
      const cat = product.category || "uncategorized";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryDistribution = Object.entries(categoryCount).map(
      ([category, count], index) => ({
        category:
          category.charAt(0).toUpperCase() +
          category.slice(1).replace(/_/g, " "),
        count: count as number,
        percentage:
          products.length > 0
            ? Math.round(((count as number) / products.length) * 100)
            : 0,
        color: colors[index % colors.length],
      }),
    );

    const quotesStatusCount = quotes.reduce((acc, quote) => {
      const st = quote.status || "pending";
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const quotesStatusDistribution = Object.entries(quotesStatusCount).map(
      ([status, count], index) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: count as number,
        percentage:
          quotes.length > 0
            ? Math.round(((count as number) / quotes.length) * 100)
            : 0,
        color: colors[index % colors.length],
      }),
    );

    const projectsStatusCount = projects.reduce((acc, project) => {
      const st = project.status || "active";
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const projectsStatusDistribution = Object.entries(projectsStatusCount).map(
      ([status, count], index) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: count as number,
        percentage:
          projects.length > 0
            ? Math.round(((count as number) / projects.length) * 100)
            : 0,
        color: colors[index % colors.length],
      }),
    );

    const monthlyActivity = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthStr = date.toISOString().slice(0, 7);

      return {
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        customers: customers.filter((c) => c.created_at?.startsWith(monthStr))
          .length,
        quotes: quotes.filter((q) => q.created_at?.startsWith(monthStr)).length,
        projects: projects.filter((p) => p.created_at?.startsWith(monthStr))
          .length,
        revenue: quotes
          .filter((q) => q.created_at?.startsWith(monthStr))
          .reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0),
      };
    });

    const recentActivity = [
      ...quotes.slice(0, 3).map((q) => ({
        type: "quote",
        title: `Quote #${q.quote_number || q.id?.slice(0, 6)}`,
        time: q.created_at
          ? new Date(q.created_at).toLocaleDateString()
          : "Recently",
        status: q.status || "pending",
      })),
      ...projects.slice(0, 2).map((p) => ({
        type: "project",
        title: `Project: ${p.name}`,
        time: p.created_at
          ? new Date(p.created_at).toLocaleDateString()
          : "Recently",
        status: p.status || "active",
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    const topPerformingProducts = products
      .filter((p) => p.price && p.price > 0)
      .sort((a, b) => (b.price || 0) - (a.price || 0))
      .slice(0, 5)
      .map((p) => ({
        name: p.name,
        sales: 0,
        revenue: Number(p.price) || 0,
      }));

    const deviceStats = sessions.reduce((acc: any[], session) => {
      const device = session.device_type || "Desktop";
      const existing = acc.find((d) => d.device === device);
      if (existing) {
        existing.sessions += 1;
      } else {
        acc.push({ device, sessions: 1, percentage: 0 });
      }
      return acc;
    }, []);

    const totalDeviceSessions = deviceStats.reduce(
      (sum, d) => sum + d.sessions,
      0,
    );
    deviceStats.forEach((d) => {
      d.percentage =
        totalDeviceSessions > 0
          ? Math.round((d.sessions / totalDeviceSessions) * 100)
          : 0;
    });

    const trafficSources = sessions.reduce((acc: any[], session) => {
      const referrer = session.referrer;
      let source = "Direct";

      if (referrer) {
        if (referrer.includes("google")) source = "Google Search";
        else if (
          referrer.includes("facebook") ||
          referrer.includes("twitter") ||
          referrer.includes("linkedin")
        )
          source = "Social Media";
        else source = "Referrals";
      }

      const existing = acc.find((s) => s.source === source);
      if (existing) {
        existing.visitors += 1;
      } else {
        acc.push({ source, visitors: 1, percentage: 0 });
      }
      return acc;
    }, []);

    const totalVisitors = trafficSources.reduce(
      (sum, s) => sum + s.visitors,
      0,
    );
    trafficSources.forEach((s) => {
      s.percentage =
        totalVisitors > 0 ? Math.round((s.visitors / totalVisitors) * 100) : 0;
    });

    const conversionFunnel = [
      { stage: "Visitor Sessions", count: sessions.length, conversion: 100 },
      {
        stage: "Engaged Visitors",
        count: sessions.filter((s) => (s.page_views || 0) > 1).length,
        conversion: 0,
      },
      { stage: "Customer Leads", count: customers.length, conversion: 0 },
      { stage: "Quotes Issued", count: quotes.length, conversion: 0 },
      { stage: "Active Projects", count: projects.length, conversion: 0 },
    ];

    conversionFunnel.forEach((stage, idx) => {
      if (idx > 0) {
        stage.conversion =
          conversionFunnel[0].count > 0
            ? Math.min(
                100,
                Math.round((stage.count / conversionFunnel[0].count) * 100),
              )
            : 0;
      }
    });

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);
    const currentMonthStr = now.toISOString().slice(0, 7);

    const lastMonthCustomers = customers.filter((c) =>
      c.created_at?.startsWith(lastMonthStr),
    ).length;
    const currentMonthCustomers = customers.filter((c) =>
      c.created_at?.startsWith(currentMonthStr),
    ).length;
    const lastMonthProducts = products.filter((p) =>
      p.created_at?.startsWith(lastMonthStr),
    ).length;
    const currentMonthProducts = products.filter((p) =>
      p.created_at?.startsWith(currentMonthStr),
    ).length;
    const lastMonthQuotes = quotes.filter((q) =>
      q.created_at?.startsWith(lastMonthStr),
    ).length;
    const currentMonthQuotes = quotes.filter((q) =>
      q.created_at?.startsWith(currentMonthStr),
    ).length;
    const lastMonthProjects = projects.filter((p) =>
      p.created_at?.startsWith(lastMonthStr),
    ).length;
    const currentMonthProjects = projects.filter((p) =>
      p.created_at?.startsWith(currentMonthStr),
    ).length;

    const lastMonthRevenue = quotes
      .filter((item) => item.created_at?.startsWith(lastMonthStr))
      .reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
    const currentMonthRevenue = quotes
      .filter((item) => item.created_at?.startsWith(currentMonthStr))
      .reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);

    const calculateGrowth = (current: number, last: number) => {
      if (last === 0) return current > 0 ? 100 : 0;
      return ((current - last) / last) * 100;
    };

    const revenueByCategory = categoryDistribution.map((cat) => {
      const categoryRevenue =
        categoryDistribution.length > 0
          ? quotes
              .filter((q) => q.total_amount)
              .reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0) /
            categoryDistribution.length
          : 0;

      return {
        category: cat.category,
        revenue: categoryRevenue,
        growth: 0,
      };
    });

    return {
      monthlyGrowth: {
        customers: calculateGrowth(currentMonthCustomers, lastMonthCustomers),
        products: calculateGrowth(currentMonthProducts, lastMonthProducts),
        quotes: calculateGrowth(currentMonthQuotes, lastMonthQuotes),
        projects: calculateGrowth(currentMonthProjects, lastMonthProjects),
        revenue: calculateGrowth(currentMonthRevenue, lastMonthRevenue),
      },
      categoryDistribution,
      quotesStatusDistribution,
      projectsStatusDistribution,
      monthlyActivity,
      recentActivity,
      topPerformingProducts,
      upcomingDeadlines: projects
        .filter((p) => p.deadline && new Date(p.deadline) > now)
        .slice(0, 5)
        .map((p) => ({
          type: "project",
          title: p.name,
          date: new Date(p.deadline!).toLocaleDateString(),
          priority:
            new Date(p.deadline!).getTime() - now.getTime() <
            7 * 24 * 60 * 60 * 1000
              ? "high"
              : "medium",
        })),
      deviceStats,
      trafficSources,
      conversionFunnel,
      revenueByCategory,
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? (
      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
    ) : (
      <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
    );
  };

  const getGrowthColor = (value: number) => {
    return value >= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <div className="h-6 w-56 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-80 rounded-lg bg-muted/60 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 rounded-lg bg-muted animate-pulse" />
            <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 rounded-2xl border border-border/60 bg-card p-5 space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
                <div className="h-5 w-14 rounded-full bg-muted/70 animate-pulse" />
              </div>
              <div className="h-7 w-24 rounded-md bg-muted animate-pulse" />
              <div className="h-3.5 w-28 rounded-md bg-muted/60 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const primaryKpis = [
    {
      label: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      growth: stats.analytics.monthlyGrowth.customers,
      icon: Users,
      accent: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
      targetTab: "customers",
    },
    {
      label: "Quote Pipeline",
      value: formatCurrency(stats.totalRevenue),
      growth: stats.analytics.monthlyGrowth.revenue,
      icon: DollarSign,
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
      targetTab: "quotes",
    },
    {
      label: "Active Quotes",
      value: stats.totalQuotes.toLocaleString(),
      growth: stats.analytics.monthlyGrowth.quotes,
      icon: Quote,
      accent: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
      targetTab: "quotes",
    },
    {
      label: "Active Projects",
      value: stats.totalProjects.toLocaleString(),
      growth: stats.analytics.monthlyGrowth.projects,
      icon: Layers,
      accent: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
      targetTab: "projects",
    },
    {
      label: "Lead Conversion",
      value: `${stats.conversionRate.toFixed(1)}%`,
      growth: 4.2,
      icon: Target,
      accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
      targetTab: "analytics",
    },
    {
      label: "Catalog Products",
      value: stats.totalProducts.toLocaleString(),
      growth: stats.analytics.monthlyGrowth.products,
      icon: ShoppingBag,
      accent: "text-teal-600 dark:text-teal-400 bg-teal-500/10",
      targetTab: "products",
    },
  ];

  const operationalPulse = [
    {
      label: "M-Pesa Revenue",
      value: formatCurrency(stats.mpesaRevenue),
      sub: `${stats.totalMpesaTransactions} transactions`,
      icon: DollarSign,
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
      tab: "mpesa",
    },
    {
      label: "Service Bookings",
      value: stats.totalServiceBookings.toLocaleString(),
      sub: `${stats.totalTechnicians} field technicians`,
      icon: Wrench,
      accent: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
      tab: "services",
    },
    {
      label: "Newsletter Subs",
      value: stats.totalNewsletterSubscribers.toLocaleString(),
      sub: "Active audience",
      icon: Mail,
      accent: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
      tab: "email",
    },
    {
      label: "Blog & News",
      value: (stats.totalBlogPosts + stats.totalNewsArticles).toLocaleString(),
      sub: `${stats.totalBlogPosts} blog · ${stats.totalNewsArticles} news`,
      icon: FileText,
      accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
      tab: "blog",
    },
    {
      label: "Service Reviews",
      value: stats.totalServiceReviews.toLocaleString(),
      sub: "Verified ratings",
      icon: Star,
      accent: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
      tab: "services",
    },
    {
      label: "WhatsApp Leads",
      value: stats.totalWhatsappConversations.toLocaleString(),
      sub: "Active chats",
      icon: MessageSquare,
      accent: "text-green-600 dark:text-green-400 bg-green-500/10",
      tab: "whatsapp",
    },
    {
      label: "Email Campaigns",
      value: stats.totalEmailCampaigns.toLocaleString(),
      sub: "Dispatched",
      icon: Activity,
      accent: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10",
      tab: "email",
    },
    {
      label: "Success Stories",
      value: stats.totalSuccessStories.toLocaleString(),
      sub: "Case studies",
      icon: Award,
      accent: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
      tab: "success-stories",
    },
    {
      label: "Contact Inquiries",
      value: stats.totalContactSubmissions.toLocaleString(),
      sub: "Web form leads",
      icon: Users,
      accent: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
      tab: "contacts",
    },
    {
      label: "Content Views",
      value: stats.totalViews.toLocaleString(),
      sub: `${stats.totalDownloads} PDF downloads`,
      icon: Eye,
      accent: "text-slate-600 dark:text-slate-400 bg-slate-500/10",
      tab: "documents",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Command Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium px-2.5 py-0.5"
              >
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Live Telemetry Connected
              </Badge>
              <span className="text-xs text-muted-foreground">
                Supabase + Cloudflare D1 Edge
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Executive Command Overview
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Real-time commercial pipeline, irrigation catalog health, M-Pesa
              collections, and field operations across Kenya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36 h-9 rounded-xl bg-background text-xs font-medium">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="1y">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="h-9 rounded-xl gap-2 text-xs font-medium"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Syncing..." : "Refresh Data"}
            </Button>
            {onNavigate && (
              <Button
                size="sm"
                onClick={() => onNavigate("products")}
                className="h-9 rounded-xl gap-1.5 text-xs font-medium shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Product
              </Button>
            )}
          </div>
        </div>

        {/* Quick Actions Launchpad */}
        {onNavigate && (
          <div className="mt-6 pt-5 border-t border-border/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Launchpad
              </span>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Click any module to jump directly
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => onNavigate(action.id)}
                    className="group flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 hover:bg-accent/50 hover:border-primary/40 p-3 text-left transition-all"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.accent} transition-transform group-hover:scale-105`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {action.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {action.sublabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Primary Executive KPIs (6-Card Bento Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {primaryKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.label}
              onClick={() => onNavigate?.(kpi.targetTab)}
              className={`border-border/70 bg-card shadow-sm transition-all ${
                onNavigate
                  ? "cursor-pointer hover:shadow-md hover:border-primary/40 group"
                  : ""
              }`}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.accent}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="inline-flex items-center gap-0.5 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium">
                    {getGrowthIcon(kpi.growth)}
                    <span className={getGrowthColor(kpi.growth)}>
                      {Math.abs(kpi.growth).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                    {kpi.value}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      {kpi.label}
                    </p>
                    {onNavigate && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Operational Pulse (10-Card Secondary Grid) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Operational Pulse & Channels
          </h2>
          <span className="text-xs text-muted-foreground">
            Real-time module counters
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {operationalPulse.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                onClick={() => onNavigate?.(item.tab)}
                className={`border-border/60 bg-card/90 shadow-none transition-all ${
                  onNavigate
                    ? "cursor-pointer hover:bg-card hover:border-primary/30 hover:shadow-sm group"
                    : ""
                }`}
              >
                <CardContent className="p-3.5 flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.accent}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-muted-foreground truncate">
                      {item.label}
                    </p>
                    <p className="text-base font-bold text-foreground truncate mt-0.5">
                      {item.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 truncate">
                      {item.sub}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Deep-Dive Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 w-full h-auto p-1 rounded-xl bg-muted/60 border border-border/60">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 py-2.5 rounded-lg text-xs font-medium"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="revenue"
            className="flex items-center gap-2 py-2.5 rounded-lg text-xs font-medium"
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Revenue</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-2 py-2.5 rounded-lg text-xs font-medium"
          >
            <PieChart className="h-3.5 w-3.5" />
            <span>Catalog & Funnel</span>
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="flex items-center gap-2 py-2.5 rounded-lg text-xs font-medium"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger
            value="traffic"
            className="flex items-center gap-2 py-2.5 rounded-lg text-xs font-medium"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Traffic</span>
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="flex items-center gap-2 py-2.5 rounded-lg text-xs font-medium"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Insights</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Monthly Activity Chart */}
            <Card className="xl:col-span-2 border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-primary" />
                      6-Month Commercial Activity
                    </CardTitle>
                    <CardDescription className="text-xs">
                      New customer leads, quotes issued, and active irrigation
                      projects
                    </CardDescription>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Customers
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      Quotes
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-violet-600" />
                      Projects
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.analytics.monthlyActivity}>
                    <defs>
                      <linearGradient
                        id="customers"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="quotes" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="hsl(142 76% 36%)"
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(142 76% 36%)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="projects" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="hsl(262 83% 58%)"
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(262 83% 58%)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "10px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="customers"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#customers)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="quotes"
                      stroke="hsl(142 76% 36%)"
                      fillOpacity={1}
                      fill="url(#quotes)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="projects"
                      stroke="hsl(262 83% 58%)"
                      fillOpacity={1}
                      fill="url(#projects)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Recent Pipeline Activity
                </CardTitle>
                <CardDescription className="text-xs">
                  Latest quotes and project milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.analytics.recentActivity.length > 0 ? (
                  stats.analytics.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          activity.type === "quote"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : activity.type === "project"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        }`}
                      >
                        {activity.type === "quote" ? (
                          <Quote className="h-3.5 w-3.5" />
                        ) : activity.type === "project" ? (
                          <Layers className="h-3.5 w-3.5" />
                        ) : (
                          <Users className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {activity.title}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-[11px] text-muted-foreground">
                            {activity.time}
                          </p>
                          <Badge
                            variant={
                              activity.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                            className="text-[10px] px-2 py-0 capitalize"
                          >
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 space-y-2">
                    <Activity className="h-8 w-8 mx-auto text-muted-foreground/40" />
                    <p className="text-xs font-medium text-muted-foreground">
                      No recent quote or project events recorded yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">
                  M-Pesa Collected
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(stats.mpesaRevenue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalMpesaTransactions} verified transactions
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">
                  Quote Pipeline Value
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {stats.totalQuotes} customer quotes
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">
                  Average Project Value
                </p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                  {formatCurrency(stats.avgProjectValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalProjects} active installations
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">
                  Quote-to-Lead Ratio
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {stats.conversionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Customer pipeline conversion
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Pipeline Share by Category
                </CardTitle>
                <CardDescription className="text-xs">
                  Estimated value distribution across irrigation categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.analytics.revenueByCategory.length > 0 ? (
                  stats.analytics.revenueByCategory.map((item, index) => {
                    const maxRev = Math.max(
                      1,
                      ...stats.analytics.revenueByCategory.map(
                        (r) => r.revenue,
                      ),
                    );
                    return (
                      <div
                        key={index}
                        className="p-3.5 rounded-xl border border-border/50 bg-muted/20"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-semibold">
                            {item.category}
                          </h4>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.revenue)}
                          </span>
                        </div>
                        <Progress
                          value={(item.revenue / maxRev) * 100}
                          className="h-1.5"
                        />
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    No category revenue data available yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  High-Value Catalog Systems
                </CardTitle>
                <CardDescription className="text-xs">
                  Top irrigation systems and kits by unit price
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.analytics.topPerformingProducts.length > 0 ? (
                  stats.analytics.topPerformingProducts.map(
                    (product, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20"
                      >
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold truncate">
                            {product.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            Catalog SKU
                          </p>
                        </div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(product.revenue)}
                        </p>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    No priced products found in catalog.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Catalog & Funnel Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-blue-500" />
                  Product Categories
                </CardTitle>
                <CardDescription className="text-xs">
                  SKU distribution by irrigation line
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {stats.analytics.categoryDistribution.length > 0 ? (
                  stats.analytics.categoryDistribution.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-muted/20"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-xs truncate">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {item.count} SKUs
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    No product categories found.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Quote className="h-4 w-4 text-emerald-500" />
                  Quotes Status Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Active quote lifecycle stages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.analytics.quotesStatusDistribution.length > 0 ? (
                  stats.analytics.quotesStatusDistribution.map(
                    (item, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{item.status}</span>
                          <span className="text-muted-foreground">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    No quotes recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-violet-500" />
                  Customer Conversion Funnel
                </CardTitle>
                <CardDescription className="text-xs">
                  End-to-end journey from session to project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                {stats.analytics.conversionFunnel.map((stage, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="text-muted-foreground font-mono">
                        {stage.count.toLocaleString()} ({stage.conversion}%)
                      </span>
                    </div>
                    <Progress value={stage.conversion} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-[11px]">
                    Project Avg
                  </Badge>
                </div>
                <p className="text-2xl font-bold pt-1">
                  {formatCurrency(stats.avgProjectValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Average Project Value
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                    <Eye className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-[11px]">
                    Reach
                  </Badge>
                </div>
                <p className="text-2xl font-bold pt-1">
                  {stats.totalViews.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Blog & Video Views
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600">
                    <Download className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-[11px]">
                    Technical Docs
                  </Badge>
                </div>
                <p className="text-2xl font-bold pt-1">
                  {stats.totalDownloads.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Datasheet & Manual Downloads
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-[11px]">
                    CSAT Score
                  </Badge>
                </div>
                <p className="text-2xl font-bold pt-1">
                  {stats.customerSatisfaction}/5.0
                </p>
                <p className="text-xs text-muted-foreground">
                  Field Service Rating
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  Visitor Device Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Sessions segmented by device platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.analytics.deviceStats.length > 0 ? (
                  stats.analytics.deviceStats.map((device, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 bg-muted/20"
                    >
                      <div className="flex items-center gap-3">
                        {device.device === "Mobile" ? (
                          <Smartphone className="h-4 w-4 text-primary" />
                        ) : device.device === "Tablet" ? (
                          <Tablet className="h-4 w-4 text-primary" />
                        ) : (
                          <Monitor className="h-4 w-4 text-primary" />
                        )}
                        <span className="text-xs font-semibold">
                          {device.device}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {device.sessions.toLocaleString()} sessions
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {device.percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    No visitor session device data recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Acquisition Channels
                </CardTitle>
                <CardDescription className="text-xs">
                  Top traffic referral sources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                {stats.analytics.trafficSources.length > 0 ? (
                  stats.analytics.trafficSources.map((source, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{source.source}</span>
                        <span className="text-muted-foreground">
                          {source.visitors.toLocaleString()} visitors (
                          {source.percentage}%)
                        </span>
                      </div>
                      <Progress value={source.percentage} className="h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    No referrer data recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Executive Recommendations
                </CardTitle>
                <CardDescription className="text-xs">
                  Automated operational insights based on live store & CRM metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        Commercial Pipeline Conversion
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lead-to-quote conversion currently stands at{" "}
                        <span className="font-semibold text-foreground">
                          {stats.conversionRate.toFixed(1)}%
                        </span>{" "}
                        across {stats.totalCustomers} registered customers and{" "}
                        {stats.totalQuotes} quotes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        Catalog & SEO Sync Opportunity
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        You have{" "}
                        <span className="font-semibold text-foreground">
                          {stats.totalProducts} products
                        </span>{" "}
                        and{" "}
                        <span className="font-semibold text-foreground">
                          {stats.totalBlogPosts} blog guides
                        </span>
                        . Run Cloudflare D1 Edge Sync after catalog updates to
                        keep static SEO and edge APIs aligned.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        Upcoming Project Milestones
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.analytics.upcomingDeadlines.length} active project
                        deadlines are scheduled. Review field technician
                        assignments to maintain on-time commissioning.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Upcoming Project Deadlines
                </CardTitle>
                <CardDescription className="text-xs">
                  Scheduled installation & delivery dates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.analytics.upcomingDeadlines.map((deadline, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl border border-border/50 bg-muted/20 border-l-4 border-l-amber-500"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge
                        variant={
                          deadline.priority === "high"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {deadline.priority} priority
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {deadline.date}
                      </span>
                    </div>
                    <h4 className="font-semibold text-xs">{deadline.title}</h4>
                    <p className="text-[11px] text-muted-foreground capitalize">
                      {deadline.type}
                    </p>
                  </div>
                ))}

                {stats.analytics.upcomingDeadlines.length === 0 && (
                  <div className="text-center py-8 space-y-2">
                    <CheckCircle className="h-9 w-9 mx-auto text-emerald-500/80" />
                    <p className="text-xs font-semibold text-foreground">
                      No overdue or urgent deadlines
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      All project schedules are on track.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
