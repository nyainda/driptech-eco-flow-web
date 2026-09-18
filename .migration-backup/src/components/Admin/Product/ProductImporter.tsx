import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  UploadCloud,
  FileJson,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PRODUCT_CATEGORIES } from "@/types/Product";

/** Shape expected in an uploaded product file. Matches CatalogProduct
 * from src/data/irrigationCatalog.ts so the same JSON files work with
 * either the built-in reference catalog or a custom upload. */
interface ImportRow {
  name: string;
  model_number?: string;
  category: string;
  subcategory?: string;
  description?: string;
  price?: number;
  features?: string[];
  applications?: string[];
  specifications?: { name: string; value: string; unit?: string }[];
  images?: string[];
}

interface ParsedRow {
  row: ImportRow;
  index: number;
  errors: string[];
}

interface ImportStats {
  total: number;
  success: number;
  failed: number;
  progress: number;
}

const VALID_CATEGORIES = new Set(PRODUCT_CATEGORIES.map((c) => c.value));

const fallbackImage = "/seed-products/drip1.jpg";

const validateRow = (row: any, index: number): ParsedRow => {
  const errors: string[] = [];
  if (!row || typeof row !== "object") {
    return { row, index, errors: ["Not a valid object"] };
  }
  if (!row.name || typeof row.name !== "string" || !row.name.trim()) {
    errors.push("Missing name");
  }
  if (!row.category || !VALID_CATEGORIES.has(row.category)) {
    errors.push(
      `Missing/unknown category (expected one of: ${[...VALID_CATEGORIES].join(", ")})`,
    );
  }
  if (row.price !== undefined && typeof row.price !== "number") {
    errors.push("price must be a number");
  }
  return { row, index, errors };
};

/**
 * Lets an admin upload a JSON file of products (matching the
 * CatalogProduct shape) and import them in bulk. New rows are inserted
 * as pending review — out of stock and not featured — so nothing goes
 * live on the site until an admin checks and approves it, same
 * guarantee as the built-in reference catalog seeder. Duplicate names
 * (case-insensitive, against existing products) are skipped.
 */
const ProductImporter = ({ onImported }: { onImported?: () => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [markInStock, setMarkInStock] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [stats, setStats] = useState<ImportStats>({
    total: 0,
    success: 0,
    failed: 0,
    progress: 0,
  });
  const { toast } = useToast();

  const reset = () => {
    setFileName(null);
    setParsed([]);
    setParseError(null);
    setStats({ total: 0, success: 0, failed: 0, progress: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setParseError(null);
    setParsed([]);
    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".json")) {
      setParseError("Only .json files are supported right now.");
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        setParseError("File must contain a JSON array of products.");
        return;
      }
      if (data.length === 0) {
        setParseError("The file is empty — no products to import.");
        return;
      }
      setParsed(data.map((row, i) => validateRow(row, i)));
    } catch (e: any) {
      setParseError(e.message || "Could not parse this file as JSON.");
    }
  };

  const validRows = parsed.filter((p) => p.errors.length === 0);
  const invalidRows = parsed.filter((p) => p.errors.length > 0);

  const runImport = async () => {
    if (validRows.length === 0) return;
    setIsImporting(true);
    try {
      const { data: existing } = await supabase.from("products").select("name");
      const existingNames = new Set(
        (existing || []).map((r: any) => (r.name || "").toLowerCase().trim()),
      );
      const toInsert = validRows
        .map((p) => p.row)
        .filter((p) => !existingNames.has(p.name.toLowerCase().trim()));

      if (toInsert.length === 0) {
        toast({
          title: "Nothing new",
          description: "Every product in this file already exists by name.",
        });
        setIsImporting(false);
        return;
      }

      setStats({ total: toInsert.length, success: 0, failed: 0, progress: 0 });
      let successCount = 0;
      let failedCount = 0;
      const batchSize = 25;

      for (let i = 0; i < toInsert.length; i += batchSize) {
        const slice = toInsert.slice(i, i + batchSize);
        const batch = slice.map((p) => ({
          name: p.name,
          model_number: p.model_number || null,
          category: p.category as any,
          subcategory: p.subcategory || null,
          description: p.description || null,
          price: p.price ?? null,
          in_stock: markInStock,
          featured: false,
          images: p.images && p.images.length ? p.images : [fallbackImage],
          features: p.features || [],
          applications: p.applications || [],
          specifications: (p.specifications || []).reduce(
            (acc: Record<string, string>, s) => {
              acc[s.name] = s.unit ? `${s.value} ${s.unit}` : s.value;
              return acc;
            },
            {},
          ),
        }));

        const { error } = await supabase.from("products").insert(batch);
        if (error) {
          console.error(error);
          failedCount += batch.length;
        } else {
          successCount += batch.length;
        }
        setStats({
          total: toInsert.length,
          success: successCount,
          failed: failedCount,
          progress: Math.round(((i + batch.length) / toInsert.length) * 100),
        });
      }

      toast({
        title: "Import complete",
        description: `Inserted ${successCount} new product(s). ${failedCount} failed. ${
          validRows.length - toInsert.length
        } duplicate name(s) skipped.`,
      });
      onImported?.();
      reset();
    } catch (e: any) {
      toast({
        title: "Import failed",
        description: e.message || "Error",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="mb-6 border-0 bg-card shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
          <UploadCloud className="h-4 w-4 sm:h-5 sm:w-5" />
          Import products from file
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Upload a JSON file with an array of products to bulk-add them.
          Duplicate names are skipped automatically and existing products
          are never changed.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          id="product-import-file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {!fileName && (
          <Label
            htmlFor="product-import-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-center transition-all hover:border-primary hover:bg-primary/5"
          >
            <FileJson className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">
              Click to choose a .json product file
            </span>
            <span className="text-xs text-muted-foreground">
              Array of objects with at least name and category
            </span>
          </Label>
        )}

        {fileName && !isImporting && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-sm">
              <FileJson className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{fileName}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {parseError && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {parseError}
          </div>
        )}

        {parsed.length > 0 && !isImporting && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" /> {validRows.length} ready to import
              </span>
              {invalidRows.length > 0 && (
                <span className="flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="h-4 w-4" /> {invalidRows.length} will be skipped
                </span>
              )}
            </div>

            {invalidRows.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-xl border border-border bg-muted/20 p-3 text-xs">
                {invalidRows.slice(0, 20).map((r) => (
                  <div key={r.index} className="text-muted-foreground">
                    Row {r.index + 1} ({r.row?.name || "unnamed"}): {r.errors.join("; ")}
                  </div>
                ))}
                {invalidRows.length > 20 && (
                  <div className="text-muted-foreground">…and {invalidRows.length - 20} more</div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch checked={markInStock} onCheckedChange={setMarkInStock} />
              <span className="text-xs sm:text-sm">
                Mark as in stock immediately (default: pending review, hidden from the site)
              </span>
            </div>

            <Button
              onClick={runImport}
              disabled={validRows.length === 0}
              className="h-11 w-full sm:w-auto sm:min-w-[240px]"
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Import {validRows.length} product{validRows.length === 1 ? "" : "s"}
            </Button>
          </div>
        )}

        {isImporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Importing…
              </span>
              <span>
                {stats.success + stats.failed}/{stats.total}
              </span>
            </div>
            <Progress value={stats.progress} className="h-2 w-full sm:h-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductImporter;
