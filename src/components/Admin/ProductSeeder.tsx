import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    progress: 0
  });
  const { toast } = useToast();

  const irrigationProducts = [
    // Drip Irrigation Systems
    {
      name: "Pressure Compensating Dripper 2L/h",
      model_number: "PC-2LH-001",
      category: "drip_irrigation",
      subcategory: "Drippers",
      description: "Self-flushing pressure compensating dripper with anti-siphon feature. Operates efficiently between 0.5-4.0 bar pressure. Ideal for uniform water distribution in orchards and vegetable farms.",
      price: 25,
      features: ["Pressure compensating", "Self-flushing", "Anti-siphon", "Wide pressure range"],
      applications: ["Fruit trees", "Vegetable crops", "Greenhouse farming"],
      specifications: [
        { name: "Flow Rate", value: "2", unit: "L/h" },
        { name: "Operating Pressure", value: "0.5-4.0", unit: "bar" },
        { name: "Filtration Required", value: "120", unit: "mesh" }
      ]
    },
    {
      name: "16mm Dripline with Integrated Emitters",
      model_number: "DL-16-30",
      category: "drip_irrigation",
      subcategory: "Driplines",
      description: "High-quality dripline with pressure compensating emitters spaced at 30cm intervals. UV stabilized for long-term outdoor use.",
      price: 180,
      features: ["Integrated emitters", "UV stabilized", "Pressure compensating", "Anti-clogging"],
      applications: ["Row crops", "Vegetable farming", "Small orchards"],
      specifications: [
        { name: "Emitter Spacing", value: "30", unit: "cm" },
        { name: "Flow Rate", value: "2.3", unit: "L/h/m" },
        { name: "Wall Thickness", value: "0.9", unit: "mm" }
      ]
    },
    // ... (Other products remain unchanged)
  ];

  const generateMoreProducts = () => {
    const categories = ["drip_irrigation", "sprinkler_systems", "filtration_systems", "control_systems", "accessories"];
    const products = [];
    
    categories.forEach(category => {
      for (let i = 1; i <= 40; i++) {
        products.push({
          name: `${category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Product ${i}`,
          model_number: `${category.toUpperCase().slice(0, 3)}-${String(i).padStart(3, '0')}`,
          category,
          subcategory: `Sub-${category}`,
          description: `Professional ${category.replace('_', ' ')} solution for commercial and residential irrigation needs. High-quality construction with durable materials.`,
          price: Math.floor(Math.random() * 500) + 50,
          features: ["High quality", "Durable", "Easy installation", "Professional grade"],
          applications: ["Commercial irrigation", "Residential systems", "Agricultural use"],
          specifications: [
            { name: "Material", value: "Premium", unit: "grade" },
            { name: "Warranty", value: "2", unit: "years" }
          ]
        });
      }
    });
    
    return [...irrigationProducts, ...products];
  };

  useEffect(() => {
    checkExistingProducts();
  }, []);

  const checkExistingProducts = async () => {
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setHasProducts(!!count && count > 0);
    } catch (error) {
      console.error('Error checking existing products:', error);
      toast({
        title: "Error",
        description: "Failed to check existing products",
        variant: "destructive"
      });
    }
  };

  const seedProducts = async () => {
    if (hasProducts || hasSeeded) {
      toast({
        title: "Seeding Disabled",
        description: "Products have already been seeded or exist in the database. Please edit existing products instead.",
        variant: "destructive"
      });
      return;
    }

    setIsSeeding(true);
    const products = generateMoreProducts();
    
    setSeedStats({
      total: products.length,
      success: 0,
      failed: 0,
      progress: 0
    });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        const productData = {
          name: product.name,
          model_number: product.model_number,
          category: product.category as "drip_irrigation" | "sprinkler_systems" | "filtration_systems" | "control_systems" | "accessories",
          subcategory: product.subcategory,
          description: product.description,
          price: product.price,
          in_stock: true,
          featured: Math.random() > 0.8,
          images: [],
          features: product.features,
          applications: product.applications,
          technical_specs: product.specifications.reduce((acc, spec) => {
            acc[spec.name] = {
              value: spec.value,
              unit: spec.unit || ""
            };
            return acc;
          }, {} as any)
        };

        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) {
          console.error(`Failed to insert product ${product.name}:`, error);
          failedCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing product ${product.name}:`, error);
        failedCount++;
      }

      const progress = ((i + 1) / products.length) * 100;
      setSeedStats({
        total: products.length,
        success: successCount,
        failed: failedCount,
        progress
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsSeeding(false);
    setHasSeeded(true);
    setHasProducts(true);
    
    toast({
      title: "Seeding Complete",
      description: `Successfully added ${successCount} products. ${failedCount} failed.`,
      variant: successCount > 0 ? "default" : "destructive"
    });
  };

  return (
    <Card className="mb-6 border-0 bg-card shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
          <Database className="h-4 w-4 sm:h-5 sm:w-5" />
          Product Database Seeder
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Generate sample irrigation products for initial setup. 
          <span className="text-orange-600 ml-1 font-medium">
            Note: Seeding can only be done once. Edit products individually in Product Management.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {isSeeding && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span>Seeding Progress</span>
              <span>{seedStats.success + seedStats.failed}/{seedStats.total}</span>
            </div>
            <Progress value={seedStats.progress} className="w-full h-2 sm:h-3" />
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
            onClick={seedProducts} 
            disabled={isSeeding || hasSeeded || hasProducts}
            className="h-9 sm:h-10 flex items-center gap-2 w-full sm:w-auto"
          >
            {isSeeding ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                Seeding Products...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 sm:h-5 sm:w-5" />
                Seed 200 Products
              </>
            )}
          </Button>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 sm:p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Important Notes:</p>
              <ul className="mt-1 text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Seeding can only be done once to prevent duplicates</li>
                <li>• Seeded products will have no images - add images via Product Management</li>
                <li>• All seeded products can be edited individually in Product Management</li>
                <li>• Deletion is disabled here; manage products individually in Product Management</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSeeder;