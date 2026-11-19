import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CloudLightning,
  Copy,
  Database,
  ExternalLink,
  Layers,
  Loader2,
  RefreshCw,
  Server,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TableGroup = "catalog" | "content";

interface SyncTableDef {
  id: string;
  label: string;
  description: string;
  group: TableGroup;
}

const CORE_TABLES: SyncTableDef[] = [
  {
    id: "products",
    label: "Products Catalogue",
    description: "Pumps, driplines, solar panels, batteries & fittings",
    group: "catalog",
  },
  {
    id: "irrigation_kits",
    label: "Irrigation Kits",
    description: "Turnkey farm & greenhouse kit packages",
    group: "catalog",
  },
  {
    id: "projects",
    label: "Field Projects",
    description: "Completed farm engineering installations",
    group: "catalog",
  },
  {
    id: "documents",
    label: "Technical Docs",
    description: "Manuals, pump curves & datasheets",
    group: "catalog",
  },
  {
    id: "blog_posts",
    label: "Blog & SEO Guides",
    description: "Agronomy & pump/solar engineering guides",
    group: "content",
  },
  {
    id: "news_articles",
    label: "News & Updates",
    description: "Company announcements & agriculture updates",
    group: "content",
  },
  {
    id: "videos",
    label: "Video Tutorials",
    description: "Walkthroughs and installation showcases",
    group: "content",
  },
  {
    id: "success_stories",
    label: "Success Stories",
    description: "Verified farmer impact & ROI transformations",
    group: "content",
  },
  {
    id: "team",
    label: "Team Directory",
    description: "Engineers, agronomists & leadership profiles",
    group: "content",
  },
];

const KNOWN_TABLES = [
  ...CORE_TABLES.map((t) => t.id),
  "blog_categories",
  "variants",
  "kit_documents",
  "system_settings",
  "mpesa_transactions",
  "customers",
  "quotes",
  "invoices",
  "contact_submissions",
  "admin_pump_reports",
  "user_roles",
  "page_views",
  "visitor_sessions",
  "product_interactions",
  "notifications",
];

type SyncStatusState = "idle" | "success" | "error";

