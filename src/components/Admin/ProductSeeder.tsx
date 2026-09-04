import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Database, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildChinaStyleCatalog } from "@/data/chinaIrrigationCatalog";

interface SeederStats {
  total: number;
  success: number;
  failed: number;
  progress: number;
}

const ProductSeeder = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [hasSeeded, setHasSeeded] = useState(false);
  const [hasProducts, setHasProducts] = useState(false);
  const [seedStats, setSeedStats] = useState<SeederStats>({
    total: 0,
    success: 0,
    failed: 0,
    progress: 0,
  });
  const { toast } = useToast();


  useEffect(() => {
    checkExistingProducts();
  }, []);

  const checkExistingProducts = async () => {
    try {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      setHasProducts(!!count && count > 0);
    } catch (error) {
      console.error("Error checking existing products:", error);
      toast({
        title: "Error",
        description: "Failed to check existing products",
        variant: "destructive",
      });
    }
  };


  /** Import China-trade SKU matrix — only names not already in DB */
  const importChinaCatalog = async () => {
    setIsSeeding(true);
    try {
      const catalog = buildChinaStyleCatalog();
      const { data: existing } = await supabase.from("products").select("name");
      const existingNames = new Set(
        (existing || []).map((r: any) => (r.name || "").toLowerCase().trim()),
      );
      const toInsert = catalog.filter(
        (p) => !existingNames.has(p.name.toLowerCase().trim()),
      );

      if (toInsert.length === 0) {
        toast({
          title: "Nothing new",
          description: "All SKUs already exist — no duplicates added.",
        });
        setIsSeeding(false);
        return;
      }

      setSeedStats({ total: toInsert.length, success: 0, failed: 0, progress: 0 });
      let successCount = 0;
      let failedCount = 0;
      const batchSize = 25;

      for (let i = 0; i < toInsert.length; i += batchSize) {
        const slice = toInsert.slice(i, i + batchSize);
        const batch = slice.map((product) => ({
          name: product.name,
          model_number: product.model_number,
          category: product.category as any,
          subcategory: product.subcategory,
          description: product.description,
          price: product.price,
          in_stock: false, // pending review — hidden on public site until approved
          featured: false,
          images: product.images,
          features: product.features,
          applications: product.applications,
          specifications: product.specifications.reduce(
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
        setSeedStats({
          total: toInsert.length,
          success: successCount,
          failed: failedCount,
          progress: Math.round(((i + batch.length) / toInsert.length) * 100),
        });
      }

      setHasSeeded(true);
      toast({
        title: "China market import done",
        description: `Inserted ${successCount} new unique products. ${failedCount} failed. Existing products unchanged.`,
      });
    } catch (e: any) {
      toast({
        title: "Import failed",
        description: e.message || "Error",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card className="mb-6 border-0 bg-card shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
          <Database className="h-4 w-4 sm:h-5 sm:w-5" />
          Product Database Seeder
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Import unique China-trade style irrigation SKUs (sizes, spacings, fittings). Skips names already in the database — no duplicates, no overwrites.
          <span className="text-orange-600 ml-1 font-medium">
            Always available. Skips names already in the database.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {isSeeding && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span>Seeding Progress</span>
              <span>
                {seedStats.success + seedStats.failed}/{seedStats.total}
              </span>
            </div>
            <Progress
              value={seedStats.progress}
              className="w-full h-2 sm:h-3"
            />
            <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                Success: {seedStats.success}
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                Failed: {seedStats.failed}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={importChinaCatalog}
            disabled={isSeeding}
            className="h-11 w-full flex items-center justify-center gap-2 text-base font-semibold sm:w-auto sm:min-w-[280px]"
          >
            {isSeeding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing unique SKUs…
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Import China-style unique products
              </>
            )}
          </Button>
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary sm:h-5 sm:w-5" />
            <div className="text-xs sm:text-sm text-foreground">
              <p className="font-medium">Safe to run anytime</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>
                  • Only <strong className="text-foreground">new unique names</strong> are inserted — existing products are never deleted or changed<br />• New imports are <strong className="text-foreground">pending review</strong> (not shown on the website until you set In stock / Approve)
                </li>
                <li>
                  • Every imported SKU includes stock images — replace with your real photos in Product Management
                </li>
                <li>
                  • Kenya-style retail prices are pre-filled; edit any price after import
                </li>
                <li>
                  • Run again after adding more catalogue data — duplicates are skipped automatically
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSeeder;
