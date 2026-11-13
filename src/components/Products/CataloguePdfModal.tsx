import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  openProductCataloguePdf,
  type CataloguePdfMode,
  type PdfProductItem,
} from "@/lib/catalogAndQuotePdf";
import { getCategoryTitleFromCategory } from "@/lib/productUrl";
import { dataService } from "@/services/dataService";

const MODAL_CATEGORIES = [
  { key: "drip_irrigation", label: "Drip Irrigation" },
  { key: "sprinkler_systems", label: "Sprinklers" },
  { key: "pumps_motors", label: "Pumps & Motors" },
  { key: "filtration_systems", label: "Filtration" },
  { key: "fertigation_systems", label: "Fertigation" },
  { key: "greenhouse_systems", label: "Greenhouse" },
  { key: "emitters_drippers", label: "Emitters & Drippers" },
  { key: "valves_regulators", label: "Valves & Regulators" },
  { key: "control_systems", label: "Controls & Timers" },
  { key: "pipes_fittings", label: "Pipes & Fittings" },
  { key: "accessories", label: "Accessories" },
] as const;

interface CataloguePdfModalProps {
  children: ReactNode;
  products?: PdfProductItem[];
  categoryCounts?: Record<string, number>;
  activeCategoryKey?: string;
  defaultWhatsApp?: boolean;
}

