import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardList,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Gauge,
  Globe2,
  Lightbulb,
  Link2,
  MousePointerClick,
  RefreshCw,
  Search,
  SearchCheck,
  SearchX,
  Target,
  TrendingUp,
} from "lucide-react";

type MetricRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type TrendRow = MetricRow & { keys: string[] };
type GscTotals = {
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type GscPayload = {
  connected: boolean;
  email?: string;
  property?: string;
  startDate?: string;
  endDate?: string;
  previousStartDate?: string;
  previousEndDate?: string;
  totals?: GscTotals;
  previousTotals?: GscTotals;
  trend?: TrendRow[];
  queries?: MetricRow[];
  pages?: MetricRow[];
  devices?: MetricRow[];
  error?: string;
};

type IntentName =
  | "Transactional"
  | "Commercial research"
  | "Informational"
  | "Technical"
  | "Branded"
  | "Other";

type ActionItem = {
  id: string;
  title: string;
  detail: string;
  kind: "snippet" | "ranking" | "content" | "internal";
  impact: string;
};

const INTENT_COLORS: Record<IntentName, string> = {
  Transactional: "#16a34a",
  "Commercial research": "#0d9488",
  Informational: "#3b82f6",
  Technical: "#8b5cf6",
  Branded: "#f59e0b",
  Other: "#94a3b8",
};

const numberFormat = (value?: number, digits = 0) =>
  Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });

const percentageFormat = (value?: number) =>
  ((Number(value) || 0) * 100).toFixed(1) + "%";

const shortDate = (value: string) => {
  const date = new Date(value + "T00:00:00");
  return date.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
};

const readablePage = (value?: string) => {
  if (!value) return "Unknown page";
  try {
    return new URL(value).pathname || "/";
  } catch {
    return value;
  }
};

const classifyIntent = (rawQuery: string): IntentName => {
  const query = rawQuery.toLowerCase();
  if (/drip\\s?tech|dripstech/.test(query)) return "Branded";
  if (/price|prices|cost|buy|purchase|supplier|shop|quote|for sale|near me/.test(query)) {
    return "Transactional";
  }
  if (/best|top|compare|comparison|review|vs\\b|company|companies/.test(query)) {
    return "Commercial research";
  }
  if (/design|sizing|calculation|pressure|flow rate|spacing|filter|filtration|clog|repair|installation|install|maintenance|troubleshoot|pump|boq|emitter/.test(query)) {
    return "Technical";
  }
  if (/how|what|why|guide|benefit|difference|meaning|types|which|when/.test(query)) {
    return "Informational";
  }
  return "Other";
};

const exportCsv = (filename: string, rows: MetricRow[]) => {
  const headers = ["Search term / page", "Clicks", "Impressions", "CTR", "Average position"];
  const escapeCell = (value: unknown) =>
    '"' + String(value ?? "").replace(/"/g, '""') + '"';
  const csv = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) =>
      [
        row.keys?.[0] || "",
        row.clicks || 0,
        row.impressions || 0,
        Number(row.ctr || 0),
        Number(row.position || 0).toFixed(2),
      ]
        .map(escapeCell)
        .join(","),
    ),
  ].join("\\r\\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const MetricCard = ({
  label,
  value,
  helper,
  icon: Icon,
  delta,
  deltaLabel,
  inverse = false,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ElementType;
  delta?: number | null;
  deltaLabel?: string;
  inverse?: boolean;
}) => {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const improved = hasDelta && (inverse ? delta < 0 : delta > 0);
  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {hasDelta ? (
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            {improved ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className={improved ? "font-semibold text-emerald-600" : "font-semibold text-rose-500"}>
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}{deltaLabel || "%"}
            </span>
            <span className="text-muted-foreground">vs previous period</span>
          </div>
        ) : (
          <div className="mt-4 text-xs text-muted-foreground">Previous-period comparison unavailable</div>
        )}
      </CardContent>
    </Card>
  );
};

