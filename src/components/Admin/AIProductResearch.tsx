import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TrendingUp,
  CheckCircle,
  XCircle,
  Plus,
  BarChart3,
  Search,
  Package,
  Sparkles,
  ImageIcon,
  Database,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  getAISuggestions,
  updateSuggestionStatus,
  deleteSuggestion,
  getSearchAnalytics,
} from "@/services/aiProductService";

/** All catalogue categories used on the product form */
const ALL_CATEGORIES = [
  "drip_irrigation",
  "sprinkler_systems",
  "filtration_systems",
  "control_systems",
  "pumps_motors",
  "pipes_fittings",
  "solar_irrigation",
  "fertigation_systems",
  "greenhouse_systems",
  "emitters_drippers",
  "valves_regulators",
  "water_storage",
  "rain_guns",
  "accessories",
  "filters_strainers",
  "controllers_timers",
  "mulching_materials",
  "greenhouse_accessories",
  "growing_media",
  "seedling_trays_nursery",
  "borehole_equipment",
] as const;

/** High-demand Kenya irrigation search themes (market research baseline) */
const KENYA_MARKET_DEMAND = [
  "1 acre drip irrigation kit price Kenya",
  "1/2 acre drip kit Kenya",
  "1/4 acre drip irrigation kit",
  "16mm dripline price Kenya",
  "dripline 15cm 20cm 30cm spacing",
  "rain hose irrigation Kenya",
  "rain gun sprinkler Kenya",
  "screen filter irrigation",
  "disc filter for drip",
  "HDPE pipe 32mm 40mm 50mm",
  "tank connector irrigation",
  "venturi fertilizer injector",
  "solar water pump 1HP Kenya",
  "surface pump irrigation",
  "submersible borehole pump",
  "greenhouse drip kit Kenya",
  "button drippers online emitters",
  "pressure regulating valve irrigation",
  "ball valve HDPE fittings",
  "water storage tank farm Kenya",
  "mulching paper agriculture",
  "seedling trays nursery Kenya",
  "fertigation system Kenya",
  "sprinkler impact brass",
  "pop up sprinkler lawn Kenya",
];

/** Category stock images (Unsplash) — form-ready, no DB overwrite of existing products */
const CATEGORY_IMAGES: Record<string, string[]> = {
  drip_irrigation: [
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80",
    "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80",
  ],
  sprinkler_systems: [
    "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
  ],
  filtration_systems: [
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
  ],
  pumps_motors: [
    "https://images.unsplash.com/photo-1581092918056-0c4c3faadceb?w=800&q=80",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
  ],
  solar_irrigation: [
    "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
  ],
  greenhouse_systems: [
    "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&q=80",
  ],
  water_storage: [
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80",
  ],
  pipes_fittings: [
    "https://images.unsplash.com/photo-1581092918056-0c4c3faadceb?w=800&q=80",
  ],
  default: [
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80",
  ],
};

function pickImages(category: string, seed: string): string[] {
  const pool =
    CATEGORY_IMAGES[category] || CATEGORY_IMAGES.default;
  const n = (seed.charCodeAt(0) + seed.length) % pool.length;
  return [pool[n], pool[(n + 1) % pool.length]].filter(Boolean);
}

interface SearchAnalytic {
  query: string;
  count: number;
  categories: string[];
}

interface AISuggestion {
  id: string;
  name: string;
  category: string;
  description: string;
  price_range: string;
  estimated_price: number;
  target_crops: string[];
  features: string[];
  applications: string[];
  search_volume: number;
  status: "pending" | "approved" | "rejected" | "created";
  created_at: string;
  technical_specs?: any;
  images?: string[];
}

const TARGET_CATALOG = 1000;
const BATCH_SIZE = 20;

async function getGeminiKey(): Promise<string> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "gemini_api_key")
    .maybeSingle();
  if (error || !data?.setting_value) {
    throw new Error(
      "Gemini API key not found. Add it under Admin → System Settings (gemini_api_key).",
    );
  }
  return data.setting_value as string;
}

