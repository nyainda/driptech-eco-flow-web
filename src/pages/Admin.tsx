import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import useWebVitals from "@/hooks/useWebVitals";
import {
  Loader2,
  LayoutDashboard,
  Package,
  FileText,
  Quote,
  Users,
  Settings,
  TrendingUp,
  Download,
  Trophy,
  UsersIcon,
  Video,
  CreditCard,
  Receipt,
  BarChart3,
  Mail,
  Gift,
  Newspaper,
  Database,
  MessageCircle,
  Calendar,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
  Sparkles,
  Droplets,
  Boxes,
  Wrench,
  Menu,
  ChevronRight,
  PlusCircle,
  Command,
} from "lucide-react";
import {
  AdminAuthProvider,
  AdminAuthGuard,
  AdminHeader,
} from "@/components/Admin/AdminAuth";
import { ThemeToggle } from "@/components/Layout/ThemeToggle";
import NotificationSystem from "@/components/Admin/NotificationSystem";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Link } from "react-router-dom";

// Lazy loaded admin components
const AdminDashboard = lazy(() => import("@/components/Admin/AdminDashboard"));
const ProductManagement = lazy(() => import("@/components/Admin/ProductManagement"));
const BlogManagement = lazy(() => import("@/components/Admin/BlogManagement"));
const QuoteManagement = lazy(() => import("@/components/Admin/QuoteManagement"));
const CustomerManagement = lazy(() => import("@/components/Admin/CustomerManagement"));
const ContactNotifications = lazy(() => import("@/components/Admin/ContactNotifications"));
const ProjectManagement = lazy(() => import("@/components/Admin/ProjectManagement"));
const DocumentManagement = lazy(() => import("@/components/Admin/DocumentManagement"));
const SystemSettings = lazy(() => import("@/components/Admin/SystemSettings"));
const TeamManagement = lazy(() => import("@/components/Admin/TeamManagement"));
const SuccessStoriesManagement = lazy(() => import("@/components/Admin/SuccessStoriesManagement"));
const VideoManagement = lazy(() => import("@/components/Admin/VideoManagement"));
const MpesaIntegration = lazy(() => import("@/components/Admin/MpesaIntegration"));
const InvoiceManagementSystem = lazy(() => import("@/components/Admin/Invoice/InvoiceManagementSystem"));
const VisitorTrackingDashboard = lazy(() => import("@/components/Admin/VisitorTrackingDashboard"));
const DiscountManagement = lazy(() => import("@/components/Admin/DiscountManagement"));
const NewsManagement = lazy(() => import("@/components/Admin/NewsManagement"));
const IrrigationKitsManagement = lazy(() => import("@/components/Admin/IrrigationKitsManagement"));
const SyncDashboard = lazy(() => import("@/components/Admin/SyncDashboard"));
const AIProductResearch = lazy(() => import("@/components/Admin/AIProductResearch"));
const NewsletterManagement = lazy(() => import("@/components/Admin/NewsletterManagement"));
const PaymentIntegrations = lazy(() => import("@/components/Admin/PaymentIntegrations"));
const WhatsAppManagement = lazy(() => import("@/components/Admin/WhatsAppManagement"));
const TechnicianManagement = lazy(() => import("@/components/Admin/TechnicianManagement"));
const ServiceBookingManagement = lazy(() => import("@/components/Admin/ServiceBookingManagement"));

interface AdminSection {
  id: string;
  label: string;
  icon: any;
  description: string;
  group: string;
  badge?: string;
}

const ADMIN_GROUPS = [
  { id: "overview", label: "Overview & Intelligence" },
  { id: "catalog", label: "Catalog & Inventory" },
  { id: "sales", label: "Sales, Quotes & Billing" },
  { id: "operations", label: "CRM & Field Operations" },
  { id: "content", label: "Content & Marketing" },
  { id: "system", label: "System & Edge Sync" },
] as const;

