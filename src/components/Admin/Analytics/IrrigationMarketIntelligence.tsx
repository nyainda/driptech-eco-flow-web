import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  CalendarClock,
  Check,
  Database,
  Download,
  ExternalLink,
  FileSearch,
  FilePlus2,
  Globe2,
  Loader2,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

type DataRow = Record<string, unknown>;
type SourceLink = { title: string; url: string; domain?: string };
type KeywordEstimate = {
  keyword: string;
  searchVolume: number | null;
  competition: number | string | null;
  cpc: number | null;
  lastUpdatedAt: string | null;
  monthlySearches: Array<{ year?: number; month?: number; searchVolume?: number | null }>;
};
type KeywordSnapshot = {
  connected: boolean;
  provider?: string;
  market?: string;
  language?: string;
  reason?: string;
  returnedAt?: string;
  providerCostUsd?: number | null;
  estimates?: KeywordEstimate[];
  seedKeywords?: string[];
  note?: string;
};
type SearchConsoleSnapshot = {
  connected: boolean;
  reason?: string;
  property?: string;
  startDate?: string;
  endDate?: string;
  totals?: { clicks?: number; impressions?: number; ctr?: number; position?: number };
  previousPeriod?: {
    startDate?: string;
    endDate?: string;
    totals?: { clicks?: number; impressions?: number; ctr?: number; position?: number };
  };
  queries?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  pages?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  queryPages?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  countries?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  devices?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  computedInsights?: DataRow;
  queryRowsReturned?: number;
  note?: string;
};
type MarketReport = {
  id: string;
  title: string;
  executive_summary: string;
  report_data: DataRow;
  search_console_snapshot: SearchConsoleSnapshot;
  keyword_estimates: KeywordSnapshot;
  source_links: SourceLink[];
  model: string;
  created_at: string;
  scan_parameters?: DataRow;
  cache_key?: string;
};
type MarketJob = {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  progress_message?: string;
  error_message?: string;
  result_report_id?: string;
};

const objectRows = (value: unknown): DataRow[] =>
  Array.isArray(value)
    ? value.filter((item): item is DataRow => !!item && typeof item === "object")
    : [];
const stringRows = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const textOf = (value: unknown, fallback = "—") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;
const numberOf = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};
const countFormat = (value: unknown) =>
  numberOf(value).toLocaleString("en-KE", { maximumFractionDigits: 0 });
