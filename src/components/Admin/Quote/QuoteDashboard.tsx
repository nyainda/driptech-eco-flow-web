import { useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Copy,
  Eye,
  FilePlus2,
  FileText,
  Filter,
  Layers3,
  Pencil,
  Receipt,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
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

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface QuoteDashboardQuote {
  id: string;
  quote_number: string;
  customer_id?: string;
  project_type?: string;
  crop_type?: string;
  area_size?: number;
  water_source?: string;
  terrain_info?: string;
  notes?: string;
  total_amount?: number;
  status: QuoteStatus;
  valid_until?: string;
  include_vat: boolean;
  vat_rate?: number;
  created_at: string;
}

interface QuoteDashboardCustomer {
  id: string;
  company_name: string;
  contact_person?: string;
}

interface QuoteDashboardProps {
  quotes: QuoteDashboardQuote[];
  customers: QuoteDashboardCustomer[];
  isLoading: boolean;
  onCreateQuote: () => void;
  onViewQuote: (quote: QuoteDashboardQuote) => void;
  onEditQuote: (quote: QuoteDashboardQuote) => void;
  onDeleteQuote: (quoteId: string) => void;
  onStatusChange?: (quoteId: string, status: QuoteStatus) => void;
  onDuplicateQuote?: (quote: QuoteDashboardQuote) => void;
  onConvertToInvoice?: (quote: QuoteDashboardQuote) => void;
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
};

const STATUS_STYLES: Record<QuoteStatus, string> = {
  draft: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  sent: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
  accepted: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  rejected: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
  expired: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
};

const STATUS_BAR_STYLES: Record<QuoteStatus, string> = {
  draft: "bg-slate-400",
  sent: "bg-sky-500",
  accepted: "bg-emerald-600",
  rejected: "bg-rose-500",
  expired: "bg-amber-500",
};

const formatKES = (value: number) =>
  "KES " +
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const QuoteDashboard = ({
  quotes,
  customers,
  isLoading,
  onCreateQuote,
  onViewQuote,
  onEditQuote,
  onDeleteQuote,
  onStatusChange,
  onDuplicateQuote,
  onConvertToInvoice,
}: QuoteDashboardProps) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QuoteStatus>("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const customerNames = useMemo(
    () =>
      new Map(
        customers.map((customer) => [
          customer.id,
          customer.company_name || customer.contact_person || "Client",
        ]),
      ),
    [customers],
  );

  const counts = useMemo(
    () => ({
      draft: quotes.filter((quote) => quote.status === "draft").length,
      sent: quotes.filter((quote) => quote.status === "sent").length,
      accepted: quotes.filter((quote) => quote.status === "accepted").length,
      rejected: quotes.filter((quote) => quote.status === "rejected").length,
      expired: quotes.filter((quote) => quote.status === "expired").length,
    }),
    [quotes],
  );

  const quotedValue = quotes.reduce(
    (total, quote) => total + Number(quote.total_amount || 0),
    0,
  );
  const acceptedValue = quotes.reduce(
    (total, quote) =>
      quote.status === "accepted"
        ? total + Number(quote.total_amount || 0)
        : total,
    0,
  );

  const filteredQuotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = quotes.filter((quote) => {
      const customer = quote.customer_id
        ? customerNames.get(quote.customer_id) || ""
        : "";
      const searchable = [
        quote.quote_number,
        quote.project_type,
        quote.crop_type,
        customer,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (statusFilter === "all" || quote.status === statusFilter) &&
        (!term || searchable.includes(term))
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      if (sortBy === "highest-value") {
        return Number(b.total_amount || 0) - Number(a.total_amount || 0);
      }
      if (sortBy === "lowest-value") {
        return Number(a.total_amount || 0) - Number(b.total_amount || 0);
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [quotes, customerNames, search, statusFilter, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filteredQuotes.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleQuotes = filteredQuotes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const updateStatus = (value: string) => {
    setStatusFilter(value as "all" | QuoteStatus);
    setPage(1);
  };

  const updateSort = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const statusEntries = (Object.keys(STATUS_LABELS) as QuoteStatus[]).map(
    (status) => ({
      status,
      label: STATUS_LABELS[status],
      count: counts[status],
      percentage: quotes.length ? (counts[status] / quotes.length) * 100 : 0,
    }),
  );

  const filterButtonClass = (active: boolean) =>
    active
      ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
      : "border-border bg-background text-foreground hover:bg-muted hover:text-foreground";

  return (
    <div className="space-y-6">
      {/* Executive Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/30 bg-gradient-to-r from-[#0d281e] via-[#1b4332] to-[#2d6a4f] p-6 text-white shadow-md sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-amber-400/20" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-200">
              <FileText className="h-3.5 w-3.5" />
              Commercial Engineering Desk
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Quotations &amp; Bill of Quantities (BOQ)
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-emerald-100/90">
              Design multi-section engineering BOQs, generate executive A4
              client proposals, and convert approved quotations directly into
              tax invoices.
            </p>
          </div>
          <Button
            type="button"
            onClick={onCreateQuote}
            className="h-11 w-full shrink-0 bg-white text-[#12372a] hover:bg-emerald-50 font-bold px-5 shadow-lg sm:w-auto"
          >
            <FilePlus2 className="mr-2 h-4 w-4" />
            Create Engineering BOQ
          </Button>
        </div>
      </section>

      {/* KPI Row */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Quotations
              </p>
              <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-foreground">
                {quotes.length.toLocaleString("en-KE")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {counts.draft} drafts · {counts.sent} sent
              </p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Awaiting Client Decision
              </p>
              <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-sky-600 dark:text-sky-400">
                {counts.sent.toLocaleString("en-KE")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Active proposals in review
              </p>
            </div>
            <div className="rounded-xl bg-sky-500/10 p-3 text-sky-600 dark:text-sky-400">
              <Clock3 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Approved Proposals
              </p>
              <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                {counts.accepted.toLocaleString("en-KE")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Win rate:{" "}
                {quotes.length
                  ? `${Math.round((counts.accepted / quotes.length) * 100)}%`
                  : "0%"}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Pipeline Value
              </p>
              <p className="mt-1.5 text-xl font-extrabold tabular-nums text-foreground sm:text-2xl">
                {formatKES(quotedValue)}
              </p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Won: {formatKES(acceptedValue)}
              </p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(290px,0.75fr)]">
        <Card className="min-w-0 overflow-hidden border-border/70 bg-card shadow-sm">
          <CardHeader className="gap-4 border-b border-border pb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-lg text-foreground">
                  Quotation Register
                </CardTitle>
                <CardDescription className="mt-1">
                  Search, preview A4 PDFs, update approval status, or convert
                  BOQs to invoices.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="w-fit border-border bg-muted text-foreground"
              >
                {filteredQuotes.length}{" "}
                {filteredQuotes.length === 1 ? "proposal" : "proposals"}
              </Badge>
            </div>

            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_180px]">
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => updateSearch(event.target.value)}
                  placeholder="Search quote ref, client, crop, or project scope…"
                  className="h-10 border-border bg-background pl-9 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Select value={statusFilter} onValueChange={updateStatus}>
                <SelectTrigger className="h-10 border-border bg-background text-foreground">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {(Object.keys(STATUS_LABELS) as QuoteStatus[]).map(
                    (status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={updateSort}>
                <SelectTrigger className="h-10 border-border bg-background text-foreground">
                  <ArrowDownWideNarrow className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Sort quotations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="highest-value">Highest value</SelectItem>
                  <SelectItem value="lowest-value">Lowest value</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={filterButtonClass(statusFilter === "all")}
                onClick={() => updateStatus("all")}
              >
                All ({quotes.length})
              </Button>
              {(Object.keys(STATUS_LABELS) as QuoteStatus[]).map((status) => (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant="outline"
                  className={filterButtonClass(statusFilter === status)}
                  onClick={() => updateStatus(status)}
                >
                  {STATUS_LABELS[status]} ({counts[status]})
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-14 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : visibleQuotes.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Search className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {quotes.length === 0
                    ? "No quotations yet"
                    : "No matching quotations"}
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  {quotes.length === 0
                    ? "Create your first quotation and build its BOQ from catalogue products or custom engineering items."
                    : "Try a different search term or clear the selected status filter."}
                </p>
                <Button
                  type="button"
                  onClick={
                    quotes.length === 0
                      ? onCreateQuote
                      : () => {
                          updateSearch("");
                          updateStatus("all");
                        }
                  }
                  className="mt-4"
                >
                  {quotes.length === 0 ? "Create first quote" : "Clear filters"}
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="min-w-[140px] font-semibold text-foreground">
                          Reference
                        </TableHead>
                        <TableHead className="min-w-[190px] font-semibold text-foreground">
                          Client &amp; Scope
                        </TableHead>
                        <TableHead className="min-w-[110px] font-semibold text-foreground">
                          Issued / Valid
                        </TableHead>
                        <TableHead className="min-w-[130px] text-right font-semibold text-foreground">
                          Total (KES)
                        </TableHead>
                        <TableHead className="min-w-[130px] font-semibold text-foreground">
                          Status
                        </TableHead>
                        <TableHead className="min-w-[230px] text-right font-semibold text-foreground">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleQuotes.map((quote) => {
                        const customerName = quote.customer_id
                          ? customerNames.get(quote.customer_id) ||
                            "Direct Client"
                          : "Direct Client";

                        return (
                          <TableRow key={quote.id} className="group">
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => onViewQuote(quote)}
                                className="font-mono font-bold text-foreground hover:text-primary text-left"
                              >
                                {quote.quote_number}
                              </button>
                              {quote.area_size ? (
                                <div className="mt-0.5 text-xs text-muted-foreground">
                                  {quote.area_size} acres
                                  {quote.crop_type ? ` · ${quote.crop_type}` : ""}
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <div
                                className="max-w-[220px] truncate font-semibold text-foreground"
                                title={customerName}
                              >
                                {customerName}
                              </div>
                              <div
                                className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground"
                                title={quote.project_type || ""}
                              >
                                {quote.project_type ||
                                  quote.crop_type ||
                                  "Commercial Irrigation System"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-medium text-foreground">
                                {formatDate(quote.created_at)}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                Exp: {formatDate(quote.valid_until)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold tabular-nums text-foreground">
                              {formatKES(Number(quote.total_amount || 0))}
                            </TableCell>
                            <TableCell>
                              {onStatusChange ? (
                                <Select
                                  value={quote.status}
                                  onValueChange={(val) =>
                                    onStatusChange(quote.id, val as QuoteStatus)
                                  }
                                >
                                  <SelectTrigger
                                    className={`h-7 w-[115px] rounded-full border px-2.5 text-xs font-semibold ${STATUS_STYLES[quote.status] || STATUS_STYLES.draft}`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(
                                      Object.keys(
                                        STATUS_LABELS,
                                      ) as QuoteStatus[]
                                    ).map((st) => (
                                      <SelectItem key={st} value={st}>
                                        {STATUS_LABELS[st]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={
                                    "border px-2.5 py-1 capitalize " +
                                    (STATUS_STYLES[quote.status] ||
                                      STATUS_STYLES.draft)
                                  }
                                >
                                  {STATUS_LABELS[quote.status] || quote.status}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  title="Preview A4 PDF"
                                  className="h-8 px-2.5 text-xs"
                                  onClick={() => onViewQuote(quote)}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  PDF
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  title="Edit BOQ"
                                  className="h-8 px-2.5 text-xs"
                                  onClick={() => onEditQuote(quote)}
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </Button>
                                {onConvertToInvoice && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    title="Convert BOQ to Invoice"
                                    className="h-8 px-2.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                                    onClick={() => onConvertToInvoice(quote)}
                                  >
                                    <Receipt className="h-3.5 w-3.5 mr-1" />
                                    Invoice
                                  </Button>
                                )}
                                {onDuplicateQuote && (
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    title="Clone / Duplicate BOQ"
                                    className="h-8 w-8"
                                    onClick={() => onDuplicateQuote(quote)}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  title="Delete Quote"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => onDeleteQuote(quote.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, filteredQuotes.length)} of{" "}
                    {filteredQuotes.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={currentPage <= 1}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <span className="min-w-20 text-center text-xs tabular-nums text-muted-foreground">
                      Page {currentPage} of {pageCount}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={currentPage >= pageCount}
                      onClick={() =>
                        setPage((current) => Math.min(pageCount, current + 1))
                      }
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Pipeline Sidebar */}
        <aside className="space-y-5">
          <Card className="border-border/70 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base text-foreground">
                    Proposal Pipeline
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-xs">
                    Click any stage to filter
                  </CardDescription>
                </div>
                <Layers3 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="flex h-2.5 overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={statusEntries
                  .map((entry) => entry.label + ": " + entry.count)
                  .join(", ")}
              >
                {statusEntries.map((entry) => (
                  <div
                    key={entry.status}
                    className={STATUS_BAR_STYLES[entry.status]}
                    style={{ width: entry.percentage + "%" }}
                  />
                ))}
              </div>
              <div className="space-y-2">
                {statusEntries.map((entry) => (
                  <button
                    key={entry.status}
                    type="button"
                    onClick={() => updateStatus(entry.status)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                      <span
                        className={
                          "h-2.5 w-2.5 rounded-full " +
                          STATUS_BAR_STYLES[entry.status]
                        }
                      />
                      {entry.label}
                    </span>
                    <span className="text-xs font-bold tabular-nums text-foreground">
                      {entry.count}
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Approval Win Rate
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {quotes.length
                      ? Math.round((counts.accepted / quotes.length) * 100) +
                        "%"
                      : "0%"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <CardTitle className="text-base text-foreground">
                  Engineering BOQ Workflow
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="font-semibold text-foreground">
                  1. Agronomic &amp; Site Profile
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  Link the client, acreage, crop, and water source parameters.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="font-semibold text-foreground">
                  2. Work Package Sections
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  Organize Headworks, Mainlines, Drip Laterals, and Solar
                  Pumping.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="font-semibold text-foreground">
                  3. Issue PDF or Convert to Invoice
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  Export the A4 Proposal PDF or generate an Invoice in 1 click.
                </p>
              </div>
              <Button
                type="button"
                onClick={onCreateQuote}
                className="w-full"
              >
                New Engineering BOQ
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default QuoteDashboard;