async function callGemini(apiKey: string, prompt: string): Promise<any> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 8192,
        },
      }),
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || "Gemini API failed");
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No content from Gemini");
  const clean = text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(clean);
}

function buildKenyaCatalogPrompt(
  count: number,
  focusCategories: string[],
  existingNames: string[],
): string {
  return `You are a Kenya irrigation trade expert (Nairobi / Rift / Western / Coast farms).
Generate ${count} REALISTIC products that Kenyan farmers and agro-dealers actually buy and search for on Google/WhatsApp.

High-demand search themes in Kenya:
${KENYA_MARKET_DEMAND.map((q) => `- ${q}`).join("\n")}

Focus categories for this batch (use these category keys exactly):
${focusCategories.join(", ")}

Avoid duplicating these existing names:
${existingNames.slice(0, 80).join(" | ") || "(none)"}

Pricing must be realistic KES retail for 2024–2026 Kenya market (smallholder to commercial).

Return ONLY valid JSON (no markdown):
{
  "suggestions": [
    {
      "name": "Specific sellable name e.g. 16mm Dripline 20cm Spacing 1000m Roll",
      "category": "one of the category keys above",
      "subcategory": "short subcategory",
      "model_number": "DT-XXX-001",
      "description": "2 short paragraphs: what it is, who it is for in Kenya, install notes",
      "price_range": "KES X - Y",
      "estimated_price": 8500,
      "target_crops": ["Tomatoes", "Onions"],
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "applications": ["Open field", "Greenhouse"],
      "search_volume": 50,
      "technical_specs": {
        "model_number": "DT-XXX-001",
        "subcategory": "dripline",
        "material": "LDPE",
        "size": "16mm",
        "specifications": [
          { "name": "Diameter", "value": "16", "unit": "mm" },
          { "name": "Spacing", "value": "20", "unit": "cm" }
        ],
        "variants": [
          { "name": "500m roll", "price": 4500, "in_stock": true },
          { "name": "1000m roll", "price": 8500, "in_stock": true }
        ]
      }
    }
  ]
}

Cover variety within the batch: kits, rolls, fittings, filters, pumps, valves — not only kits.
Products must be form-ready for a product admin form.`;
}