const decimalFormat = (value: unknown, digits = 1) =>
  numberOf(value).toLocaleString("en-KE", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const priorityVariant = (value: unknown): "destructive" | "secondary" | "outline" => {
  const priority = String(value || "").toLowerCase();
  if (priority === "high") return "destructive";
  if (priority === "medium") return "secondary";
  return "outline";
};
const safeRows = (value: unknown) => objectRows(value);
const metricChange = (currentValue: unknown, previousValue: unknown, digits = 1) => {
  const current = numberOf(currentValue);
  const previous = numberOf(previousValue);
  if (previous === 0) return current === 0 ? "0%" : "New";
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return `${change > 0 ? "+" : ""}${change.toFixed(digits)}%`;
};
const recommendationStatusKey = (reportId: string, index: number) => `${reportId}:${index}`;

const IrrigationMarketIntelligence: React.FC = () => {
  const [reports, setReports] = useState<MarketReport[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [grokConfigured, setGrokConfigured] = useState(false);
  const [keywordProviderConfigured, setKeywordProviderConfigured] = useState(false);
  const [model, setModel] = useState("grok-4.7");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [periodDays, setPeriodDays] = useState(28);
  const [activeJob, setActiveJob] = useState<MarketJob | null>(null);
  const [anotherAdminScanning, setAnotherAdminScanning] = useState(false);
  const [recommendationStatuses, setRecommendationStatuses] = useState<Record<string, "open" | "done">>({});
  const [savingRecommendationIndex, setSavingRecommendationIndex] = useState<number | null>(null);
  const [draftingRecommendationIndex, setDraftingRecommendationIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadContext = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("irrigation-market-intelligence", {
        body: { action: "context" },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      const nextReports: MarketReport[] = Array.isArray(data?.reports) ? data.reports : [];
      setReports(nextReports);
      setGrokConfigured(!!data?.configured);
      setKeywordProviderConfigured(!!data?.keywordProviderConfigured);
      setModel(data?.model || "grok-4.7");
      const statuses: Record<string, "open" | "done"> = {};
      for (const status of Array.isArray(data?.recommendationStatuses) ? data.recommendationStatuses : []) {
        if (status?.report_id && Number.isInteger(status.recommendation_index)) {
          statuses[recommendationStatusKey(status.report_id, status.recommendation_index)] = status.status === "done" ? "done" : "open";
        }
      }
      setRecommendationStatuses(statuses);
      const job = data?.activeJob;
      setAnotherAdminScanning(!!job && !job.ownedByUser);
      setActiveJob(job?.ownedByUser ? job : null);
      setSelectedId((current) => current || nextReports[0]?.id || "");
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Could not load market intelligence.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadContext(); }, [loadContext]);

  useEffect(() => {
    const jobId = activeJob?.id;
    if (!jobId || !["queued", "running"].includes(activeJob.status)) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const { data, error: invokeError } = await supabase.functions.invoke("irrigation-market-intelligence", {
          body: { action: "job", jobId },
        });
        if (invokeError) throw invokeError;
        if (data?.error) throw new Error(data.error);
        if (cancelled) return;
        setActiveJob(data as MarketJob);
        if (data.status === "succeeded") {
          if (data.result_report_id) setSelectedId(data.result_report_id);
          setNotice("Market scan finished and the report is saved.");
          await loadContext();
          return;
        }
        if (data.status === "failed") {
          setError(data.error_message || "The background market scan failed.");
          return;
        }
        timer = setTimeout(poll, 2500);
      } catch (pollError: unknown) {
        if (!cancelled) {
          setError(pollError instanceof Error ? pollError.message : "Could not check scan progress.");
          setActiveJob(null);
        }
      }
    };
    timer = setTimeout(poll, 1800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeJob?.id, activeJob?.status, loadContext]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedId) || reports[0] || null,
    [reports, selectedId],
  );
  const reportData = selectedReport?.report_data || {};
  const gsc = selectedReport?.search_console_snapshot;
  const keywordData = selectedReport?.keyword_estimates;
  const marketTopics = safeRows(reportData.market_topics);
  const customerQuestions = safeRows(reportData.customer_questions);
  const competitorObservations = safeRows(reportData.competitor_observations);
  const productPriorities = safeRows(reportData.product_page_priorities);
  const recommendations = safeRows(reportData.recommendations);
  const sources = selectedReport?.source_links || [];
  const insights = gsc?.computedInsights || {};
  const ctrOpportunities = safeRows(insights.ctrOpportunities);
  const pageOneOpportunities = safeRows(insights.pageOneOpportunities);
  const multiPageQueries = safeRows(insights.multipleLandingPages);
  const brandSplit = insights.brandedVsNonBranded && typeof insights.brandedVsNonBranded === "object"
    ? insights.brandedVsNonBranded as DataRow
    : {};
  const brandedTotals = brandSplit.branded && typeof brandSplit.branded === "object" ? brandSplit.branded as DataRow : {};
  const nonBrandedTotals = brandSplit.nonBranded && typeof brandSplit.nonBranded === "object" ? brandSplit.nonBranded as DataRow : {};
  const countryBreakdown = safeRows(insights.topCountries);
  const deviceBreakdown = safeRows(insights.devices);
  const selectedIndex = selectedReport ? reports.findIndex((report) => report.id === selectedReport.id) : -1;
  const previousSavedReport = selectedIndex >= 0 ? reports[selectedIndex + 1] || null : null;
  const scanBusy = !!activeJob && ["queued", "running"].includes(activeJob.status);
  const completedRecommendations = selectedReport
    ? recommendations.filter((_, index) => recommendationStatuses[recommendationStatusKey(selectedReport.id, index)] === "done").length
    : 0;

  const runScan = async () => {
    setRunning(true);
    setError("");
    setNotice("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("irrigation-market-intelligence", {
        body: { action: "run", days: periodDays },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      if (data?.cached && data?.report?.id) {
        const report = data.report as MarketReport;
        setReports((current) => [report, ...current.filter((item) => item.id !== report.id)]);
        setSelectedId(report.id);
        setNotice("Loaded the matching saved scan. No new provider requests were made.");
      } else if (data?.queued && data?.job?.id) {
        setActiveJob(data.job as MarketJob);
        setAnotherAdminScanning(false);
        setNotice("Scan queued. You can keep working while the report is prepared.");
      } else {
        throw new Error("The scan was not queued and no saved report was returned.");
      }
    } catch (runError: unknown) {
      setError(runError instanceof Error ? runError.message : "Market intelligence scan failed.");
    } finally {
      setRunning(false);
    }
  };

  const updateRecommendationStatus = async (index: number, status: "open" | "done") => {
    if (!selectedReport) return;
    setSavingRecommendationIndex(index);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("irrigation-market-intelligence", {
        body: { action: "recommendation_status", reportId: selectedReport.id, recommendationIndex: index, status },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setRecommendationStatuses((current) => ({
        ...current,
        [recommendationStatusKey(selectedReport.id, index)]: status,
      }));
    } catch (statusError: unknown) {
      setError(statusError instanceof Error ? statusError.message : "Could not update recommendation progress.");
    } finally {
      setSavingRecommendationIndex(null);
    }
  };

  const createGuideDraft = async (item: DataRow, index: number) => {
    setDraftingRecommendationIndex(index);
    setError("");
    setNotice("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("generate-blog-posts", {
        body: {
          action: "createDraft",
          title: textOf(item.title, ""),
          keywords: [textOf(item.title, ""), textOf(item.category, ""), textOf(item.basis, "")].filter(Boolean).join(", "),
          category: textOf(item.category, ""),
          evidence: [textOf(item.basis, ""), textOf(item.expected_outcome, "")].filter(Boolean).join(" — "),
          steps: stringRows(item.steps),
          reportTitle: selectedReport?.title || "",
        },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setNotice(`Unpublished guide draft created: ${textOf(data?.draft?.title, "open it in Admin → News")}.`);
    } catch (draftError: unknown) {
      setError(draftError instanceof Error ? draftError.message : "Could not create the guide draft.");
    } finally {
      setDraftingRecommendationIndex(null);
    }
  };

  const downloadReport = () => {
    if (!selectedReport) return;
    const lines = [
      "# " + selectedReport.title,
      "",
      "Generated: " + new Date(selectedReport.created_at).toLocaleString("en-KE"),
      "Model: " + selectedReport.model,
      "",
      "## Executive summary",
      selectedReport.executive_summary,
      "",
      "## First-party Search Console measurements",
      JSON.stringify(selectedReport.search_console_snapshot, null, 2),
      "",
      "## Third-party keyword estimates",
      JSON.stringify(selectedReport.keyword_estimates, null, 2),
      "",
      "## AI interpretation and recommendations",
      JSON.stringify(selectedReport.report_data, null, 2),
      "",
      "## Public sources",
      ...sources.map((source) => "- [" + source.title + "](" + source.url + ")"),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "driptech-irrigation-market-intelligence-" + selectedReport.id + ".md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const gscTotals = gsc?.totals;
  const estimates = keywordData?.estimates || [];

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                <Radar className="h-3.5 w-3.5" /> Irrigation Market Intelligence
              </span>
              <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">{model}</Badge>
              <Badge variant={grokConfigured ? "default" : "destructive"}>{grokConfigured ? "Grok connected" : "Grok setup needed"}</Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Understand what irrigation buyers are searching for</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Combine DripTech's actual Google Search Console data, optional third-party keyword estimates and Grok's research of public competitor pages. Each source is labelled so estimates and AI ideas never masquerade as measured demand.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-slate-200">
              Scan window
              <select
                aria-label="Scan window"
                value={periodDays}
                onChange={(event) => setPeriodDays(Number(event.target.value))}
                disabled={scanBusy || anotherAdminScanning}
                className="rounded-md border-0 bg-transparent text-sm font-semibold text-white outline-none"
              >
                <option className="text-slate-900" value={28}>28 days</option>
                <option className="text-slate-900" value={56}>56 days</option>
                <option className="text-slate-900" value={90}>90 days</option>
              </select>
            </label>
            <Button onClick={runScan} disabled={running || loading || !grokConfigured || scanBusy || anotherAdminScanning} className="bg-emerald-500 text-white hover:bg-emerald-600">
              {running || scanBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Radar className="mr-2 h-4 w-4" />}
              {scanBusy ? "Scan in progress…" : anotherAdminScanning ? "Another scan is running" : running ? "Starting scan…" : "Run market scan"}
            </Button>
            <Button variant="outline" onClick={loadContext} disabled={loading || running} className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <RefreshCw className={"mr-2 h-4 w-4 " + (loading ? "animate-spin" : "")} /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-border/70"><CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-xl bg-sky-500/10 p-3 text-sky-600"><Database className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Measured Search Console clicks</p><p className="text-2xl font-bold">{selectedReport ? countFormat(gscTotals?.clicks) : "—"}</p></div>
        </CardContent></Card>
        <Card className="rounded-2xl border-border/70"><CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-600"><Search className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Search Console impressions</p><p className="text-2xl font-bold">{selectedReport ? countFormat(gscTotals?.impressions) : "—"}</p></div>
        </CardContent></Card>
        <Card className="rounded-2xl border-border/70"><CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-xl bg-violet-500/10 p-3 text-violet-600"><BarChart3 className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Third-party keyword ideas</p><p className="text-2xl font-bold">{selectedReport ? countFormat(estimates.length) : "—"}</p></div>
        </CardContent></Card>
        <Card className="rounded-2xl border-border/70"><CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600"><Sparkles className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Action items completed</p><p className="text-2xl font-bold">{selectedReport ? `${completedRecommendations}/${recommendations.length}` : "—"}</p></div>
        </CardContent></Card>
      </div>

      {activeJob && ["queued", "running"].includes(activeJob.status) && (
        <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/[0.04]">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300"><Loader2 className="h-5 w-5 animate-spin" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">Market scan is processing</p><Badge variant="outline">{activeJob.status}</Badge></div>
              <p className="mt-1 text-sm text-muted-foreground">{activeJob.progress_message || "Preparing the report…"}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-500/10"><div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" /></div>
            </div>
          </CardContent>
        </Card>
      )}
      {anotherAdminScanning && !activeJob && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-200">
          Another administrator has a market scan in progress. Refresh this page to check again.
        </div>
      )}

      {selectedReport && (
        <Card className="rounded-2xl">
          <CardHeader className="gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Compared with the previous saved scan</CardTitle>
              <CardDescription>
                {previousSavedReport
                  ? `${new Date(selectedReport.created_at).toLocaleDateString("en-KE")} versus ${new Date(previousSavedReport.created_at).toLocaleDateString("en-KE")}`
                  : "This is the first saved scan available for comparison."}
              </CardDescription>
            </div>
            {previousSavedReport && <Badge variant="outline">Scan to scan</Badge>}
          </CardHeader>
          <CardContent>
            {previousSavedReport?.search_console_snapshot?.connected && gsc?.connected ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Clicks", current: gsc.totals?.clicks, previous: previousSavedReport.search_console_snapshot.totals?.clicks },
                  { label: "Impressions", current: gsc.totals?.impressions, previous: previousSavedReport.search_console_snapshot.totals?.impressions },
                  { label: "CTR", current: gsc.totals?.ctr, previous: previousSavedReport.search_console_snapshot.totals?.ctr },
                  { label: "Average position", current: gsc.totals?.position, previous: previousSavedReport.search_console_snapshot.totals?.position },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">{item.label === "CTR" ? `${decimalFormat(numberOf(item.current) * 100)}%` : item.label === "Average position" ? decimalFormat(item.current) : countFormat(item.current)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Previous: {item.label === "CTR" ? `${decimalFormat(numberOf(item.previous) * 100)}%` : item.label === "Average position" ? decimalFormat(item.previous) : countFormat(item.previous)}</p>
                    <p className="mt-1 text-xs font-medium text-foreground">
                      {item.label === "CTR"
                        ? `${(numberOf(item.current) - numberOf(item.previous)) >= 0 ? "+" : ""}${decimalFormat((numberOf(item.current) - numberOf(item.previous)) * 100)} percentage points`
                        : item.label === "Average position"
                          ? `${numberOf(item.current) < numberOf(item.previous) ? "Improved by" : "Changed by"} ${decimalFormat(Math.abs(numberOf(item.current) - numberOf(item.previous)))} positions`
                          : metricChange(item.current, item.previous)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {previousSavedReport
                  ? "A scan-to-scan comparison needs Search Console data in both reports."
                  : "Run another scan to compare measured clicks, impressions, CTR and average position over time."}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300">{notice}</div>}

      {!grokConfigured && (
        <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div><p className="font-semibold">Connect Grok securely</p><p className="mt-1 text-sm leading-5 text-muted-foreground">Add XAI_API_KEY to Supabase Edge Function Secrets. The key stays server-side and is never exposed in the browser.</p></div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.7fr)]">
        <aside className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Evidence guide</CardTitle><CardDescription>Read every figure according to where it came from.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                <Badge className="bg-sky-600 text-white hover:bg-sky-600">Actual measurement</Badge>
                <p className="mt-2 text-sm font-semibold">Google Search Console</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Clicks, impressions, CTR and average position for DripTech's verified property and the displayed date window.</p>
              </div>
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
                <Badge className="bg-violet-600 text-white hover:bg-violet-600">Third-party estimate</Badge>
                <p className="mt-2 text-sm font-semibold">DataForSEO</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Estimated monthly keyword volumes for Kenya. These are not DripTech clicks or a count of known individual searches.</p>
                <Badge variant={keywordProviderConfigured ? "secondary" : "outline"} className="mt-2">{keywordProviderConfigured ? "Credentials configured" : "Optional provider not connected"}</Badge>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <Badge className="bg-emerald-700 text-white hover:bg-emerald-700">Public evidence</Badge>
                <p className="mt-2 text-sm font-semibold">Competitor websites and web results</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Public product pages, pricing, guides, FAQs and visible search results. No private competitor traffic or sales data.</p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <Badge className="bg-amber-600 text-white hover:bg-amber-600">AI recommendation</Badge>
                <p className="mt-2 text-sm font-semibold">Grok analysis</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Interpretations and proposed next steps. Useful hypotheses, not measurements or guaranteed outcomes.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Saved market scans</CardTitle><CardDescription>Choose a past report to compare findings.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {reports.length ? reports.map((report) => (
                <button key={report.id} type="button" onClick={() => setSelectedId(report.id)} className={"w-full rounded-xl border p-3 text-left transition-colors " + (selectedReport?.id === report.id ? "border-emerald-500/50 bg-emerald-500/5" : "border-border hover:bg-muted/50")}>
                  <p className="line-clamp-2 text-sm font-semibold">{report.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(report.created_at).toLocaleString("en-KE")}</p>
                </button>
              )) : <p className="py-5 text-center text-sm text-muted-foreground">{loading ? "Loading reports…" : "No scans yet. Run the first scan."}</p>}
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0 space-y-5">
          {!selectedReport ? (
            <Card className="rounded-2xl"><CardContent className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
              <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-600"><Radar className="h-8 w-8" /></div>
              <h3 className="mt-4 text-lg font-semibold">Your first irrigation market report</h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Run a scan to inspect real Search Console queries, optional keyword estimates and public competitor evidence, then review Grok's recommendations.</p>
            </CardContent></Card>
          ) : (
            <>
              <Card className="rounded-2xl">
                <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Market report</Badge>
                      <Badge variant="secondary">{selectedReport.model}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(selectedReport.created_at).toLocaleString("en-KE")}</span>
                    </div>
                    <CardTitle className="mt-2 text-xl">{selectedReport.title}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-6">{selectedReport.executive_summary}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadReport} className="shrink-0"><Download className="mr-2 h-4 w-4" /> Export</Button>
                </CardHeader>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Database className="h-4 w-4 text-sky-600" /> 1. Actual DripTech search performance</CardTitle>
                  <CardDescription>Google Search Console · {gsc?.startDate || "date unavailable"} to {gsc?.endDate || "date unavailable"} · {gsc?.property || "property not connected"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {gsc?.connected ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Clicks</p><p className="text-xl font-bold">{countFormat(gscTotals?.clicks)}</p></div>
                        <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Impressions</p><p className="text-xl font-bold">{countFormat(gscTotals?.impressions)}</p></div>
                        <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">CTR</p><p className="text-xl font-bold">{decimalFormat(numberOf(gscTotals?.ctr) * 100)}%</p></div>
                        <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Average position</p><p className="text-xl font-bold">{decimalFormat(gscTotals?.position)}</p></div>
                      </div>
                      {gsc.previousPeriod?.totals && (
                        <div className="rounded-xl border bg-muted/20 p-4">
                          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                            <div><p className="text-sm font-semibold">Period-over-period change</p><p className="text-xs text-muted-foreground">Equal-length windows; the latest three days are excluded.</p></div>
                            <Badge variant="outline">{gsc.previousPeriod.startDate} – {gsc.previousPeriod.endDate}</Badge>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                              { label: "Clicks", current: gscTotals?.clicks, previous: gsc.previousPeriod.totals.clicks },
                              { label: "Impressions", current: gscTotals?.impressions, previous: gsc.previousPeriod.totals.impressions },
                              { label: "CTR", current: gscTotals?.ctr, previous: gsc.previousPeriod.totals.ctr },
                              { label: "Average position", current: gscTotals?.position, previous: gsc.previousPeriod.totals.position },
                            ].map((item) => (
                              <div key={item.label} className="rounded-lg bg-background/80 p-3">
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                                <p className="mt-1 font-semibold tabular-nums">
                                  {item.label === "CTR" ? `${decimalFormat(numberOf(item.current) * 100)}%` : item.label === "Average position" ? decimalFormat(item.current) : countFormat(item.current)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {item.label === "CTR"
                                    ? `${(numberOf(item.current) - numberOf(item.previous)) >= 0 ? "+" : ""}${decimalFormat((numberOf(item.current) - numberOf(item.previous)) * 100)} pp`
                                    : item.label === "Average position"
                                      ? `${numberOf(item.current) < numberOf(item.previous) ? "Improved" : "Changed"} ${decimalFormat(Math.abs(numberOf(item.current) - numberOf(item.previous)))} positions`
                                      : metricChange(item.current, item.previous)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <details className="rounded-xl border p-4">
                        <summary className="cursor-pointer text-sm font-semibold">Computed opportunities and audience segments</summary>
                        <p className="mt-2 text-xs text-muted-foreground">These rules are calculated from the Search Console samples, not generated by AI.</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-sm font-semibold">Branded vs non-branded sample</p>
                            <p className="mt-1 text-xs text-muted-foreground">Query rows containing “DripTech” are grouped as branded. Other returned irrigation queries are grouped as non-branded.</p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {[["Branded", brandedTotals], ["Non-branded", nonBrandedTotals]].map(([label, metrics]) => {
                                const row = metrics as DataRow;
                                return <div key={String(label)} className="rounded-md bg-background p-2">
                                  <p className="text-xs font-medium">{label}</p>
                                  <p className="mt-1 text-sm font-semibold">{countFormat(row.clicks)} clicks</p>
                                  <p className="text-xs text-muted-foreground">{countFormat(row.impressions)} impressions</p>
                                </div>;
                              })}
                            </div>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-sm font-semibold">CTR review opportunities</p>
                            <p className="mt-1 text-xs text-muted-foreground">Returned queries with at least 25 impressions and a CTR below the property average.</p>
                            {ctrOpportunities.length ? <ul className="mt-2 space-y-1 text-xs">{ctrOpportunities.slice(0, 5).map((row, index) => <li key={index} className="flex justify-between gap-3"><span className="truncate">{textOf(row.query)}</span><span className="shrink-0 tabular-nums">{countFormat(row.impressions)} imp. · {decimalFormat(numberOf(row.ctr) * 100)}%</span></li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">No rows met this rule in the returned sample.</p>}
                          </div>
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-sm font-semibold">Near page-one queries</p>
                            <p className="mt-1 text-xs text-muted-foreground">Returned queries averaging positions 11–20 with at least 10 impressions.</p>
                            {pageOneOpportunities.length ? <ul className="mt-2 space-y-1 text-xs">{pageOneOpportunities.slice(0, 5).map((row, index) => <li key={index} className="flex justify-between gap-3"><span className="truncate">{textOf(row.query)}</span><span className="shrink-0 tabular-nums">Pos. {decimalFormat(row.position)} · {countFormat(row.impressions)} imp.</span></li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">No rows met this rule in the returned sample.</p>}
                          </div>
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-sm font-semibold">Queries across multiple pages</p>
                            <p className="mt-1 text-xs text-muted-foreground">Review these page associations; multiple URLs do not by themselves prove cannibalization.</p>
                            {multiPageQueries.length ? <ul className="mt-2 space-y-2 text-xs">{multiPageQueries.slice(0, 5).map((row, index) => <li key={index}><p className="font-medium">{textOf(row.query)} · {countFormat(row.impressions)} impressions</p><p className="mt-0.5 break-all text-muted-foreground">{stringRows(row.pages).slice(0, 3).join(" · ")}</p></li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">No repeated query-to-page rows in this sample.</p>}
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg border p-3">
                            <p className="text-sm font-semibold">Top countries</p>
                            <div className="mt-2 flex flex-wrap gap-2">{countryBreakdown.slice(0, 6).map((row, index) => <Badge key={index} variant="outline">{textOf(row.country)} · {countFormat(row.clicks)} clicks</Badge>)}</div>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-sm font-semibold">Device mix</p>
                            <div className="mt-2 flex flex-wrap gap-2">{deviceBreakdown.map((row, index) => <Badge key={index} variant="outline">{textOf(row.device)} · {countFormat(row.clicks)} clicks</Badge>)}</div>
                          </div>
                        </div>
                      </details>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[580px] text-sm">
                          <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 pr-3 font-medium">Actual search query (sample)</th><th className="py-2 px-2 text-right font-medium">Clicks</th><th className="py-2 px-2 text-right font-medium">Impressions</th><th className="py-2 px-2 text-right font-medium">CTR</th><th className="py-2 pl-2 text-right font-medium">Avg. position</th></tr></thead>
                          <tbody>{(gsc.queries || []).slice(0, 15).map((query, index) => (
                            <tr key={(query.keys || []).join("|") + index} className="border-b border-border/60 last:border-0">
                              <td className="max-w-[260px] truncate py-2.5 pr-3 font-medium">{textOf(query.keys?.[0], "Unknown query")}</td>
                              <td className="px-2 py-2.5 text-right tabular-nums">{countFormat(query.clicks)}</td>
                              <td className="px-2 py-2.5 text-right tabular-nums">{countFormat(query.impressions)}</td>
                              <td className="px-2 py-2.5 text-right tabular-nums">{decimalFormat(numberOf(query.ctr) * 100)}%</td>
                              <td className="pl-2 py-2.5 text-right tabular-nums">{decimalFormat(query.position)}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">{gsc.note || "Query rows are a sample returned by Search Console. They are not a complete list of searches."}</p>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed p-5"><p className="font-semibold">Search Console data unavailable for this scan</p><p className="mt-1 text-sm text-muted-foreground">{gsc?.reason || "Connect the DripTech Search Console property and retry."}</p></div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2"><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-violet-600" /> 2. Third-party keyword estimates</CardTitle><Badge className="bg-violet-600 text-white hover:bg-violet-600">Estimate, not actual traffic</Badge></div>
                  <CardDescription>DataForSEO Google keyword database · Kenya · English. Search volume is a provider estimate and may differ from live demand.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {keywordData?.connected && estimates.length ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>{countFormat(estimates.length)} keyword ideas returned · refreshed {keywordData.returnedAt ? new Date(keywordData.returnedAt).toLocaleString("en-KE") : "date unavailable"}</span>
                        <span>Provider request cost: {keywordData.providerCostUsd == null ? "not supplied" : "$" + decimalFormat(keywordData.providerCostUsd, 4)}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-sm">
                          <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 pr-3 font-medium">Keyword idea</th><th className="px-2 py-2 text-right font-medium">Est. monthly searches</th><th className="px-2 py-2 text-right font-medium">Competition</th><th className="pl-2 py-2 text-right font-medium">CPC</th></tr></thead>
                          <tbody>{estimates.slice().sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0)).slice(0, 30).map((item, index) => (
                            <tr key={item.keyword + index} className="border-b border-border/60 last:border-0">
                              <td className="py-2.5 pr-3 font-medium">{item.keyword}</td>
                              <td className="px-2 py-2.5 text-right tabular-nums">{item.searchVolume == null ? "Not available" : countFormat(item.searchVolume)}</td>
                              <td className="px-2 py-2.5 text-right">{item.competition == null ? "—" : typeof item.competition === "number" ? decimalFormat(item.competition, 2) : item.competition}</td>
                              <td className="pl-2 py-2.5 text-right tabular-nums">{item.cpc == null ? "—" : "$" + decimalFormat(item.cpc, 2)}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {keywordData.sourceUrl && <a href={keywordData.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-violet-600 hover:underline">Provider methodology <ExternalLink className="h-3 w-3" /></a>}
                        {keywordData.note && <span>{keywordData.note}</span>}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed p-5">
                      <p className="font-semibold">Third-party estimates are not connected</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{keywordData?.reason || "Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD as Supabase Edge Function Secrets to enable estimated monthly search volumes."}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Until then, this section will stay empty. Grok is explicitly instructed not to invent keyword volumes.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-amber-600" /> 3. Grok interpretation and AI recommendations</CardTitle><CardDescription>These are analysis and proposals based on the evidence above, not measured search metrics.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  {marketTopics.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">Topics and search opportunities to investigate</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {marketTopics.slice(0, 8).map((item, index) => (
                          <div key={index} className="rounded-xl border p-3">
                            <div className="flex flex-wrap items-center gap-2">{(Array.isArray(item.evidence_classes) ? item.evidence_classes : [textOf(item.evidence_class, "AI hypothesis")]).map((evidence, evidenceIndex) => <Badge key={evidenceIndex} variant="outline">{String(evidence)}</Badge>)}</div>
                            <p className="mt-2 text-sm font-semibold">{textOf(item.topic)}</p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">{textOf(item.why_it_matters)}</p>
                            <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">{textOf(item.next_step)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {recommendations.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">Action plan · {completedRecommendations} of {recommendations.length} complete</h3>
                      <div className="space-y-2">
                        {recommendations.slice(0, 10).map((item, index) => (
                          <div key={index} className={"flex gap-3 rounded-xl border p-3 " + (recommendationStatuses[recommendationStatusKey(selectedReport.id, index)] === "done" ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "")}>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-sm font-bold text-amber-700 dark:text-amber-300">{index + 1}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{textOf(item.title)}</p><Badge variant={priorityVariant(item.priority)}>{textOf(item.priority, "Review")}</Badge></div>
                              <p className="mt-1 text-xs text-muted-foreground">{textOf(item.category)} · Basis: {textOf(item.basis)}</p>
                              <p className="mt-2 text-sm text-muted-foreground">{textOf(item.expected_outcome)}</p>
                              {stringRows(item.steps).length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">{stringRows(item.steps).slice(0, 4).map((step, stepIndex) => <li key={stepIndex}>{step}</li>)}</ul>}
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant={recommendationStatuses[recommendationStatusKey(selectedReport.id, index)] === "done" ? "secondary" : "outline"}
                                  disabled={savingRecommendationIndex === index}
                                  onClick={() => updateRecommendationStatus(
                                    index,
                                    recommendationStatuses[recommendationStatusKey(selectedReport.id, index)] === "done" ? "open" : "done",
                                  )}
                                >
                                  {savingRecommendationIndex === index ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
                                  {recommendationStatuses[recommendationStatusKey(selectedReport.id, index)] === "done" ? "Reopen" : "Mark done"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={draftingRecommendationIndex === index}
                                  onClick={() => createGuideDraft(item, index)}
                                >
                                  {draftingRecommendationIndex === index ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FilePlus2 className="mr-1.5 h-3.5 w-3.5" />}
                                  {draftingRecommendationIndex === index ? "Creating draft…" : "Create guide draft"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {(productPriorities.length > 0 || customerQuestions.length > 0 || competitorObservations.length > 0) && (
                <div className="grid gap-4 xl:grid-cols-2">
                  {productPriorities.length > 0 && <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Product and category page priorities</CardTitle><CardDescription>Each item carries its evidence class.</CardDescription></CardHeader><CardContent className="space-y-3">
                    {productPriorities.slice(0, 8).map((item, index) => <div key={index} className="border-b border-border/60 pb-3 last:border-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{textOf(item.product_or_category)}</p><Badge variant={priorityVariant(item.priority)}>{textOf(item.priority, "Review")}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{(Array.isArray(item.evidence_classes) ? item.evidence_classes.map(String).join(" + ") : textOf(item.evidence_class, "AI hypothesis"))} · {textOf(item.reason)}</p><p className="mt-2 text-sm text-muted-foreground">{textOf(item.recommended_improvement)}</p></div>)}
                  </CardContent></Card>}
                  {customerQuestions.length > 0 && <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Questions irrigation buyers may ask</CardTitle><CardDescription>Question ideas are not automatically proof of search frequency.</CardDescription></CardHeader><CardContent className="space-y-3">
                    {customerQuestions.slice(0, 8).map((item, index) => <div key={index} className="border-b border-border/60 pb-3 last:border-0"><p className="text-sm font-semibold">{textOf(item.question)}</p><div className="mt-1 flex flex-wrap gap-1">{(Array.isArray(item.evidence_classes) ? item.evidence_classes : [textOf(item.evidence_class, "AI hypothesis")]).map((evidence, evidenceIndex) => <Badge key={evidenceIndex} variant="outline">{String(evidence)}</Badge>)}</div><p className="mt-2 text-xs text-muted-foreground">{textOf(item.supporting_evidence)}</p><p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">{textOf(item.suggested_destination)}</p></div>)}
                  </CardContent></Card>}
                </div>
              )}

              {competitorObservations.length > 0 && <Card className="rounded-2xl">
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Globe2 className="h-4 w-4" /> Public competitor observations</CardTitle><CardDescription>Public pages only. No private competitor traffic, sales or conversion metrics.</CardDescription></CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {competitorObservations.slice(0, 10).map((item, index) => <div key={index} className="rounded-xl border p-4">
                    <p className="font-semibold">{textOf(item.name, "Competitor")}</p><p className="text-xs text-muted-foreground">{textOf(item.domain)}</p>
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{stringRows(item.observed_offering).slice(0, 4).map((entry, entryIndex) => <li key={entryIndex}>• {entry}</li>)}</ul>
                    <p className="mt-3 text-sm font-medium">Opportunity for DripTech</p>
                    <ul className="mt-1 space-y-1 text-xs text-muted-foreground">{stringRows(item.opportunity_for_driptech).slice(0, 4).map((entry, entryIndex) => <li key={entryIndex}>• {entry}</li>)}</ul>
                  </div>)}
                </CardContent>
              </Card>}

              <Card className="rounded-2xl">
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" /> Sources and evidence limitations</CardTitle><CardDescription>Review the original public evidence before acting on time-sensitive observations.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    {sources.map((source, index) => <a key={source.url || index} href={source.url} target="_blank" rel="noreferrer" className="group flex items-start justify-between gap-2 rounded-lg border p-3 hover:bg-muted/40"><div className="min-w-0"><p className="text-sm font-medium group-hover:text-emerald-600">{source.title || source.domain}</p><p className="mt-1 break-all text-xs text-muted-foreground">{source.domain || source.url}</p></div><ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></a>)}
                    {!sources.length && <p className="text-sm text-muted-foreground">No public citations were returned for this scan.</p>}
                  </div>
                  {stringRows(reportData.evidence_limits).length > 0 && <div className="rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground"><p className="mb-1 font-semibold text-foreground">Evidence notes</p>{stringRows(reportData.evidence_limits).map((item, index) => <p key={index}>• {item}</p>)}</div>}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span><CalendarClock className="mr-1 inline h-3.5 w-3.5" /> Scans run manually. No recurring paid keyword lookups are scheduled.</span>
        <span><FileSearch className="mr-1 inline h-3.5 w-3.5" /> Keyword provider configured: {keywordProviderConfigured ? "yes" : "no"}</span>
      </div>
    </section>
  );
};

export default IrrigationMarketIntelligence;
