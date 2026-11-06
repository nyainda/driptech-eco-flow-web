import { useQuery } from "@tanstack/react-query";
import { dataService } from "@/services/dataService";

type KitRow = {
  name: string;
  acres: number | null;
  price: number | null;
  crops: string[];
};

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

// Mirrors scripts/generate-seo-pages.mjs so the table crawlers see in the static
// HTML is the same content visitors (and Google's rendered view) see after load.
const normalise = (kits: unknown): KitRow[] => {
  const list = Array.isArray(kits) ? kits : Array.isArray((kits as { data?: unknown })?.data) ? (kits as { data: unknown[] }).data : [];
  return list
    .filter((kit: any) => typeof kit?.name === "string" && kit.name.trim())
    .map((kit: any) => ({
      name: kit.name.trim(),
      acres: Number(kit.coverage_area) > 0 ? Number(kit.coverage_area) : null,
      price: Number(kit.price) > 0 ? Number(kit.price) : null,
      crops: toStringList(kit.recommended_crops).slice(0, 4),
    }))
    .sort((a, b) => (a.acres ?? Infinity) - (b.acres ?? Infinity) || (a.price ?? Infinity) - (b.price ?? Infinity));
};

const formatKes = (value: number) => `KES ${Math.round(value).toLocaleString("en-US")}`;
const formatAcres = (acres: number | null) => (acres ? `${acres} acre${acres === 1 ? "" : "s"}` : "Custom size");

const KitPriceTable = () => {
  const { data: rows = [] } = useQuery({
    queryKey: ["seo-kit-price-table"],
    queryFn: async () => normalise(await dataService.getIrrigationKits({ sortBy: "coverage_area" })),
    staleTime: 10 * 60 * 1000,
  });

  if (rows.length === 0) return null;

  return (
    <article className="dt-card p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-foreground">Current drip irrigation kit prices</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <caption className="sr-only">DripTech kit catalogue prices in Kenyan shillings</caption>
          <thead>
            <tr className="border-b border-border text-foreground">
              <th scope="col" className="py-3 pr-4 font-semibold">Kit</th>
              <th scope="col" className="py-3 pr-4 font-semibold">Covers</th>
              <th scope="col" className="py-3 pr-4 font-semibold">Price</th>
              <th scope="col" className="py-3 font-semibold">Suited to</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {rows.map((kit) => (
              <tr key={kit.name} className="border-b border-border/60">
                <th scope="row" className="py-3 pr-4 font-medium text-foreground">{kit.name}</th>
                <td className="py-3 pr-4">{formatAcres(kit.acres)}</td>
                <td className="py-3 pr-4">{kit.price ? formatKes(kit.price) : "Contact DripTech for a quote"}</td>
                <td className="py-3">{kit.crops.join(", ") || "Ask for a crop-specific layout"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 leading-7 text-muted-foreground">
        Prices are DripTech's catalogue prices when this page was last published. A kit's acreage is a starting point: crop layout, lines per bed, water source and distance change the final list, so confirm the included components, delivery and installation before you order.
      </p>
    </article>
  );
};

export default KitPriceTable;
