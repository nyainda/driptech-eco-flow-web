
export interface Variant {
  id: string;
  name: string;
  value: string;
  price?: number;
  sku: string;
  stock_quantity: number;
  attributes: Record<string, any>;
  images: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'drip_irrigation' | 'sprinkler_systems' | 'filtration_systems' | 'control_systems' | 'accessories';
  subcategory?: string;
  model_number?: string;
  price?: number;
  images: string[];
  features: string[];
  applications: string[];
  specifications?: Record<string, any>;
  technical_specs?: Record<string, any>;
  variants: Variant[];
  in_stock: boolean;
  featured: boolean;
  brochure_url?: string;
  installation_guide_url?: string;
  maintenance_manual_url?: string;
  video_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  businessShortCode: string;
  callbackUrl: string;
}
