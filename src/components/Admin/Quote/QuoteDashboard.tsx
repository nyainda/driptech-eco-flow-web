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
  FilePlus2,
  FileText,
  Filter,
  Layers3,
  Search,
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

type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface QuoteDashboardQuote {
  id: string;
  quote_number: string;
  customer_id?: string;
  project_type?: string;
  crop_type?: string;
  area_size?: number;
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
}

interface QuoteDashboardProps {
  quotes: QuoteDashboardQuote[];
  customers: QuoteDashboardCustomer[];
  isLoading: boolean;
  onCreateQuote: () => void;
  onViewQuote: (quote: QuoteDashboardQuote) => void;
  onEditQuote: (quote: QuoteDashboardQuote) => void;
  onDeleteQuote: (quoteId: string) => void;
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
};

const STATUS_STYLES: Record<QuoteStatus, string> = {
  draft: "border-border bg-muted text-foreground",
  sent: "border-primary/30 bg-primary/10 text-primary",
  accepted: "border-primary/40 bg-primary/15 text-primary",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  expired: "border-destructive/20 bg-muted text-destructive",
};

const STATUS_BAR_STYLES: Record<QuoteStatus, string> = {
  draft: "bg-muted-foreground/50",
  sent: "bg-primary/55",
  accepted: "bg-primary",
  rejected: "bg-destructive/70",
  expired: "bg-destructive/35",
};