export const CataloguePdfModal = ({
  children,
  products = [],
  categoryCounts,
  activeCategoryKey = "all",
  defaultWhatsApp = false,
}: CataloguePdfModalProps) => {
  const hasSpecificCategory = Boolean(activeCategoryKey && activeCategoryKey !== "all");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CataloguePdfMode>(
    hasSpecificCategory ? "category" : "executive",
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    hasSpecificCategory ? activeCategoryKey : "drip_irrigation",
  );
  const [includeImages, setIncludeImages] = useState(false);
  const [alsoWhatsApp, setAlsoWhatsApp] = useState(defaultWhatsApp);
  const [generating, setGenerating] = useState(false);
  const [fetchedCounts, setFetchedCounts] = useState<Record<string, number>>({});

  // Sync defaults whenever opened or active category prop changes
  useEffect(() => {
    if (!open) return;
    const isSpecific = Boolean(activeCategoryKey && activeCategoryKey !== "all");
    setMode(isSpecific ? "category" : "executive");
    setSelectedCategory(isSpecific ? activeCategoryKey : "drip_irrigation");
    setIncludeImages(false);
    setAlsoWhatsApp(defaultWhatsApp);
  }, [open, activeCategoryKey, defaultWhatsApp]);

  // Fetch category SKU counts lightly when not supplied by parent
  useEffect(() => {
    if (!open) return;
    if (categoryCounts && Object.keys(categoryCounts).length > 0) return;
    if (Object.keys(fetchedCounts).length > 0) return;

    dataService
      .getProductCategoryCounts()
      .then((rows: { category: string; count: number }[]) => {
        const next: Record<string, number> = {};
        (rows || []).forEach((r) => {
          if (r?.category) next[r.category] = Number(r.count || 0);
        });
        setFetchedCounts(next);
      })
      .catch(() => {});
  }, [open, categoryCounts, fetchedCounts]);

  const effectiveCounts = useMemo(() => {
    if (categoryCounts && Object.keys(categoryCounts).length > 0) {
      return categoryCounts;
    }
    if (Object.keys(fetchedCounts).length > 0) {
      return fetchedCounts;
    }
    const derived: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category) {
        derived[p.category] = (derived[p.category] || 0) + 1;
      }
    });
    return derived;
  }, [categoryCounts, fetchedCounts, products]);

  const totalCount = useMemo(
    () => Object.values(effectiveCounts).reduce((sum, n) => sum + n, 0) || products.length,
    [effectiveCounts, products.length],
  );

  const selectedCategoryCount = effectiveCounts[selectedCategory] ?? 0;
  const canIncludeSmallPhotos = mode === "category" && selectedCategoryCount > 0 && selectedCategoryCount <= 25;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const catLabel = getCategoryTitleFromCategory(selectedCategory);
      // Fire synchronously inside click handler so popup blockers permit window.open()
      const pendingPdf = openProductCataloguePdf({
        products,
        categoryCounts: effectiveCounts,
        mode,
        categoryKey: mode === "category" ? selectedCategory : "all",
        categoryLabel: mode === "category" ? catLabel : undefined,
        title:
          mode === "category"
            ? `${catLabel} Equipment & Price List`
            : mode === "compact-full"
              ? "Complete Stocked SKU Price List (Compact Ledger)"
              : "Key Irrigation Equipment & Kits Catalogue",
        maxPerCategory: 4,
        includeImages: canIncludeSmallPhotos ? includeImages : false,
        alsoOpenWhatsApp: alsoWhatsApp,
      });
      await pendingPdf;
      setOpen(false);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-xl max-h-[88vh] flex flex-col gap-0 overflow-hidden p-0 rounded-2xl">
        <DialogHeader className="shrink-0 border-b border-border/60 px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-3.5 text-left">
          <DialogTitle className="font-heading text-base sm:text-xl font-bold pr-6">
            Download Light PDF Catalogue
          </DialogTitle>
          <DialogDescription className="text-[11px] sm:text-sm leading-snug">
            Instead of loading all {totalCount || "500+"} heavy product photos into one huge file, pick the exact catalogue edition you need.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 sm:px-6 space-y-2.5">
          {/* Option 1: Curated Key Products & Kits */}
          <button
            type="button"
            onClick={() => setMode("executive")}
            className={`w-full rounded-xl border p-3 sm:p-3.5 text-left transition-all ${
              mode === "executive"
                ? "border-primary bg-primary/[0.06] ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-heading text-xs sm:text-sm font-bold text-foreground">
                  Key Products &amp; Complete Kits
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold text-primary-foreground">
                Light · ~5 Pages
              </span>
            </div>
            <p className="mt-1 pl-6 text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
              Company profile, ¼–1+ acre irrigation kits, category directory, and top 4 priority items per category. Fast download &amp; WhatsApp-ready.
            </p>
          </button>

          {/* Option 2: Single Category Price List */}
          <div
            className={`rounded-xl border p-3 sm:p-3.5 transition-all ${
              mode === "category"
                ? "border-primary bg-primary/[0.06] ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <button
              type="button"
              onClick={() => setMode("category")}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Filter className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-heading text-xs sm:text-sm font-bold text-foreground">
                    Specific Category Price List
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                  1–4 Pages
                </span>
              </div>
              <p className="mt-1 pl-6 text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
                Export all stocked items and variants for one irrigation category only.
              </p>
            </button>

            {mode === "category" && (
              <div className="mt-2.5 border-t border-border/70 pt-2.5 pl-0 sm:pl-6 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {MODAL_CATEGORIES.map((cat) => {
                    const count = effectiveCounts[cat.key];
                    const isSelected = selectedCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.key);
                          if ((effectiveCounts[cat.key] ?? 99) > 25) {
                            setIncludeImages(false);
                          }
                        }}
                        className={`inline-flex max-w-full items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-primary/50"
                        }`}
                      >
                        <span className="truncate">{cat.label}</span>
                        {typeof count === "number" && count > 0 && (
                          <span
                            className={`shrink-0 rounded px-1 text-[9px] ${
                              isSelected ? "bg-white/20" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {canIncludeSmallPhotos && (
                  <label className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-border accent-primary shrink-0"
                    />
                    <span>
                      Include product thumbnails ({selectedCategoryCount} items)
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Option 3: Compact Full SKU Price Ledger */}
          <button
            type="button"
            onClick={() => setMode("compact-full")}
            className={`w-full rounded-xl border p-3 sm:p-3.5 text-left transition-all ${
              mode === "compact-full"
                ? "border-primary bg-primary/[0.06] ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-heading text-xs sm:text-sm font-bold text-foreground">
                  Complete SKU Price Sheet
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                Text-Only · Compact
              </span>
            </div>
            <p className="mt-1 pl-6 text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
              Every stocked item ({totalCount || "all"} SKUs) in a compact single-line price table without heavy photos—for tenders &amp; corporate LPOs.
            </p>
          </button>
        </div>

        <div className="shrink-0 flex flex-col gap-2.5 border-t border-border bg-background px-4 py-3 sm:px-6 sm:py-4">
          <label className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={alsoWhatsApp}
              onChange={(e) => setAlsoWhatsApp(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary shrink-0"
            />
            <MessageCircle className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--dt-whatsapp))]" />
            <span>Also open WhatsApp for bulk pricing or custom BOQ</span>
          </label>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="w-full h-10 sm:h-11 rounded-xl bg-primary text-xs sm:text-sm font-extrabold text-primary-foreground hover:bg-primary/90"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Light PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">
                  {mode === "executive"
                    ? "Download Key Highlights PDF"
                    : mode === "category"
                      ? `Download ${getCategoryTitleFromCategory(selectedCategory)} PDF`
                      : "Download Compact Full Price Sheet"}
                </span>
              </>
            )}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0" />
            Fast vector print window — save as PDF in one click
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CataloguePdfModal;
