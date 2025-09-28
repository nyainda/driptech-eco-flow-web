import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Newspaper
} from "lucide-react";
import { AdminAuthProvider, AdminAuthGuard, AdminHeader } from "@/components/Admin/AdminAuth";
import { ThemeToggle } from "@/components/Layout/ThemeToggle";
import NotificationSystem from "@/components/Admin/NotificationSystem";
import AdminDashboard from "@/components/Admin/AdminDashboard";
import ProductManagement from "@/components/Admin/ProductManagement";
import BlogManagement from "@/components/Admin/BlogManagement";
import QuoteManagement from "@/components/Admin/QuoteManagement";
import CustomerManagement from "@/components/Admin/CustomerManagement";
import ContactNotifications from "@/components/Admin/ContactNotifications";
import ProjectManagement from "@/components/Admin/ProjectManagement";
import DocumentManagement from "@/components/Admin/DocumentManagement";
import SystemSettings from "@/components/Admin/SystemSettings";
import TeamManagement from "@/components/Admin/TeamManagement";
import SuccessStoriesManagement from "@/components/Admin/SuccessStoriesManagement";
import VideoManagement from "@/components/Admin/VideoManagement";
import MpesaIntegration from "@/components/Admin/MpesaIntegration";
import InvoiceManagementSystem from "@/components/Admin/Invoice/InvoiceManagementSystem";
import VisitorTrackingDashboard from "@/components/Admin/VisitorTrackingDashboard";
import DiscountManagement from "@/components/Admin/DiscountManagement";
import NewsManagement from "@/components/Admin/NewsManagement";
import { Button } from "@/components/ui/button"; 
import { Badge } from "@/components/ui/badge"; 
import IrrigationKitsManagement from "@/components/Admin/IrrigationKitsManagement"; 

const AdminContent = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const unreadCount = 0; 

  const adminSections = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview and analytics"
    },
    {
      id: "products",
      label: "Products",
      icon: Package,
      description: "Manage irrigation products"
    },

    {
      id: "kits",
      label: "Irrigation Kits",
      icon: Package,
      description: "Manage irrigation kits"
    },
    {
      id: "blog",
      label: "Blog & Content",
      icon: FileText,
      description: "Content management system"
    },
    {
      id: "news",
      label: "News",
      icon: Newspaper,
      description: "News articles and announcements"
    },
    {
      id: "videos",
      label: "Videos",
      icon: Video,
      description: "Video content management"
    },
    {
      id: "quotes",
      label: "Quotes & BOQ",
      icon: Quote,
      description: "Quote and billing management"
    },
    {
      id: "invoices",
      label: "Invoices",
      icon: Receipt,
      description: "Invoice management system"
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      description: "Visitor tracking and website analytics"
    },
    {
      id: "customers",
      label: "Customers",
      icon: Users,
      description: "Customer relationship management"
    },
    {
      id: "contact-notifications",
      label: "Contact Messages", // Changed label
      icon: Mail, // Changed icon to Mail
      description: "Manage contact form submissions"
    },
    {
      id: "projects",
      label: "Projects",
      icon: TrendingUp,
      description: "Project portfolio management"
    },
    {
      id: "team",
      label: "Team",
      icon: UsersIcon,
      description: "Manage team members"
    },
    {
      id: "success-stories",
      label: "Success Stories",
      icon: Trophy,
      description: "Client success stories"
    },
    {
      id: "documents",
      label: "Documents",
      icon: Download,
      description: "Document download center"
    },
    {
      id: "discounts",
      label: "Discount Banners",
      icon: Gift,
      description: "Promotional banner management"
    },
    {
      id: "mpesa",
      label: "M-Pesa Payments",
      icon: CreditCard,
      description: "Payment tracking and statements"
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      description: "System configuration"
    }
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
              <p className="text-muted-foreground">Manage your irrigation business</p>
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
                  className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 lg:p-4 rounded-lg border transition-all hover:shadow-md min-h-[60px] sm:min-h-[70px] lg:min-h-[80px] ${
                    activeTab === section.id
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-card hover:bg-muted/50'
                  }`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs font-medium text-center leading-tight px-1">{section.label}</span>
                </Button>
              );
            })}
          </div>

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

          <TabsContent value="settings" className="space-y-6">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Admin = () => {
  return (
    <AdminAuthProvider>
      <AdminAuthGuard>
        <AdminContent />
      </AdminAuthGuard>
    </AdminAuthProvider>
  );
};

export default Admin;