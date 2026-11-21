import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Building,
  Calendar,
  Check,
  CheckCheck,
  ChevronDown,
  Compass,
  DollarSign,
  Grid3X3,
  Inbox,
  List,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  Ruler,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import {
  buildWhatsAppChatUrl,
  inferIrrigationSystemType,
  parseAcreageFromText,
} from "@/lib/adminContactHelpers";
import type { EngineeringReportSeed } from "@/lib/engineeringReportEngine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  project_type: string | null;
  budget_range: string | null;
  area_size: string | null;
  message: string;
  status: string;
  read: boolean;
  created_at: string;
}

interface CustomerRef {
  id: string;
  email: string;
  contact_person: string;
}

type StatusFilter = "all" | "unread" | "new" | "in_progress" | "resolved";
type SortField = "created_at" | "name" | "status";

interface ContactNotificationsProps {
  onStartEngineeringReport?: (seed: EngineeringReportSeed) => void;
}

type ParsedMessageSegment =
  | { type: "field"; field: string; value: string }
  | { type: "text"; content: string };

const parseMessageSegments = (message: string): ParsedMessageSegment[] => {
  if (!message) return [];
  const lines = message.split("\n");
  const segments: ParsedMessageSegment[] = [];
  const textBuffer: string[] = [];

  const flushText = () => {
    const joined = textBuffer.join("\n").trim();
    if (joined) {
      segments.push({ type: "text", content: joined });
    }
    textBuffer.length = 0;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushText();
      continue;
    }
    const colonIdx = line.indexOf(":");
    if (colonIdx > 1 && colonIdx < 36 && !line.slice(0, colonIdx).includes("http")) {
      flushText();
      segments.push({
        type: "field",
        field: line.slice(0, colonIdx).trim(),
        value: line.slice(colonIdx + 1).trim(),
      });
    } else {
      textBuffer.push(line);
    }
  }
  flushText();

  if (segments.length === 0) {
    return [{ type: "text", content: message }];
  }
  return segments;
};

const formatDateShort = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat("en-KE", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case "new":
      return {
        label: "New",
        className: "bg-primary/10 text-primary border-primary/25",
      };
    case "in_progress":
    case "contacted":
      return {
        label: status === "contacted" ? "Contacted" : "In Progress",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
      };
    case "resolved":
      return {
        label: "Resolved",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
      };
    case "read":
      return {
        label: "Reviewed",
        className: "bg-muted text-muted-foreground border-border",
      };
    default:
      return {
        label: status || "New",
        className: "bg-muted text-muted-foreground border-border",
      };
  }
};

const isPumpOrSizingLead = (sub: ContactSubmission) => {
  const haystack = `${sub.project_type || ""} ${sub.message || ""}`.toLowerCase();
  return (
    haystack.includes("pump") ||
    haystack.includes("solar") ||
    haystack.includes("borehole") ||
    haystack.includes("sizing") ||
    haystack.includes("drip") ||
    haystack.includes("dam")
  );
};

