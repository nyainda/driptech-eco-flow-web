import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  CheckCircle2,
  CheckSquare,
  Copy,
  Download,
  ExternalLink,
  FileSearch,
  Globe,
  Layers,
  Lightbulb,
  Link2,
  MapPin,
  Monitor,
  RefreshCw,
  Search,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Square,
  Tablet,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { extractEdgeFunctionError } from "@/lib/edge-functions";
import {
  buildGscCsv,
  buildGscDiagnosticBrief,
  buildWeightedIntentSummary,
  classifyIntent,
  classifyPageSection,
  computeLowCtrPages,
  computeQuickWins,
  findCannibalizedQueries,
  formatCountryName,
  formatSearchAppearanceLabel,
  INTENT_COLORS,
  isBrandedQuery,
  isXmlSitemapUrl,
  mapQueryToTopPages,
  readablePage,
  summarizeBrandSplit,
  summarizePageSections,
  summarizeSitemaps,
  type GscPayload,
  type IntentName,
  type IntentWeightMode,
  type MetricRow,
  type PageSectionName,
  type UrlInspectionResult,
} from "@/lib/gscHelpers";

type SubTab =
  | "overview"
  | "keywords"
  | "pages"
  | "intent"
  | "indexing"
  | "ideas"
  | "actions";

const CHECKLIST_STORAGE_KEY = "driptech-gsc-completed-actions";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  denied: "Google Search Console authorization was cancelled or denied.",
  missing_parameters: "Google OAuth callback was missing required authorization parameters.",
  invalid_state: "Google OAuth session expired or did not match. Please try connecting again.",
  token_exchange_failed:
    "Google did not issue a refresh token. Try reconnecting and ensure offline access consent is granted.",
  save_failed: "Authorized with Google, but failed to save credentials in Supabase.",
};

const QUICK_INSPECT_PATHS = [
  "/",
  "/products",
  "/irrigation-kits",
  "/irrigation-guides-kenya",
  "/pump-solar-sizing",
  "/greenhouse-irrigation-kenya",
];

function formatNumber(value: number): string {
  return Math.round(value || 0).toLocaleString();
}

function formatPct(ctr: number): string {
  return `${((ctr || 0) * 100).toFixed(2)}%`;
}

function formatPos(pos: number): string {
  return (pos || 0) > 0 ? pos.toFixed(1) : "—";
}

function computeDelta(current: number, previous: number, inverse = false) {
  if (!previous) return null;
  const pct = ((current - previous) / previous) * 100;
  const positive = inverse ? pct < 0 : pct > 0;
  return {
    label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
    positive,
  };
}

function verdictBadgeVariant(verdict: string): "default" | "secondary" | "destructive" | "outline" {
  if (verdict === "PASS") return "default";
  if (verdict === "FAIL") return "destructive";
  if (verdict === "PARTIAL") return "secondary";
  return "outline";
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  delta?: { label: string; positive: boolean } | null;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, delta }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardDescription className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </CardDescription>
      <div className="flex items-baseline justify-between gap-2">
        <CardTitle className="text-2xl font-bold text-slate-900">{value}</CardTitle>
        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
              delta.positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {delta.positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {delta.label}
          </span>
        )}
      </div>
    </CardHeader>
    {subtitle && (
      <CardContent className="pt-0 text-xs text-slate-500">{subtitle}</CardContent>
    )}
  </Card>
);

async function parseErrorContextJson(
  invokeError: unknown,
): Promise<{ reconnectRequired?: boolean; connected?: boolean; error?: string } | null> {
  if (!invokeError || typeof invokeError !== "object" || !("context" in invokeError)) {
    return null;
  }
  const ctx = (invokeError as { context?: Response }).context;
  if (!ctx || typeof ctx.clone !== "function") return null;
  try {
    return (await ctx.clone().json()) as {
      reconnectRequired?: boolean;
      connected?: boolean;
      error?: string;
    };
  } catch {
    return null;
  }
}

