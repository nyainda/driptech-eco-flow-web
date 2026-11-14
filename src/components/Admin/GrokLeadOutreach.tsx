import React, { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Archive,
  Ban,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Globe2,
  KeyRound,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Radar,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type LeadStatus =
  | "new"
  | "approved"
  | "email_sent"
  | "whatsapp_sent"
  | "replied"
  | "converted"
  | "unsubscribed"
  | "archived";

interface OutreachLead {
  id: string;
  campaign_id?: string | null;
  company_name: string;
  organization_type: string;
  county_region: string;
  website_url: string;
  source_url: string;
  source_title: string;
  public_email: string;
  public_phone: string;
  whatsapp_number: string;
  likely_needs: string[];
  recommended_url: string;
  why_they_need_irrigation: string;
  confidence_note: string;
  email_subject: string;
  email_body: string;
  whatsapp_message: string;
  status: LeadStatus;
  email_sent_at?: string | null;
  whatsapp_sent_at?: string | null;
  resend_message_id?: string | null;
  last_error?: string | null;
  notes: string;
  created_at: string;
}

interface OutreachCampaign {
  id: string;
  segment: string;
  region: string;
  product_focus: string;
  model: string;
  summary: string;
  source_links: Array<{ title?: string; url: string; domain?: string }>;
  lead_count: number;
  created_at: string;
}

interface CatalogLink {
  label: string;
  url: string;
}

interface OutreachJob {
  id: string;
  segment: string;
  region: string;
  product_focus?: string;
  model?: string;
  status: "queued" | "running" | "succeeded" | "failed";
  progress_message?: string;
  error_message?: string | null;
  lead_count?: number;
  skipped_duplicates?: number;
  skipped_suppressed?: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

const invokeOutreach = (body: Record<string, unknown>) =>
  invokeEdgeFunction("b2b-lead-outreach", body);

const SEGMENT_PRESETS = [
  "Commercial Avocado & Horticulture Farms",
  "Greenhouse Growers & Nursery Operators",
  "Agrovet & Hardware Stockists / Distributors",
  "County Irrigation & Borehole Water Tenders",
  "Coffee, Tea & Fruit Plantations",
  "Landscaping Contractors & Golf / Resort Estates",
  "Agricultural NGOs, Schools & Church Farms",
];

const REGION_PRESETS = [
  "Kenya (Nationwide)",
  "Kiambu, Murang'a & Nyeri",
  "Nakuru, Naivasha & Rift Valley",
  "Eldoret & Uasin Gishu",
  "Meru, Embu & Kirinyaga",
  "Machakos & Kajiado",
  "Kisumu, Kisii & Western Kenya",
  "Mombasa, Kilifi & Coast",
];

const PRODUCT_FOCUS_OPTIONS = [
  "Any DripTech Irrigation Equipment & Kits",
  "Turnkey Acreage Drip Kits (1/8 to 1+ Acre)",
  "Driplines, Emitter Tape & Fittings",
  "HDPE Pipes & Compression Fittings",
  "Sprinklers & Rain Gun Systems",
  "Solar Water Pumps & Borehole Pumping",
  "Screen, Disc & Sand Media Filtration",
  "Greenhouse Drip, Misting & Shade Netting",
];

const STATUS_BADGE_MAP: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20" },
  approved: { label: "Approved", className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20" },
  email_sent: { label: "Email Sent", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" },
  whatsapp_sent: { label: "WhatsApp Sent", className: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20" },
  replied: { label: "Replied", className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20" },
  converted: { label: "Converted", className: "bg-emerald-600 text-white border-emerald-700" },
  unsubscribed: { label: "Unsubscribed", className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground border-border" },
};

function normalizeLocalWaNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12 && (digits[3] === "7" || digits[3] === "1")) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 10 && (digits[1] === "7" || digits[1] === "1")) {
    return `254${digits.slice(1)}`;
  }
  if (digits.length === 9 && (digits[0] === "7" || digits[0] === "1")) {
    return `254${digits}`;
  }
  return "";
}

function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? "").replace(/\r?\n/g, " ");
  if (/[",]/.test(raw)) return `"${raw.replaceAll('"', '""')}"`;
  return raw;
}

interface LeadCardProps {
  lead: OutreachLead;
  catalogLinks: CatalogLink[];
  emailConfigured: boolean;
  dailyQuotaReached: boolean;
  busyAction: string;
  onUpdateLead: (leadId: string, fields: Record<string, unknown>) => Promise<void>;
  onSendEmail: (lead: OutreachLead, draft: LeadDraft) => Promise<void>;
  onOpenWhatsApp: (lead: OutreachLead, draft: LeadDraft) => Promise<void>;
  onSuppressLead: (lead: OutreachLead) => Promise<void>;
}

interface LeadDraft {
  public_email: string;
  public_phone: string;
  recommended_url: string;
  email_subject: string;
  email_body: string;
  whatsapp_message: string;
  notes: string;
}

const LeadOutreachCard: React.FC<LeadCardProps> = ({
  lead,
  catalogLinks,
  emailConfigured,
  dailyQuotaReached,
  busyAction,
  onUpdateLead,
  onSendEmail,
  onOpenWhatsApp,
  onSuppressLead,
}) => {
  const { toast } = useToast();
  const [draft, setDraft] = useState<LeadDraft>({
    public_email: lead.public_email || "",
    public_phone: lead.public_phone || "",
    recommended_url: lead.recommended_url || catalogLinks[0]?.url || "https://www.dripstech.co.ke/irrigation-kits",
    email_subject: lead.email_subject || "",
    email_body: lead.email_body || "",
    whatsapp_message: lead.whatsapp_message || "",
    notes: lead.notes || "",
  });

  useEffect(() => {
    setDraft({
      public_email: lead.public_email || "",
      public_phone: lead.public_phone || "",
      recommended_url: lead.recommended_url || catalogLinks[0]?.url || "https://www.dripstech.co.ke/irrigation-kits",
      email_subject: lead.email_subject || "",
      email_body: lead.email_body || "",
      whatsapp_message: lead.whatsapp_message || "",
      notes: lead.notes || "",
    });
  }, [lead, catalogLinks]);

  const isDirty =
    draft.public_email !== (lead.public_email || "") ||
    draft.public_phone !== (lead.public_phone || "") ||
    draft.recommended_url !== (lead.recommended_url || "") ||
    draft.email_subject !== (lead.email_subject || "") ||
    draft.email_body !== (lead.email_body || "") ||
    draft.whatsapp_message !== (lead.whatsapp_message || "") ||
    draft.notes !== (lead.notes || "");

  const waDigits = useMemo(
    () => normalizeLocalWaNumber(draft.public_phone || lead.whatsapp_number || ""),
    [draft.public_phone, lead.whatsapp_number],
  );
  const statusMeta = STATUS_BADGE_MAP[lead.status] || STATUS_BADGE_MAP.new;
  const lockedOut = lead.status === "unsubscribed" || lead.status === "archived";
  const emailAlreadySent = !!lead.email_sent_at;
  const isBusy = busyAction.startsWith(`${lead.id}:`);

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(draft.whatsapp_message);
      toast({ title: "Copied", description: "WhatsApp message copied to clipboard." });
    } catch {
      toast({
        title: "Copy blocked",
        description: "Select and copy the WhatsApp text manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="rounded-2xl border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg font-bold">{lead.company_name}</CardTitle>
              <Badge variant="outline" className={statusMeta.className}>
                {statusMeta.label}
              </Badge>
              {lead.organization_type && <Badge variant="secondary">{lead.organization_type}</Badge>}
              {lead.county_region && (
                <Badge variant="outline" className="text-xs font-normal">
                  {lead.county_region}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {lead.source_url && (
                <a
                  href={lead.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Verify Public Source
                </a>
              )}
              {lead.website_url && lead.website_url !== lead.source_url && (
                <a
                  href={lead.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-400 hover:underline font-medium"
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  Official Site
                </a>
              )}
              {lead.confidence_note && <span>· {lead.confidence_note}</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isDirty && (
              <Button
                size="sm"
                variant="secondary"
                disabled={isBusy}
                onClick={() => onUpdateLead(lead.id, { ...draft })}
              >
                {busyAction === `${lead.id}:save` ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                Save Draft
              </Button>
            )}
            {lead.status === "new" && (
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => onUpdateLead(lead.id, { ...draft, status: "approved" })}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                Approve
              </Button>
            )}
            {lead.status !== "replied" && !lockedOut && (
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => onUpdateLead(lead.id, { status: "replied" })}
              >
                Mark Replied
              </Button>
            )}
            {lead.status !== "converted" && !lockedOut && (
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => onUpdateLead(lead.id, { status: "converted" })}
              >
                Won Quote
              </Button>
            )}
            {lead.status !== "unsubscribed" && (
              <Button
                size="sm"
                variant="ghost"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                disabled={isBusy}
                onClick={() => onSuppressLead(lead)}
                title="Add to Do-Not-Contact suppression list"
              >
                <Ban className="h-3.5 w-3.5 mr-1" />
                Opt-Out
              </Button>
            )}
            {lead.status !== "archived" && (
              <Button
                size="sm"
                variant="ghost"
                disabled={isBusy}
                onClick={() => onUpdateLead(lead.id, { status: "archived" })}
                title="Archive lead"
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted/40 border border-border/60 p-3 space-y-2">
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Why they fit: </span>
            {lead.why_they_need_irrigation || "Commercial irrigation & water equipment buyer."}
          </p>
          {Array.isArray(lead.likely_needs) && lead.likely_needs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lead.likely_needs.map((need, index) => (
                <Badge key={index} variant="secondary" className="text-xs font-medium">
                  {need}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Contact Verification & Link Selection */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Public Business Email
            </Label>
            <Input
              type="email"
              value={draft.public_email}
              onChange={(e) => setDraft((prev) => ({ ...prev, public_email: e.target.value }))}
              placeholder="Not listed — verify from source page"
              disabled={lockedOut}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              Public Phone / WhatsApp
              {waDigits ? (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  · WA +{waDigits}
                </span>
              ) : draft.public_phone ? (
                <span className="text-[11px] text-amber-600 dark:text-amber-400">· Call only</span>
              ) : null}
            </Label>
            <Input
              value={draft.public_phone}
              onChange={(e) => setDraft((prev) => ({ ...prev, public_phone: e.target.value }))}
              placeholder="07xx xxx xxx or +254..."
              disabled={lockedOut}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">DripTech Landing Page to Share</Label>
            <select
              value={draft.recommended_url}
              onChange={(e) => setDraft((prev) => ({ ...prev, recommended_url: e.target.value }))}
              disabled={lockedOut}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {!catalogLinks.some((item) => item.url === draft.recommended_url) && draft.recommended_url && (
                <option value={draft.recommended_url}>{draft.recommended_url}</option>
              )}
              {catalogLinks.map((link) => (
                <option key={link.url} value={link.url}>
                  {link.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Outreach Channels */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Email Draft & Send */}
          <div className="rounded-xl border border-border/70 p-3.5 space-y-2.5 bg-card">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-sky-600" />
                Personalized Email Outreach
              </span>
              {emailAlreadySent && lead.email_sent_at && (
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Sent {new Date(lead.email_sent_at).toLocaleDateString()}
                </span>
              )}
            </div>

            <Input
              value={draft.email_subject}
              onChange={(e) => setDraft((prev) => ({ ...prev, email_subject: e.target.value }))}
              placeholder="Email subject line"
              disabled={lockedOut || emailAlreadySent}
              className="text-sm font-medium"
            />
            <Textarea
              rows={5}
              value={draft.email_body}
              onChange={(e) => setDraft((prev) => ({ ...prev, email_body: e.target.value }))}
              disabled={lockedOut || emailAlreadySent}
              className="text-xs leading-relaxed"
            />
            {lead.last_error && (
              <p className="text-xs text-rose-600 dark:text-rose-400">Last error: {lead.last_error}</p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-muted-foreground">
                Includes DripTech link + 1-click unsubscribe footer
              </span>
              <Button
                size="sm"
                disabled={
                  lockedOut ||
                  emailAlreadySent ||
                  !draft.public_email.trim() ||
                  !emailConfigured ||
                  dailyQuotaReached ||
                  isBusy
                }
                onClick={() => onSendEmail(lead, draft)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {busyAction === `${lead.id}:email` ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                )}
                {emailAlreadySent ? "Email Dispatched" : "Send Email via Resend"}
              </Button>
            </div>
          </div>

          {/* WhatsApp Draft & Direct Launch */}
          <div className="rounded-xl border border-border/70 p-3.5 space-y-2.5 bg-card">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                WhatsApp Pitch (Safe Direct Send)
              </span>
              {lead.whatsapp_sent_at && (
                <span className="text-[11px] font-medium text-green-600 dark:text-green-400">
                  Opened {new Date(lead.whatsapp_sent_at).toLocaleDateString()}
                </span>
              )}
            </div>

            <Textarea
              rows={5}
              value={draft.whatsapp_message}
              onChange={(e) => setDraft((prev) => ({ ...prev, whatsapp_message: e.target.value }))}
              disabled={lockedOut}
              className="text-xs leading-relaxed"
            />
            <Input
              value={draft.notes}
              onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Sales follow-up note (optional)..."
              className="h-8 text-xs"
            />
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={handleCopyWhatsApp} disabled={!draft.whatsapp_message.trim()}>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy Text
              </Button>
              <Button
                size="sm"
                disabled={lockedOut || !waDigits || !draft.whatsapp_message.trim() || isBusy}
                onClick={() => onOpenWhatsApp(lead, draft)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {busyAction === `${lead.id}:whatsapp` ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                )}
                Open in WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface GrokLeadOutreachProps {
  onOpenApiSettings?: () => void;
}

const GrokLeadOutreach: React.FC<GrokLeadOutreachProps> = ({ onOpenApiSettings }) => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [grokConfigured, setGrokConfigured] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [senderEmail, setSenderEmail] = useState("info@dripstech.co.ke");
  const [usingSubdomainSender, setUsingSubdomainSender] = useState(false);
  const [dailyEmailSentCount, setDailyEmailSentCount] = useState(0);
  const [dailyEmailCap, setDailyEmailCap] = useState(25);
  const [suppressionCount, setSuppressionCount] = useState(0);
  const [model, setModel] = useState("grok-4.7");
  const [catalogLinks, setCatalogLinks] = useState<CatalogLink[]>([]);
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [leads, setLeads] = useState<OutreachLead[]>([]);
  const [activeJob, setActiveJob] = useState<OutreachJob | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [segment, setSegment] = useState(SEGMENT_PRESETS[0]);
  const [region, setRegion] = useState(REGION_PRESETS[1]);
  const [productFocus, setProductFocus] = useState(PRODUCT_FOCUS_OPTIONS[0]);
  const [maxLeads, setMaxLeads] = useState(4);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const applyServerContext = useCallback((data: Record<string, unknown>) => {
    setGrokConfigured(!!data.configured);
    setEmailConfigured(!!data.emailConfigured);
    setSenderEmail(String(data.senderEmail || "info@dripstech.co.ke"));
    setUsingSubdomainSender(!!data.usingSubdomainSender);
    setDailyEmailSentCount(Number(data.dailyEmailSentCount || 0));
    setDailyEmailCap(Number(data.dailyEmailCap || 25));
    setSuppressionCount(Number(data.suppressionCount || 0));
    setModel(String(data.model || "grok-4.7"));
    setCatalogLinks(Array.isArray(data.catalogLinks) ? (data.catalogLinks as CatalogLink[]) : []);
    setCampaigns(Array.isArray(data.campaigns) ? (data.campaigns as OutreachCampaign[]) : []);
    setLeads(Array.isArray(data.leads) ? (data.leads as OutreachLead[]) : []);
    if ("activeJob" in data) {
      const incoming = data.activeJob && typeof data.activeJob === "object" ? (data.activeJob as OutreachJob) : null;
      setActiveJob(incoming && ["queued", "running"].includes(incoming.status) ? incoming : null);
    }
  }, []);

  const loadContext = useCallback(async () => {
    setLoading(true);
    setError("");
    if (!isSupabaseConfigured) {
      setError(
        "Supabase credentials (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are not active in this local D1 preview. Connect Supabase in production to run Grok B2B discovery and Resend email outreach.",
      );
      setLoading(false);
      return;
    }
    try {
      const data = await invokeOutreach({ action: "context" });
      applyServerContext(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not load Grok B2B Outreach Desk.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [applyServerContext]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const scanBusy = !!activeJob && (activeJob.status === "queued" || activeJob.status === "running");

  useEffect(() => {
    if (!scanBusy || !activeJob) {
      setElapsedSeconds(0);
      return;
    }
    const anchorMs = new Date(activeJob.started_at || activeJob.created_at).getTime();
    const updateElapsed = () => {
      if (Number.isFinite(anchorMs)) {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - anchorMs) / 1000)));
      }
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [scanBusy, activeJob]);

  useEffect(() => {
    const jobId = activeJob?.id;
    if (!jobId || !scanBusy) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const data = await invokeOutreach({ action: "job", jobId });
        if (cancelled) return;
        const job = data.job as OutreachJob | undefined;
        if (!job) {
          setActiveJob(null);
          return;
        }
        setActiveJob(job);
        if (job.status === "succeeded") {
          setActiveJob(null);
          const inserted = Number(job.lead_count || 0);
          const dupes = Number(job.skipped_duplicates || 0);
          const suppressed = Number(job.skipped_suppressed || 0);
          setNotice(
            `Grok added ${inserted} new verified prospect${inserted === 1 ? "" : "s"}` +
              (dupes ? ` (${dupes} duplicate${dupes === 1 ? "" : "s"} skipped)` : "") +
              (suppressed ? ` (${suppressed} opted-out skipped)` : "") +
              ". Review & approve before sending.",
          );
          toast({
            title: "Prospect Scan Complete",
            description: `Found ${inserted} new B2B lead${inserted === 1 ? "" : "s"} in ${job.region}.`,
          });
          await loadContext();
          return;
        }
        if (job.status === "failed") {
          setActiveJob(null);
          const msg = job.error_message || "Grok prospect discovery failed.";
          setError(msg);
          toast({ title: "Discovery Failed", description: msg, variant: "destructive" });
          return;
        }
        timer = setTimeout(poll, 2500);
      } catch (err: unknown) {
        if (!cancelled) {
          setActiveJob(null);
          setError(err instanceof Error ? err.message : "Could not check prospect scan progress.");
        }
      }
    };

    timer = setTimeout(poll, 1800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeJob?.id, scanBusy, loadContext, toast]);

  const handleDiscover = async () => {
    setDiscovering(true);
    setError("");
    setNotice("");
    try {
      const data = await invokeOutreach({
        action: "discover",
        segment,
        region,
        productFocus,
        maxLeads,
      });

      if (data.queued && data.job && typeof data.job === "object") {
        const queuedJob = data.job as OutreachJob;
        setActiveJob(queuedJob);
        setNotice(
          data.alreadyRunning
            ? "Attached to the active background Grok scan — results will appear automatically."
            : "Grok prospect scan running in background — results will load automatically.",
        );
        return;
      }

      applyServerContext(data);
      const inserted = Number(data.insertedCount || 0);
      const dupes = Number(data.skippedDuplicates || 0);
      const suppressed = Number(data.skippedSuppressed || 0);
      setNotice(
        `Grok added ${inserted} new verified prospect${inserted === 1 ? "" : "s"}` +
          (dupes ? ` (${dupes} duplicate${dupes === 1 ? "" : "s"} skipped)` : "") +
          (suppressed ? ` (${suppressed} opted-out skipped)` : "") +
          ". Review & approve before sending.",
      );
      toast({
        title: "Prospect Scan Complete",
        description: `Found ${inserted} new B2B lead${inserted === 1 ? "" : "s"} in ${region}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Grok prospect discovery failed.";
      setError(msg);
      toast({ title: "Discovery Failed", description: msg, variant: "destructive" });
    } finally {
      setDiscovering(false);
    }
  };

  const handleCancelJob = async () => {
    if (!activeJob?.id) return;
    const jobId = activeJob.id;
    setActiveJob(null);
    setNotice("");
    try {
      await invokeOutreach({ action: "cancel_job", jobId });
      toast({ title: "Scan Cancelled", description: "You can adjust your filters and start a fresh scan." });
    } catch {
      // Ignore cancellation cleanup failures; stale jobs auto-expire on the server.
    }
  };

  const handleUpdateLead = async (leadId: string, fields: Record<string, unknown>) => {
    setBusyAction(`${leadId}:save`);
    try {
      const data = await invokeOutreach({ action: "update_lead", leadId, ...fields });
      if (data.lead) {
        setLeads((prev) => prev.map((item) => (item.id === leadId ? (data.lead as OutreachLead) : item)));
      }
      toast({ title: "Saved", description: "Prospect details updated." });
    } catch (err: unknown) {
      toast({
        title: "Update Failed",
        description: err instanceof Error ? err.message : "Could not save changes.",
        variant: "destructive",
      });
    } finally {
      setBusyAction("");
    }
  };

  const handleSendEmail = async (lead: OutreachLead, draft: LeadDraft) => {
    setBusyAction(`${lead.id}:email`);
    try {
      const data = await invokeOutreach({
        action: "send_email",
        leadId: lead.id,
        public_email: draft.public_email,
        email_subject: draft.email_subject,
        email_body: draft.email_body,
        recommended_url: draft.recommended_url,
      });
      if (data.lead) {
        setLeads((prev) => prev.map((item) => (item.id === lead.id ? (data.lead as OutreachLead) : item)));
      }
      if (typeof data.dailyEmailSentCount === "number") {
        setDailyEmailSentCount(data.dailyEmailSentCount);
      }
      toast({
        title: "Email Sent",
        description: `Sent personalized pitch to ${draft.public_email} via Resend.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send email.";
      toast({ title: "Email Not Sent", description: msg, variant: "destructive" });
    } finally {
      setBusyAction("");
    }
  };

  const handleOpenWhatsApp = async (lead: OutreachLead, draft: LeadDraft) => {
    const waDigits = normalizeLocalWaNumber(draft.public_phone || lead.whatsapp_number || "");
    if (!waDigits) {
      toast({
        title: "No mobile WhatsApp number",
        description: "Enter a valid Kenyan mobile number (07xx / 01xx) first.",
        variant: "destructive",
      });
      return;
    }

    let messageWithUtm = draft.whatsapp_message.trim();
    if (!messageWithUtm.includes("utm_source=")) {
      const urlMatch = messageWithUtm.match(/https?:\/\/(?:www\.)?dripstech\.co\.ke[^\s)"]*/i);
      if (urlMatch) {
        try {
          const parsed = new URL(urlMatch[0]);
          parsed.searchParams.set("utm_source", "b2b_outreach");
          parsed.searchParams.set("utm_medium", "whatsapp");
          messageWithUtm = messageWithUtm.replace(urlMatch[0], parsed.toString());
        } catch {
          // Keep user's text unchanged if URL parse fails.
        }
      }
    }
    const url = `https://wa.me/${waDigits}?text=${encodeURIComponent(messageWithUtm)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    setBusyAction(`${lead.id}:whatsapp`);
    try {
      const data = await invokeOutreach({
        action: "mark_whatsapp_sent",
        leadId: lead.id,
        whatsapp_number: waDigits,
        whatsapp_message: draft.whatsapp_message,
      });
      if (data.lead) {
        setLeads((prev) => prev.map((item) => (item.id === lead.id ? (data.lead as OutreachLead) : item)));
      }
      toast({
        title: "WhatsApp Ready",
        description: `Marked ${lead.company_name} as contacted on WhatsApp.`,
      });
    } catch {
      // Non-fatal: the user already opened wa.me cleanly.
    } finally {
      setBusyAction("");
    }
  };

  const handleSuppressLead = async (lead: OutreachLead) => {
    setBusyAction(`${lead.id}:suppress`);
    try {
      const data = await invokeOutreach({ action: "suppress", leadId: lead.id });
      applyServerContext(data);
      toast({
        title: "Suppressed",
        description: `${lead.company_name} added to the opt-out list and will not be contacted again.`,
      });
    } catch (err: unknown) {
      toast({
        title: "Suppression Failed",
        description: err instanceof Error ? err.message : "Could not suppress lead.",
        variant: "destructive",
      });
    } finally {
      setBusyAction("");
    }
  };

  const filteredLeads = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter === "contacted") {
        if (lead.status !== "email_sent" && lead.status !== "whatsapp_sent") return false;
      } else if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return [
        lead.company_name,
        lead.organization_type,
        lead.county_region,
        lead.public_email,
        lead.public_phone,
        lead.why_they_need_irrigation,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [leads, statusFilter, searchTerm]);

  const counts = useMemo(() => {
    let newCount = 0;
    let approved = 0;
    let contacted = 0;
    let repliedOrWon = 0;
    for (const lead of leads) {
      if (lead.status === "new") newCount++;
      else if (lead.status === "approved") approved++;
      else if (lead.status === "email_sent" || lead.status === "whatsapp_sent") contacted++;
      else if (lead.status === "replied" || lead.status === "converted") repliedOrWon++;
    }
    return { all: leads.length, newCount, approved, contacted, repliedOrWon };
  }, [leads]);

  const handleExportCsv = () => {
    const headers = [
      "Company",
      "Type",
      "County",
      "Status",
      "Email",
      "Phone",
      "WhatsApp",
      "Website",
      "Source URL",
      "Recommended DripTech Page",
      "Why They Fit",
    ];
    const rows = filteredLeads.map((lead) =>
      [
        lead.company_name,
        lead.organization_type,
        lead.county_region,
        lead.status,
        lead.public_email,
        lead.public_phone,
        lead.whatsapp_number,
        lead.website_url,
        lead.source_url,
        lead.recommended_url,
        lead.why_they_need_irrigation,
      ]
        .map(escapeCsvCell)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driptech-b2b-prospects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dailyQuotaReached = dailyEmailSentCount >= dailyEmailCap;

  return (
    <div className="space-y-6">
      {/* Header & Status Pills */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Radar className="h-6 w-6 text-emerald-600" />
              Grok B2B Client Finder & Outreach Desk
            </h2>
            <Badge variant={grokConfigured ? "default" : "destructive"}>
              {grokConfigured ? `Grok (${model}) ready` : "Grok key needed"}
            </Badge>
            <Badge variant={emailConfigured ? "secondary" : "outline"}>
              {emailConfigured ? "Resend email ready" : "Resend key needed"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover commercial farms, greenhouses, agrovets &amp; tenders across Kenya using live web search, review each fit, and reach out safely via Resend or WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenApiSettings && (
            <Button variant="outline" size="sm" onClick={onOpenApiSettings}>
              <KeyRound className="h-4 w-4 mr-1.5" />
              Manage API Keys
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadContext} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={filteredLeads.length === 0}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {!loading && (!grokConfigured || !emailConfigured) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <KeyRound className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>API Key Setup Needed:</strong>{" "}
              {!grokConfigured && !emailConfigured
                ? "Add your xAI Grok API key and Resend API key in System Settings -> API Keys to enable AI discovery and email sending."
                : !grokConfigured
                  ? "Add your xAI Grok API key in System Settings -> API Keys to enable live B2B prospect discovery."
                  : "Add your Resend API key in System Settings -> API Keys to send direct outreach emails (WhatsApp outreach still works right away)."}
            </div>
          </div>
          {onOpenApiSettings && (
            <Button type="button" size="sm" variant="outline" onClick={onOpenApiSettings} className="shrink-0">
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              Open API Key Settings
            </Button>
          )}
        </div>
      )}

      {/* Safety & Deliverability Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Prospects in Pipeline</p>
            <p className="mt-1 text-2xl font-bold">{counts.all}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {counts.newCount} new · {counts.repliedOrWon} replied/won
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Daily Email Safety Cap</p>
            <p className="mt-1 text-2xl font-bold">
              {dailyEmailSentCount} / {dailyEmailCap}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Protects DripTech domain reputation</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Sender Address</p>
            <p className="mt-1 text-sm font-semibold truncate" title={senderEmail}>
              {senderEmail}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {usingSubdomainSender
                ? "Dedicated subdomain active"
                : "Tip: set Outreach Sender in Settings → API Keys"}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Suppression / Opt-Outs</p>
            <p className="mt-1 text-2xl font-bold">{suppressionCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Auto-excluded from future scans &amp; emails</p>
          </CardContent>
        </Card>
      </div>

      {!usingSubdomainSender && emailConfigured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong>Deliverability recommendation:</strong> Cold outreach currently sends via{" "}
            <code className="font-mono">{senderEmail}</code>. Once ready to scale, verify a dedicated subdomain in Resend (for example{" "}
            <code className="font-mono">sales@mail.dripstech.co.ke</code>) and update Outreach From Email in{" "}
            <span className="font-medium">System Settings → API Keys</span> so your primary{" "}
            <code className="font-mono">info@dripstech.co.ke</code> inbox stays clean.
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300 space-y-2">
          <p className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </p>
          <p className="text-xs text-rose-600/90 dark:text-rose-300/80">
            Make sure you have pushed <code className="font-mono">202611130001_b2b_outreach_leads.sql</code> &amp;{" "}
            <code className="font-mono">202611140001_b2b_outreach_async_jobs.sql</code>, deployed{" "}
            <code className="font-mono">b2b-lead-outreach</code>, and saved your xAI Grok Key &amp; Resend Key in{" "}
            <span className="font-medium">Admin → System Settings → API Keys</span>.
          </p>
        </div>
      )}

      {scanBusy && activeJob && (
        <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/[0.04]">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300 self-start sm:self-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-sm">
                  Searching {activeJob.segment} · {activeJob.region}
                </p>
                <Badge variant="outline" className="text-xs">
                  {activeJob.status} · {elapsedSeconds}s
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {activeJob.progress_message || "Running Grok web search in background..."}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-500/15">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" />
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleCancelJob} className="shrink-0 self-end sm:self-center">
              Cancel Scan
            </Button>
          </CardContent>
        </Card>
      )}

      {notice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Discovery Builder */}
      <Card className="rounded-2xl border-emerald-500/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            1. Find Real B2B Prospects with Grok Live Web Search
          </CardTitle>
          <CardDescription>
            Grok searches public websites, agricultural directories &amp; tenders in Kenya, verifies URLs, extracts only publicly posted B2B contacts, and writes custom DripTech pitches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {SEGMENT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSegment(preset)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  segment === preset
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-background hover:bg-muted text-muted-foreground border-border"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Target Buyer Segment / Search Query</Label>
              <Input
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                placeholder="e.g. Commercial avocado farms & nurseries"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">County / Region</Label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {REGION_PRESETS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Batch Size</Label>
              <select
                value={maxLeads}
                onChange={(e) => setMaxLeads(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={4}>4 prospects (Fast — Recommended)</option>
                <option value={6}>6 prospects</option>
                <option value={8}>8 prospects</option>
                <option value={10}>10 prospects</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5 flex-1 max-w-xl">
              <Label className="text-xs">Equipment Focus to Recommend</Label>
              <select
                value={productFocus}
                onChange={(e) => setProductFocus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {PRODUCT_FOCUS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleDiscover}
              disabled={discovering || scanBusy || !segment.trim() || !grokConfigured}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            >
              {discovering || scanBusy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {scanBusy ? `Scanning in background (${elapsedSeconds}s)...` : "Starting Grok scan..."}
                </>
              ) : (
                <>
                  <Radar className="h-4 w-4 mr-2" />
                  Find B2B Prospects with Grok
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Filter & Search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full lg:w-auto overflow-x-auto">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="new">New ({counts.newCount})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="contacted">Contacted ({counts.contacted})</TabsTrigger>
            <TabsTrigger value="replied">Replied ({leads.filter((l) => l.status === "replied").length})</TabsTrigger>
            <TabsTrigger value="converted">Won ({leads.filter((l) => l.status === "converted").length})</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by farm, county, email..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Prospect Cards */}
      {loading ? (
        <Card className="rounded-2xl">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-sm">Loading B2B prospects &amp; outreach status...</p>
          </CardContent>
        </Card>
      ) : filteredLeads.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-14 text-center space-y-2">
            <Radar className="h-8 w-8 mx-auto text-emerald-600/70" />
            <p className="font-semibold">No prospects match this view yet</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Pick an agricultural segment &amp; county above and click <strong>Find B2B Prospects with Grok</strong> to populate your outreach queue.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <LeadOutreachCard
              key={lead.id}
              lead={lead}
              catalogLinks={catalogLinks}
              emailConfigured={emailConfigured}
              dailyQuotaReached={dailyQuotaReached}
              busyAction={busyAction}
              onUpdateLead={handleUpdateLead}
              onSendEmail={handleSendEmail}
              onOpenWhatsApp={handleOpenWhatsApp}
              onSuppressLead={handleSuppressLead}
            />
          ))}
        </div>
      )}

      {/* Recent Discovery Runs & Citations */}
      {campaigns.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Grok Discovery Runs &amp; Verified Web Sources</CardTitle>
            <CardDescription>Audit trail of every search and public citation used</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.slice(0, 6).map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-xl border border-border/60 p-3.5 space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-sm">
                    {campaign.segment} · <span className="text-emerald-700 dark:text-emerald-400">{campaign.region}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="outline">{campaign.lead_count} new leads</Badge>
                    <span>{new Date(campaign.created_at).toLocaleString()}</span>
                  </div>
                </div>
                {campaign.summary && <p className="text-muted-foreground leading-relaxed">{campaign.summary}</p>}
                {Array.isArray(campaign.source_links) && campaign.source_links.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {campaign.source_links.slice(0, 6).map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {src.domain || src.title || src.url}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GrokLeadOutreach;
