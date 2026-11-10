import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  ExternalLink,
  FileSearch,
  Globe2,
  Lightbulb,
  Loader2,
  PackageSearch,
  Radar,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

type Competitor = { name: string; domain: string; focus: string };
type SourceLink = { title: string; url: string; domain?: string };
type Report = {
  id: string;
  report_type: string;
  title: string;
  executive_summary: string;
  report_data: Record<string, unknown>;
  source_links: SourceLink[];
  metrics_snapshot: Record<string, unknown>;
  model: string;
  created_at: string;
};

const listOf = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value)
    ? value.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>>
    : [];

const stringsOf = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item) => typeof item === "string") as string[] : [];

const textOf = (value: unknown, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const metric = (value: unknown) =>
  Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 1 });

const priorityVariant = (priority: unknown): "destructive" | "secondary" | "outline" => {
  const value = String(priority || "").toLowerCase();
  if (value === "high") return "destructive";
  if (value === "medium") return "secondary";
  return "outline";
};

const GrokSEOIntelligence: React.FC = () => {
  const [competitorDraft, setCompetitorDraft] = useState("");
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [configured, setConfigured] = useState(false);
  const [model, setModel] = useState("grok-4.7");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadContext = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("seo-intelligence", {
        body: { action: "context" },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      const nextCompetitors: Competitor[] = Array.isArray(data?.competitors) ? data.competitors : [];
      const nextReports: Report[] = Array.isArray(data?.reports) ? data.reports : [];
      setCompetitors(nextCompetitors);
      setCompetitorDraft(
        nextCompetitors.map((item) => item.name + " | " + item.domain + " | " + (item.focus || "")).join("\n"),
      );
      setReports(nextReports);
      setConfigured(!!data?.configured);
      setModel(data?.model || "grok-4.7");
      setSelectedReportId((current) => current || nextReports[0]?.id || "");
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Could not load Grok intelligence settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) || reports[0] || null,
    [reports, selectedReportId],
  );

  const reportData = selectedReport?.report_data || {};
  const assessment = (reportData.overall_assessment || {}) as Record<string, unknown>;
  const recommendations = listOf(reportData.recommendations);
  const competitorFindings = listOf(reportData.competitor_findings);
  const productOpportunities = listOf(reportData.product_opportunities);
  const searchPerformance = (reportData.search_performance || {}) as Record<string, unknown>;
  const keywordOpportunities = listOf(searchPerformance.keyword_opportunities);
  const sources = selectedReport?.source_links?.length
    ? selectedReport.source_links
    : listOf(reportData.sources).map((source) => ({
        title: textOf(source.title, textOf(source.domain, "Public source")),
        url: textOf(source.url),
        domain: textOf(source.domain),
      })).filter((source) => source.url);

  const saveCompetitors = async () => {
    const parsed = competitorDraft.split("\n").map((line) => {
      const [name = "", domain = "", ...focus] = line.split("|");
      return { name: name.trim(), domain: domain.trim(), focus: focus.join("|").trim() };
    }).filter((item) => item.name && item.domain);

    if (!parsed.length) {
      setError("Add at least one competitor. Use one per line: Company | domain | focus.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("seo-intelligence", {
        body: { action: "save_competitors", competitors: parsed },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      const saved: Competitor[] = data.competitors || parsed;
      setCompetitors(saved);
      setCompetitorDraft(saved.map((item) => item.name + " | " + item.domain + " | " + (item.focus || "")).join("\n"));
      setNotice("Competitor watchlist saved.");
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Could not save competitors.");
    } finally {
      setSaving(false);
    }
  };

  const runAnalysis = async () => {
    setRunning(true);
    setError("");
    setNotice("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("seo-intelligence", {
        body: { action: "run", days: 28 },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      if (!data?.report) throw new Error("Grok did not return a saved report.");
      setReports((current) => [data.report, ...current.filter((item) => item.id !== data.report.id)]);
      setSelectedReportId(data.report.id);
      setNotice("Research completed with " + metric(data.sourcesCount) + " cited sources.");
    } catch (runError: unknown) {
      setError(runError instanceof Error ? runError.message : "Grok analysis failed.");
    } finally {
      setRunning(false);
    }
  };

  const reportDate = selectedReport
    ? new Date(selectedReport.created_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
    : "No report yet";

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                <Bot className="h-3.5 w-3.5" /> Grok SEO Intelligence
              </span>
              <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">{model}</Badge>
              <Badge variant={configured ? "default" : "destructive"}>{configured ? "API configured" : "API key needed"}</Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Market intelligence for DripTech</h2>
            <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Compare real Search Console performance, the products visitors explore and public competitor pages.
              Grok searches public sources and turns the evidence into a prioritized action plan.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={runAnalysis} disabled={running || loading || !configured} className="bg-emerald-500 text-white hover:bg-emerald-600">
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Radar className="mr-2 h-4 w-4" />}
              {running ? "Researching competitors…" : "Run full intelligence scan"}
            </Button>
            <Button variant="outline" onClick={loadContext} disabled={loading || running} className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <RefreshCw className={"mr-2 h-4 w-4 " + (loading ? "animate-spin" : "")} /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {!configured && (
        <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Connect Grok securely</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Add XAI_API_KEY in Supabase → Edge Functions → Secrets. The key belongs on the server and must not be placed in frontend settings or source code.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300">{notice}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600"><Radar className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Competitors watched</p><p className="text-2xl font-bold">{competitors.length}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-xl bg-sky-500/10 p-3 text-sky-600"><FileSearch className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Saved reports</p><p className="text-2xl font-bold">{reports.length}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600"><Target className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Recommended actions</p><p className="text-2xl font-bold">{recommendations.length}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-xl bg-violet-500/10 p-3 text-violet-600"><Activity className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Latest scan</p><p className="text-sm font-semibold">{selectedReport ? new Date(selectedReport.created_at).toLocaleDateString("en-KE") : "Not run yet"}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.7fr)]">
        <div className="space-y-5">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Globe2 className="h-4 w-4" /> Competitor watchlist</CardTitle>
              <CardDescription>One company per line: name | domain | what they compete on</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={competitorDraft}
                onChange={(event) => setCompetitorDraft(event.target.value)}
                rows={9}
                placeholder={"Grekkon Limited | grekkon.com | Drip and sprinkler systems"}
              />
              <Button onClick={saveCompetitors} disabled={saving || loading} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Save watchlist
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">
                The scan checks public websites and public search results only. Add or remove competitors to fit the products and counties DripTech targets.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Report history</CardTitle>
              <CardDescription>Select an earlier scan to review its findings and citations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {reports.length ? reports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedReportId(report.id)}
                  className={"w-full rounded-xl border p-3 text-left transition-colors " + (selectedReport?.id === report.id ? "border-emerald-500/50 bg-emerald-500/5" : "border-border hover:bg-muted/50")}
                >
                  <p className="line-clamp-2 text-sm font-semibold">{report.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(report.created_at).toLocaleString("en-KE")}</p>
                </button>
              )) : (
                <div className="py-6 text-center text-sm text-muted-foreground">No saved reports. Run the first scan to create one.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          {!selectedReport ? (
            <Card className="rounded-2xl">
              <CardContent className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-600"><Sparkles className="h-8 w-8" /></div>
                <h3 className="mt-4 text-lg font-semibold">Your first intelligence report starts here</h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  Grok will combine the selected Search Console period, the products visitors interacted with, your catalogue and public competitor research.
                </p>
                {!configured && (
                  <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                    Add XAI_API_KEY to Supabase Edge Function Secrets. Keep the key out of frontend settings and source code.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="rounded-2xl">
                <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Badge variant="outline">Grok report · {reportDate}</Badge>
                    <CardTitle className="mt-2 text-xl">{selectedReport.title}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-6">{selectedReport.executive_summary}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{selectedReport.model}</Badge>
                </CardHeader>
                <CardContent className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assessment</p>
                    <p className="mt-2 text-sm font-semibold">{textOf(assessment.status, "Mixed")}</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {stringsOf(assessment.main_risks).slice(0, 4).map((item, index) => <li key={index}>• {item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What is working</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {stringsOf(assessment.what_is_working).slice(0, 4).map((item, index) => <li key={index}>• {item}</li>)}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="rounded-2xl">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><PackageSearch className="h-4 w-4" /> Products attracting interest</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {productOpportunities.length ? productOpportunities.slice(0, 6).map((item, index) => (
                      <div key={index} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">{textOf(item.product, "Product opportunity")}</p>
                          <Badge variant={priorityVariant(item.priority)}>{textOf(item.priority, "Review")}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{metric(item.observed_interactions)} interactions · {textOf(item.category)}</p>
                        <p className="mt-2 text-sm leading-5 text-muted-foreground">{textOf(item.recommended_page_or_action, textOf(item.public_market_gap))}</p>
                      </div>
                    )) : <p className="py-5 text-sm text-muted-foreground">No product opportunities were returned in this report.</p>}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4" /> Keyword opportunities</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {keywordOpportunities.length ? keywordOpportunities.slice(0, 6).map((item, index) => (
                      <div key={index} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">{textOf(item.keyword, "Search opportunity")}</p>
                          <Badge variant={priorityVariant(item.priority)}>{textOf(item.priority, "Review")}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{textOf(item.intent, "Search intent not classified")}</p>
                        <p className="mt-2 text-sm leading-5 text-muted-foreground">{textOf(item.recommended_action, textOf(item.evidence))}</p>
                      </div>
                    )) : <p className="py-5 text-sm text-muted-foreground">No query opportunity was returned in this report.</p>}
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-2xl">
                <CardHeader><CardTitle className="flex items-center gap-2"><Radar className="h-4 w-4" /> Competitor observations</CardTitle><CardDescription>Publicly visible evidence only. These are not estimates of competitor traffic or sales.</CardDescription></CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {competitorFindings.length ? competitorFindings.map((item, index) => (
                    <div key={index} className="rounded-xl border border-border/70 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div><p className="font-semibold">{textOf(item.name, "Competitor")}</p><p className="text-xs text-muted-foreground">{textOf(item.domain)}</p></div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-sm leading-5 text-muted-foreground">{textOf(item.positioning, "Positioning not stated.")}</p>
                      <div className="mt-3 space-y-2">
                        {stringsOf(item.opportunities_for_driptech).slice(0, 3).map((value, itemIndex) => (
                          <p key={itemIndex} className="text-xs leading-5">• {value}</p>
                        ))}
                      </div>
                      {stringsOf(item.source_urls).length > 0 && (
                        <a href={stringsOf(item.source_urls)[0]} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline">
                          View public source <ArrowRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No competitor observations in the saved report.</p>}
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Priority action plan</CardTitle><CardDescription>Practical actions based on product interest, Search Console data and public-market evidence.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {recommendations.length ? recommendations.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex gap-3 rounded-xl border border-border/70 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-bold text-emerald-700 dark:text-emerald-300">{index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{textOf(item.title, "SEO improvement")}</p>
                          <Badge variant={priorityVariant(item.priority)}>{textOf(item.priority, "Review")}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{textOf(item.category)} · Effort: {textOf(item.effort, "Not assessed")}</p>
                        <p className="mt-2 text-sm leading-5 text-muted-foreground">{textOf(item.why, textOf(item.impact))}</p>
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {stringsOf(item.steps).slice(0, 4).map((step, stepIndex) => <li key={stepIndex}>• {step}</li>)}
                        </ul>
                      </div>
                    </div>
                  )) : <p className="py-6 text-center text-sm text-muted-foreground">No actions were generated in this report.</p>}
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader><CardTitle>Research sources and evidence limits</CardTitle><CardDescription>Open the pages Grok referenced. Re-check time-sensitive prices and offers before acting.</CardDescription></CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {sources.map((source, index) => (
                    <a key={source.url || index} href={source.url} target="_blank" rel="noreferrer" className="group rounded-lg border border-border/70 p-3 hover:bg-muted/40">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium group-hover:text-emerald-600">{source.title || source.domain || source.url}</p>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="mt-1 break-all text-xs text-muted-foreground">{source.domain || source.url}</p>
                    </a>
                  ))}
                  {!sources.length && <p className="text-sm text-muted-foreground">No citations were returned by the model for this scan.</p>}
                  {stringsOf(reportData.evidence_limits).length > 0 && (
                    <div className="rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground md:col-span-2">
                      <p className="mb-1 flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="h-4 w-4" /> Evidence notes</p>
                      {stringsOf(reportData.evidence_limits).map((item, index) => <p key={index}>• {item}</p>)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default GrokSEOIntelligence;