const ADMIN_SECTIONS: AdminSection[] = [
  // Overview & Intelligence
  {
    id: "dashboard",
    label: "Executive Dashboard",
    icon: LayoutDashboard,
    description: "Real-time KPIs, revenue pulse, and operational telemetry",
    group: "overview",
  },
  {
    id: "analytics",
    label: "Visitor & SEO Analytics",
    icon: BarChart3,
    description: "Visitor tracking, Search Console insights, and traffic funnels",
    group: "overview",
  },
  {
    id: "ai-research",
    label: "AI Market Research",
    icon: Sparkles,
    description: "AI-powered Kenyan irrigation demand & product discovery",
    group: "overview",
    badge: "AI",
  },

  // Catalog & Inventory
  {
    id: "products",
    label: "Products Catalog",
    icon: Package,
    description: "Manage driplines, sprinklers, pumps, filters, and fittings",
    group: "catalog",
  },
  {
    id: "kits",
    label: "Irrigation Kits",
    icon: Boxes,
    description: "Complete acreage packages, component lists, and kit pricing",
    group: "catalog",
  },
  {
    id: "discounts",
    label: "Promo Banners",
    icon: Gift,
    description: "Header discount campaigns and seasonal irrigation offers",
    group: "catalog",
  },

  // Sales, Quotes & Billing
  {
    id: "quotes",
    label: "Quotes & BOQ",
    icon: Quote,
    description: "Farm quotations, bills of quantities, and PDF generation",
    group: "sales",
  },
  {
    id: "invoices",
    label: "Invoices & Receipts",
    icon: Receipt,
    description: "Customer billing, payment tracking, and invoice PDFs",
    group: "sales",
  },
  {
    id: "mpesa",
    label: "M-Pesa Transactions",
    icon: CreditCard,
    description: "Mobile money payment logs, STK push status, and statements",
    group: "sales",
  },
  {
    id: "payments",
    label: "Payment Gateways",
    icon: CreditCard,
    description: "Configure M-Pesa Daraja and bank payment integrations",
    group: "sales",
  },

  // CRM & Field Operations
  {
    id: "customers",
    label: "Customers (CRM)",
    icon: Users,
    description: "Farm client profiles, contact records, and order history",
    group: "operations",
  },
  {
    id: "service-bookings",
    label: "Service Bookings",
    icon: Calendar,
    description: "Site survey, installation, and maintenance scheduling",
    group: "operations",
  },
  {
    id: "technicians",
    label: "Field Technicians",
    icon: Wrench,
    description: "Manage irrigation engineers, specialties, and assignments",
    group: "operations",
  },
  {
    id: "projects",
    label: "Farm Projects",
    icon: TrendingUp,
    description: "Track active and completed irrigation installations",
    group: "operations",
  },
  {
    id: "contact-notifications",
    label: "Contact Inquiries",
    icon: Mail,
    description: "Inbound website inquiries and consultation requests",
    group: "operations",
  },
  {
    id: "whatsapp",
    label: "WhatsApp Center",
    icon: MessageCircle,
    description: "Customer WhatsApp click logs and direct messaging",
    group: "operations",
  },

  // Content & Marketing
  {
    id: "blog",
    label: "Blog & SEO Guides",
    icon: FileText,
    description: "Editorial farming guides and autonomous AI SEO content",
    group: "content",
  },
  {
    id: "news",
    label: "News & Updates",
    icon: Newspaper,
    description: "Company announcements and agricultural industry updates",
    group: "content",
  },
  {
    id: "videos",
    label: "Video Tutorials",
    icon: Video,
    description: "Installation walkthroughs and equipment demonstration videos",
    group: "content",
  },
  {
    id: "success-stories",
    label: "Success Stories",
    icon: Trophy,
    description: "Verified farm case studies and client impact stories",
    group: "content",
  },
  {
    id: "documents",
    label: "Technical Docs",
    icon: Download,
    description: "Product datasheets, manuals, and downloadable brochures",
    group: "content",
  },
  {
    id: "newsletter",
    label: "Newsletter & Email",
    icon: Mail,
    description: "Subscriber list and agricultural email campaigns",
    group: "content",
  },

  // System & Edge Sync
  {
    id: "team",
    label: "Team Directory",
    icon: UsersIcon,
    description: "Manage staff profiles and leadership directory",
    group: "system",
  },
  {
    id: "sync",
    label: "Cloudflare D1 Sync",
    icon: Database,
    description: "Synchronize Supabase primary records with Cloudflare D1 edge",
    group: "system",
    badge: "Edge",
  },
  {
    id: "settings",
    label: "System Settings",
    icon: Settings,
    description: "API keys, AI configuration, and global platform preferences",
    group: "system",
  },
];

const AdminLoading = () => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/50 py-24 gap-4">
    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-foreground">Loading workspace module...</p>
      <p className="text-xs text-muted-foreground mt-0.5">Preparing management interface</p>
    </div>
  </div>
);