const ContactNotifications: React.FC<ContactNotificationsProps> = ({
  onStartEngineeringReport,
}) => {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<ContactSubmission | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkViewport = () => {
      if (window.innerWidth >= 1120) {
        setViewMode("table");
      } else {
        setViewMode("cards");
      }
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const {
    data: submissions = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["contact-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching submissions:", error);
        throw error;
      }
      return (data || []) as ContactSubmission[];
    },
  });

  const { data: existingCustomers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("email, contact_person, id")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching customers:", error);
        return [];
      }
      return (data || []) as CustomerRef[];
    },
  });

  const existingEmailMap = useMemo(() => {
    const map = new Map<string, CustomerRef>();
    for (const c of existingCustomers) {
      if (c.email) {
        map.set(c.email.trim().toLowerCase(), c);
      }
    }
    return map;
  }, [existingCustomers]);

  const convertToCustomerMutation = useMutation({
    mutationFn: async (submission: ContactSubmission) => {
      const normalizedEmail = submission.email.trim().toLowerCase();
      if (existingEmailMap.has(normalizedEmail)) {
        throw new Error(`Customer with email ${submission.email} already exists in CRM.`);
      }

      const customerData = {
        contact_person: submission.name,
        email: submission.email,
        phone: submission.phone || "",
        company_name: submission.company || "",
        address: "",
        city: "",
        country: "Kenya",
        user_role: "customer" as const,
      };

      const { data, error } = await supabase
        .from("customers")
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("contact_submissions")
        .update({ status: "resolved", read: true })
        .eq("id", submission.id);

      return data;
    },
    onSuccess: (_data, submission) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      toast({
        title: "Converted to CRM Customer",
        description: `${submission.name} has been added to Customers and marked resolved.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Conversion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const batchConvertMutation = useMutation({
    mutationFn: async (selectedSubs: ContactSubmission[]) => {
      const newCustomers = selectedSubs
        .filter((sub) => !existingEmailMap.has(sub.email.trim().toLowerCase()))
        .map((sub) => ({
          contact_person: sub.name,
          email: sub.email,
          phone: sub.phone || "",
          company_name: sub.company || "",
          address: "",
          city: "",
          country: "Kenya",
          user_role: "customer" as const,
        }));

      if (newCustomers.length === 0) {
        throw new Error("All selected contacts already exist in Customers.");
      }

      const { data, error } = await supabase
        .from("customers")
        .insert(newCustomers)
        .select();

      if (error) throw error;

      const selectedIds = selectedSubs.map((sub) => sub.id);
      await supabase
        .from("contact_submissions")
        .update({ status: "resolved", read: true })
        .in("id", selectedIds);

      return { created: data || [], skipped: selectedSubs.length - newCustomers.length };
    },
    onSuccess: ({ created, skipped }) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      setSelectedSubmissions([]);
      setShowBatchModal(false);
      toast({
        title: "Batch CRM Conversion Complete",
        description: `Created ${created.length} customer record(s)${skipped > 0 ? ` (${skipped} duplicates skipped)` : ""}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Batch Conversion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ read: true, status: "read" })
        .eq("id", submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      toast({ title: "Marked as Read" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const batchMarkReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ read: true, status: "read" })
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      setSelectedSubmissions([]);
      toast({
        title: "Marked Selected as Read",
        description: `Updated ${ids.length} message(s).`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ status, read: status !== "new" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      toast({ title: "Inquiry status updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Status Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase
        .from("contact_submissions")
        .delete()
        .eq("id", submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      setDeleteTarget(null);
      toast({ title: "Message deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleRowExpansion = (submissionId: string) => {
    setExpandedRows((prev) =>
      prev.includes(submissionId)
        ? prev.filter((id) => id !== submissionId)
        : [...prev, submissionId],
    );
  };

  const toggleSubmissionSelection = (submissionId: string) => {
    setSelectedSubmissions((prev) =>
      prev.includes(submissionId)
        ? prev.filter((id) => id !== submissionId)
        : [...prev, submissionId],
    );
  };

  const handleSort = (column: SortField) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handleReplyWhatsApp = (sub: ContactSubmission) => {
    const firstName = sub.name.split(" ")[0] || "there";
    const projectRef = sub.project_type ? ` regarding your ${sub.project_type} inquiry` : "";
    const msg = `Hello ${firstName}, thank you for contacting DripTech Eco Flow${projectRef}. Our irrigation engineering team is reviewing your site details and can prepare a system sizing & BOQ proposal for you.`;
    const waUrl = buildWhatsAppChatUrl(sub.phone, msg);
    if (!waUrl) {
      toast({
        title: "No Valid Phone Number",
        description: "This message does not include a valid phone/WhatsApp number.",
        variant: "destructive",
      });
      return;
    }
    openTrackedWhatsApp(waUrl, "admin_contact_messages_reply");
    if (!sub.read) {
      markAsReadMutation.mutate(sub.id);
    }
  };

  const handleLaunchEngineeringReport = (sub: ContactSubmission) => {
    if (!onStartEngineeringReport) return;
    const matchedCustomer = existingEmailMap.get(sub.email.trim().toLowerCase());
    const parsedAcres =
      parseAcreageFromText(sub.area_size) || parseAcreageFromText(sub.message);
    const inferredSystem = inferIrrigationSystemType(sub.project_type, sub.message);
    onStartEngineeringReport({
      clientName: sub.name,
      companyFarmName: sub.company || undefined,
      clientPhone: sub.phone || undefined,
      clientEmail: sub.email,
      acres: parsedAcres,
      systemType: inferredSystem,
      customerId: matchedCustomer?.id,
      projectTitle: `${sub.company || sub.name} — ${sub.project_type || "Irrigation & Solar"} Proposal`,
      siteNotes: `Source: Contact Inquiry (${formatDateShort(sub.created_at)})\nBudget: ${sub.budget_range || "Unspecified"}\nArea: ${sub.area_size || "Unspecified"}\n\n${sub.message}`,
      reportEdition: "client_proposal",
      sourceModule: "Contact Messages",
    });
  };

  const projectTypes = useMemo(() => {
    const set = new Set<string>();
    for (const s of submissions) {
      if (s.project_type?.trim()) set.add(s.project_type.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [submissions]);

  const stats = useMemo(() => {
    const unread = submissions.filter((s) => !s.read).length;
    const sizingLeads = submissions.filter(isPumpOrSizingLead).length;
    const readyToConvert = submissions.filter(
      (s) => s.email && !existingEmailMap.has(s.email.trim().toLowerCase()),
    ).length;
    const converted = submissions.filter(
      (s) => s.email && existingEmailMap.has(s.email.trim().toLowerCase()),
    ).length;
    return {
      total: submissions.length,
      unread,
      sizingLeads,
      readyToConvert,
      converted,
    };
  }, [submissions, existingEmailMap]);

  const sortedAndFilteredSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return submissions
      .filter((sub) => {
        if (filter === "unread") return !sub.read;
        if (filter === "new") return sub.status === "new";
        if (filter === "in_progress") {
          return sub.status === "in_progress" || sub.status === "contacted";
        }
        if (filter === "resolved") return sub.status === "resolved";
        return true;
      })
      .filter((sub) => {
        if (projectTypeFilter === "all") return true;
        return (sub.project_type || "").trim() === projectTypeFilter;
      })
      .filter((sub) => {
        if (!q) return true;
        return (
          sub.name.toLowerCase().includes(q) ||
          sub.email.toLowerCase().includes(q) ||
          (sub.phone || "").toLowerCase().includes(q) ||
          (sub.company || "").toLowerCase().includes(q) ||
          (sub.project_type || "").toLowerCase().includes(q) ||
          sub.message.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;
        if (sortBy === "name") {
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
        } else if (sortBy === "status") {
          aVal = a.status;
          bVal = b.status;
        } else {
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
        }
        if (sortOrder === "asc") return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      });
  }, [submissions, filter, projectTypeFilter, searchQuery, sortBy, sortOrder]);

  const selectedSubs = useMemo(
    () => submissions.filter((s) => selectedSubmissions.includes(s.id)),
    [submissions, selectedSubmissions],
  );

  const selectedEligibleToConvert = useMemo(
    () =>
      selectedSubs.filter(
        (s) => s.email && !existingEmailMap.has(s.email.trim().toLowerCase()),
      ),
    [selectedSubs, existingEmailMap],
  );

  const allVisibleSelected =
    sortedAndFilteredSubmissions.length > 0 &&
    sortedAndFilteredSubmissions.every((s) => selectedSubmissions.includes(s.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(sortedAndFilteredSubmissions.map((s) => s.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Inbox className="h-5 w-5" />
            {stats.unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {stats.unread}
              </span>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Contact Messages & Leads
              </h2>
              <Badge variant="outline" className="border-primary/30 text-primary">
                {stats.total} Total
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Respond on WhatsApp or email, convert qualified inquiries to Customers CRM, and launch Engineering Reports in one click.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedSubmissions.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => batchMarkReadMutation.mutate(selectedSubmissions)}
                disabled={batchMarkReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-1.5" />
                Mark Read ({selectedSubmissions.length})
              </Button>
              {selectedEligibleToConvert.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setShowBatchModal(true)}
                >
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Convert to CRM ({selectedEligibleToConvert.length})
                </Button>
              )}
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Inquiries
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-0.5">All contact form submissions</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Unread Attention
            </CardTitle>
            <Inbox className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.unread}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Awaiting first team response</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Sizing & System Leads
            </CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.sizingLeads}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Pump, solar, drip or dam scope</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Synced to CRM
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.converted}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.readyToConvert} ready to convert
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Controls */}
      <Card className="border-border/70">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, phone, company, project type or message..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={projectTypeFilter} onValueChange={setProjectTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Project Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Project Types</SelectItem>
                  {projectTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  className="h-8 px-2.5"
                  onClick={() => setViewMode("cards")}
                  title="Card view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  className="h-8 px-2.5"
                  onClick={() => setViewMode("table")}
                  title="Table view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: "all", label: "All", count: submissions.length },
                  { key: "unread", label: "Unread", count: stats.unread },
                  {
                    key: "new",
                    label: "New",
                    count: submissions.filter((s) => s.status === "new").length,
                  },
                  {
                    key: "in_progress",
                    label: "In Progress",
                    count: submissions.filter(
                      (s) => s.status === "in_progress" || s.status === "contacted",
                    ).length,
                  },
                  {
                    key: "resolved",
                    label: "Resolved",
                    count: submissions.filter((s) => s.status === "resolved").length,
                  },
                ] as Array<{ key: StatusFilter; label: string; count: number }>
              ).map((tab) => (
                <Button
                  key={tab.key}
                  type="button"
                  size="sm"
                  variant={filter === tab.key ? "default" : "outline"}
                  onClick={() => setFilter(tab.key)}
                  className="h-8 text-xs"
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      filter === tab.key
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                </Button>
              ))}
            </div>

            {sortedAndFilteredSubmissions.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleSelectAllVisible}
                className="text-xs text-muted-foreground"
              >
                {allVisibleSelected ? "Clear Selection" : `Select All (${sortedAndFilteredSubmissions.length})`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {isLoading ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading contact submissions...</p>
          </CardContent>
        </Card>
      ) : sortedAndFilteredSubmissions.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No matching messages</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {searchQuery || projectTypeFilter !== "all" || filter !== "all"
                ? "Try clearing your search or status filters to see more inquiries."
                : "New inquiries from your website Contact & Consultation forms will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedAndFilteredSubmissions.map((sub) => {
            const isExpanded = expandedRows.includes(sub.id);
            const isSelected = selectedSubmissions.includes(sub.id);
            const existingCustomer = sub.email
              ? existingEmailMap.get(sub.email.trim().toLowerCase())
              : undefined;
            const statusStyle = getStatusBadgeStyle(sub.status);
            const hasPhone = Boolean(buildWhatsAppChatUrl(sub.phone));

            return (
              <Card
                key={sub.id}
                className={`border-border/80 transition-shadow hover:shadow-md ${
                  !sub.read ? "border-l-4 border-l-primary" : ""
                } ${isSelected ? "ring-2 ring-primary/40" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSubmissionSelection(sub.id)}
                        className="mt-1"
                        aria-label={`Select inquiry from ${sub.name}`}
                      />
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                          !sub.read
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {sub.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base truncate">{sub.name}</CardTitle>
                          {!sub.read && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">
                              Unread
                            </Badge>
                          )}
                          {existingCustomer && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            >
                              In CRM
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex flex-col gap-0.5 mt-1 text-xs">
                          <span className="flex items-center gap-1.5 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{sub.email}</span>
                          </span>
                          {sub.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 shrink-0" />
                              {sub.phone}
                            </span>
                          )}
                          {sub.company && (
                            <span className="flex items-center gap-1.5">
                              <Building className="h-3 w-3 shrink-0" />
                              {sub.company}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>

                    <Badge variant="outline" className={`shrink-0 ${statusStyle.className}`}>
                      {statusStyle.label}
                    </Badge>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {sub.project_type && (
                      <Badge variant="secondary" className="text-xs font-normal gap-1">
                        <MapPin className="h-3 w-3" />
                        {sub.project_type}
                      </Badge>
                    )}
                    {sub.area_size && (
                      <Badge variant="secondary" className="text-xs font-normal gap-1">
                        <Ruler className="h-3 w-3" />
                        {sub.area_size}
                      </Badge>
                    )}
                    {sub.budget_range && (
                      <Badge variant="secondary" className="text-xs font-normal gap-1">
                        <DollarSign className="h-3 w-3" />
                        {sub.budget_range}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs font-normal gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDateShort(sub.created_at)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  {/* Compact preview */}
                  <p className="text-sm text-muted-foreground line-clamp-2 bg-muted/40 rounded-lg px-3 py-2 border border-border/50">
                    {sub.message}
                  </p>

                  {/* Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {hasPhone && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => handleReplyWhatsApp(sub)}
                        >
                          <MessageCircle className="h-3.5 w-3.5 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                      {onStartEngineeringReport && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => handleLaunchEngineeringReport(sub)}
                        >
                          <Compass className="h-3.5 w-3.5 mr-1" />
                          Eng. Report
                        </Button>
                      )}
                      {!existingCustomer && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => convertToCustomerMutation.mutate(sub)}
                          disabled={convertToCustomerMutation.isPending}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          To CRM
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        asChild
                        title="Email Reply"
                      >
                        <a
                          href={`mailto:${sub.email}?subject=${encodeURIComponent(
                            `Re: ${sub.project_type || "DripTech Irrigation Inquiry"}`,
                          )}`}
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
                      {!sub.read && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-emerald-600 dark:text-emerald-400"
                          onClick={() => markAsReadMutation.mutate(sub.id)}
                          disabled={markAsReadMutation.isPending}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => toggleRowExpansion(sub.id)}
                        title={isExpanded ? "Collapse details" : "Inspect structured details"}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(sub)}
                        title="Delete inquiry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Structured Inquiry Detail */}
                  {isExpanded && (
                    <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-primary" />
                          Parsed Inquiry Breakdown
                        </span>
                        <Select
                          value={sub.status || "new"}
                          onValueChange={(nextStatus) =>
                            updateStatusMutation.mutate({ id: sub.id, status: nextStatus })
                          }
                        >
                          <SelectTrigger className="h-7 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="read">Reviewed</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-lg border border-border/70 bg-background p-3 space-y-2">
                        {parseMessageSegments(sub.message).map((seg, idx) =>
                          seg.type === "field" ? (
                            <div
                              key={idx}
                              className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-border/40 pb-1.5 last:border-b-0 last:pb-0"
                            >
                              <span className="text-xs font-medium text-primary">
                                {seg.field}
                              </span>
                              <span className="text-sm text-foreground">
                                {!seg.value || seg.value === "Not specified" ? (
                                  <span className="italic text-muted-foreground">Not specified</span>
                                ) : (
                                  seg.value
                                )}
                              </span>
                            </div>
                          ) : (
                            <p key={idx} className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                              {seg.content}
                            </p>
                          ),
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Ref #{sub.id.slice(-8)}</span>
                        <span>Received {new Date(sub.created_at).toLocaleString("en-KE")}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Desktop Table View */
        <Card className="border-border/70 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleSelectAllVisible}
                      aria-label="Select all visible inquiries"
                    />
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
                    >
                      Contact
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
                    >
                      Status
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead>Scope & Size</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
                    >
                      Received
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredSubmissions.map((sub) => {
                  const isExpanded = expandedRows.includes(sub.id);
                  const isSelected = selectedSubmissions.includes(sub.id);
                  const existingCustomer = sub.email
                    ? existingEmailMap.get(sub.email.trim().toLowerCase())
                    : undefined;
                  const statusStyle = getStatusBadgeStyle(sub.status);
                  const hasPhone = Boolean(buildWhatsAppChatUrl(sub.phone));

                  return (
                    <React.Fragment key={sub.id}>
                      <TableRow className={!sub.read ? "bg-primary/[0.03]" : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSubmissionSelection(sub.id)}
                            aria-label={`Select inquiry from ${sub.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                !sub.read
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {sub.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground truncate max-w-[180px]">
                                  {sub.name}
                                </span>
                                {existingCustomer && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  >
                                    CRM
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                                {sub.email}
                                {sub.phone ? ` · ${sub.phone}` : ""}
                              </div>
                              {sub.company && (
                                <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                                  {sub.company}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={sub.status || "new"}
                            onValueChange={(nextStatus) =>
                              updateStatusMutation.mutate({ id: sub.id, status: nextStatus })
                            }
                          >
                            <SelectTrigger className={`h-7 w-32 text-xs border ${statusStyle.className}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="read">Reviewed</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[260px]">
                            {sub.project_type && (
                              <Badge variant="secondary" className="text-[11px] font-normal">
                                {sub.project_type}
                              </Badge>
                            )}
                            {sub.area_size && (
                              <Badge variant="outline" className="text-[11px] font-normal">
                                {sub.area_size}
                              </Badge>
                            )}
                            {sub.budget_range && (
                              <Badge variant="outline" className="text-[11px] font-normal">
                                {sub.budget_range}
                              </Badge>
                            )}
                            {!sub.project_type && !sub.area_size && !sub.budget_range && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {sub.message}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateShort(sub.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {hasPhone && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-emerald-600 dark:text-emerald-400"
                                onClick={() => handleReplyWhatsApp(sub)}
                                title="Reply on WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {onStartEngineeringReport && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-primary"
                                onClick={() => handleLaunchEngineeringReport(sub)}
                                title="Open in Engineering Report Studio"
                              >
                                <Compass className="h-4 w-4" />
                              </Button>
                            )}
                            {!existingCustomer && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2"
                                onClick={() => convertToCustomerMutation.mutate(sub)}
                                disabled={convertToCustomerMutation.isPending}
                                title="Convert to CRM Customer"
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            )}
                            {!sub.read && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-emerald-600 dark:text-emerald-400"
                                onClick={() => markAsReadMutation.mutate(sub.id)}
                                disabled={markAsReadMutation.isPending}
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => toggleRowExpansion(sub.id)}
                              title="Toggle structured inquiry breakdown"
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(sub)}
                              title="Delete message"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={6} className="p-4">
                            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                                  Full Submission Details
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs" asChild>
                                    <a
                                      href={`mailto:${sub.email}?subject=${encodeURIComponent(
                                        `Re: ${sub.project_type || "DripTech Irrigation Inquiry"}`,
                                      )}`}
                                    >
                                      <Mail className="h-3.5 w-3.5 mr-1" />
                                      Reply by Email
                                    </a>
                                  </Button>
                                  {hasPhone && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                                      onClick={() => handleReplyWhatsApp(sub)}
                                    >
                                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                                      Reply via WhatsApp
                                    </Button>
                                  )}
                                  {onStartEngineeringReport && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => handleLaunchEngineeringReport(sub)}
                                    >
                                      <Compass className="h-3.5 w-3.5 mr-1" />
                                      Draft Client Engineering Report
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border border-border/60 bg-background p-3">
                                {parseMessageSegments(sub.message).map((seg, idx) =>
                                  seg.type === "field" ? (
                                    <div key={idx} className="space-y-0.5">
                                      <span className="text-xs font-medium text-primary">
                                        {seg.field}
                                      </span>
                                      <p className="text-sm text-foreground">
                                        {seg.value || "Not specified"}
                                      </p>
                                    </div>
                                  ) : (
                                    <div key={idx} className="md:col-span-2">
                                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                        {seg.content}
                                      </p>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Batch Convert Dialog */}
      <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Convert Inquiries to Customers CRM
            </DialogTitle>
            <DialogDescription>
              Create CRM customer profiles for {selectedEligibleToConvert.length} selected contact(s). Duplicate emails already in Customers will be skipped cleanly.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-56 overflow-y-auto space-y-2 py-2">
            {selectedSubs.map((sub) => {
              const exists = Boolean(
                sub.email && existingEmailMap.has(sub.email.trim().toLowerCase()),
              );
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{sub.name}</div>
                    <div className="text-muted-foreground truncate">{sub.email}</div>
                  </div>
                  <Badge variant={exists ? "secondary" : "default"} className="shrink-0">
                    {exists ? "Already in CRM" : "New Customer"}
                  </Badge>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowBatchModal(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => batchConvertMutation.mutate(selectedSubs)}
              disabled={batchConvertMutation.isPending || selectedEligibleToConvert.length === 0}
            >
              {batchConvertMutation.isPending ? "Converting..." : "Confirm Conversion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Contact Inquiry</DialogTitle>
            <DialogDescription>
              Remove the inquiry from <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteTarget && deleteSubmissionMutation.mutate(deleteTarget.id)}
              disabled={deleteSubmissionMutation.isPending}
            >
              {deleteSubmissionMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactNotifications;
