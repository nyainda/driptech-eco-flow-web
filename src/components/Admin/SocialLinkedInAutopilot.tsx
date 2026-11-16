import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarClock,
  Check,
  Copy,
  Database,
  ExternalLink,
  ImagePlus,
  Linkedin,
  Loader2,
  PauseCircle,
  Play,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

type MediaAsset = {
  id: string;
  title: string;
  image_url: string;
  storage_path: string;
  category: string;
  tags: string[];
  caption_hint: string;
  location: string;
  source_type: string;
  active: boolean;
  used_count: number;
  last_used_at: string | null;
  created_at: string;
};

type LinkedInPost = {
  id: string;
  status: "draft" | "queued" | "publishing" | "published" | "failed" | "skipped";
  source_mode: string;
  topic: string;
  content_pillar: string;
  commentary: string;
  cta_url: string;
  asset_id: string | null;
  image_url: string;
  scheduled_for: string | null;
  published_at: string | null;
  linkedin_post_urn: string;
  linkedin_post_url: string;
  error_message: string | null;
  created_at: string;
};

type AutopilotSettings = {
  autopilot_enabled: boolean;
  auto_replenish_queue: boolean;
  min_queue_buffer: number;
  posts_per_week: number;
  preferred_post_hour_eat: number;
  posting_days: string[];
  use_live_web_trends: boolean;
  default_cta_url: string;
  brand_voice: string;
  linkedin_api_version: string;
  last_generated_at: string | null;
  last_published_at: string | null;
};

type ConnectionState = {
  connected: boolean;
  author_urn: string;
  account_name: string;
  account_avatar_url: string;
  post_target: "member" | "organization";
  organization_id: string;
  access_token_expires_at: string | null;
  has_refresh_token: boolean;
  scope: string;
};

type UsageTelemetry = {
  todayCalls: number;
  todayTokens: number;
  todayWebSearchCalls: number;
  todaySpendUsd: number;
  dailyBudgetUsd: number;
  dailyTokenCap: number;
};

const DAY_OPTIONS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const ASSET_CATEGORIES = [
  "drip",
  "sprinklers",
  "pumps",
  "filtration",
  "fertigation",
  "greenhouse",
  "projects",
  "kits",
  "general",
];