const GSCAnalytics: React.FC = () => {
  const [payload, setPayload] = useState<GscPayload | null>(null);
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("overview");
  const [querySearch, setQuerySearch] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [completedActions, setCompletedActions] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem("driptech-gsc-completed-actions") || "[]");
    } catch {
      return [];
    }
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("gsc-analytics", {
        body: { days },
      });
      if (invokeError) throw invokeError;
      if (!data) throw new Error("Search Console returned an empty response.");
      if (data.error) throw new Error(data.error);
      setPayload(data as GscPayload);
    } catch (loadError: unknown) {
      const message =
        loadError instanceof Error ? loadError.message : "Could not load Search Console data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  const connect = async () => {
    setConnecting(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("gsc-oauth-start");
      if (invokeError) throw invokeError;
      if (!data?.url) throw new Error(data?.error || "Could not start Google connection.");
      window.location.assign(data.url);
    } catch (connectError: unknown) {
      setError(connectError instanceof Error ? connectError.message : "Could not connect Google Search Console.");
      setConnecting(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "driptech-gsc-completed-actions",
        JSON.stringify(completedActions),
      );
    } catch {
      // The dashboard remains usable when browser storage is unavailable.
    }
  }, [completedActions]);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("gsc");
    if (!status) return;
    setError(
      status === "connected"
        ? "Google Search Console connected. Refreshing the latest data now."
        : "Google connection status: " + status,
    );
    const url = new URL(window.location.href);
    url.searchParams.delete("gsc");
    window.history.replaceState({}, "", url.toString());
    if (status === "connected") load();
  }, [load]);

  const connected = !!payload?.connected;
  const queries = payload?.queries || [];
  const pages = payload?.pages || [];
  const totals = payload?.totals || {};
  const previousTotals = payload?.previousTotals || {};

  const trendData = useMemo(
    () =>
      (payload?.trend || []).map((row) => ({
        ...row,
        date: row.keys?.[0] || "",
      })),
    [payload?.trend],
  );

  const queryRows = useMemo(
    () =>
      queries.filter((row) =>
        (row.keys?.[0] || "").toLowerCase().includes(querySearch.toLowerCase()),
      ),
    [queries, querySearch],
  );

  const pageRows = useMemo(
    () =>
      pages.filter((row) =>
        (row.keys?.[0] || "").toLowerCase().includes(pageSearch.toLowerCase()),
      ),
    [pages, pageSearch],
  );

  const quickWins = useMemo(
    () =>
      queries
        .filter(
          (row) =>
            Number(row.impressions || 0) >= 10 &&
            Number(row.position || 0) >= 5 &&
            Number(row.position || 0) <= 20,
        )
        .sort((a, b) => Number(b.impressions || 0) - Number(a.impressions || 0))
        .slice(0, 8),
    [queries],
  );

  const lowCtrPages = useMemo(
    () =>
      pages
        .filter(
          (row) =>
            Number(row.impressions || 0) >= 20 &&
            Number(row.ctr || 0) < 0.02,
        )
        .sort((a, b) => Number(b.impressions || 0) - Number(a.impressions || 0))
        .slice(0, 6),
    [pages],
  );

  const intentData = useMemo(() => {
    const counts = new Map<IntentName, number>();
    queries.forEach((row) => {
      const intent = classifyIntent(row.keys?.[0] || "");
      counts.set(intent, (counts.get(intent) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({
        name,
        value,
        fill: INTENT_COLORS[name],
      }))
      .sort((a, b) => b.value - a.value);
  }, [queries]);

  const contentIdeas = useMemo(() => {
    const ideas: Array<{ title: string; reason: string; source: string; type: string }> = [];
    quickWins.slice(0, 4).forEach((row) => {
      const term = row.keys?.[0] || "this search topic";
      ideas.push({
        title: "Strengthen the page targeting “" + term + "”",
        reason:
          numberFormat(row.impressions) +
          " impressions with an average position of " +
          numberFormat(row.position, 1) +
          ". Improve topical depth, headings and related internal links.",
        source: term,
        type: "Ranking opportunity",
      });
    });
    lowCtrPages.slice(0, 3).forEach((row) => {
      const page = readablePage(row.keys?.[0]);
      ideas.push({
        title: "Rewrite the search snippet for " + page,
        reason:
          numberFormat(row.impressions) +
          " impressions but " +
          percentageFormat(row.ctr) +
          " CTR. Test a clearer title and a more specific meta description.",
        source: row.keys?.[0] || page,
        type: "CTR improvement",
      });
    });
    queries
      .filter((row) => {
        const intent = classifyIntent(row.keys?.[0] || "");
        return (
          (intent === "Informational" || intent === "Technical") &&
          Number(row.impressions || 0) >= 5
        );
      })
      .slice(0, 3)
      .forEach((row) => {
        const term = row.keys?.[0] || "this question";
        ideas.push({
          title: "Answer the question “" + term + "”",
          reason:
            "This wording appears in the Search Console query sample. Add a useful guide section or FAQ answer and link it to the most relevant product or service page.",
          source: term,
          type: "Content demand",
        });
      });
    return ideas.slice(0, 8);
  }, [quickWins, lowCtrPages, queries]);

  const actionItems = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];
    lowCtrPages.slice(0, 4).forEach((row) => {
      const page = readablePage(row.keys?.[0]);
      items.push({
        id: "snippet:" + (row.keys?.[0] || page),
        title: "Improve title and meta description — " + page,
        detail:
          numberFormat(row.impressions) +
          " impressions · " +
          percentageFormat(row.ctr) +
          " CTR",
        kind: "snippet",
        impact: "CTR",
      });
    });
    quickWins.slice(0, 5).forEach((row) => {
      const term = row.keys?.[0] || "Search term";
      items.push({
        id: "ranking:" + term,
        title: "Improve relevance for “" + term + "”",
        detail:
          numberFormat(row.impressions) +
          " impressions · position " +
          numberFormat(row.position, 1),
        kind: "ranking",
        impact: "Ranking",
      });
    });
    queries
      .filter((row) => {
        const intent = classifyIntent(row.keys?.[0] || "");
        return (
          (intent === "Informational" || intent === "Technical") &&
          Number(row.impressions || 0) >= 5
        );
      })
      .slice(0, 3)
      .forEach((row) => {
        const term = row.keys?.[0] || "Question";
        items.push({
          id: "content:" + term,
          title: "Publish or expand content for “" + term + "”",
          detail: "Observed in the returned query sample · " + numberFormat(row.impressions) + " impressions",
          kind: "content",
          impact: "Content",
        });
      });
    return items.slice(0, 12);
  }, [lowCtrPages, quickWins, queries]);

  const comparePercent = (current?: number, previous?: number) => {
    if (typeof current !== "number" || typeof previous !== "number" || previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const comparePoints = (current?: number, previous?: number) => {
    if (typeof current !== "number" || typeof previous !== "number") return null;
    return (current - previous) * 100;
  };

  const comparePosition = (current?: number, previous?: number) => {
    if (typeof current !== "number" || typeof previous !== "number") return null;
    return current - previous;
  };

  const toggleAction = (id: string) => {
    setCompletedActions((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "keywords", label: "Keyword insights", icon: Search },
    { id: "pages", label: "Pages & content", icon: Globe2 },
    { id: "intent", label: "Search intent", icon: Target },
    { id: "ideas", label: "Content ideas", icon: Lightbulb },
    { id: "actions", label: "SEO action plan", icon: ClipboardList },
  ];

  const periodLabel =
    payload?.startDate && payload?.endDate
      ? shortDate(payload.startDate) + " – " + shortDate(payload.endDate)
      : "Selected period";
  const previousLabel =
    payload?.previousStartDate && payload?.previousEndDate
      ? shortDate(payload.previousStartDate) + " – " + shortDate(payload.previousEndDate)
      : "Previous period";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <SearchCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">SEO performance</h2>
              <p className="text-sm text-muted-foreground">Google Search Console · DripTech organic search</p>
            </div>
            <Badge variant={connected ? "default" : "secondary"} className="ml-1">
              {connected ? "Connected" : "Not connected"}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {payload?.email && <span>{payload.email}</span>}
            {payload?.property && <span>Property: {payload.property}</span>}
            {connected && <span>Reporting period: {periodLabel}</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Search Console date range"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button variant="outline" onClick={load} disabled={loading || connecting}>
            <RefreshCw className={"mr-2 h-4 w-4 " + (loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button onClick={connect} disabled={loading || connecting}>
            <Link2 className="mr-2 h-4 w-4" />
            {connecting ? "Connecting…" : connected ? "Reconnect Google" : "Connect Google"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Open Google Search Console"
            onClick={() => window.open("https://search.google.com/search-console", "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm">
          <SearchX className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">Search Console notice</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {loading && !payload ? (
        <Card className="rounded-2xl">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm text-muted-foreground">Loading Google Search Console data…</p>
          </CardContent>
        </Card>
      ) : !connected ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-600">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">Connect Google Search Console</h3>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Link the verified DripTech property to load organic clicks, impressions, rankings,
              search terms, landing pages and search-intent insights.
            </p>
            <Button className="mt-5" onClick={connect} disabled={connecting}>
              <Link2 className="mr-2 h-4 w-4" />
              {connecting ? "Connecting…" : "Connect Google"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-600" />
              <span>Google data is delayed. This report intentionally ends three days behind today.</span>
            </div>
            <span>Comparison: {previousLabel}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Organic clicks"
              value={numberFormat(totals.clicks)}
              helper="Visits from Google search results"
              icon={MousePointerClick}
              delta={comparePercent(totals.clicks, previousTotals.clicks)}
            />
            <MetricCard
              label="Search impressions"
              value={numberFormat(totals.impressions)}
              helper="Appearances in Google search"
              icon={Eye}
              delta={comparePercent(totals.impressions, previousTotals.impressions)}
            />
            <MetricCard
              label="Average CTR"
              value={percentageFormat(totals.ctr)}
              helper="Clicks ÷ impressions"
              icon={TrendingUp}
              delta={comparePoints(totals.ctr, previousTotals.ctr)}
              deltaLabel=" pp"
            />
            <MetricCard
              label="Average position"
              value={numberFormat(totals.position, 1)}
              helper="Lower position number is better"
              icon={Gauge}
              delta={comparePosition(totals.position, previousTotals.position)}
              deltaLabel=" positions"
              inverse
            />
          </div>

          <div className="flex gap-1 overflow-x-auto rounded-xl border border-border/70 bg-muted/40 p-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={
                    "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
                    (active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/70 hover:text-foreground")
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {activeView === "overview" && (
            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
                <Card className="rounded-2xl">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle>Search visibility trend</CardTitle>
                      <CardDescription>{periodLabel} · Daily clicks and impressions</CardDescription>
                    </div>
                    <Badge variant="outline">Organic search</Badge>
                  </CardHeader>
                  <CardContent>
                    {payload?.trend?.length ? (
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gscClicksFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#059669" stopOpacity={0.28} />
                                <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                              </linearGradient>
                              <linearGradient id="gscImpressionsFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.01} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) => shortDate(String(value))}
                              minTickGap={24}
                              tick={{ fontSize: 11 }}
                              stroke="#94a3b8"
                            />
                            <YAxis yAxisId="clicks" tick={{ fontSize: 11 }} stroke="#059669" />
                            <YAxis yAxisId="impressions" orientation="right" tick={{ fontSize: 11 }} stroke="#0ea5e9" />
                            <Tooltip
                              labelFormatter={(value) => shortDate(String(value))}
                              formatter={(value: number, name: string) => [numberFormat(value), name]}
                              contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                            />
                            <Legend />
                            <Area yAxisId="clicks" type="monotone" dataKey="clicks" name="Clicks" stroke="#059669" fill="url(#gscClicksFill)" strokeWidth={2.5} />
                            <Area yAxisId="impressions" type="monotone" dataKey="impressions" name="Impressions" stroke="#0ea5e9" fill="url(#gscImpressionsFill)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                        No daily Search Console trend rows were returned for this period.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Search intent mix</CardTitle>
                    <CardDescription>Heuristic labels applied to the returned query sample</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {intentData.length ? (
                      <>
                        <div className="h-[210px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={intentData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>
                                {intentData.map((entry) => (
                                  <Cell key={entry.name} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => [value + " queries", "Sample count"]} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                          {intentData.slice(0, 5).map((item) => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                {item.name}
                              </span>
                              <span className="font-semibold tabular-nums">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                        Query data is not available yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle>Keyword opportunities</CardTitle>
                        <CardDescription>Queries ranking between positions 5 and 20</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActiveView("keywords")}>
                        View all <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {quickWins.length ? (
                      <div className="space-y-3">
                        {quickWins.slice(0, 5).map((row, index) => (
                          <div key={(row.keys?.[0] || "query") + index} className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{row.keys?.[0]}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {numberFormat(row.impressions)} impressions · {numberFormat(row.clicks)} clicks
                              </p>
                            </div>
                            <Badge variant="secondary">Pos. {numberFormat(row.position, 1)}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-sm text-muted-foreground">No query currently meets the opportunity filter for this period.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle>Pages with CTR opportunity</CardTitle>
                        <CardDescription>At least 20 impressions and CTR below 2%</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActiveView("pages")}>
                        View pages <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {lowCtrPages.length ? (
                      <div className="space-y-3">
                        {lowCtrPages.slice(0, 5).map((row, index) => (
                          <div key={(row.keys?.[0] || "page") + index} className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{readablePage(row.keys?.[0])}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {numberFormat(row.impressions)} impressions
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0">{percentageFormat(row.ctr)} CTR</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-sm text-muted-foreground">No page currently meets the CTR filter for this period.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeView === "keywords" && (
            <Card className="rounded-2xl">
              <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Search queries</CardTitle>
                  <CardDescription>Actual queries returned by Google Search Console (up to the API row limit)</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative min-w-[220px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={querySearch} onChange={(event) => setQuerySearch(event.target.value)} placeholder="Filter search queries…" className="pl-9" />
                  </div>
                  <Button variant="outline" onClick={() => exportCsv("driptech-search-queries.csv", queryRows)}>
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Search query</th>
                        <th className="px-4 py-3 text-right">Clicks</th>
                        <th className="px-4 py-3 text-right">Impressions</th>
                        <th className="px-4 py-3 text-right">CTR</th>
                        <th className="px-4 py-3 text-right">Position</th>
                        <th className="px-4 py-3 text-left">Intent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queryRows.length ? queryRows.map((row, index) => {
                        const intent = classifyIntent(row.keys?.[0] || "");
                        return (
                          <tr key={(row.keys?.[0] || "query") + index} className="border-t border-border/60 hover:bg-muted/30">
                            <td className="max-w-[420px] px-4 py-3 font-medium">{row.keys?.[0]}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{numberFormat(row.clicks)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{numberFormat(row.impressions)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{percentageFormat(row.ctr)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{numberFormat(row.position, 1)}</td>
                            <td className="px-4 py-3"><Badge variant="secondary">{intent}</Badge></td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No query rows match this filter.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Search intent is classified from query wording using simple rules. It is an analytical hint, not a label supplied by Google.
                </p>
              </CardContent>
            </Card>
          )}

          {activeView === "pages" && (
            <Card className="rounded-2xl">
              <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Landing page performance</CardTitle>
                  <CardDescription>Pages receiving organic search visibility for the selected date range</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative min-w-[220px] flex-1">
                    <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={pageSearch} onChange={(event) => setPageSearch(event.target.value)} placeholder="Filter landing pages…" className="pl-9" />
                  </div>
                  <Button variant="outline" onClick={() => exportCsv("driptech-landing-pages.csv", pageRows)}>
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Landing page</th>
                        <th className="px-4 py-3 text-right">Clicks</th>
                        <th className="px-4 py-3 text-right">Impressions</th>
                        <th className="px-4 py-3 text-right">CTR</th>
                        <th className="px-4 py-3 text-right">Position</th>
                        <th className="px-4 py-3 text-right">Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.length ? pageRows.map((row, index) => {
                        const pageUrl = row.keys?.[0] || "";
                        return (
                          <tr key={pageUrl + index} className="border-t border-border/60 hover:bg-muted/30">
                            <td className="max-w-[430px] px-4 py-3">
                              <p className="font-medium">{readablePage(pageUrl)}</p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">{pageUrl}</p>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">{numberFormat(row.clicks)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{numberFormat(row.impressions)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{percentageFormat(row.ctr)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{numberFormat(row.position, 1)}</td>
                            <td className="px-4 py-3 text-right">
                              {pageUrl.startsWith("http") && (
                                <a href={pageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-emerald-600 hover:underline">
                                  <ExternalLink className="h-4 w-4" />
                                  <span className="sr-only">Open landing page</span>
                                </a>
                              )}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No page rows match this filter.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeView === "intent" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Search intent distribution</CardTitle>
                  <CardDescription>Classification of the query sample returned by Google</CardDescription>
                </CardHeader>
                <CardContent>
                  {intentData.length ? (
                    <>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={intentData} dataKey="value" nameKey="name" innerRadius={66} outerRadius={105} paddingAngle={3}>
                              {intentData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                            </Pie>
                            <Tooltip formatter={(value: number) => [value + " queries", "Sample count"]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-xs text-muted-foreground">This reflects the returned top-query sample, not every search made by every visitor.</p>
                    </>
                  ) : (
                    <p className="py-14 text-center text-sm text-muted-foreground">No query sample is available.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>What the intent labels mean</CardTitle>
                  <CardDescription>Rules used to group query wording into practical SEO themes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    ["Transactional", "Queries containing price, cost, buy, supplier, quote or purchase language.", INTENT_COLORS.Transactional],
                    ["Commercial research", "Queries comparing options, providers, reviews or the best solution.", INTENT_COLORS["Commercial research"]],
                    ["Informational", "Questions and learning searches such as how, what, why, guides and benefits.", INTENT_COLORS.Informational],
                    ["Technical", "Engineering and implementation searches such as design, sizing, pressure, filtration and BOQ.", INTENT_COLORS.Technical],
                    ["Branded", "Queries that explicitly mention DripTech or Dripstech.", INTENT_COLORS.Branded],
                    ["Other", "Queries where the wording does not clearly match the rules above.", INTENT_COLORS.Other],
                  ].map(([name, description, color]) => (
                    <div key={String(name)} className="flex gap-3">
                      <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: String(color) }} />
                      <div>
                        <p className="text-sm font-semibold">{String(name)}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{String(description)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeView === "ideas" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Content opportunities from real search demand</h3>
                  <p className="text-sm text-muted-foreground">Suggestions are generated from the returned query and page metrics, not sample keywords.</p>
                </div>
                <Badge variant="outline">{contentIdeas.length} suggestions</Badge>
              </div>
              {contentIdeas.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {contentIdeas.map((idea, index) => (
                    <Card key={idea.type + idea.source + index} className="rounded-2xl">
                      <CardContent className="flex h-full gap-3 p-5">
                        <div className="mt-0.5 rounded-xl bg-amber-500/10 p-2.5 text-amber-600">
                          <Lightbulb className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <Badge variant="secondary">{idea.type}</Badge>
                          <h4 className="mt-2 font-semibold">{idea.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{idea.reason}</p>
                          <p className="mt-3 truncate text-xs text-muted-foreground">Source: {idea.source}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="rounded-2xl">
                  <CardContent className="flex min-h-52 flex-col items-center justify-center text-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 font-medium">No content suggestions yet</p>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">More query data is needed before the dashboard can identify useful topics and page improvements.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeView === "actions" && (
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>SEO action tracker</CardTitle>
                    <CardDescription>Prioritized tasks generated from this Search Console reporting period</CardDescription>
                  </div>
                  <Badge variant="secondary">{completedActions.filter((id) => actionItems.some((item) => item.id === id)).length} / {actionItems.length} completed</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {actionItems.length ? (
                  <div className="space-y-3">
                    {actionItems.map((item) => {
                      const complete = completedActions.includes(item.id);
                      const ItemIcon = item.kind === "snippet" ? Search : item.kind === "ranking" ? TrendingUp : BookOpen;
                      return (
                        <div key={item.id} className={"flex items-start gap-3 rounded-xl border p-4 transition-colors " + (complete ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/70")}>
                          <button
                            type="button"
                            aria-label={complete ? "Mark task as not completed" : "Mark task as completed"}
                            onClick={() => toggleAction(item.id)}
                            className={"mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border " + (complete ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/40 text-transparent hover:border-emerald-600")}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={"text-sm font-semibold " + (complete ? "text-muted-foreground line-through" : "text-foreground")}>{item.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge variant="outline" className="hidden sm:inline-flex">{item.impact}</Badge>
                            <ItemIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-48 flex-col items-center justify-center text-center">
                    <ClipboardList className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 font-medium">No actions identified yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">The tracker will populate when the query and landing-page data show actionable opportunities.</p>
                  </div>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  Completion checkmarks are saved in this browser only. The rules prioritize pages with at least 20 impressions and CTR below 2%, and queries with at least 10 impressions ranking between positions 5 and 20.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <span>Property: {payload?.property || "Google Search Console"}</span>
            <span>Sitewide totals come from an ungrouped GSC request; query and page tables are ranked samples returned by Google.</span>
          </div>
        </>
      )}
    </section>
  );
};

export default GSCAnalytics;