export default function AIProductResearch() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [analytics, setAnalytics] = useState<SearchAnalytic[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");
  const [creatingIds, setCreatingIds] = useState<Set<string>>(new Set());
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "created"
  >("all");

  useEffect(() => {
    loadSuggestions();
    loadAnalytics();
  }, []);

  const loadSuggestions = async () => {
    try {
      const data = await getAISuggestions();
      setSuggestions(data as AISuggestion[]);
    } catch (error) {
      console.error("Failed to load suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to load AI suggestions",
        variant: "destructive",
      });
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await getSearchAnalytics(30);
      setAnalytics(data.slice(0, 20));
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  const pendingCount = useMemo(
    () => suggestions.filter((s) => s.status === "pending").length,
    [suggestions],
  );
  const approvedCount = useMemo(
    () => suggestions.filter((s) => s.status === "approved").length,
    [suggestions],
  );
  const createdCount = useMemo(
    () => suggestions.filter((s) => s.status === "created").length,
    [suggestions],
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") return suggestions;
    return suggestions.filter((s) => s.status === statusFilter);
  }, [suggestions, statusFilter]);

  const saveSuggestions = async (list: any[]) => {
    for (const suggestion of list) {
      const cat = suggestion.category || "accessories";
      const images =
        suggestion.images?.length > 0
          ? suggestion.images
          : pickImages(cat, suggestion.name || "x");

      await supabase.from("ai_product_suggestions").insert({
        name: suggestion.name,
        category: cat,
        description: suggestion.description,
        price_range: suggestion.price_range,
        estimated_price: suggestion.estimated_price,
        target_crops: suggestion.target_crops,
        technical_specs: {
          ...(suggestion.technical_specs || {}),
          model_number:
            suggestion.model_number ||
            suggestion.technical_specs?.model_number,
          subcategory:
            suggestion.subcategory ||
            suggestion.technical_specs?.subcategory,
          images,
        },
        features: suggestion.features,
        applications: suggestion.applications,
        search_volume: suggestion.search_volume || 0,
        status: "pending",
      });
    }
  };

  /** Site search trends → product ideas */
  const analyzeSearchTrends = async () => {
    setAnalyzing(true);
    try {
      const apiKey = await getGeminiKey();

      const { data: searchData, error: searchError } = await supabase
        .from("search_queries")
        .select("query, category")
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        );

      const topQueries =
        !searchError && searchData && searchData.length > 0
          ? Object.entries(
              searchData.reduce((acc: Record<string, number>, row) => {
                const q = (row.query || "").toLowerCase().trim();
                if (!q) return acc;
                acc[q] = (acc[q] || 0) + 1;
                return acc;
              }, {}),
            )
              .sort((a, b) => Number(b[1]) - Number(a[1]))
              .slice(0, 30)
              .map(([query, count]) => ({ query, count: Number(count) }))
          : KENYA_MARKET_DEMAND.map((query, i) => ({
              query,
              count: 100 - i,
            }));

      if (!searchData?.length) {
        toast({
          title: "Using Kenya market demand list",
          description:
            "No on-site searches yet — generating from common Kenya irrigation searches.",
        });
      }

      const existing = suggestions.map((s) => s.name);
      const prompt = `You are an irrigation equipment expert for Kenya.
Analyze these search queries (site + market):
${JSON.stringify(topQueries, null, 2)}

Generate ${BATCH_SIZE} product suggestions farmers would buy.
Categories must be one of: ${ALL_CATEGORIES.join(", ")}

Avoid: ${existing.slice(0, 40).join(", ") || "none"}

Return ONLY JSON:
{
  "suggestions": [
    {
      "name": "string",
      "category": "drip_irrigation",
      "subcategory": "string",
      "model_number": "DT-...",
      "description": "string",
      "price_range": "KES ...",
      "estimated_price": 0,
      "target_crops": [],
      "features": [],
      "applications": [],
      "search_volume": 0,
      "technical_specs": {
        "model_number": "DT-...",
        "subcategory": "",
        "specifications": [{ "name": "", "value": "", "unit": "" }],
        "variants": [{ "name": "", "price": 0, "in_stock": true }]
      }
    }
  ]
}`;

      const parsed = await callGemini(apiKey, prompt);
      const list = parsed.suggestions || [];
      await saveSuggestions(list);
      toast({
        title: "Analysis complete",
        description: `Generated ${list.length} product suggestions`,
      });
      await loadSuggestions();
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze trends",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Aggressive Kenya market fill toward ~1000 products.
   * Only inserts into ai_product_suggestions — never updates existing catalogue products.
   */
  const generateKenyaMarketBatch = async (batches = 3) => {
    setBulkRunning(true);
    try {
      const apiKey = await getGeminiKey();
      let total = 0;
      const existingNames = suggestions.map((s) => s.name);

      for (let b = 0; b < batches; b++) {
        setBulkProgress(`Batch ${b + 1}/${batches}…`);
        // Rotate category focus so catalogue is balanced
        const start = (b * 5) % ALL_CATEGORIES.length;
        const focus = [
          ...ALL_CATEGORIES.slice(start, start + 7),
          ...ALL_CATEGORIES.slice(0, Math.max(0, 7 - (ALL_CATEGORIES.length - start))),
        ].slice(0, 7);

        const prompt = buildKenyaCatalogPrompt(
          BATCH_SIZE,
          focus as string[],
          existingNames,
        );
        const parsed = await callGemini(apiKey, prompt);
        const list = parsed.suggestions || [];
        await saveSuggestions(list);
        list.forEach((s: any) => existingNames.push(s.name));
        total += list.length;
      }

      toast({
        title: "Kenya market batch ready",
        description: `Added ${total} draft suggestions. Review, approve, then Create — existing DB products are not changed.`,
      });
      await loadSuggestions();
    } catch (error: any) {
      toast({
        title: "Batch failed",
        description: error.message || "Could not generate market batch",
        variant: "destructive",
      });
    } finally {
      setBulkRunning(false);
      setBulkProgress("");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateSuggestionStatus(id, "approved");
      toast({ title: "Approved", description: "Ready to create as product." });
      await loadSuggestions();
    } catch {
      toast({
        title: "Error",
        description: "Failed to approve",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateSuggestionStatus(id, "rejected");
      toast({ title: "Rejected" });
      await loadSuggestions();
    } catch {
      toast({
        title: "Error",
        description: "Failed to reject",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this suggestion?")) return;
    try {
      await deleteSuggestion(id);
      toast({ title: "Deleted" });
      await loadSuggestions();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      });
    }
  };

  /** Insert as NEW product only — never updates existing rows */
  const handleCreateProduct = async (suggestion: AISuggestion) => {
    setCreatingIds((prev) => new Set(prev).add(suggestion.id));
    try {
      const specs = (suggestion.technical_specs || {}) as any;
      const variants = specs?.variants || [];
      const specifications = specs?.specifications || [];
      const images: string[] =
        specs?.images ||
        suggestion.images ||
        pickImages(suggestion.category, suggestion.name);

      // Skip if same name already in catalogue
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .ilike("name", suggestion.name)
        .limit(1);

      if (existing && existing.length > 0) {
        await updateSuggestionStatus(suggestion.id, "created");
        toast({
          title: "Already in catalogue",
          description: `${suggestion.name} already exists — suggestion marked created. No overwrite.`,
        });
        await loadSuggestions();
        return;
      }

      const productData = {
        name: suggestion.name,
        model_number:
          specs?.model_number ||
          `DT-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        category: suggestion.category as any,
        subcategory: specs?.subcategory || "",
        description: suggestion.description,
        price: suggestion.estimated_price,
        in_stock: true,
        featured: false,
        images,
        features: suggestion.features || [],
        applications: suggestion.applications || [],
        specifications: Array.isArray(specifications)
          ? specifications.reduce((acc: any, spec: any) => {
              if (spec.name && spec.value) {
                acc[spec.name] = spec.unit
                  ? `${spec.value} ${spec.unit}`
                  : String(spec.value);
              }
              return acc;
            }, {})
          : specifications || {},
        technical_specs: Array.isArray(specifications)
          ? specifications.reduce((acc: any, spec: any) => {
              if (spec.name && spec.value) {
                acc[spec.name] = {
                  value: spec.value,
                  unit: spec.unit || "",
                };
              }
              return acc;
            }, {})
          : specs || {},
        variants:
          variants.length > 0
            ? variants.map((v: any) => ({
                name: v.name,
                price: parseFloat(v.price) || suggestion.estimated_price,
                in_stock: v.in_stock !== false,
              }))
            : null,
      };

      const { error } = await supabase.from("products").insert([productData]);
      if (error) throw error;

      await updateSuggestionStatus(suggestion.id, "created");
      toast({
        title: "Product created",
        description: `${suggestion.name} added as a new product (existing catalogue untouched).`,
      });
      await loadSuggestions();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setCreatingIds((prev) => {
        const n = new Set(prev);
        n.delete(suggestion.id);
        return n;
      });
    }
  };

  const createAllApproved = async () => {
    const approved = suggestions.filter((s) => s.status === "approved");
    if (!approved.length) {
      toast({
        title: "Nothing to create",
        description: "Approve suggestions first.",
      });
      return;
    }
    if (
      !confirm(
        `Create ${approved.length} NEW products? Existing products will not be changed.`,
      )
    ) {
      return;
    }
    for (const s of approved) {
      await handleCreateProduct(s);
    }
  };

  const progressPct = Math.min(
    100,
    Math.round((createdCount / TARGET_CATALOG) * 100),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            AI Product Research
          </h2>
          <p className="text-sm text-muted-foreground">
            Kenya market demand + site search trends → form-ready products with
            images. Target ~{TARGET_CATALOG} catalogue items. Existing products
            are never overwritten.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            {showAnalytics ? "Hide" : "Show"} Analytics
          </Button>
          <Button onClick={analyzeSearchTrends} disabled={analyzing || bulkRunning}>
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Analyze Trends
              </>
            )}
          </Button>
          <Button
            variant="default"
            className="bg-primary"
            onClick={() => generateKenyaMarketBatch(3)}
            disabled={bulkRunning || analyzing}
          >
            {bulkRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {bulkProgress || "Generating…"}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Kenya market batch (~60)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress toward 1000 */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium">
                Catalogue push progress (from AI suggestions marked created)
              </p>
              <p className="text-xs text-muted-foreground">
                {createdCount} / {TARGET_CATALOG} · {pendingCount} pending ·{" "}
                {approvedCount} approved
              </p>
            </div>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={createAllApproved}
            disabled={!approvedCount}
          >
            <Database className="mr-2 h-4 w-4" />
            Create all approved
          </Button>
        </CardContent>
      </Card>

      {showAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search analytics (30 days)</CardTitle>
            <CardDescription>
              On-site queries. If empty, Kenya market demand list is used when
              you Analyze Trends.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  No site searches yet. Top Kenya market queries we target:
                </p>
                <div className="flex flex-wrap gap-2">
                  {KENYA_MARKET_DEMAND.slice(0, 12).map((q) => (
                    <Badge key={q} variant="secondary" className="text-xs">
                      <Search className="mr-1 h-3 w-3" />
                      {q}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {analytics.map((a) => (
                  <div
                    key={a.query}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="truncate pr-2">{a.query}</span>
                    <Badge variant="outline">{a.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "approved", "created"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="mb-4 text-muted-foreground">
                No suggestions yet. Run <strong>Analyze Trends</strong> or{" "}
                <strong>Kenya market batch</strong> to generate form-ready
                products with images.
              </p>
              <Button onClick={() => generateKenyaMarketBatch(2)} disabled={bulkRunning}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Kenya market products
              </Button>
            </CardContent>
          </Card>
        ) : (
          filtered.map((s) => {
            const specs = (s.technical_specs || {}) as any;
            const images: string[] =
              specs.images || s.images || pickImages(s.category, s.name);
            return (
              <Card key={s.id} className="overflow-hidden">
                <div className="relative aspect-[16/10] bg-muted">
                  {images[0] ? (
                    <img
                      src={images[0]}
                      alt={s.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className="absolute left-2 top-2 capitalize">
                    {s.status}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base leading-snug">
                    {s.name}
                  </CardTitle>
                  <CardDescription className="capitalize">
                    {(s.category || "").replace(/_/g, " ")} ·{" "}
                    {s.price_range ||
                      `KES ${Number(s.estimated_price || 0).toLocaleString()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-3 text-xs text-muted-foreground">
                    {s.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(s.features || []).slice(0, 3).map((f) => (
                      <Badge key={f} variant="secondary" className="text-[10px]">
                        {f}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {s.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(s.id)}>
                          <CheckCircle className="mr-1 h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(s.id)}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </>
                    )}
                    {(s.status === "approved" || s.status === "pending") && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={creatingIds.has(s.id)}
                        onClick={() => handleCreateProduct(s)}
                      >
                        {creatingIds.has(s.id) ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="mr-1 h-3.5 w-3.5" />
                        )}
                        Create product
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(s.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
