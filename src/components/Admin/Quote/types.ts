export interface Customer {
  id: string;
  email: string;
  contact_person: string;
  company_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface Quote {
  id: string;
  quote_number: string;
  project_type?: string;
  crop_type?: string;
  area_size?: number;
  water_source?: string;
  terrain_info?: string;
  notes?: string;
  total_amount?: number;
  include_vat: boolean; 
  vat_rate: number;
  status: string;
  valid_until?: string;
  created_at: string;
}

export interface QuoteItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;

  vat_rate?: number;
  include_vat?: boolean;
  total: number;
}

export interface QuotePDFProps {
  quote: Quote;
  items: QuoteItem[];
  customer?: Customer;
  onEdit?: () => void;
}