const formatKES = (value: number) =>
  "KES " + Number(value || 0).toLocaleString("en-KE", {
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
}: QuoteDashboardProps) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QuoteStatus>("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const customerNames = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.company_name])),
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
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "highest-value") {
        return Number(b.total_amount || 0) - Number(a.total_amount || 0);
      }
      if (sortBy === "lowest-value") {
        return Number(a.total_amount || 0) - Number(b.total_amount || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
      ? "border-primary bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
      : "border-border bg-background text-foreground hover:bg-muted hover:text-foreground";

  return (
    <div className="min-h-screen space-y-6 bg-background p-3 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary p-5 text-primary-foreground shadow-sm sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border border-primary-foreground/10" />
          <div className="pointer-events-none absolute -right-1 -top-10 h-44 w-44 rounded-full border border-primary-foreground/10" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold tracking-wide">
                <FileText className="h-3.5 w-3.5" />
                SALES WORKSPACE
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Quotes &amp; Bill of Quantities
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
                Prepare irrigation proposals, organise materials into BOQ sections,
                and follow every quotation from draft to acceptance.
              </p>
            </div>
            <Button
              type="button"
              onClick={onCreateQuote}
              variant="outline"
              className="h-11 w-full shrink-0 border border-primary-foreground/25 bg-background px-5 font-semibold text-foreground shadow-sm hover:bg-muted hover:text-foreground sm:w-auto"
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              Create new quote
            </Button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total quotations</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {quotes.length.toLocaleString("en-KE")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">All saved quotations</p>
              </div>
              <div className="rounded-xl bg-muted p-3 text-primary">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Awaiting response</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {counts.sent.toLocaleString("en-KE")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Sent to customers</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Clock3 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accepted</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {counts.accepted.toLocaleString("en-KE")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Approved quotations</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total quoted value</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                  {formatKES(quotedValue)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Accepted: {formatKES(acceptedValue)}
                </p>
              </div>
              <div className="rounded-xl bg-muted p-3 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(290px,0.8fr)]">
          <Card className="min-w-0 overflow-hidden border-border bg-card shadow-sm">
            <CardHeader className="gap-4 border-b border-border pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground">Quotations</CardTitle>
                  <CardDescription className="mt-1">
                    Search, review and manage your customer proposals.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="w-fit border-border bg-muted text-foreground">
                  {filteredQuotes.length} {filteredQuotes.length === 1 ? "result" : "results"}
                </Badge>
              </div>

              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_190px_190px]">
                <div className="relative min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => updateSearch(event.target.value)}
                    placeholder="Search quote number, customer or project…"
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
                    {(Object.keys(STATUS_LABELS) as QuoteStatus[]).map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
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
                    <div key={index} className="h-14 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : visibleQuotes.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Search className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {quotes.length === 0 ? "No quotations yet" : "No matching quotations"}
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    {quotes.length === 0
                      ? "Create your first quotation and build its BOQ from catalogue products or manual items."
                      : "Try a different search term or clear the selected status filter."}
                  </p>
                  <Button
                    type="button"
                    onClick={quotes.length === 0 ? onCreateQuote : () => {
                      updateSearch("");
                      updateStatus("all");
                    }}
                    variant="secondary"
                    className="mt-4 border border-primary bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
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
                          <TableHead className="min-w-[150px] font-semibold text-foreground">Quote</TableHead>
                          <TableHead className="min-w-[175px] font-semibold text-foreground">Customer / project</TableHead>
                          <TableHead className="min-w-[115px] font-semibold text-foreground">Created</TableHead>
                          <TableHead className="min-w-[115px] font-semibold text-foreground">Valid until</TableHead>
                          <TableHead className="min-w-[130px] text-right font-semibold text-foreground">Total (KES)</TableHead>
                          <TableHead className="min-w-[110px] font-semibold text-foreground">Status</TableHead>
                          <TableHead className="min-w-[205px] text-right font-semibold text-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleQuotes.map((quote) => {
                          const customerName = quote.customer_id
                            ? customerNames.get(quote.customer_id) || "Customer unavailable"
                            : "No customer selected";

                          return (
                            <TableRow key={quote.id}>
                              <TableCell>
                                <div className="font-semibold text-foreground">{quote.quote_number}</div>
                                {quote.area_size ? (
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {quote.area_size} acres
                                  </div>
                                ) : null}
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[230px] truncate font-medium text-foreground" title={customerName}>
                                  {customerName}
                                </div>
                                <div className="mt-1 max-w-[230px] truncate text-xs text-muted-foreground" title={quote.project_type || ""}>
                                  {quote.project_type || quote.crop_type || "Irrigation project"}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(quote.created_at)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(quote.valid_until)}
                              </TableCell>
                              <TableCell className="text-right font-semibold tabular-nums text-foreground">
                                {formatKES(Number(quote.total_amount || 0))}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={"border px-2.5 py-1 capitalize " + (STATUS_STYLES[quote.status] || STATUS_STYLES.draft)}
                                >
                                  {STATUS_LABELS[quote.status] || quote.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-border bg-background px-2.5 text-foreground hover:bg-muted hover:text-foreground"
                                    onClick={() => onViewQuote(quote)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-border bg-background px-2.5 text-foreground hover:bg-muted hover:text-foreground"
                                    onClick={() => onEditQuote(quote)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-destructive/30 bg-background px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => onDeleteQuote(quote.id)}
                                  >
                                    Delete
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
                      {Math.min(currentPage * pageSize, filteredQuotes.length)} of {filteredQuotes.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-border bg-background text-foreground hover:bg-muted hover:text-foreground"
                        disabled={currentPage <= 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
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
                        className="border-border bg-background text-foreground hover:bg-muted hover:text-foreground"
                        disabled={currentPage >= pageCount}
                        onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
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

          <aside className="space-y-5">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg text-foreground">Quotation pipeline</CardTitle>
                    <CardDescription className="mt-1">Current status breakdown</CardDescription>
                  </div>
                  <Layers3 className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="flex h-2.5 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={statusEntries.map((entry) => entry.label + ": " + entry.count).join(", ")}
                >
                  {statusEntries.map((entry) => (
                    <div
                      key={entry.status}
                      className={STATUS_BAR_STYLES[entry.status]}
                      style={{ width: entry.percentage + "%" }}
                    />
                  ))}
                </div>
                <div className="space-y-2.5">
                  {statusEntries.map((entry) => (
                    <button
                      key={entry.status}
                      type="button"
                      onClick={() => updateStatus(entry.status)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-foreground">
                        <span className={"h-2.5 w-2.5 rounded-full " + STATUS_BAR_STYLES[entry.status]} />
                        {entry.label}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {entry.count}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Conversion to accepted</span>
                    <span className="font-semibold text-foreground">
                      {quotes.length
                        ? Math.round((counts.accepted / quotes.length) * 100) + "%"
                        : "0%"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Accepted quotations as a share of all saved quotes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg text-foreground">BOQ workspace</CardTitle>
                </div>
                <CardDescription>
                  Build a clear estimate, one work package at a time.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="rounded-md bg-background p-2 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Quote details</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Add the customer, site and irrigation project information.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="rounded-md bg-background p-2 text-primary">
                    <Layers3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">BOQ by sections</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Group pumping, filtration, pipework and irrigation items.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="rounded-md bg-background p-2 text-primary">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Review and issue</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Check subtotals, VAT and the final quotation PDF.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={onCreateQuote}
                  variant="secondary"
                  className="w-full border border-primary bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
                >
                  Start a new BOQ
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardContent className="flex items-start gap-3 p-4">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Keep quotations current</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Review validity dates and update sent, accepted or expired statuses as customers respond.
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default QuoteDashboard;
