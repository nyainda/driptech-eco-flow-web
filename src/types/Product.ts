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
    | "fertigation_systems"
    | "greenhouse_systems"
    | "emitters_drippers"
    | "valves_regulators"
    | "filters_strainers"
    | "controllers_timers"
    | "borehole_equipment"
    | "rain_guns"
    | "solar_irrigation"
    | "water_storage";
  subcategory?: string;
  description?: string;
  technical_specs?: TechnicalSpec;
  price?: number;
  images?: string[];
  in_stock: boolean;
  featured: boolean;
  created_at: string;
  updated_at?: string;
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

export type ProductStatusFilter =
  | "all"
  | "in_stock"
  | "out_of_stock"
  | "missing_photos"
  | "featured"
  | "with_variants"
  | "unpriced";

export type ProductSortOption =
  | "newest"
  | "name_asc"
  | "price_asc"
  | "price_desc"
  | "missing_photos";

export type ProductViewMode = "table" | "grid";

export interface ProductCategory {
  value: string;
  label: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { value: "drip_irrigation", label: "Drip Irrigation" },
  { value: "sprinkler_systems", label: "Sprinkler Systems" },
  { value: "filtration_systems", label: "Filtration Systems" },
  { value: "filters_strainers", label: "Filters & Strainers" },
  { value: "control_systems", label: "Control Systems" },
  { value: "controllers_timers", label: "Controllers & Timers" },
  { value: "pumps_motors", label: "Pumps & Motors" },
  { value: "borehole_equipment", label: "Borehole Equipment" },
  { value: "pipes_fittings", label: "Pipes & Fittings" },
  { value: "fertigation_systems", label: "Fertigation Systems" },
  { value: "greenhouse_systems", label: "Greenhouse Systems" },
  { value: "emitters_drippers", label: "Emitters & Drippers" },
  { value: "valves_regulators", label: "Valves & Regulators" },
  { value: "rain_guns", label: "Rain Guns" },
  { value: "solar_irrigation", label: "Solar Irrigation" },
  { value: "water_storage", label: "Water Storage" },
  { value: "accessories", label: "Accessories" },
];

export const getProductCategoryLabel = (category?: string): string => {
  if (!category) return "Uncategorized";
  return (
    PRODUCT_CATEGORIES.find((c) => c.value === category)?.label ||
    category.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())
  );
};
