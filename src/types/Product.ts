export interface ProductVariant {
  name: string;
  price: number;
  in_stock: boolean;
}

export interface ProductSpecification {
  name: string;
  value: string;
  unit?: string;
}

export interface TechnicalSpec {
  [key: string]:
    | {
        value: string;
        unit: string;
      }
    | string;
}

export interface Product {
  id: string;
  name: string;
  model_number?: string;
  category:
    | "drip_irrigation"
    | "sprinkler_systems"
    | "filtration_systems"
    | "control_systems"
    | "accessories"
    | "pumps_motors"
    | "pipes_fittings"
    | "solar_irrigation"
    | "fertigation_systems"
    | "greenhouse_systems"
    | "emitters_drippers"
    | "valves_regulators"
    | "water_storage"
    | "rain_guns";
  subcategory?: string;
  description?: string;
  technical_specs?: TechnicalSpec;
  price?: number;
  images?: string[];
  in_stock: boolean;
  featured: boolean;
  created_at: string;
  variants?: ProductVariant[];
  features?: string[];
  applications?: string[];
  specifications?: ProductSpecification[];
}

export interface ProductFormData {
  name: string;
  model_number: string;
  category: string;
  subcategory: string;
  description: string;
  price: string;
  in_stock: boolean;
  featured: boolean;
  images: string[];
  features: string[];
  applications: string[];
  specifications: ProductSpecification[];
  variants: { name: string; price: string; in_stock: boolean }[];
}

export interface ProductCategory {
  value: string;
  label: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { value: "drip_irrigation", label: "Drip Irrigation" },
  { value: "sprinkler_systems", label: "Sprinkler Systems" },
  { value: "filtration_systems", label: "Filtration Systems" },
  { value: "control_systems", label: "Control Systems" },
  { value: "pumps_motors", label: "Pumps & Motors" },
  { value: "pipes_fittings", label: "Pipes & Fittings" },
  { value: "solar_irrigation", label: "Solar Irrigation" },
  { value: "fertigation_systems", label: "Fertigation Systems" },
  { value: "greenhouse_systems", label: "Greenhouse Systems" },
  { value: "emitters_drippers", label: "Emitters & Drippers" },
  { value: "valves_regulators", label: "Valves & Regulators" },
  { value: "water_storage", label: "Water Storage" },
  { value: "rain_guns", label: "Rain Guns" },
  { value: "accessories", label: "Accessories" },
];
