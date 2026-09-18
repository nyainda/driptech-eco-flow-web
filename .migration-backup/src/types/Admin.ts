export interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "super_admin" | "editor";
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
}

export interface AdminStats {
  totalProducts: number;
  totalCustomers: number;
  totalQuotes: number;
  totalRevenue: number;
  monthlyGrowth: number;
  activeProjects: number;
}

export interface NotificationMessage {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, any>;
  timestamp: string;
}