export const GSCAnalytics: React.FC = () => {
  const [days, setDays] = useState<7 | 28 | 90>(28);
  const [countryFilter, setCountryFilter] = useState<"all" | "ken">("all");
  const [activeTab, setActiveTab] = useState<SubTab>("overview");
  const [payload, setPayload] = useState<GscPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [switchingProperty, setSwitchingProperty] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnectRequired, setReconnectRequired] = useState<boolean>(false);

  // Keyword filters
  const [kwSearch, setKwSearch] = useState("");
  const [kwIntent, setKwIntent] = useState<"ALL" | IntentName>("ALL");
  const [kwSegment, setKwSegment] = useState<"all" | "non_branded" | "branded">("all");
  const [kwSort, setKwSort] = useState<"clicks" | "impressions" | "position" | "ctr">("clicks");
  const [showAllKeywords, setShowAllKeywords] = useState(false);

  // Page filters
  const [pageSearch, setPageSearch] = useState("");
  const [pageSection, setPageSection] = useState<"ALL" | PageSectionName>("ALL");
  const [pageSort, setPageSort] = useState<"clicks" | "impressions" | "low_ctr">("clicks");

  // Intent weighting
  const [intentWeight, setIntentWeight] = useState<IntentWeightMode>("clicks");

  // Live URL Index Inspector
  const [inspectInput, setInspectInput] = useState("/pump-solar-sizing");
  const [inspecting, setInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<UrlInspectionResult | null>(null);
  const [inspectionError, setInspectionError] = useState<string | null>(null);

  // Action plan checklist
  const [completedActions, setCompletedActions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const loadReport = useCallback(
    async (targetDays: 7 | 28 | 90, targetCountry: "all" | "ken") => {
      setLoading(true);
      setError(null);
      setReconnectRequired(false);

      try {
        const { data: rawData, error: invokeError } = await supabase.functions.invoke(
          "gsc-analytics",
          {
            body: { action: "report", days: targetDays, country: targetCountry },
          },
        );
        const data = rawData as GscPayload | null;

        if (invokeError) {
          const parsedContext = await parseErrorContextJson(invokeError);
          const msg = await extractEdgeFunctionError(invokeError, data);
          if (parsedContext?.reconnectRequired) {
            setReconnectRequired(true);
            setPayload((prev) =>
              prev ? { ...prev, connected: true } : {
                connected: true,
                reconnectRequired: true,
                trend: [],
                queries: [],
                pages: [],
                devices: [],
              },
            );
          }
          setError(msg || "Could not load Google Search Console report.");
          return;
        }

        if (data?.error) {
          if (data.reconnectRequired) setReconnectRequired(true);
          setError(data.error);
          if (data.connected) setPayload(data);
          return;
        }

        setPayload(data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reach Search Console service.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Detect Google OAuth callback status on first mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const gscParam = url.searchParams.get("gsc");
    if (gscParam) {
      if (gscParam === "connected") {
        setNotice(
          "Google Search Console connected successfully. Loading verified DripTech organic metrics...",
        );
      } else {
        setError(
          OAUTH_ERROR_MESSAGES[gscParam] ||
            `Google Search Console connection returned status: ${gscParam}.`,
        );
      }
      url.searchParams.delete("gsc");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  useEffect(() => {
    void loadReport(days, countryFilter);
  }, [days, countryFilter, loadReport]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    setNotice(null);
    try {
      const { data: rawData, error: invokeError } = await supabase.functions.invoke(
        "gsc-oauth-start",
        { body: {} },
      );
      const data = rawData as { url?: string; error?: string } | null;
      if (invokeError) {
        const msg = await extractEdgeFunctionError(invokeError, data);
        setError(msg || "Unable to initiate Google Search Console login.");
        return;
      }
      if (!data?.url) {
        setError(data?.error || "Did not receive a Google authorization URL.");
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Google OAuth.");
    } finally {
      setConnecting(false);
    }
  };

  const handlePropertySwitch = async (propertyUrl: string) => {
    if (!propertyUrl || propertyUrl === payload?.property) return;
    setSwitchingProperty(true);
    setError(null);
    setNotice(null);
    try {
      const { data: rawData, error: invokeError } = await supabase.functions.invoke(
        "gsc-analytics",
        {
          body: { action: "set_property", propertyUrl },
        },
      );
      const data = rawData as {
        connected?: boolean;
        property?: string;
        error?: string;
      } | null;
      if (invokeError) {
        const msg = await extractEdgeFunctionError(invokeError, data);
        setError(msg || "Could not switch Search Console property.");
        return;
      }
      setNotice(`Switched active Search Console property to ${propertyUrl}.`);
      await loadReport(days, countryFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch property.");
    } finally {
      setSwitchingProperty(false);
    }
  };

  const handleInspectUrl = async (targetUrl?: string) => {
    const queryUrl = (targetUrl ?? inspectInput).trim();
    if (!queryUrl) {
      setInspectionError("Enter a DripTech page URL or path (e.g. /pump-solar-sizing).");
      return;
    }
    if (targetUrl) {
      setInspectInput(readablePage(targetUrl));
      setActiveTab("indexing");
    }
    setInspecting(true);
    setInspectionError(null);
    try {
      const { data: rawData, error: invokeError } = await supabase.functions.invoke(
        "gsc-analytics",
        {
          body: { action: "inspect_url", url: queryUrl },
        },
      );
      const data = rawData as {
        connected?: boolean;
        inspection?: UrlInspectionResult;
        error?: string;
      } | null;
      if (invokeError) {
        const msg = await extractEdgeFunctionError(invokeError, data);
        setInspectionError(msg || "URL inspection failed.");
        return;
      }
      if (data?.error || !data?.inspection) {
        setInspectionError(data?.error || "No inspection data returned by Google.");
        return;
      }
      setInspectionResult(data.inspection);
    } catch (err) {
      setInspectionError(
        err instanceof Error ? err.message : "Could not inspect URL via Search Console API.",
      );
    } finally {
      setInspecting(false);
    }
  };

  const toggleActionItem = (id: string) => {
    setCompletedActions((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors in private mode
      }
      return next;
    });
  };

  // Memoized SEO Intelligence derivations
  const queryPageMap = useMemo(
    () => mapQueryToTopPages(payload?.queryPages || []),
    [payload?.queryPages],
  );

  const brandSplit = useMemo(
    () => summarizeBrandSplit(payload?.queries || []),
    [payload?.queries],
  );

  const intentSummary = useMemo(
    () => buildWeightedIntentSummary(payload?.queries || [], intentWeight),
    [payload?.queries, intentWeight],
  );

  const cannibalizedQueries = useMemo(
    () => findCannibalizedQueries(payload?.queryPages || [], 20),
    [payload?.queryPages],
  );

  const quickWins = useMemo(
    () => computeQuickWins(payload?.queries || [], queryPageMap, 15),
    [payload?.queries, queryPageMap],
  );

  const lowCtrPages = useMemo(
    () => computeLowCtrPages(payload?.pages || [], 50),
    [payload?.pages],
  );

  const sectionSummary = useMemo(
    () => summarizePageSections(payload?.pages || []),
    [payload?.pages],
  );

  const sitemapSummary = useMemo(
    () => summarizeSitemaps(payload?.sitemaps || []),
    [payload?.sitemaps],
  );

  const filteredQueries = useMemo(() => {
    const searchLower = kwSearch.trim().toLowerCase();
    const list = (payload?.queries || []).filter((row) => {
      const q = row.keys[0] || "";
      if (searchLower && !q.toLowerCase().includes(searchLower)) return false;
      if (kwIntent !== "ALL" && classifyIntent(q) !== kwIntent) return false;
      if (kwSegment === "branded" && !isBrandedQuery(q)) return false;
      if (kwSegment === "non_branded" && isBrandedQuery(q)) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (kwSort === "impressions") return b.impressions - a.impressions;
      if (kwSort === "ctr") return b.ctr - a.ctr;
      if (kwSort === "position") return a.position - b.position;
      return b.clicks - a.clicks || b.impressions - a.impressions;
    });
  }, [payload?.queries, kwSearch, kwIntent, kwSegment, kwSort]);

  const filteredPages = useMemo(() => {
    const searchLower = pageSearch.trim().toLowerCase();
    const list = (payload?.pages || []).filter((row) => {
      const url = row.keys[0] || "";
      const path = readablePage(url).toLowerCase();
      if (searchLower && !path.includes(searchLower)) return false;
      if (pageSection !== "ALL" && classifyPageSection(url) !== pageSection) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (pageSort === "impressions") return b.impressions - a.impressions;
      if (pageSort === "low_ctr") {
        const bGap = Math.max(0, b.impressions * 0.05 - b.clicks);
        const aGap = Math.max(0, a.impressions * 0.05 - a.clicks);
        return bGap - aGap;
      }
      return b.clicks - a.clicks || b.impressions - a.impressions;
    });
  }, [payload?.pages, pageSearch, pageSection, pageSort]);

  const actionPlanItems = useMemo(() => {
    const items: Array<{
      id: string;
      priority: "High" | "Medium" | "Monitor";
      title: string;
      detail: string;
      targetUrl?: string;
    }> = [];

    if (cannibalizedQueries.length > 0) {
      const topCannibal = cannibalizedQueries[0];
      items.push({
        id: "resolve-cannibalization",
        priority: "High",
        title: `Consolidate ${cannibalizedQueries.length} keyword cannibalization conflict(s)`,
        detail: `"${topCannibal.query}" splits ${formatNumber(topCannibal.totalImpressions)} impressions across ${topCannibal.pages.length} URLs (primary: ${readablePage(topCannibal.primaryPage)}). Reinforce one canonical target and link secondary pages to it.`,
        targetUrl: topCannibal.primaryPage,
      });
    }

    if (quickWins.length > 0) {
      const topWin = quickWins[0];
      items.push({
        id: "push-quick-wins",
        priority: "High",
        title: `Boost ${quickWins.length} striking-distance keywords (Pos 4–20)`,
        detail: `Top upside: "${topWin.keys[0]}" ranks #${formatPos(topWin.position)} with ${formatNumber(topWin.impressions)} impressions (+~${formatNumber(topWin.upsideClicks)} estimated clicks/period)${topWin.topPage ? ` on ${readablePage(topWin.topPage)}` : ""}.`,
        targetUrl: topWin.topPage || undefined,
      });
    }

    if (lowCtrPages.length > 0) {
      const topLowCtr = lowCtrPages[0];
      items.push({
        id: "improve-low-ctr-titles",
        priority: "High",
        title: `Rewrite titles & meta descriptions on ${lowCtrPages.length} low-CTR pages`,
        detail: `${readablePage(topLowCtr.keys[0])} has ${formatNumber(topLowCtr.impressions)} impressions at ${formatPct(topLowCtr.ctr)} CTR. Add clear KES pricing / Kenya delivery cues to lift clicks.`,
        targetUrl: topLowCtr.keys[0],
      });
    }

    if (sitemapSummary.sitemapCount > 0) {
      const ratio =
        sitemapSummary.totalSubmitted > 0
          ? Math.round((sitemapSummary.totalIndexed / sitemapSummary.totalSubmitted) * 100)
          : 0;
      items.push({
        id: "monitor-sitemap-coverage",
        priority: sitemapSummary.totalErrors > 0 || ratio < 70 ? "High" : "Monitor",
        title: `Sitemap indexing coverage: ${sitemapSummary.totalIndexed}/${sitemapSummary.totalSubmitted} URLs (${ratio}%)`,
        detail:
          sitemapSummary.totalErrors > 0 || sitemapSummary.totalWarnings > 0
            ? `${sitemapSummary.totalErrors} sitemap error(s) and ${sitemapSummary.totalWarnings} warning(s) reported by Search Console.`
            : "Inspect unindexed calculators, product pages, or county landing pages in the Indexing & Cannibalization tab.",
      });
    }

    const productSnippet = (payload?.searchAppearances || []).find((s) =>
      (s.keys[0] || "").includes("PRODUCT"),
    );
    items.push({
      id: "verify-product-snippets",
      priority: productSnippet ? "Monitor" : "Medium",
      title: productSnippet
        ? `Product Snippets active (${formatNumber(productSnippet.impressions)} impressions)`
        : "Validate Product JSON-LD snippets & availability in Search Console",
      detail:
        "Ensure all DripTech products & irrigation kits include schema availability, review ratings, and accurate KES prices for Google Merchant / Product rich results.",
      targetUrl: "/products",
    });

    return items;
  }, [
    cannibalizedQueries,
    quickWins,
    lowCtrPages,
    sitemapSummary,
    payload?.searchAppearances,
  ]);

  const handleExportCsv = () => {
    const csv = buildGscCsv(filteredQueries, queryPageMap);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `driptech-gsc-${countryFilter}-${days}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyBrief = async () => {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(buildGscDiagnosticBrief(payload));
      setNotice("Copied full Google Search Console diagnostic brief to clipboard.");
    } catch {
      setError("Could not access clipboard. Use Export CSV on the Keywords tab instead.");
    }
  };

  const totals = payload?.totals;
  const prevTotals = payload?.previousTotals;
  const isConnected = Boolean(payload?.connected);

  if (loading && !payload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-emerald-600" />
            Google Search Console · DripTech Organic Search
          </CardTitle>
          <CardDescription>
            Loading verified queries, landing pages, indexation status, and Kenya search demand...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="h-24 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {notice && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle>Search Console Updated</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{notice}</span>
            <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {reconnectRequired
              ? "Google Search Console Re-Authorization Required"
              : "Search Console Error"}
          </AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            {reconnectRequired && (
              <Button
                size="sm"
                variant="outline"
                className="bg-white text-slate-900 hover:bg-slate-100"
                onClick={handleConnect}
                disabled={connecting}
              >
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
                {connecting ? "Redirecting..." : "Reconnect Google"}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!isConnected ? (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-emerald-600" />
              Connect Google Search Console
            </CardTitle>
            <CardDescription>
              Link your verified Search Console property (e.g.{" "}
              <code>sc-domain:dripstech.co.ke</code> or <code>https://www.dripstech.co.ke/</code>)
              to track Kenya buyer keywords, ranking landing pages, cannibalization, sitemaps, and
              live URL indexation directly inside DripTech Admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleConnect} disabled={connecting}>
              <Link2 className="mr-2 h-4 w-4" />
              {connecting ? "Connecting to Google..." : "Connect Google Search Console"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header Controls */}
          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      <Search className="h-5 w-5 text-emerald-600" />
                      SEO Performance · Google Search Console
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700"
                    >
                      Connected{payload?.email ? ` · ${payload.email}` : ""}
                    </Badge>
                    {countryFilter === "ken" && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        <MapPin className="mr-1 h-3 w-3" /> Kenya Traffic Only
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {payload?.startDate && payload?.endDate && (
                      <span>
                        Window: <strong>{payload.startDate}</strong> to{" "}
                        <strong>{payload.endDate}</strong> (vs{" "}
                        {payload.previousStartDate} → {payload.previousEndDate})
                      </span>
                    )}
                    {(payload?.verifiedProperties?.length || 0) > 1 ? (
                      <label className="inline-flex items-center gap-1.5">
                        <span>Property:</span>
                        <select
                          aria-label="Active Search Console property"
                          className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-800"
                          value={payload?.property || ""}
                          disabled={switchingProperty}
                          onChange={(e) => void handlePropertySwitch(e.target.value)}
                        >
                          {payload?.verifiedProperties?.map((prop) => (
                            <option key={prop.siteUrl} value={prop.siteUrl}>
                              {prop.siteUrl}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : payload?.property ? (
                      <span>
                        Property: <code>{payload.property}</code>
                      </span>
                    ) : null}
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Market filter */}
                  <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
                    <Button
                      size="sm"
                      variant={countryFilter === "all" ? "default" : "ghost"}
                      className="h-7 px-2.5 text-xs"
                      onClick={() => setCountryFilter("all")}
                    >
                      <Globe className="mr-1 h-3.5 w-3.5" />
                      All Countries
                    </Button>
                    <Button
                      size="sm"
                      variant={countryFilter === "ken" ? "default" : "ghost"}
                      className="h-7 px-2.5 text-xs"
                      onClick={() => setCountryFilter("ken")}
                    >
                      <MapPin className="mr-1 h-3.5 w-3.5" />
                      Kenya (KE)
                    </Button>
                  </div>

                  {/* Period toggle */}
                  <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
                    {([7, 28, 90] as const).map((periodDays) => (
                      <Button
                        key={periodDays}
                        size="sm"
                        variant={days === periodDays ? "default" : "ghost"}
                        className="h-7 px-2.5 text-xs"
                        onClick={() => setDays(periodDays)}
                      >
                        {periodDays}d
                      </Button>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void loadReport(days, countryFilter)}
                    disabled={loading}
                  >
                    <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleCopyBrief()}
                    disabled={!payload}
                    title="Copy Markdown SEO diagnostic brief for review"
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy Brief
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleConnect}
                    disabled={connecting}
                    title="Re-authorize Google Search Console"
                  >
                    <Link2 className="mr-1 h-3.5 w-3.5" />
                    Reconnect
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Main Sub-Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SubTab)}>
            <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-slate-100 p-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="keywords" className="text-xs sm:text-sm">
                Keywords ({payload?.queries?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pages" className="text-xs sm:text-sm">
                Pages ({payload?.pages?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="intent" className="text-xs sm:text-sm">
                Search Intent
              </TabsTrigger>
              <TabsTrigger value="indexing" className="text-xs sm:text-sm">
                Indexing & Cannibalization
                {cannibalizedQueries.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
                    {cannibalizedQueries.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ideas" className="text-xs sm:text-sm">
                Opportunities ({quickWins.length + lowCtrPages.length})
              </TabsTrigger>
              <TabsTrigger value="actions" className="text-xs sm:text-sm">
                Action Plan ({completedActions.length}/{actionPlanItems.length})
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Organic Clicks"
                  value={formatNumber(totals?.clicks || 0)}
                  subtitle={`Prev period: ${formatNumber(prevTotals?.clicks || 0)}`}
                  delta={
                    totals && prevTotals
                      ? computeDelta(totals.clicks, prevTotals.clicks)
                      : null
                  }
                />
                <MetricCard
                  title="Search Impressions"
                  value={formatNumber(totals?.impressions || 0)}
                  subtitle={`Prev period: ${formatNumber(prevTotals?.impressions || 0)}`}
                  delta={
                    totals && prevTotals
                      ? computeDelta(totals.impressions, prevTotals.impressions)
                      : null
                  }
                />
                <MetricCard
                  title="Average CTR"
                  value={formatPct(totals?.ctr || 0)}
                  subtitle={`Prev period: ${formatPct(prevTotals?.ctr || 0)}`}
                  delta={
                    totals && prevTotals ? computeDelta(totals.ctr, prevTotals.ctr) : null
                  }
                />
                <MetricCard
                  title="Average Position"
                  value={formatPos(totals?.position || 0)}
                  subtitle={`Prev period: ${formatPos(prevTotals?.position || 0)} (lower is better)`}
                  delta={
                    totals && prevTotals
                      ? computeDelta(totals.position, prevTotals.position, true)
                      : null
                  }
                />
              </div>

              {/* Branded vs Non-Branded Organic Demand Split */}
              <div className="grid gap-3 md:grid-cols-2">
                <Card className="border-emerald-200 bg-emerald-50/40">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                        <Target className="h-4 w-4 text-emerald-600" />
                        Non-Branded Buyer Searches (New Customer Discovery)
                      </CardTitle>
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        {brandSplit.nonBranded.queries} queries
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500">Clicks</div>
                      <div className="text-base font-bold text-slate-900">
                        {formatNumber(brandSplit.nonBranded.clicks)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Impressions</div>
                      <div className="text-base font-bold text-slate-900">
                        {formatNumber(brandSplit.nonBranded.impressions)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">CTR</div>
                      <div className="text-base font-bold text-slate-900">
                        {formatPct(brandSplit.nonBranded.ctr)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Avg Pos</div>
                      <div className="text-base font-bold text-slate-900">
                        {formatPos(brandSplit.nonBranded.avgPosition)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Award className="h-4 w-4 text-teal-600" />
                        Branded Searches (DripTech Name Recall)
                      </CardTitle>
                      <Badge variant="outline">{brandSplit.branded.queries} queries</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500">Clicks</div>
                      <div className="text-base font-bold text-slate-900">
                        {formatNumber(brandSplit.branded.clicks)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Impressions</div>
                      <div className="text-base font-bold text-slate-900">
                        {formatNumber(brandSplit.branded.impressions)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">CTR</div>
                      <div className="text-base font-bold text-slate-900">
                        {formatPct(brandSplit.branded.ctr)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Avg Pos</div>
                      <div className="text-base font-bold text-slate-900">
                        {formatPos(brandSplit.branded.avgPosition)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Clicks & Impressions Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Daily Organic Clicks & Impressions</CardTitle>
                  <CardDescription>
                    Up to 1,000 queries & pages retrieved per report window
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(payload?.trend?.length || 0) === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-500">
                      No daily trend rows available for this date range and country filter yet.
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={(payload?.trend || []).map((row) => ({
                            date: row.keys[0],
                            clicks: row.clicks,
                            impressions: row.impressions,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
                          <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="impressions"
                            name="Impressions"
                            stroke="#94a3b8"
                            fill="#e2e8f0"
                            fillOpacity={0.5}
                          />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="clicks"
                            name="Clicks"
                            stroke="#059669"
                            fill="#10b981"
                            fillOpacity={0.25}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Geography, Devices, Search Appearance & Sitemaps */}
              <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Globe className="h-4 w-4 text-emerald-600" />
                      Top Countries
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Click Kenya to focus reports on local buyers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(payload?.countries || []).slice(0, 6).map((c) => {
                      const code = (c.keys[0] || "").toLowerCase();
                      const isKenya = code === "ken";
                      return (
                        <div
                          key={c.keys[0]}
                          className="flex items-center justify-between rounded border border-slate-100 px-2.5 py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-2 font-medium text-slate-800">
                            <span>{formatCountryName(code)}</span>
                            {isKenya && countryFilter !== "ken" && (
                              <button
                                type="button"
                                className="text-[11px] text-emerald-700 underline hover:text-emerald-900"
                                onClick={() => setCountryFilter("ken")}
                              >
                                Filter KE
                              </button>
                            )}
                          </div>
                          <div className="text-right text-slate-600">
                            <strong className="text-slate-900">{formatNumber(c.clicks)}</strong> clicks ·{" "}
                            {formatNumber(c.impressions)} impr
                          </div>
                        </div>
                      );
                    })}
                    {(payload?.countries?.length || 0) === 0 && (
                      <p className="text-xs text-slate-500">No country breakdown available.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      Device Breakdown
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Mobile dominates Kenyan farm & agritech searches
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(payload?.devices || []).map((dev) => {
                      const label = (dev.keys[0] || "UNKNOWN").toUpperCase();
                      const Icon =
                        label === "MOBILE"
                          ? Smartphone
                          : label === "TABLET"
                          ? Tablet
                          : Monitor;
                      return (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded border border-slate-100 px-2.5 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2 font-medium text-slate-800">
                            <Icon className="h-3.5 w-3.5 text-slate-500" />
                            <span>{label}</span>
                          </div>
                          <div className="text-right text-slate-600">
                            <strong className="text-slate-900">{formatNumber(dev.clicks)}</strong> clicks ·{" "}
                            {formatPct(dev.ctr)} CTR · Pos {formatPos(dev.position)}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      Rich Results & Sitemap Health
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Structured data snippets + Google sitemap indexation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between rounded bg-slate-50 px-2.5 py-2">
                      <span className="font-medium text-slate-700">Sitemaps Indexed</span>
                      <span className="font-semibold text-slate-900">
                        {formatNumber(sitemapSummary.totalIndexed)} /{" "}
                        {formatNumber(sitemapSummary.totalSubmitted)} URLs
                      </span>
                    </div>
                    {(payload?.searchAppearances || []).slice(0, 4).map((sa) => (
                      <div
                        key={sa.keys[0]}
                        className="flex items-center justify-between rounded border border-slate-100 px-2.5 py-1.5"
                      >
                        <span className="font-medium text-slate-800">
                          {formatSearchAppearanceLabel(sa.keys[0])}
                        </span>
                        <span className="text-slate-600">
                          <strong>{formatNumber(sa.clicks)}</strong> clicks ·{" "}
                          {formatNumber(sa.impressions)} impr
                        </span>
                      </div>
                    ))}
                    {(payload?.searchAppearances?.length || 0) === 0 && (
                      <p className="text-slate-500">
                        No special Search Appearance snippets recorded in this window yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* KEYWORDS TAB */}
            <TabsContent value="keywords" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Search Queries ({filteredQueries.length} matched / {payload?.queries?.length || 0} loaded)
                      </CardTitle>
                      <CardDescription>
                        Includes matched landing page and cannibalization indicators from query-page pairs
                      </CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleExportCsv}>
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Export CSV
                    </Button>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Input
                      placeholder="Filter keywords..."
                      value={kwSearch}
                      onChange={(e) => setKwSearch(e.target.value)}
                    />
                    <select
                      aria-label="Filter by search intent"
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
                      value={kwIntent}
                      onChange={(e) => setKwIntent(e.target.value as "ALL" | IntentName)}
                    >
                      <option value="ALL">All Intents</option>
                      {Object.keys(INTENT_COLORS).map((intentName) => (
                        <option key={intentName} value={intentName}>
                          {intentName}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter by brand segment"
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
                      value={kwSegment}
                      onChange={(e) =>
                        setKwSegment(e.target.value as "all" | "non_branded" | "branded")
                      }
                    >
                      <option value="all">All Segments (Branded + Non-Branded)</option>
                      <option value="non_branded">Non-Branded Only</option>
                      <option value="branded">Branded Only (DripTech)</option>
                    </select>
                    <select
                      aria-label="Sort keywords"
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
                      value={kwSort}
                      onChange={(e) =>
                        setKwSort(
                          e.target.value as "clicks" | "impressions" | "position" | "ctr",
                        )
                      }
                    >
                      <option value="clicks">Sort: Most Clicks</option>
                      <option value="impressions">Sort: Most Impressions</option>
                      <option value="position">Sort: Best Position</option>
                      <option value="ctr">Sort: Highest CTR</option>
                    </select>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Query</TableHead>
                          <TableHead>Intent</TableHead>
                          <TableHead>Top Landing Page</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead className="text-right">Impressions</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Pos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(showAllKeywords
                          ? filteredQueries
                          : filteredQueries.slice(0, 100)
                        ).map((row) => {
                          const query = row.keys[0] || "";
                          const intent = classifyIntent(query);
                          const matchedPages = queryPageMap.get(query.trim().toLowerCase()) || [];
                          const topUrl = matchedPages[0]?.keys[1];
                          return (
                            <TableRow key={query}>
                              <TableCell className="font-medium text-slate-900">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span>{query}</span>
                                  {isBrandedQuery(query) && (
                                    <Badge variant="outline" className="text-[10px]">
                                      Brand
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`whitespace-nowrap text-[11px] ${INTENT_COLORS[intent]}`}
                                >
                                  {intent.split(" (")[0]}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[240px]">
                                {topUrl ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => void handleInspectUrl(topUrl)}
                                      className="truncate text-left text-xs text-emerald-700 hover:underline"
                                      title={`Inspect ${topUrl}`}
                                    >
                                      {readablePage(topUrl)}
                                    </button>
                                    {matchedPages.length > 1 && (
                                      <Badge
                                        variant="secondary"
                                        className="shrink-0 px-1 py-0 text-[10px]"
                                        title={`${matchedPages.length} URLs rank for this query`}
                                      >
                                        {matchedPages.length} URLs
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatNumber(row.clicks)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(row.impressions)}
                              </TableCell>
                              <TableCell className="text-right">{formatPct(row.ctr)}</TableCell>
                              <TableCell className="text-right">{formatPos(row.position)}</TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredQueries.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                              No keywords match the current filter criteria.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredQueries.length > 100 && (
                    <div className="mt-3 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllKeywords((prev) => !prev)}
                      >
                        {showAllKeywords
                          ? "Show Top 100 Only"
                          : `Show All ${filteredQueries.length} Keywords`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PAGES & SECTIONS TAB */}
            <TabsContent value="pages" className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sectionSummary.map((sec) => (
                  <Card
                    key={sec.section}
                    className={`cursor-pointer transition-colors ${
                      pageSection === sec.section
                        ? "border-emerald-500 bg-emerald-50/40"
                        : "hover:border-slate-300"
                    }`}
                    onClick={() =>
                      setPageSection((prev) => (prev === sec.section ? "ALL" : sec.section))
                    }
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                          <Layers className="h-4 w-4 text-emerald-600" />
                          {sec.section}
                        </CardTitle>
                        <Badge variant="outline">{sec.pages} URLs</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between text-xs text-slate-600">
                      <span>
                        <strong className="text-slate-900">{formatNumber(sec.clicks)}</strong> clicks ·{" "}
                        {formatNumber(sec.impressions)} impr
                      </span>
                      <span>Pos {formatPos(sec.avgPosition)}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Landing Pages ({filteredPages.length})
                      </CardTitle>
                      <CardDescription>
                        Click any site section card above to slice traffic by section, or inspect live indexing
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Input
                        className="w-56"
                        placeholder="Filter URL path..."
                        value={pageSearch}
                        onChange={(e) => setPageSearch(e.target.value)}
                      />
                      <select
                        aria-label="Sort pages"
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
                        value={pageSort}
                        onChange={(e) =>
                          setPageSort(e.target.value as "clicks" | "impressions" | "low_ctr")
                        }
                      >
                        <option value="clicks">Most Clicks</option>
                        <option value="impressions">Most Impressions</option>
                        <option value="low_ctr">Biggest CTR Gap</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Page Path</TableHead>
                          <TableHead>Section</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead className="text-right">Impressions</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Pos</TableHead>
                          <TableHead className="text-right">Inspect</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPages.slice(0, 100).map((row) => {
                          const url = row.keys[0] || "";
                          return (
                            <TableRow key={url}>
                              <TableCell className="max-w-xs">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
                                >
                                  <span className="truncate">{readablePage(url)}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[11px]">
                                  {classifyPageSection(url)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatNumber(row.clicks)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(row.impressions)}
                              </TableCell>
                              <TableCell className="text-right">{formatPct(row.ctr)}</TableCell>
                              <TableCell className="text-right">{formatPos(row.position)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => void handleInspectUrl(url)}
                                >
                                  <FileSearch className="mr-1 h-3.5 w-3.5" />
                                  Inspect
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* WEIGHTED SEARCH INTENT TAB */}
            <TabsContent value="intent" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Search Intent Distribution
                      </CardTitle>
                      <CardDescription>
                        Compare how much real traffic vs visibility each buyer intent drives
                      </CardDescription>
                    </div>
                    <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
                      {(
                        [
                          { id: "clicks", label: "By Clicks" },
                          { id: "impressions", label: "By Impressions" },
                          { id: "queries", label: "By Query Count" },
                        ] as const
                      ).map((mode) => (
                        <Button
                          key={mode.id}
                          size="sm"
                          variant={intentWeight === mode.id ? "default" : "ghost"}
                          className="h-7 px-2.5 text-xs"
                          onClick={() => setIntentWeight(mode.id)}
                        >
                          {mode.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {intentSummary.map((item) => (
                    <div key={item.intent} className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={INTENT_COLORS[item.intent]}>
                            {item.intent}
                          </Badge>
                          <span className="text-slate-500">{item.queries} queries</span>
                        </div>
                        <div className="text-slate-700">
                          <strong>{formatNumber(item.clicks)}</strong> clicks ·{" "}
                          {formatNumber(item.impressions)} impr · CTR {formatPct(item.avgCtr)} · Pos{" "}
                          {formatPos(item.avgPosition)} ({(item.share * 100).toFixed(1)}%)
                        </div>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all"
                          style={{ width: `${Math.max(2, item.share * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* INDEXING, URL INSPECTOR, SITEMAPS & CANNIBALIZATION TAB */}
            <TabsContent value="indexing" className="space-y-4">
              {/* Live Google URL Index Inspector */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileSearch className="h-4 w-4 text-emerald-600" />
                    Live Google URL Index Inspector
                  </CardTitle>
                  <CardDescription>
                    Query Google Search Console directly for index coverage, canonical URL chosen by
                    Google, crawl timestamp, and rich result eligibility
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="/pump-solar-sizing or https://www.dripstech.co.ke/products/..."
                      value={inspectInput}
                      onChange={(e) => setInspectInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleInspectUrl();
                      }}
                    />
                    <Button
                      onClick={() => void handleInspectUrl()}
                      disabled={inspecting}
                      className="shrink-0"
                    >
                      <FileSearch className="mr-1.5 h-4 w-4" />
                      {inspecting ? "Inspecting..." : "Inspect URL"}
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="mr-1 font-medium text-slate-600">Quick check: </span>
                    {QUICK_INSPECT_PATHS.map((path) => (
                      <button
                        key={path}
                        type="button"
                        onClick={() => void handleInspectUrl(path)}
                        className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-100"
                      >
                        {path}
                      </button>
                    ))}
                  </div>

                  {inspectionError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{inspectionError}</AlertDescription>
                    </Alert>
                  )}

                  {inspectionResult && (
                    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900">
                            {inspectionResult.inspectionUrl}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={verdictBadgeVariant(inspectionResult.verdict)}>
                              {inspectionResult.verdict}
                            </Badge>
                            <span className="font-medium text-slate-700">
                              {inspectionResult.coverageState}
                            </span>
                          </div>
                        </div>
                        {inspectionResult.inspectionResultLink && (
                          <a
                            href={inspectionResult.inspectionResultLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
                          >
                            Open in Search Console
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded bg-white p-2.5">
                          <div className="text-slate-500">Indexing State</div>
                          <div className="font-medium text-slate-900">
                            {inspectionResult.indexingState}
                          </div>
                        </div>
                        <div className="rounded bg-white p-2.5">
                          <div className="text-slate-500">Page Fetch & Robots</div>
                          <div className="font-medium text-slate-900">
                            {inspectionResult.pageFetchState} · {inspectionResult.robotsTxtState}
                          </div>
                        </div>
                        <div className="rounded bg-white p-2.5">
                          <div className="text-slate-500">Last Crawl ({inspectionResult.crawledAs})</div>
                          <div className="font-medium text-slate-900">
                            {inspectionResult.lastCrawlTime
                              ? new Date(inspectionResult.lastCrawlTime).toLocaleString()
                              : "Not yet crawled"}
                          </div>
                        </div>
                        <div className="rounded bg-white p-2.5">
                          <div className="text-slate-500">Mobile & Rich Results</div>
                          <div className="font-medium text-slate-900">
                            {inspectionResult.mobileVerdict} · {inspectionResult.richResultsVerdict}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2 text-slate-600 sm:grid-cols-2">
                        <div className="rounded bg-white px-2.5 py-1.5">
                          <span className="text-slate-500">User Canonical: </span>
                          <code className="break-all text-slate-900">
                            {inspectionResult.userCanonical || "None"}
                          </code>
                        </div>
                        <div className="rounded bg-white px-2.5 py-1.5">
                          <span className="text-slate-500">Google Canonical: </span>
                          <code className="break-all text-slate-900">
                            {inspectionResult.googleCanonical || "None"}
                          </code>
                        </div>
                      </div>
                      {inspectionResult.richResultTypes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-slate-600">
                          <span>Detected Schema:</span>
                          {inspectionResult.richResultTypes.map((typeName) => (
                            <Badge key={typeName} variant="outline">
                              {typeName}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Keyword Cannibalization Detection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    Keyword Cannibalization Alerts ({cannibalizedQueries.length})
                  </CardTitle>
                  <CardDescription>
                    Queries where two or more DripTech URLs split meaningful impressions (20+
                    total impressions). Consolidating signals helps one page break into top 3.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cannibalizedQueries.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No significant keyword cannibalization conflicts detected in this window.
                    </p>
                  ) : (
                    cannibalizedQueries.slice(0, 20).map((conflict) => (
                      <div
                        key={conflict.query}
                        className="rounded-lg border border-slate-200 p-3 text-xs"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold text-slate-900">
                            "{conflict.query}"
                          </div>
                          <div className="text-slate-600">
                            {formatNumber(conflict.totalClicks)} clicks ·{" "}
                            {formatNumber(conflict.totalImpressions)} impr across{" "}
                            {conflict.pages.length} URLs
                          </div>
                        </div>
                        <div className="space-y-1">
                          {conflict.pages.slice(0, 4).map((p, idx) => (
                            <div
                              key={p.page}
                              className="flex flex-wrap items-center justify-between gap-2 rounded bg-slate-50 px-2.5 py-1.5"
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant={idx === 0 ? "default" : "outline"} className="text-[10px]">
                                  {idx === 0 ? "Primary" : `#${idx + 1}`}
                                </Badge>
                                <button
                                  type="button"
                                  onClick={() => void handleInspectUrl(p.page)}
                                  className="text-emerald-700 hover:underline"
                                >
                                  {readablePage(p.page)}
                                </button>
                              </div>
                              <span className="text-slate-600">
                                {(p.share * 100).toFixed(0)}% share · {formatNumber(p.clicks)} clicks ·{" "}
                                {formatNumber(p.impressions)} impr · Pos {formatPos(p.position)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Submitted Sitemaps Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Submitted Sitemaps ({payload?.sitemaps?.length || 0})
                  </CardTitle>
                  <CardDescription>
                    Live status from Google Webmasters Sitemaps API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sitemap URL</TableHead>
                        <TableHead>Last Downloaded</TableHead>
                        <TableHead className="text-right">Submitted</TableHead>
                        <TableHead className="text-right">Indexed</TableHead>
                        <TableHead className="text-right">Errors / Warnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(payload?.sitemaps || []).map((sm) => {
                        const submitted = (sm.contents || []).reduce(
                          (acc, c) => acc + Number(c.submitted || 0),
                          0,
                        );
                        const indexed = (sm.contents || []).reduce(
                          (acc, c) => acc + Number(c.indexed || 0),
                          0,
                        );
                        const invalidNonXml = !isXmlSitemapUrl(sm.path);
                        return (
                          <TableRow
                            key={sm.path}
                            className={invalidNonXml ? "bg-rose-50/50" : undefined}
                          >
                            <TableCell className="space-y-1">
                              <div className="font-mono text-xs">{sm.path}</div>
                              {invalidNonXml && (
                                <div className="text-[11px] font-medium text-rose-700">
                                  Not an XML sitemap — delete this entry in Search Console → Sitemaps and keep only{" "}
                                  <code>/sitemap.xml</code>.
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              {sm.lastDownloaded
                                ? new Date(sm.lastDownloaded).toLocaleDateString()
                                : "Pending"}
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(submitted)}</TableCell>
                            <TableCell className="text-right font-semibold text-emerald-700">
                              {formatNumber(indexed)}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {Number(sm.errors || 0)} err / {Number(sm.warnings || 0)} warn
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(payload?.sitemaps?.length || 0) === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                            No sitemaps returned by Google Search Console for this property.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* OPPORTUNITIES TAB */}
            <TabsContent value="ideas" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Striking-Distance Quick Wins (Positions 4–20)
                    </CardTitle>
                    <CardDescription>
                      Queries with 15+ impressions sitting just below the top 3 results
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {quickWins.slice(0, 12).map((kw) => (
                      <div
                        key={kw.keys[0]}
                        className="flex items-center justify-between gap-2 rounded border border-slate-100 p-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-900">
                            {kw.keys[0]}
                          </div>
                          <div className="mt-0.5 text-slate-500">
                            Pos {formatPos(kw.position)} · {formatNumber(kw.impressions)} impr ·{" "}
                            {formatPct(kw.ctr)} CTR
                            {kw.topPage && (
                              <button
                                type="button"
                                onClick={() => void handleInspectUrl(kw.topPage!)}
                                className="ml-2 text-emerald-700 hover:underline"
                              >
                                {readablePage(kw.topPage)}
                              </button>
                            )}
                          </div>
                        </div>
                        <Badge className="shrink-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          +{formatNumber(kw.upsideClicks)} est clicks
                        </Badge>
                      </div>
                    ))}
                    {quickWins.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No qualifying position 4–20 opportunities in this window.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4 text-blue-600" />
                      Low-CTR Pages (&lt; 2.5% CTR on 50+ Impr)
                    </CardTitle>
                    <CardDescription>
                      High-visibility URLs losing clicks due to generic titles or missing meta cues
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {lowCtrPages.slice(0, 12).map((page) => (
                      <div
                        key={page.keys[0]}
                        className="flex items-center justify-between gap-2 rounded border border-slate-100 p-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => void handleInspectUrl(page.keys[0])}
                            className="block truncate font-medium text-emerald-700 hover:underline"
                          >
                            {readablePage(page.keys[0])}
                          </button>
                          <div className="mt-0.5 text-slate-500">
                            {formatNumber(page.impressions)} impr · {formatNumber(page.clicks)}{" "}
                            clicks · Pos {formatPos(page.position)}
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-rose-700">
                          {formatPct(page.ctr)} CTR
                        </Badge>
                      </div>
                    ))}
                    {lowCtrPages.length === 0 && (
                      <p className="text-sm text-slate-500">
                        All high-impression pages exceed 2.5% CTR.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SEO ACTION PLAN TAB */}
            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Prioritized DripTech SEO Action Checklist
                  </CardTitle>
                  <CardDescription>
                    Generated dynamically from your Search Console queries, cannibalization, sitemaps,
                    and rich result telemetry
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {actionPlanItems.map((item) => {
                    const done = completedActions.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start justify-between gap-3 rounded-lg border p-3.5 transition-colors ${
                          done
                            ? "border-emerald-200 bg-emerald-50/40"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleActionItem(item.id)}
                          className="mt-0.5 shrink-0 text-emerald-600"
                          aria-label={`Toggle ${item.title}`}
                        >
                          {done ? (
                            <CheckSquare className="h-5 w-5" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                done ? "text-slate-500 line-through" : "text-slate-900"
                              }`}
                            >
                              {item.title}
                            </span>
                            <Badge
                              variant={
                                item.priority === "High" ? "destructive" : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {item.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600">{item.detail}</p>
                        </div>
                        {item.targetUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 text-xs"
                            onClick={() => void handleInspectUrl(item.targetUrl!)}
                          >
                            Inspect
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default GSCAnalytics;
