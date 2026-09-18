import { useState, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useWebVitals from "@/hooks/useWebVitals";
import { Loader2 } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  FileText,
  Quote,
  Users,
  FolderOpen,
  Settings,
  TrendingUp,
  Download,
  Trophy,
  UsersIcon,
  Bell,
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

const AdminLoading = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <Loader2 className="h-10 w-10 text-primary animate-spin" />
    <p className="text-muted-foreground animate-pulse">Loading management module...</p>
  </div>
);

const AdminContent = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const unreadCount = 0;

  // Monitor Web Vitals in Admin
  useWebVitals((metric) => {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`📊 [Admin] ${metric.name}:`, metric);
    }
    // In production, you could send to analytics
    // analytics.send({ ...metric, page: 'admin' });
  });

  const adminSections = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview and analytics",
    },
    {
      id: "products",
      label: "Products",
      icon: Package,
      description: "Manage irrigation products",
    },

    {
      id: "kits",
      label: "Irrigation Kits",
      icon: Package,
      description: "Manage irrigation kits",
    },
    {
      id: "blog",
      label: "Blog & Content",
      icon: FileText,
      description: "Content management system",
    },
    {
      id: "news",
      label: "News",
      icon: Newspaper,
      description: "News articles and announcements",
    },
    {
      id: "videos",
      label: "Videos",
      icon: Video,
      description: "Video content management",
    },
    {
      id: "quotes",
      label: "Quotes & BOQ",
      icon: Quote,
      description: "Quote and billing management",
    },
    {
      id: "invoices",
      label: "Invoices",
      icon: Receipt,
      description: "Invoice management system",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      description: "Visitor tracking and website analytics",
    },
    {
      id: "customers",
      label: "Customers",
      icon: Users,
      description: "Customer relationship management",
    },
    {
      id: "contact-notifications",
      label: "Contact Messages", // Changed label
      icon: Mail, // Changed icon to Mail
      description: "Manage contact form submissions",
    },
    {
      id: "projects",
      label: "Projects",
      icon: TrendingUp,
      description: "Project portfolio management",
    },
    {
      id: "team",
      label: "Team",
      icon: UsersIcon,
      description: "Manage team members",
    },
    {
      id: "success-stories",
      label: "Success Stories",
      icon: Trophy,
      description: "Client success stories",
    },
    {
      id: "documents",
      label: "Documents",
      icon: Download,
      description: "Document download center",
    },
    {
      id: "discounts",
      label: "Discount Banners",
      icon: Gift,
      description: "Promotional banner management",
    },
    {
      id: "mpesa",
      label: "M-Pesa Payments",
      icon: CreditCard,
      description: "Payment tracking and statements",
    },
    {
      id: "payments",
      label: "Payment Integrations",
      icon: CreditCard,
      description: "M-Pesa & Bank payment setup",
    },
    {
      id: "newsletter",
      label: "Newsletter",
      icon: Mail,
      description: "Email subscriber management",
    },
    {
      id: "technicians",
      label: "Technicians",
      icon: UsersIcon,
      description: "Manage irrigation technicians",
    },
    {
      id: "service-bookings",
      label: "Service Bookings",
      icon: Calendar,
      description: "Manage service requests",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      description: "WhatsApp message management",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      description: "System configuration",
    },
    {
      id: "sync",
      label: "Sync Status",
      icon: Database,
      description: "Data synchronization",
    },
    {
      id: "ai-research",
      label: "AI Product Research",
      icon: TrendingUp,
      description: "AI-powered product suggestions",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5">
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                DripTech Admin Portal
              </h1>
              <p className="text-muted-foreground">
                Manage your irrigation business
              </p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationSystem />
              <ThemeToggle />
              <AdminHeader />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-2 mb-6 lg:mb-8">
            {adminSections.map((section) => {
              const Icon = section.icon;
              return (
                <Button
                  key={section.id}
                  variant={activeTab === section.id ? "secondary" : "ghost"}
                  onClick={() => setActiveTab(section.id)}
                  className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 lg:p-4 rounded-lg border transition-all hover:shadow-md min-h-[60px] sm:min-h-[70px] lg:min-h-[80px] ${activeTab === section.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card hover:bg-muted/50"
                    }`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs font-medium text-center leading-tight px-1">
                    {section.label}
                  </span>
                </Button>
              );
            })}
          </div>

          <Suspense fallback={<AdminLoading />}>
            <TabsContent value="dashboard" className="space-y-6">
              <AdminDashboard />
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <ProductManagement />
            </TabsContent>

            <TabsContent value="blog" className="space-y-6">
              <BlogManagement />
            </TabsContent>

            <TabsContent value="news" className="space-y-6">
              <NewsManagement />
            </TabsContent>

            <TabsContent value="videos" className="space-y-6">
              <VideoManagement />
            </TabsContent>

            <TabsContent value="quotes" className="space-y-6">
              <QuoteManagement />
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <InvoiceManagementSystem />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <VisitorTrackingDashboard />
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              <CustomerManagement />
            </TabsContent>

            <TabsContent value="contact-notifications" className="space-y-6">
              <ContactNotifications />
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              <ProjectManagement />
            </TabsContent>

            <TabsContent value="kits" className="space-y-6">
              <IrrigationKitsManagement />
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <TeamManagement />
            </TabsContent>

            <TabsContent value="success-stories" className="space-y-6">
              <SuccessStoriesManagement />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <DocumentManagement />
            </TabsContent>

            <TabsContent value="discounts" className="space-y-6">
              <DiscountManagement />
            </TabsContent>

            <TabsContent value="mpesa" className="space-y-6">
              <MpesaIntegration />
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <PaymentIntegrations />
            </TabsContent>

            <TabsContent value="newsletter" className="space-y-6">
              <NewsletterManagement />
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-6">
              <WhatsAppManagement />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <SystemSettings />
            </TabsContent>

            <TabsContent value="sync" className="space-y-6">
              <SyncDashboard />
            </TabsContent>

            <TabsContent value="technicians" className="space-y-6">
              <TechnicianManagement />
            </TabsContent>

            <TabsContent value="service-bookings" className="space-y-6">
              <ServiceBookingManagement />
            </TabsContent>

            <TabsContent value="ai-research" className="space-y-6">
              <AIProductResearch />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </div>
  );
};

const Admin = () => {
  return (
    <>
      <Helmet>
        <title>DripTech Admin</title>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="googlebot" content="noindex, nofollow, noarchive" />
        <link rel="canonical" href="https://www.dripstech.co.ke/admin" />
      </Helmet>
      <AdminAuthProvider>
        <AdminAuthGuard>
          <AdminContent />
        </AdminAuthGuard>
      </AdminAuthProvider>
    </>
  );
};

export default Admin;
