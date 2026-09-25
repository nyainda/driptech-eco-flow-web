/**
 * Shared product URL, slug and category-label helpers.
 *
 * Previously this logic (slugify / getProductSlug / getProductPath / category
 * title lookup) was defined inline and separately inside Products.tsx,
 * ProductsShowcase.tsx and ProductRecommendations.tsx. Consolidated here so
 * every place that links to a product generates the same URL.
 */

export const CATEGORY_PATHS: Record<string, string> = {
  accessories: "accessories",
  borehole_equipment: "borehole",
  control_systems: "controls",
  drip_irrigation: "drip",
  emitters_drippers: "emitters",
  fertigation_systems: "fertigation",
  filtration_systems: "filtration",
  greenhouse_systems: "greenhouse",
  filters_strainers: "filters-strainers",
  pipes_fittings: "pipes",
  pumps_motors: "pumps",
  sprinkler_systems: "sprinklers",
  valves_regulators: "valves",
  controllers_timers: "controllers",
};

const CATEGORY_TITLES: Record<string, string> = {
  drip: "Drip Irrigation Systems",
  sprinklers: "Sprinkler Systems",
  filtration: "Filtration Systems",
  controls: "Control Systems",
  accessories: "Accessories",
  pumps: "Pumps & Motors",
  pipes: "Pipes & Fittings",
  fertigation: "Fertigation Systems",
  greenhouse: "Greenhouse Systems",
  emitters: "Emitters & Drippers",
  valves: "Valves & Regulators",
  "filters-strainers": "Filters & Strainers",
  controllers: "Controllers & Timers",
  borehole: "Borehole Equipment",
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export interface SluggableProduct {
  id: string;
  name: string;
  category: string;
}

export const getProductSlug = (product: SluggableProduct) =>
  `${slugify(product.name)}-${product.id.slice(0, 8)}`;

export const getProductPath = (product: SluggableProduct) =>
  `/products/${CATEGORY_PATHS[product.category] || "all"}/${getProductSlug(product)}`;

/** Category title from a URL path segment (e.g. "drip" -> "Drip Irrigation Systems"). */
export const getCategoryTitleFromPath = (categoryPath: string) =>
  CATEGORY_TITLES[categoryPath] || "All Products";

/** Category title from a raw database category value (e.g. "drip_irrigation" -> "Drip Irrigation Systems"). */
export const getCategoryTitleFromCategory = (category: string) =>
  CATEGORY_TITLES[CATEGORY_PATHS[category]] ||
  category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return "Contact for price";
  return `KSh ${price.toLocaleString()}`;
};
