export interface QuoteItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface Customer {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  user_role: string;
  created_at: string;
}

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

export interface Quote {
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

export interface QuoteFormData {
  customer?: Customer;
  project_type?: string;
  crop_type?: string;
  area_size?: number;
  water_source?: string;
  terrain_info?: string;
  notes?: string;
  valid_until?: string;
  status: QuoteStatus;
  include_vat: boolean;
  vat_rate: number;
  items: QuoteItem[];
}