const AdminContent = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  // Monitor Web Vitals in Admin
  useWebVitals((metric) => {
    if (import.meta.env.DEV) {
      console.log(`📊 [Admin] ${metric.name}:`, metric);
    }
  });

  // Keyboard shortcut Ctrl+K / Cmd+K for quick module command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeSection = useMemo(
    () => ADMIN_SECTIONS.find((s) => s.id === activeTab) || ADMIN_SECTIONS[0],
    [activeTab],
  );

  const activeGroup = useMemo(
    () => ADMIN_GROUPS.find((g) => g.id === activeSection.group) || ADMIN_GROUPS[0],
    [activeSection],
  );

  const filteredSections = useMemo(() => {
    const q = sidebarFilter.trim().toLowerCase();
    if (!q) return ADMIN_SECTIONS;
    return ADMIN_SECTIONS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q),
    );
  }, [sidebarFilter]);

  const commandFilteredSections = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    if (!q) return ADMIN_SECTIONS;
    return ADMIN_SECTIONS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q),
    );
  }, [commandQuery]);

  const selectModule = (id: string) => {
    setActiveTab(id);
    setMobileDrawerOpen(false);
    setCommandOpen(false);
    setCommandQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderNavigationList = (collapsed = false) => (
    <div className="space-y-5">
      {ADMIN_GROUPS.map((group) => {
        const items = filteredSections.filter((s) => s.group === group.id);
        if (items.length === 0) return null;

        return (
          <div key={group.id} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map((section) => {
                const Icon = section.icon;
                const isActive = activeTab === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => selectModule(section.id)}
                    title={collapsed ? `${section.label} — ${section.description}` : undefined}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    } ${collapsed ? "justify-center px-2 py-2.5" : ""}`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-transform duration-150 ${
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{section.label}</span>
                        {section.badge && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                              isActive
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {section.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderActiveModule = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard onNavigate={selectModule} />;
      case "products":
        return <ProductManagement />;
      case "kits":
        return <IrrigationKitsManagement />;
      case "blog":
        return <BlogManagement />;
      case "news":
        return <NewsManagement />;
      case "videos":
        return <VideoManagement />;
      case "quotes":
        return <QuoteManagement />;
      case "invoices":
        return <InvoiceManagementSystem />;
      case "analytics":
        return <VisitorTrackingDashboard />;
      case "customers":
        return <CustomerManagement />;
      case "contact-notifications":
        return <ContactNotifications />;
      case "projects":
        return <ProjectManagement />;
      case "team":
        return <TeamManagement />;
      case "success-stories":
        return <SuccessStoriesManagement />;
      case "documents":
        return <DocumentManagement />;
      case "discounts":
        return <DiscountManagement />;
      case "mpesa":
        return <MpesaIntegration />;
      case "payments":
        return <PaymentIntegrations />;
      case "newsletter":
        return <NewsletterManagement />;
      case "whatsapp":
        return <WhatsAppManagement />;
      case "settings":
        return <SystemSettings />;
      case "sync":
        return <SyncDashboard />;
      case "technicians":
        return <TechnicianManagement />;
      case "service-bookings":
        return <ServiceBookingManagement />;
      case "ai-research":
        return <AIProductResearch />;
      default:
        return <AdminDashboard onNavigate={selectModule} />;
    }
  };

  const ActiveIcon = activeSection.icon;

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border/80 bg-card/95 backdrop-blur-sm transition-all duration-200 shrink-0 sticky top-0 h-screen ${
          sidebarCollapsed ? "w-[74px]" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border/70 px-4">
          <button
            type="button"
            onClick={() => selectModule("dashboard")}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Droplets className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="leading-tight overflow-hidden">
                <p className="text-sm font-bold tracking-tight text-foreground truncate">
                  DripTech Admin
                </p>
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 truncate">
                  EcoFlow Command v2
                </p>
              </div>
            )}
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Sidebar Filter Input */}
        {!sidebarCollapsed && (
          <div className="p-3 border-b border-border/60">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={sidebarFilter}
                onChange={(e) => setSidebarFilter(e.target.value)}
                placeholder="Filter 24 modules..."
                className="h-8 rounded-lg bg-muted/50 pl-8 pr-2 text-xs border-border/60"
              />
            </div>
          </div>
        )}

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 scrollbar-thin">
          {renderNavigationList(sidebarCollapsed)}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-border/70 p-3 space-y-2">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            title="Open live storefront in a new tab"
            className={`flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${
              sidebarCollapsed ? "justify-center px-2" : ""
            }`}
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary" />
            {!sidebarCollapsed && (
              <span className="truncate">View Public Storefront</span>
            )}
          </Link>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="border-b border-border/70 px-4 py-4 text-left">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold">DripTech Admin</SheetTitle>
                <SheetDescription className="text-xs">
                  24 Management Modules
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="p-3 border-b border-border/60">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={sidebarFilter}
                onChange={(e) => setSidebarFilter(e.target.value)}
                placeholder="Search modules..."
                className="h-8 rounded-lg bg-muted/50 pl-8 text-xs"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            {renderNavigationList(false)}
          </div>
          <div className="border-t border-border/70 p-3">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
              Open Storefront
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Command Header */}
        <header className="sticky top-0 z-30 border-b border-border/80 bg-card/90 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            {/* Left: Mobile Drawer Trigger + Breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden h-9 w-9 rounded-xl shrink-0"
                aria-label="Open admin navigation"
              >
                <Menu className="h-4 w-4" />
              </Button>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="hidden sm:inline font-medium">{activeGroup.label}</span>
                  <ChevronRight className="hidden sm:inline h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="font-semibold text-foreground truncate">
                    {activeSection.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate hidden md:block">
                  {activeSection.description}
                </p>
              </div>
            </div>

            {/* Center/Right: Command Search + Quick Actions + Auth Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Module Command Palette Trigger */}
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="hidden sm:flex items-center gap-3 rounded-xl border border-border/80 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Search className="h-3.5 w-3.5 text-primary" />
                <span>Jump to module...</span>
                <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                  Ctrl K
                </kbd>
              </button>

              {/* Quick Action Pills on Large Screens */}
              <div className="hidden xl:flex items-center gap-1.5">
                <Button
                  variant={activeTab === "products" ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectModule("products")}
                  className="h-8 rounded-xl text-xs gap-1.5"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Products
                </Button>
                <Button
                  variant={activeTab === "quotes" ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectModule("quotes")}
                  className="h-8 rounded-xl text-xs gap-1.5"
                >
                  <Quote className="h-3.5 w-3.5" />
                  Quotes & BOQ
                </Button>
                <Button
                  variant={activeTab === "sync" ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectModule("sync")}
                  className="h-8 rounded-xl text-xs gap-1.5"
                >
                  <Database className="h-3.5 w-3.5 text-emerald-500" />
                  Edge Sync
                </Button>
              </div>

              <NotificationSystem />
              <ThemeToggle />
              <AdminHeader />
            </div>
          </div>
        </header>

        {/* Active Module Banner + Workspace Body */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-[1600px] w-full mx-auto space-y-6">
          {/* Module Context Bar (shown on non-dashboard tabs for clear orientation) */}
          {activeTab !== "dashboard" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <ActiveIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                      {activeSection.label}
                    </h2>
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                      {activeGroup.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeSection.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectModule("dashboard")}
                  className="h-8 rounded-xl text-xs"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                  Back to Overview
                </Button>
              </div>
            </div>
          )}

          <Suspense fallback={<AdminLoading />}>
            <div className="animate-in fade-in duration-200">
              {renderActiveModule()}
            </div>
          </Suspense>
        </main>
      </div>

      {/* Ctrl+K Quick Module Jumper Modal */}
      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-border">
          <DialogHeader className="px-4 pt-4 pb-2 border-b border-border/70">
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <Command className="h-4 w-4 text-primary" />
              Quick Module Switcher
            </DialogTitle>
            <DialogDescription className="text-xs">
              Jump directly to any of the 24 DripTech administration modules
            </DialogDescription>
            <div className="relative pt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/3 text-muted-foreground" />
              <Input
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Type a module name (e.g., Products, M-Pesa, Quotes, Sync)..."
                className="h-10 rounded-xl pl-9 text-sm"
              />
            </div>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/40">
            {commandFilteredSections.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No matching admin modules found.
              </p>
            ) : (
              commandFilteredSections.map((section) => {
                const Icon = section.icon;
                const isActive = section.id === activeTab;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => selectModule(section.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/70"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {section.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {section.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {section.group}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Admin = () => {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="googlebot" content="noindex, nofollow, noarchive" />
      </Helmet>
      <AdminAuthProvider>
        <AdminAuthGuard>
          <Helmet>
            <title>DripTech Admin — Operations Command Center</title>
          </Helmet>
          <AdminContent />
        </AdminAuthGuard>
      </AdminAuthProvider>
    </>
  );
};

export default Admin;