function formatEatDateTime(iso: string | null | undefined) {
  if (!iso) return "Unscheduled";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Invalid date";
  return d.toLocaleString("en-KE", {
    timeZone: "Africa/Nairobi",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toLocalDateTimeInputValue(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const SocialLinkedInAutopilot: React.FC = () => {
  const [activeTab, setActiveTab] = useState("queue");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [grokConfigured, setGrokConfigured] = useState(false);
  const [grokModel, setGrokModel] = useState("grok-4.7");
  const [oauthReady, setOauthReady] = useState(false);
  const [clientIdPreview, setClientIdPreview] = useState("");
  const [clientSecretConfigured, setClientSecretConfigured] = useState(false);
  const [redirectUri, setRedirectUri] = useState("");
  const [usageTelemetry, setUsageTelemetry] = useState<UsageTelemetry | null>(null);

  const [connection, setConnection] = useState<ConnectionState>({
    connected: false,
    author_urn: "",
    account_name: "",
    account_avatar_url: "",
    post_target: "member",
    organization_id: "",
    access_token_expires_at: null,
    has_refresh_token: false,
    scope: "",
  });

  const [settings, setSettings] = useState<AutopilotSettings>({
    autopilot_enabled: false,
    auto_replenish_queue: true,
    min_queue_buffer: 3,
    posts_per_week: 3,
    preferred_post_hour_eat: 9,
    posting_days: ["mon", "wed", "fri"],
    use_live_web_trends: true,
    default_cta_url: "https://www.dripstech.co.ke",
    brand_voice: "",
    linkedin_api_version: "202610",
    last_generated_at: null,
    last_published_at: null,
  });

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [posts, setPosts] = useState<LinkedInPost[]>([]);

  // Batch generation inputs
  const [topicFocus, setTopicFocus] = useState("");
  const [batchCount, setBatchCount] = useState(3);

  // Editing existing queue item
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState("");
  const [editCommentary, setEditCommentary] = useState("");
  const [editCtaUrl, setEditCtaUrl] = useState("");
  const [editAssetId, setEditAssetId] = useState("");
  const [editScheduledFor, setEditScheduledFor] = useState("");

  // Manual post composer
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTopic, setManualTopic] = useState("");
  const [manualCommentary, setManualCommentary] = useState("");
  const [manualAssetId, setManualAssetId] = useState("");
  const [manualScheduledFor, setManualScheduledFor] = useState("");

  // Image DB upload form
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newAssetTitle, setNewAssetTitle] = useState("");
  const [newAssetCategory, setNewAssetCategory] = useState("projects");
  const [newAssetLocation, setNewAssetLocation] = useState("");
  const [newAssetTags, setNewAssetTags] = useState("");
  const [newAssetHint, setNewAssetHint] = useState("");
  const [newAssetFile, setNewAssetFile] = useState<File | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingAssetHint, setEditingAssetHint] = useState("");

  // LinkedIn credential form
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientSecretInput, setClientSecretInput] = useState("");
  const [postTargetInput, setPostTargetInput] = useState<"member" | "organization">("member");
  const [orgIdInput, setOrgIdInput] = useState("");
  const [manualTokenInput, setManualTokenInput] = useState("");
  const [manualUrnInput, setManualUrnInput] = useState("");
  const [copiedUri, setCopiedUri] = useState(false);

  const applyServerPayload = useCallback((data: Record<string, unknown>) => {
    setGrokConfigured(!!data.grokConfigured);
    setGrokModel(typeof data.grokModel === "string" && data.grokModel ? data.grokModel : "grok-4.7");
    setOauthReady(!!data.oauthReady);
    setClientIdPreview(String(data.clientIdPreview || ""));
    setClientSecretConfigured(!!data.clientSecretConfigured);
    setRedirectUri(String(data.redirectUri || ""));
    if (data.usageTelemetry && typeof data.usageTelemetry === "object") {
      setUsageTelemetry(data.usageTelemetry as UsageTelemetry);
    }
    if (data.connection && typeof data.connection === "object") {
      const conn = data.connection as ConnectionState;
      setConnection(conn);
      setPostTargetInput(conn.post_target === "organization" ? "organization" : "member");
      setOrgIdInput(conn.organization_id || "");
    }
    if (data.settings && typeof data.settings === "object") {
      setSettings(data.settings as AutopilotSettings);
    }
    if (Array.isArray(data.assets)) {
      setAssets(data.assets as MediaAsset[]);
    }
    if (Array.isArray(data.posts)) {
      setPosts(data.posts as LinkedInPost[]);
    }
  }, []);

  const loadContext = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await invokeEdgeFunction("social-linkedin-autopilot", { action: "context" });
      applyServerPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load LinkedIn social autopilot.");
    } finally {
      setLoading(false);
    }
  }, [applyServerPayload]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const liStatus = params.get("linkedin");
    const detail = params.get("detail");
    if (liStatus === "connected") {
      setNotice("LinkedIn account connected successfully.");
      setActiveTab("settings");
    } else if (liStatus === "error") {
      setError(detail ? `LinkedIn authorization failed: ${detail}` : "LinkedIn authorization failed.");
      setActiveTab("settings");
    }
    if (liStatus) {
      params.delete("linkedin");
      params.delete("detail");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
    loadContext();
  }, [loadContext]);

  const queuePosts = useMemo(
    () => posts.filter((p) => ["queued", "draft", "publishing", "failed"].includes(p.status)),
    [posts],
  );
  const publishedPosts = useMemo(
    () => posts.filter((p) => p.status === "published"),
    [posts],
  );
  const activeAssets = useMemo(() => assets.filter((a) => a.active), [assets]);

  const runAction = async (
    label: string,
    body: Record<string, unknown>,
    successMsg?: string,
  ) => {
    setBusyAction(label);
    setError("");
    setNotice("");
    try {
      const data = await invokeEdgeFunction("social-linkedin-autopilot", body);
      applyServerPayload(data);
      if (successMsg) setNotice(successMsg);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
      return null;
    } finally {
      setBusyAction("");
    }
  };

  const handleGenerateBatch = async () => {
    const res = await runAction("generate_batch", {
      action: "generate_batch",
      count: batchCount,
      autoApprove: true,
      topicFocus,
    });
    if (res) {
      const count = Number(res.generatedCount || 0);
      const tokens = Number((res.usage as Record<string, unknown> | undefined)?.total_tokens || 0);
      setNotice(
        `Grok drafted & scheduled ${count} LinkedIn post${count === 1 ? "" : "s"}${tokens ? ` (${tokens.toLocaleString()} tokens)` : ""}.`,
      );
      setTopicFocus("");
      setActiveTab("queue");
    }
  };

  const handleRunAutopilot = async () => {
    const res = await runAction("run_autopilot", {
      action: "run_autopilot",
      manualTrigger: true,
    });
    if (res) {
      const parts: string[] = [];
      if (Number(res.replenishedCount || 0) > 0) parts.push(`generated ${res.replenishedCount} queued posts`);
      if (res.publishedPost) parts.push("published 1 due post to LinkedIn");
      setNotice(parts.length ? `Autopilot finished: ${parts.join(" & ")}.` : String(res.note || "Autopilot check completed."));
    }
  };

  const handleSyncCatalogImages = async () => {
    const res = await runAction("sync_catalog_images", { action: "sync_catalog_images" });
    if (res) {
      setNotice(`Synced existing catalog & project photos (${Number(res.imported || 0)} newly added to Image Database).`);
    }
  };

  const handleUploadNewAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetFile) {
      setError("Choose a JPG, PNG, or GIF image file to upload.");
      return;
    }
    if (!/^image\/(jpeg|jpg|png|gif)$/i.test(newAssetFile.type)) {
      setError("LinkedIn Images API requires JPG, PNG, or GIF images.");
      return;
    }

    setUploadingImage(true);
    setError("");
    setNotice("");
    try {
      const ext = newAssetFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `social-campaign/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("images").upload(filePath, newAssetFile);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl || "";
      if (!publicUrl) throw new Error("Failed to get uploaded image public URL.");

      const saved = await runAction(
        "upsert_asset",
        {
          action: "upsert_asset",
          title: newAssetTitle.trim() || newAssetFile.name.replace(/\.[^.]+$/, ""),
          image_url: publicUrl,
          storage_path: filePath,
          category: newAssetCategory,
          location: newAssetLocation.trim(),
          tags: newAssetTags,
          caption_hint: newAssetHint.trim(),
          active: true,
        },
        "Uploaded photo into Image Database.",
      );
      if (saved) {
        setNewAssetTitle("");
        setNewAssetLocation("");
        setNewAssetTags("");
        setNewAssetHint("");
        setNewAssetFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload campaign image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const startEditPost = (post: LinkedInPost) => {
    setEditingPostId(post.id);
    setEditTopic(post.topic);
    setEditCommentary(post.commentary);
    setEditCtaUrl(post.cta_url);
    setEditAssetId(post.asset_id || "");
    setEditScheduledFor(toLocalDateTimeInputValue(post.scheduled_for));
  };

  const handleSaveEditPost = async () => {
    if (!editingPostId) return;
    const res = await runAction(
      "update_post",
      {
        action: "update_post",
        id: editingPostId,
        topic: editTopic,
        commentary: editCommentary,
        cta_url: editCtaUrl,
        asset_id: editAssetId,
        scheduled_for: editScheduledFor ? new Date(editScheduledFor).toISOString() : null,
      },
      "Updated post in queue.",
    );
    if (res) setEditingPostId(null);
  };

  const handleCreateManualPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await runAction(
      "create_manual_post",
      {
        action: "create_manual_post",
        topic: manualTopic || "DripTech Field Highlight",
        commentary: manualCommentary,
        asset_id: manualAssetId || undefined,
        scheduled_for: manualScheduledFor ? new Date(manualScheduledFor).toISOString() : new Date().toISOString(),
        status: "queued",
      },
      "Added post to LinkedIn queue.",
    );
    if (res) {
      setShowManualForm(false);
      setManualTopic("");
      setManualCommentary("");
      setManualAssetId("");
      setManualScheduledFor("");
    }
  };

  const handleSaveCredentials = async () => {
    const res = await runAction(
      "save_credentials",
      {
        action: "save_credentials",
        ...(clientIdInput.trim() ? { linkedin_client_id: clientIdInput.trim() } : {}),
        ...(clientSecretInput.trim() ? { linkedin_client_secret: clientSecretInput.trim() } : {}),
        post_target: postTargetInput,
        organization_id: orgIdInput.trim(),
        ...(manualTokenInput.trim() ? { manual_access_token: manualTokenInput.trim() } : {}),
        ...(manualUrnInput.trim() ? { manual_author_urn: manualUrnInput.trim() } : {}),
      },
      "Saved LinkedIn connection settings.",
    );
    if (res) {
      setClientIdInput("");
      setClientSecretInput("");
      setManualTokenInput("");
      setManualUrnInput("");
    }
  };

  const handleStartOAuth = async () => {
    setBusyAction("oauth_start");
    setError("");
    try {
      const data = await invokeEdgeFunction("social-linkedin-autopilot", {
        action: "oauth_start",
        post_target: postTargetInput,
      });
      if (data?.url && typeof data.url === "string") {
        window.location.href = data.url;
      } else {
        throw new Error("Could not build LinkedIn authorization URL.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not initiate LinkedIn OAuth.");
      setBusyAction("");
    }
  };

  const toggleDay = (dayKey: string) => {
    setSettings((prev) => {
      const exists = prev.posting_days.includes(dayKey);
      const next = exists
        ? prev.posting_days.filter((d) => d !== dayKey)
        : [...prev.posting_days, dayKey];
      return { ...prev, posting_days: next.length ? next : prev.posting_days };
    });
  };

  const copyRedirectUri = () => {
    if (!redirectUri) return;
    navigator.clipboard.writeText(redirectUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-100">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn Social Autopilot
              </span>
              <Badge variant={connection.connected ? "default" : "destructive"}>
                {connection.connected
                  ? `Connected: ${connection.account_name || connection.author_urn}`
                  : "LinkedIn setup needed"}
              </Badge>
              <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                {settings.autopilot_enabled ? "Autopilot ON" : "Autopilot Paused"}
              </Badge>
              <Badge variant="outline" className="border-white/20 text-slate-200">{grokModel}</Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Automatic LinkedIn campaigns powered by Grok &amp; your Image Database
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Grok researches seasonal Kenya irrigation angles, picks unused real photos from your Image Database, drafts B2B posts in batches to keep token costs tiny, and publishes directly on schedule.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={handleRunAutopilot}
              disabled={!!busyAction || loading}
              className="bg-sky-500 text-white hover:bg-sky-600"
            >
              {busyAction === "run_autopilot" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Run Autopilot Now
            </Button>
            <Button
              variant="outline"
              onClick={loadContext}
              disabled={loading || !!busyAction}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <RefreshCw className={"mr-2 h-4 w-4 " + (loading ? "animate-spin" : "")} /> Refresh
            </Button>
          </div>
        </div>

        {usageTelemetry && (
          <div className="relative mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300">
            <span>Active images: <strong className="text-white">{activeAssets.length}</strong></span>
            <span>Queued posts: <strong className="text-white">{queuePosts.filter((p) => p.status === "queued").length}</strong></span>
            <span>
              Today across Grok: <strong className="text-white">{usageTelemetry.todayCalls}</strong> call{usageTelemetry.todayCalls === 1 ? "" : "s"} ·{" "}
              <strong className="text-white">{usageTelemetry.todayTokens.toLocaleString("en-KE")}</strong> tokens ·{" "}
              <strong className="text-emerald-300">${usageTelemetry.todaySpendUsd.toFixed(4)}</strong> / ${usageTelemetry.dailyBudgetUsd.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      )}

      <Card className="rounded-2xl">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <Label htmlFor="topicFocus" className="text-xs font-semibold text-muted-foreground">
              Ask Grok to plan &amp; match next LinkedIn batch against your Image Database
            </Label>
            <Input
              id="topicFocus"
              value={topicFocus}
              onChange={(e) => setTopicFocus(e.target.value)}
              placeholder="Optional theme (e.g. Avocado drip irrigation Nakuru, solar borehole pumps, greenhouse tomatoes)..."
              className="mt-1.5"
            />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label htmlFor="batchCount" className="text-xs text-muted-foreground">Posts</Label>
              <select
                id="batchCount"
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="mt-1.5 block h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value={1}>1 post</option>
                <option value={3}>3 posts (1 wk)</option>
                <option value={5}>5 posts (batch)</option>
              </select>
            </div>
            <Button
              onClick={handleGenerateBatch}
              disabled={!grokConfigured || activeAssets.length === 0 || !!busyAction}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {busyAction === "generate_batch" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Batch with Grok
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="queue">Post Queue ({queuePosts.length})</TabsTrigger>
          <TabsTrigger value="assets">Image Database ({assets.length})</TabsTrigger>
          <TabsTrigger value="settings">LinkedIn &amp; Schedule</TabsTrigger>
          <TabsTrigger value="published">Published ({publishedPosts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Queued posts publish automatically on schedule ({settings.posting_days.join(", ").toUpperCase()} at {String(settings.preferred_post_hour_eat).padStart(2, "0")}:00 EAT) or manually anytime.
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowManualForm((v) => !v)}>
              <Plus className="mr-1.5 h-4 w-4" /> New Manual Post
            </Button>
          </div>

          {showManualForm && (
            <Card className="rounded-2xl border-primary/30">
              <CardHeader>
                <CardTitle className="text-base">Write a Manual LinkedIn Post</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateManualPost} className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Topic / Headline</Label>
                      <Input
                        value={manualTopic}
                        onChange={(e) => setManualTopic(e.target.value)}
                        placeholder="2-Acre Tomato Drip Kit Installation in Kirinyaga"
                      />
                    </div>
                    <div>
                      <Label>Schedule Time</Label>
                      <Input
                        type="datetime-local"
                        value={manualScheduledFor}
                        onChange={(e) => setManualScheduledFor(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Choose Image from Database</Label>
                    <select
                      value={manualAssetId}
                      onChange={(e) => setManualAssetId(e.target.value)}
                      className="mt-1.5 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Text-only post (no image)</option>
                      {activeAssets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title} ({a.category} · used {a.used_count}x)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Post Commentary</Label>
                    <Textarea
                      rows={5}
                      value={manualCommentary}
                      onChange={(e) => setManualCommentary(e.target.value)}
                      placeholder="Write your LinkedIn post copy and include https://www.dripstech.co.ke link + hashtags..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={busyAction === "create_manual_post"}>
                      {busyAction === "create_manual_post" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Add to Queue
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowManualForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {queuePosts.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <CalendarClock className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 font-semibold">No posts in queue yet</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  First sync or upload photos in the Image Database tab, then click &ldquo;Generate Batch with Grok&rdquo; above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {queuePosts.map((post) => {
                const isEditing = editingPostId === post.id;
                return (
                  <Card key={post.id} className="rounded-2xl">
                    <CardContent className="p-4 sm:p-5">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <Label>Topic</Label>
                              <Input value={editTopic} onChange={(e) => setEditTopic(e.target.value)} />
                            </div>
                            <div>
                              <Label>Scheduled Time</Label>
                              <Input type="datetime-local" value={editScheduledFor} onChange={(e) => setEditScheduledFor(e.target.value)} />
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <Label>Matched Image Asset</Label>
                              <select
                                value={editAssetId}
                                onChange={(e) => setEditAssetId(e.target.value)}
                                className="mt-1.5 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                              >
                                <option value="">No image</option>
                                {activeAssets.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.title} ({a.category})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label>CTA URL</Label>
                              <Input value={editCtaUrl} onChange={(e) => setEditCtaUrl(e.target.value)} />
                            </div>
                          </div>
                          <div>
                            <Label>LinkedIn Commentary</Label>
                            <Textarea rows={5} value={editCommentary} onChange={(e) => setEditCommentary(e.target.value)} />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={handleSaveEditPost} disabled={busyAction === "update_post"}>
                              Save Changes
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingPostId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4 md:flex-row">
                          {post.image_url ? (
                            <img
                              src={post.image_url}
                              alt={post.topic}
                              className="h-44 w-full shrink-0 rounded-xl border object-cover md:h-36 md:w-52"
                            />
                          ) : (
                            <div className="flex h-36 w-full shrink-0 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground md:w-52">
                              Text only
                            </div>
                          )}
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={post.status === "failed" ? "destructive" : post.status === "queued" ? "default" : "secondary"}>
                                {post.status}
                              </Badge>
                              <Badge variant="outline">{post.content_pillar}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Scheduled: {formatEatDateTime(post.scheduled_for)}
                              </span>
                            </div>
                            <h3 className="text-base font-semibold">{post.topic}</h3>
                            <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                              {post.commentary}
                            </p>
                            {post.error_message && (
                              <p className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-300">
                                {post.error_message}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button
                                size="sm"
                                disabled={!connection.connected || !!busyAction}
                                onClick={() =>
                                  runAction("publish_post", { action: "publish_post", id: post.id }, "Published live to LinkedIn!")
                                }
                              >
                                {busyAction === "publish_post" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                                Publish Now
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => startEditPost(post)}>
                                Edit / Swap Photo
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  runAction("update_post", {
                                    action: "update_post",
                                    id: post.id,
                                    status: post.status === "queued" ? "draft" : "queued",
                                  })
                                }
                              >
                                {post.status === "queued" ? (
                                  <>
                                    <PauseCircle className="mr-1.5 h-3.5 w-3.5" /> Move to Draft
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-1.5 h-3.5 w-3.5" /> Approve to Queue
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:text-rose-700"
                                onClick={() => runAction("delete_post", { action: "delete_post", id: post.id }, "Deleted post.")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assets" className="mt-4 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Curated Campaign Image Database</h3>
              <p className="text-xs text-muted-foreground">
                Grok selects least-recently-used active photos matching each LinkedIn topic (JPG/PNG/GIF required by LinkedIn).
              </p>
            </div>
            <Button onClick={handleSyncCatalogImages} disabled={!!busyAction} variant="outline">
              {busyAction === "sync_catalog_images" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Import Existing Product &amp; Project Photos
            </Button>
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImagePlus className="h-4 w-4" /> Upload New Campaign Photo
              </CardTitle>
              <CardDescription>
                Add field installations, warehouse stock, or farm results with a short description hint for Grok.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadNewAsset} className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Image File (JPG, PNG, GIF)</Label>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={(e) => setNewAssetFile(e.target.files?.[0] || null)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Photo Title</Label>
                  <Input
                    value={newAssetTitle}
                    onChange={(e) => setNewAssetTitle(e.target.value)}
                    placeholder="e.g. Naivasha Rose Greenhouse Drip Manifold"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    value={newAssetCategory}
                    onChange={(e) => setNewAssetCategory(e.target.value)}
                    className="mt-1.5 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {ASSET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>County / Location (optional)</Label>
                  <Input
                    value={newAssetLocation}
                    onChange={(e) => setNewAssetLocation(e.target.value)}
                    placeholder="e.g. Nakuru, Kiambu, Eldoret"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input
                    value={newAssetTags}
                    onChange={(e) => setNewAssetTags(e.target.value)}
                    placeholder="avocado, drip-line, 1-acre, filtration"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Context Hint for Grok</Label>
                  <Input
                    value={newAssetHint}
                    onChange={(e) => setNewAssetHint(e.target.value)}
                    placeholder="What should Grok mention about this photo?"
                    className="mt-1.5"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" disabled={uploadingImage || !newAssetFile}>
                    {uploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Upload to Image Database
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <Card key={asset.id} className={"overflow-hidden rounded-2xl " + (!asset.active ? "opacity-60" : "")}>
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                  <img src={asset.image_url} alt={asset.title} className="h-full w-full object-cover" />
                </div>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 font-semibold text-sm">{asset.title}</p>
                    <Badge variant="outline" className="shrink-0 text-[10px]">used {asset.used_count}x</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-[10px]">{asset.category}</Badge>
                    <Badge variant="outline" className="text-[10px]">{asset.source_type}</Badge>
                    {asset.location && <Badge variant="outline" className="text-[10px]">{asset.location}</Badge>}
                  </div>
                  {editingAssetId === asset.id ? (
                    <div className="space-y-2 pt-1">
                      <Input
                        value={editingAssetHint}
                        onChange={(e) => setEditingAssetHint(e.target.value)}
                        placeholder="Caption hint for Grok..."
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            await runAction("upsert_asset", {
                              action: "upsert_asset",
                              id: asset.id,
                              title: asset.title,
                              image_url: asset.image_url,
                              category: asset.category,
                              tags: asset.tags,
                              location: asset.location,
                              caption_hint: editingAssetHint,
                              active: asset.active,
                            });
                            setEditingAssetId(null);
                          }}
                        >
                          Save Hint
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingAssetId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {asset.caption_hint || "No caption hint yet"}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingAssetId(asset.id);
                        setEditingAssetHint(asset.caption_hint || "");
                      }}
                    >
                      Edit Hint
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runAction("upsert_asset", {
                          action: "upsert_asset",
                          id: asset.id,
                          title: asset.title,
                          image_url: asset.image_url,
                          category: asset.category,
                          tags: asset.tags,
                          location: asset.location,
                          caption_hint: asset.caption_hint,
                          active: !asset.active,
                        })
                      }
                    >
                      {asset.active ? "Pause" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600"
                      onClick={() => runAction("delete_asset", { action: "delete_asset", id: asset.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 grid gap-5 lg:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Linkedin className="h-4 w-4 text-sky-600" /> LinkedIn API Connection
              </CardTitle>
              <CardDescription>
                Create an app at developer.linkedin.com, enable &ldquo;Share on LinkedIn&rdquo; + &ldquo;Sign In with LinkedIn using OpenID Connect&rdquo; (or Community Management API for Company Pages), and add the redirect URL below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-muted/40 p-3 text-xs">
                <p className="font-semibold">OAuth Redirect URL to register in LinkedIn Developer Portal</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-background px-2 py-1 font-mono text-[11px]">
                    {redirectUri}
                  </code>
                  <Button type="button" size="sm" variant="outline" onClick={copyRedirectUri}>
                    {copiedUri ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>
                    LinkedIn Client ID {clientIdPreview ? `(${clientIdPreview})` : ""}
                  </Label>
                  <Input
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder={oauthReady ? "Saved — enter to replace" : "Paste Client ID"}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>
                    LinkedIn Client Secret {clientSecretConfigured ? "(Saved)" : ""}
                  </Label>
                  <Input
                    type="password"
                    value={clientSecretInput}
                    onChange={(e) => setClientSecretInput(e.target.value)}
                    placeholder={clientSecretConfigured ? "Saved on server" : "Paste Client Secret"}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Posting Destination</Label>
                  <select
                    value={postTargetInput}
                    onChange={(e) => setPostTargetInput(e.target.value === "organization" ? "organization" : "member")}
                    className="mt-1.5 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="member">Personal LinkedIn Profile (Self-Serve)</option>
                    <option value="organization">Company Page (Needs Community Management API)</option>
                  </select>
                </div>
                <div>
                  <Label>Company Page Numeric ID (optional)</Label>
                  <Input
                    value={orgIdInput}
                    onChange={(e) => setOrgIdInput(e.target.value)}
                    placeholder="e.g. 12345678"
                    disabled={postTargetInput !== "organization"}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <details className="rounded-xl border p-3 text-xs">
                <summary className="cursor-pointer font-medium">
                  Advanced: Paste OAuth Access Token directly (60-day token override)
                </summary>
                <div className="mt-3 space-y-2">
                  <Input
                    type="password"
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    placeholder="Paste LinkedIn Bearer access_token"
                  />
                  <Input
                    value={manualUrnInput}
                    onChange={(e) => setManualUrnInput(e.target.value)}
                    placeholder="Author URN (urn:li:person:... or urn:li:organization:...)"
                  />
                </div>
              </details>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveCredentials} disabled={busyAction === "save_credentials"} variant="outline">
                  Save Credentials
                </Button>
                <Button onClick={handleStartOAuth} disabled={!oauthReady || busyAction === "oauth_start"} className="bg-sky-600 text-white hover:bg-sky-700">
                  {busyAction === "oauth_start" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Linkedin className="mr-2 h-4 w-4" />}
                  {connection.connected ? "Reconnect LinkedIn OAuth" : "1-Click Connect LinkedIn"}
                </Button>
                {connection.connected && (
                  <Button variant="ghost" className="text-rose-600" onClick={() => runAction("disconnect", { action: "disconnect" }, "Disconnected LinkedIn.")}>
                    Disconnect
                  </Button>
                )}
              </div>
              {connection.connected && (
                <p className="text-xs text-muted-foreground">
                  Author URN: <code className="font-mono">{connection.author_urn}</code> · Token expires:{" "}
                  {connection.access_token_expires_at ? formatEatDateTime(connection.access_token_expires_at) : "unknown"}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="h-4 w-4" /> Autopilot Schedule &amp; Brand Rules
              </CardTitle>
              <CardDescription>
                Control when automated cron runs publish queued posts and generate replacement batches.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2.5 text-sm">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autopilot_enabled}
                    onChange={(e) => setSettings({ ...settings, autopilot_enabled: e.target.checked })}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                  <span><strong>Enable Automatic Publishing</strong> (cron publishes 1 due queued post per scheduled day)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_replenish_queue}
                    onChange={(e) => setSettings({ ...settings, auto_replenish_queue: e.target.checked })}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                  <span>Auto-generate 3 posts with Grok when queue drops below buffer</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.use_live_web_trends}
                    onChange={(e) => setSettings({ ...settings, use_live_web_trends: e.target.checked })}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                  <span>Include 1 quick web search per batch for seasonal Kenya agriculture relevance</span>
                </label>
              </div>

              <div>
                <Label>Posting Days</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {DAY_OPTIONS.map((d) => {
                    const active = settings.posting_days.includes(d.key);
                    return (
                      <Button
                        key={d.key}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        onClick={() => toggleDay(d.key)}
                      >
                        {d.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Post Hour (EAT)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={22}
                    value={settings.preferred_post_hour_eat}
                    onChange={(e) => setSettings({ ...settings, preferred_post_hour_eat: Number(e.target.value) })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Min Queue Buffer</Label>
                  <Input
                    type="number"
                    min={1}
                    max={14}
                    value={settings.min_queue_buffer}
                    onChange={(e) => setSettings({ ...settings, min_queue_buffer: Number(e.target.value) })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>LinkedIn Version</Label>
                  <Input
                    value={settings.linkedin_api_version}
                    onChange={(e) => setSettings({ ...settings, linkedin_api_version: e.target.value })}
                    placeholder="202610"
                    className="mt-1.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <Label>Default Website CTA URL</Label>
                <Input
                  value={settings.default_cta_url}
                  onChange={(e) => setSettings({ ...settings, default_cta_url: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Brand Voice &amp; Messaging Guidance</Label>
                <Textarea
                  rows={3}
                  value={settings.brand_voice}
                  onChange={(e) => setSettings({ ...settings, brand_voice: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <Button
                onClick={() =>
                  runAction(
                    "save_settings",
                    {
                      action: "save_settings",
                      ...settings,
                    },
                    "Saved LinkedIn autopilot schedule & rules.",
                  )
                }
                disabled={busyAction === "save_settings"}
              >
                {busyAction === "save_settings" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Save Schedule Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="published" className="mt-4 space-y-3">
          {publishedPosts.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No posts published to LinkedIn yet.
              </CardContent>
            </Card>
          ) : (
            publishedPosts.map((post) => (
              <Card key={post.id} className="rounded-2xl">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt={post.topic}
                      className="h-32 w-full shrink-0 rounded-xl border object-cover sm:w-44"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-emerald-600 text-white">Published</Badge>
                      <Badge variant="outline">{post.content_pillar}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatEatDateTime(post.published_at)}
                      </span>
                    </div>
                    <h4 className="font-semibold">{post.topic}</h4>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{post.commentary}</p>
                    {post.linkedin_post_url && (
                      <a
                        href={post.linkedin_post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline"
                      >
                        View Live Post on LinkedIn <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default SocialLinkedInAutopilot;