export default function SyncDashboard() {
  const { toast } = useToast();

  const workerUrl = useMemo(() => {
    const raw = (import.meta.env.VITE_WORKER_URL as string | undefined) || "";
    return raw.trim().replace(/\/+$/, "");
  }, []);

  const [groupFilter, setGroupFilter] = useState<"all" | TableGroup>("all");
  const [rowCounts, setRowCounts] = useState<Record<string, number | null>>({});
  const [loadingCounts, setLoadingCounts] = useState<boolean>(true);

  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, SyncStatusState>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [syncedAt, setSyncedAt] = useState<Record<string, string>>({});
  const [syncedCounts, setSyncedCounts] = useState<Record<string, number>>({});

  const [selectedTable, setSelectedTable] = useState<string>("");
  const [batchRunning, setBatchRunning] = useState<boolean>(false);
  const [batchDoneCount, setBatchDoneCount] = useState<number>(0);

  const [pinging, setPinging] = useState<boolean>(false);
  const [workerHealth, setWorkerHealth] = useState<{
    state: "unknown" | "online" | "offline";
    latencyMs?: number;
    note?: string;
  }>({ state: "unknown" });

  const loadSupabaseCounts = useCallback(async () => {
    setLoadingCounts(true);
    try {
      const results = await Promise.all(
        CORE_TABLES.map(async (t) => {
          const { count, error } = await supabase
            .from(t.id as never)
            .select("*", { count: "exact", head: true });
          return [t.id, error ? null : (count ?? 0)] as const;
        }),
      );
      const next: Record<string, number | null> = {};
      for (const [id, count] of results) {
        next[id] = count;
      }
      setRowCounts(next);
    } catch (err) {
      console.error("Failed loading Supabase table counts:", err);
    } finally {
      setLoadingCounts(false);
    }
  }, []);

  useEffect(() => {
    loadSupabaseCounts();
  }, [loadSupabaseCounts]);

  const handlePingWorker = async () => {
    if (!workerUrl) {
      setWorkerHealth({
        state: "offline",
        note: "VITE_WORKER_URL environment variable is not configured.",
      });
      toast({
        title: "Worker URL Missing",
        description: "Configure VITE_WORKER_URL in your deployment environment first.",
        variant: "destructive",
      });
      return;
    }

    setPinging(true);
    const t0 = performance.now();
    try {
      const res = await fetch(`${workerUrl}/api/health`);
      const latencyMs = Math.round(performance.now() - t0);
      if (res.ok) {
        setWorkerHealth({
          state: "online",
          latencyMs,
          note: `Responded HTTP ${res.status} in ${latencyMs} ms`,
        });
        toast({
          title: "Cloudflare Edge Worker Online",
          description: `Healthy response in ${latencyMs} ms`,
        });
      } else {
        setWorkerHealth({
          state: "offline",
          latencyMs,
          note: `Returned HTTP ${res.status}`,
        });
        toast({
          title: "Worker Returned Error",
          description: `Status HTTP ${res.status}`,
          variant: "destructive",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error reaching Worker";
      setWorkerHealth({ state: "offline", note: msg });
      toast({
        title: "Worker Unreachable",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setPinging(false);
    }
  };

  const handleSync = async (table: string): Promise<boolean> => {
    if (!workerUrl) {
      setStatus((prev) => ({ ...prev, [table]: "error" }));
      setMessages((prev) => ({ ...prev, [table]: "VITE_WORKER_URL not set" }));
      toast({
        title: "Worker URL Not Configured",
        description: "Set VITE_WORKER_URL before pushing data to Cloudflare D1.",
        variant: "destructive",
      });
      return false;
    }

    setSyncing((prev) => ({ ...prev, [table]: true }));
    setStatus((prev) => ({ ...prev, [table]: "idle" }));
    setMessages((prev) => ({ ...prev, [table]: "Reading Supabase..." }));

    try {
      const { data, error } = await supabase.from(table as never).select("*");
      if (error) throw error;

      const rows = (data as unknown[]) || [];
      setRowCounts((prev) => ({ ...prev, [table]: rows.length }));

      if (rows.length === 0) {
        setMessages((prev) => ({ ...prev, [table]: "0 rows in Supabase (skipped)" }));
        setStatus((prev) => ({ ...prev, [table]: "success" }));
        setSyncedAt((prev) => ({ ...prev, [table]: new Date().toLocaleTimeString("en-KE") }));
        setSyncedCounts((prev) => ({ ...prev, [table]: 0 }));
        return true;
      }

      setMessages((prev) => ({ ...prev, [table]: `Pushing ${rows.length} rows to D1...` }));
      const response = await fetch(`${workerUrl}/api/sync/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });

      if (!response.ok) {
        let errMsg = `Sync failed (HTTP ${response.status})`;
        try {
          const parsed = (await response.json()) as { error?: string };
          if (parsed.error) errMsg = parsed.error;
        } catch {
          // keep status error
        }
        throw new Error(errMsg);
      }

      const result = (await response.json()) as { synced?: number };
      const count = result.synced ?? rows.length;
      setMessages((prev) => ({ ...prev, [table]: `Synced ${count} records` }));
      setStatus((prev) => ({ ...prev, [table]: "success" }));
      setSyncedAt((prev) => ({ ...prev, [table]: new Date().toLocaleTimeString("en-KE") }));
      setSyncedCounts((prev) => ({ ...prev, [table]: count }));
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      setMessages((prev) => ({ ...prev, [table]: msg }));
      setStatus((prev) => ({ ...prev, [table]: "error" }));
      return false;
    } finally {
      setSyncing((prev) => ({ ...prev, [table]: false }));
    }
  };

  const handleSyncAll = async () => {
    if (!workerUrl) {
      toast({
        title: "Worker URL Missing",
        description: "Configure VITE_WORKER_URL to enable Cloudflare D1 batch sync.",
        variant: "destructive",
      });
      return;
    }

    setBatchRunning(true);
    setBatchDoneCount(0);
    let okCount = 0;

    for (let i = 0; i < CORE_TABLES.length; i++) {
      const ok = await handleSync(CORE_TABLES[i].id);
      if (ok) okCount += 1;
      setBatchDoneCount(i + 1);
    }

    setBatchRunning(false);
    toast({
      title: "Batch Edge Sync Complete",
      description: `Successfully synchronized ${okCount} of ${CORE_TABLES.length} core tables.`,
      variant: okCount === CORE_TABLES.length ? "default" : "destructive",
    });
  };

  const webhookUrl = workerUrl
    ? `${workerUrl}/api/webhooks/supabase`
    : "https://<your-worker-url>/api/webhooks/supabase";

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast({ title: "Webhook URL Copied" });
    } catch {
      toast({ title: "Copy manually", description: webhookUrl });
    }
  };

  const visibleTables = useMemo(
    () =>
      CORE_TABLES.filter((t) => groupFilter === "all" || t.group === groupFilter),
    [groupFilter],
  );

  const summary = useMemo(() => {
    const totalSourceRows = Object.values(rowCounts).reduce<number>(
      (sum, c) => sum + (typeof c === "number" ? c : 0),
      0,
    );
    const completedTables = Object.values(status).filter((s) => s === "success").length;
    const errorTables = Object.values(status).filter((s) => s === "error").length;
    const pushedRecords = Object.values(syncedCounts).reduce((sum, n) => sum + n, 0);
    return {
      totalSourceRows,
      completedTables,
      errorTables,
      pushedRecords,
    };
  }, [rowCounts, status, syncedCounts]);

  const anyBusy = batchRunning || Object.values(syncing).some(Boolean);
  const progressPct = batchRunning
    ? Math.round((batchDoneCount / CORE_TABLES.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CloudLightning className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Cloudflare D1 Edge Sync
              </h2>
              <Badge
                variant="outline"
                className={
                  workerUrl
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                }
              >
                {workerUrl ? "Edge Endpoint Configured" : "VITE_WORKER_URL Unset"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Replicate Supabase primary records to Cloudflare D1 global edge cache and inspect live table counts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSupabaseCounts}
            disabled={loadingCounts}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loadingCounts ? "animate-spin" : ""}`} />
            Refresh Counts
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePingWorker}
            disabled={pinging}
          >
            <Activity className={`h-4 w-4 mr-1.5 ${pinging ? "animate-pulse" : ""}`} />
            Ping Worker
          </Button>
          <Button size="sm" onClick={handleSyncAll} disabled={anyBusy}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${anyBusy ? "animate-spin" : ""}`} />
            {batchRunning
              ? `Syncing (${batchDoneCount}/${CORE_TABLES.length})...`
              : "Sync All Core Tables"}
          </Button>
        </div>
      </div>

      {batchRunning && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-primary">
                Running sequential Supabase → Cloudflare D1 sync...
              </span>
              <span className="text-foreground">
                {batchDoneCount} / {CORE_TABLES.length} tables ({progressPct}%)
              </span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Source Records (Supabase)
            </CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loadingCounts ? "…" : summary.totalSourceRows.toLocaleString("en-KE")}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Across {CORE_TABLES.length} core public tables
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Session Pushed
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary.pushedRecords.toLocaleString("en-KE")}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.completedTables} table(s) synced cleanly
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Worker Health
            </CardTitle>
            <Server className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">
              {workerHealth.state === "online"
                ? `Online (${workerHealth.latencyMs}ms)`
                : workerHealth.state === "offline"
                  ? "Unreachable"
                  : "Not Pinged"}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {workerHealth.note || (workerUrl ? workerUrl.replace(/^https?:\/\//, "") : "Env missing")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Sync Errors
            </CardTitle>
            {summary.errorTables > 0 ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <Layers className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.errorTables > 0 ? "text-destructive" : "text-foreground"
              }`}
            >
              {summary.errorTables}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.errorTables > 0 ? "Check worker endpoint or logs" : "Zero failed operations"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Group Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all", label: `All Core Tables (${CORE_TABLES.length})` },
            {
              key: "catalog",
              label: `Catalog & Engineering (${CORE_TABLES.filter((t) => t.group === "catalog").length})`,
            },
            {
              key: "content",
              label: `Content & Team (${CORE_TABLES.filter((t) => t.group === "content").length})`,
            },
          ] as Array<{ key: "all" | TableGroup; label: string }>
        ).map((pill) => (
          <Button
            key={pill.key}
            type="button"
            size="sm"
            variant={groupFilter === pill.key ? "default" : "outline"}
            onClick={() => setGroupFilter(pill.key)}
            className="h-8 text-xs"
          >
            {pill.label}
          </Button>
        ))}
      </div>

      {/* Table Sync Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTables.map((table) => {
          const tableStatus = status[table.id] || "idle";
          const isSyncing = Boolean(syncing[table.id]);
          const rowCount = rowCounts[table.id];

          return (
            <Card key={table.id} className="border-border/80 flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-semibold">{table.label}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{table.description}</CardDescription>
                  </div>
                  {tableStatus === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                  {tableStatus === "error" && (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-1 space-y-3">
                <div className="flex items-center justify-between text-xs rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5">
                  <span className="font-mono text-muted-foreground">{table.id}</span>
                  <Badge variant="secondary" className="text-[11px] font-semibold">
                    {typeof rowCount === "number" ? `${rowCount} rows` : "—"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div
                      className={`text-xs truncate ${
                        tableStatus === "error"
                          ? "text-destructive"
                          : tableStatus === "success"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                      }`}
                      title={messages[table.id]}
                    >
                      {messages[table.id] || "Ready to sync"}
                    </div>
                    {syncedAt[table.id] && (
                      <div className="text-[10px] text-muted-foreground">
                        At {syncedAt[table.id]}
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync(table.id)}
                    disabled={isSyncing}
                    className="h-8 shrink-0"
                  >
                    {isSyncing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    )}
                    Sync
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Any-Table Sync + Supabase Webhook Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Custom Table Replication</CardTitle>
            <CardDescription>
              On-demand sync for operational tables like `admin_pump_reports`, `quotes`, `customers`, and `system_settings`.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choose a Supabase table..." />
                </SelectTrigger>
                <SelectContent>
                  {KNOWN_TABLES.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="default"
                onClick={() => selectedTable && handleSync(selectedTable)}
                disabled={!selectedTable || Boolean(syncing[selectedTable])}
              >
                {syncing[selectedTable] ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Syncing
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Sync Table
                  </>
                )}
              </Button>
            </div>
            {selectedTable && messages[selectedTable] && (
              <p className="text-xs text-muted-foreground">
                Status ({selectedTable}): <span className="font-medium text-foreground">{messages[selectedTable]}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Automatic Webhook Sync</CardTitle>
            <CardDescription>
              Point Supabase Database Webhooks (`INSERT` / `UPDATE` / `DELETE`) to this Worker endpoint for instant edge cache updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5">
              <code className="flex-1 truncate text-xs text-primary font-mono">
                {webhookUrl}
              </code>
              <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={copyWebhookUrl}>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </Button>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://supabase.com/dashboard/project/_/database/hooks"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Open Supabase Database Webhooks
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
