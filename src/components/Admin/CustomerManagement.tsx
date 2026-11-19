import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building,
  Calendar,
  Compass,
  Download,
  Edit,
  Grid3X3,
  List,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { DatabaseWithoutInternals } from "@/integrations/supabase/shared";
import { useToast } from "@/hooks/use-toast";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import { buildWhatsAppChatUrl } from "@/lib/adminContactHelpers";
import type { EngineeringReportSeed } from "@/lib/engineeringReportEngine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type UserRole = DatabaseWithoutInternals["public"]["Enums"]["user_role"];

interface Customer {
  id: string;
  contact_person: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  user_role: UserRole | null;
  created_at: string | null;
  updated_at: string | null;
}

interface CustomerFormState {
  contact_person: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  user_role: UserRole;
}

type SortOption = "newest" | "name_asc" | "company_asc";

interface CustomerManagementProps {
  onStartEngineeringReport?: (seed: EngineeringReportSeed) => void;
}

const USER_ROLES: Array<{ value: UserRole; label: string }> = [
  { value: "customer", label: "Customer" },
  { value: "sales", label: "Sales Rep" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

const EMPTY_FORM: CustomerFormState = {
  contact_person: "",
  company_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "Kenya",
  user_role: "customer",
};

const getRoleBadgeClass = (role?: UserRole | null) => {
  switch (role) {
    case "admin":
      return "bg-primary/15 text-primary border-primary/30";
    case "manager":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25";
    case "sales":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const csvEscape = (val?: string | null) => {
  const safe = (val || "").replace(/"/g, '""');
  return `"${safe}"`;
};

const CustomerManagement: React.FC<CustomerManagementProps> = ({
  onStartEngineeringReport,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 9;

  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers((data || []) as Customer[]);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error Loading Customers",
        description: "Could not load CRM customer records.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, sortBy]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      contact_person: customer.contact_person || "",
      company_name: customer.company_name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      country: customer.country || "Kenya",
      user_role: customer.user_role || "customer",
    });
    setFormOpen(true);
  };

  const closeFormModal = () => {
    setFormOpen(false);
    setEditingCustomer(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contact_person.trim()) {
      toast({
        title: "Contact Person Required",
        description: "Please enter the customer or farm contact name.",
        variant: "destructive",
      });
      return;
    }

    const emailToSave =
      formData.email.trim() ||
      `noemail+${Date.now()}@driptech-crm.local`;

    try {
      setSaving(true);
      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update({
            contact_person: formData.contact_person.trim(),
            company_name: formData.company_name.trim() || null,
            email: emailToSave,
            phone: formData.phone.trim() || null,
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            country: formData.country.trim() || "Kenya",
            user_role: formData.user_role,
          })
          .eq("id", editingCustomer.id);

        if (error) throw error;
        toast({
          title: "Customer Updated",
          description: `${formData.contact_person} has been updated.`,
        });
      } else {
        const { error } = await supabase.from("customers").insert([
          {
            contact_person: formData.contact_person.trim(),
            company_name: formData.company_name.trim() || null,
            email: emailToSave,
            phone: formData.phone.trim() || null,
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            country: formData.country.trim() || "Kenya",
            user_role: formData.user_role,
          },
        ]);

        if (error) throw error;
        toast({
          title: "Customer Added",
          description: `${formData.contact_person} has been added to CRM.`,
        });
      }

      closeFormModal();
      await fetchCustomers();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to save customer.";
      toast({
        title: "Save Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) throw error;
      toast({
        title: "Customer Removed",
        description: `${deleteTarget.contact_person} was deleted from CRM.`,
      });
      setDeleteTarget(null);
      await fetchCustomers();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to delete customer.";
      toast({
        title: "Delete Failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppContact = (customer: Customer) => {
    const msg = `Hello ${customer.contact_person}, greetings from DripTech Eco Flow! Reaching out regarding your irrigation & pumping setup${customer.company_name ? ` at ${customer.company_name}` : ""}.`;
    const waUrl = buildWhatsAppChatUrl(customer.phone, msg);
    if (!waUrl) {
      toast({
        title: "No Phone Number",
        description: "Add a Kenyan/international phone number to message on WhatsApp.",
        variant: "destructive",
      });
      return;
    }
    openTrackedWhatsApp(waUrl, "admin_customers_crm");
  };

  const handleStartEngReportForCustomer = (customer: Customer) => {
    if (!onStartEngineeringReport) return;
    onStartEngineeringReport({
      customerId: customer.id,
      clientName: customer.contact_person,
      companyFarmName: customer.company_name || undefined,
      clientPhone: customer.phone || undefined,
      clientEmail: customer.email.includes("@driptech-crm.local") ? undefined : customer.email,
      countyLocation: customer.city || undefined,
      projectTitle: `${customer.company_name || customer.contact_person} — Irrigation & Solar Proposal`,
      reportEdition: "client_proposal",
      sourceModule: "Customers CRM",
    });
  };

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let newThisMonth = 0;
    let withCompany = 0;
    let staffCount = 0;

    for (const c of customers) {
      if (c.created_at && new Date(c.created_at).getTime() >= monthStart) {
        newThisMonth += 1;
      }
      if (c.company_name?.trim()) {
        withCompany += 1;
      }
      if (c.user_role && c.user_role !== "customer") {
        staffCount += 1;
      }
    }

    return {
      total: customers.length,
      newThisMonth,
      withCompany,
      staffCount,
    };
  }, [customers]);

  const filteredAndSortedCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = customers.filter((c) => {
      const matchesRole = roleFilter === "all" || c.user_role === roleFilter;
      if (!matchesRole) return false;
      if (!q) return true;
      return (
        c.contact_person.toLowerCase().includes(q) ||
        (c.company_name || "").toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.address || "").toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === "name_asc") {
        return a.contact_person.localeCompare(b.contact_person);
      }
      if (sortBy === "company_asc") {
        return (a.company_name || a.contact_person).localeCompare(
          b.company_name || b.contact_person,
        );
      }
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [customers, searchTerm, roleFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCustomers.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCustomers = filteredAndSortedCustomers.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  );

  const handleExportCsv = () => {
    const header = [
      "Contact Person",
      "Company / Farm",
      "Email",
      "Phone",
      "City",
      "Country",
      "Address",
      "Role",
      "Joined",
    ];
    const rows = filteredAndSortedCustomers.map((c) =>
      [
        csvEscape(c.contact_person),
        csvEscape(c.company_name),
        csvEscape(c.email),
        csvEscape(c.phone),
        csvEscape(c.city),
        csvEscape(c.country),
        csvEscape(c.address),
        csvEscape(c.user_role || "customer"),
        csvEscape(c.created_at ? new Date(c.created_at).toISOString().split("T")[0] : ""),
      ].join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `driptech-crm-customers-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "CRM CSV Exported",
      description: `Downloaded ${filteredAndSortedCustomers.length} customer record(s).`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-2xl bg-muted/60 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/60 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CRM Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Customers CRM
              </h2>
              <Badge variant="outline" className="border-primary/30 text-primary">
                {stats.total} Records
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage farm owners, estates, commercial contacts, direct WhatsApp follow-ups, and 1-click Client Engineering Reports.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCustomers}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredAndSortedCustomers.length === 0}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
          <Button size="sm" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total CRM Contacts
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Saved clients & partners</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Added This Month
            </CardTitle>
            <UserPlus className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              +{stats.newThisMonth}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Recent onboarding velocity</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Farms & Companies
            </CardTitle>
            <Building className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.withCompany}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Named organizations / estates</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Staff & Sales Team
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.staffCount}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Sales, manager & admin accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="border-border/70">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by contact person, farm/company, email, phone, or city..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="company_asc">Company (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
              <Button
                type="button"
                size="sm"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                className="h-8 px-2.5"
                onClick={() => setViewMode("grid")}
                title="Grid view"
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
        </CardContent>
      </Card>

      {/* Customer Directory */}
      {paginatedCustomers.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No customers found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mb-4">
              {searchTerm || roleFilter !== "all"
                ? "Try clearing your search or role filter."
                : "Add your first farm owner, commercial estate, or distributor contact."}
            </p>
            {!searchTerm && roleFilter === "all" && (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add Customer
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedCustomers.map((customer) => {
            const hasPhone = Boolean(buildWhatsAppChatUrl(customer.phone));
            const roleLabel =
              USER_ROLES.find((r) => r.value === customer.user_role)?.label || "Customer";
            const location = [customer.city, customer.country].filter(Boolean).join(", ");
            const hasRealEmail =
              customer.email && !customer.email.includes("@driptech-crm.local");

            return (
              <Card
                key={customer.id}
                className="border-border/80 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                        {customer.contact_person.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">
                          {customer.contact_person}
                        </CardTitle>
                        {customer.company_name ? (
                          <CardDescription className="flex items-center gap-1 text-xs mt-0.5 truncate">
                            <Building className="h-3 w-3 shrink-0" />
                            <span className="truncate">{customer.company_name}</span>
                          </CardDescription>
                        ) : (
                          <CardDescription className="text-xs mt-0.5">
                            Individual / Farm Account
                          </CardDescription>
                        )}
                      </div>
                    </div>

                    <Badge variant="outline" className={`shrink-0 text-[11px] ${getRoleBadgeClass(customer.user_role)}`}>
                      {roleLabel}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-1.5 text-xs text-muted-foreground rounded-lg bg-muted/35 p-3 border border-border/50">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                      <span className="truncate text-foreground">
                        {hasRealEmail ? customer.email : "No email recorded"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                      <span className="text-foreground">
                        {customer.phone || "No phone number"}
                      </span>
                    </div>
                    {location && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                        <span className="truncate">{location}</span>
                      </div>
                    )}
                    {customer.created_at && (
                      <div className="flex items-center gap-2 text-[11px] pt-0.5">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>Joined {new Date(customer.created_at).toLocaleDateString("en-KE")}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick CRM Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {hasPhone && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => handleWhatsAppContact(customer)}
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
                          onClick={() => handleStartEngReportForCustomer(customer)}
                        >
                          <Compass className="h-3.5 w-3.5 mr-1" />
                          Eng. Report
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {hasRealEmail && (
                        <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" asChild title="Send email">
                          <a href={`mailto:${customer.email}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => openEditModal(customer)}
                        title="Edit customer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(customer)}
                        title="Delete customer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border/70 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Company / Farm</TableHead>
                  <TableHead>Email & Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer) => {
                  const hasPhone = Boolean(buildWhatsAppChatUrl(customer.phone));
                  const hasRealEmail =
                    customer.email && !customer.email.includes("@driptech-crm.local");
                  const roleLabel =
                    USER_ROLES.find((r) => r.value === customer.user_role)?.label || "Customer";

                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium text-foreground">
                        {customer.contact_person}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {customer.company_name || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <div className="text-foreground truncate max-w-[200px]">
                            {hasRealEmail ? customer.email : "No email"}
                          </div>
                          {customer.phone && (
                            <div className="text-muted-foreground">{customer.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {[customer.city, customer.country].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[11px] ${getRoleBadgeClass(customer.user_role)}`}>
                          {roleLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {customer.created_at
                          ? new Date(customer.created_at).toLocaleDateString("en-KE")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {hasPhone && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-emerald-600 dark:text-emerald-400"
                              onClick={() => handleWhatsAppContact(customer)}
                              title="WhatsApp customer"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {onStartEngineeringReport && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-primary"
                              onClick={() => handleStartEngReportForCustomer(customer)}
                              title="Create Engineering Report"
                            >
                              <Compass className="h-4 w-4" />
                            </Button>
                          )}
                          {hasRealEmail && (
                            <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" asChild title="Email customer">
                              <a href={`mailto:${customer.email}`}>
                                <Mail className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditModal(customer)}
                            title="Edit customer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(customer)}
                            title="Delete customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * itemsPerPage + 1}–
            {Math.min(safePage * itemsPerPage, filteredAndSortedCustomers.length)} of{" "}
            {filteredAndSortedCustomers.length} records
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, safePage - 3), Math.min(totalPages, safePage + 2))
              .map((pageNum) => (
                <Button
                  key={pageNum}
                  type="button"
                  size="sm"
                  variant={safePage === pageNum ? "default" : "outline"}
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8 px-0"
                >
                  {pageNum}
                </Button>
              ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeFormModal()}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? `Edit ${editingCustomer.contact_person}` : "Add New CRM Customer"}
            </DialogTitle>
            <DialogDescription>
              Store farmer, estate, commercial client, or sales contact details for quotes and Client Engineering Reports.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="crm-contact-person">Contact Person *</Label>
                <Input
                  id="crm-contact-person"
                  required
                  value={formData.contact_person}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contact_person: e.target.value }))
                  }
                  placeholder="e.g., Peter Kamau"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="crm-company-name">Farm / Company Name</Label>
                <Input
                  id="crm-company-name"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, company_name: e.target.value }))
                  }
                  placeholder="e.g., Highland Hass Growers"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="crm-email">Email Address</Label>
                <Input
                  id="crm-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="client@farm.co.ke (optional)"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="crm-phone">Phone / WhatsApp</Label>
                <Input
                  id="crm-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+254 7XX XXX XXX"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="crm-address">Site Address / Landmark</Label>
              <Input
                id="crm-address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Road, ward, or nearest market center"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="crm-city">County / Town</Label>
                <Input
                  id="crm-city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="e.g., Nakuru"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="crm-country">Country</Label>
                <Input
                  id="crm-country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, country: e.target.value }))
                  }
                  placeholder="Kenya"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="crm-role">Account Role</Label>
                <Select
                  value={formData.user_role}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, user_role: value as UserRole }))
                  }
                >
                  <SelectTrigger id="crm-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeFormModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingCustomer ? "Update Customer" : "Save Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove CRM Customer</DialogTitle>
            <DialogDescription>
              Delete <strong>{deleteTarget?.contact_person}</strong>
              {deleteTarget?.company_name ? ` (${deleteTarget.company_name})` : ""} from CRM? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Delete Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerManagement;
