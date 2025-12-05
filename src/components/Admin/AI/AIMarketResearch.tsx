import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Search, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIMarketResearchProps {
    onGenerate: (products: any[]) => void;
}

const AIMarketResearch = ({ onGenerate }: AIMarketResearchProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState("");
    const [productCount, setProductCount] = useState(20);
    const { toast } = useToast();

    const handleResearch = async () => {
        if (!category.trim()) {
            toast({
                title: "Error",
                description: "Please enter a category to research",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            // 1. Fetch Gemini API Key from settings
            const { data: settingsData, error: settingsError } = await supabase
                .from("system_settings")
                .select("setting_value")
                .eq("setting_key", "gemini_api_key")
                .maybeSingle();

            if (settingsError) throw settingsError;

            const apiKey = settingsData?.setting_value;

            if (!apiKey) {
                toast({
                    title: "API Key Missing",
                    description: "Please configure your Gemini API Key in System Settings → API Keys",
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }

            // 2. Fetch existing products to avoid duplicates
            const { data: existingProducts } = await supabase
                .from('ai_product_suggestions')
                .select('name')
                .limit(100);

            const existingNames = existingProducts?.map(p => p.name) || [];
            const timestamp = Date.now();

            // 3. Construct comprehensive market research prompt with variety
            const prompt = `You are an irrigation equipment market research expert. Research and generate ${productCount} UNIQUE, DIVERSE irrigation products in: "${category}".

CRITICAL REQUIREMENTS FOR VARIETY:
1. Generate COMPLETELY DIFFERENT products each time - vary brands, sizes, models, specifications
2. Use different brand combinations: Netafim, Jain, Rain Bird, Toro, Hunter, NaanDanJain, Rivulis, Irritec, Azud, Eurodrip
3. Vary sizes: 12mm, 16mm, 20mm, 25mm, 32mm, 40mm, 50mm, 63mm, 75mm, 90mm, 110mm
4. Vary flow rates: 0.6, 1.0, 1.2, 1.6, 2.0, 2.3, 3.0, 4.0, 8.0 L/hr
5. Vary emitter spacing: 10cm, 15cm, 20cm, 30cm, 40cm, 50cm, 75cm, 100cm
6. Include budget, mid-range, and premium products
7. Mix PC (pressure compensating) and non-PC variants
8. Include different materials: LDPE, LLDPE, HDPE, PVC, PP, ABS, Brass, Stainless Steel
9. Add unique model numbers with timestamp: ${timestamp}

AVOID THESE EXISTING PRODUCTS:
${existingNames.slice(0, 50).join(', ')}

DIVERSITY STRATEGY:
- 30% Budget products (KSH 500-3,000)
- 40% Mid-range products (KSH 3,000-15,000)
- 30% Premium products (KSH 15,000-100,000)
- Mix inline, online, and button drippers
- Include surface and subsurface options
- Add different wall thicknesses: 0.15mm, 0.20mm, 0.25mm, 0.30mm, 0.40mm
- Vary pressure ratings: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0 bar

PRODUCT CATEGORIES TO COVER:
- Drip Irrigation: Drip tape, laterals, inline drippers, button drippers, PC emitters, micro tubing
- Sprinkler Systems: Pop-up sprays, rotary sprinklers, impact sprinklers, micro sprinklers
- Filtration: Screen filters, disc filters, sand filters, sand separators
- Valves: Solenoid valves, ball valves, gate valves, check valves, air release valves
- Pipes & Fittings: PVC pipes, HDPE pipes, PE pipes, compression fittings, threaded fittings
- Controllers: Irrigation timers, smart controllers, fertigation controllers
- Pumps: Centrifugal pumps, submersible pumps, booster pumps
- Agricultural Materials: Mulch film, shade nets, greenhouse plastic, grow bags
- Accessories: Pressure regulators, flow meters, hole punches, stakes, goof plugs

OUTPUT FORMAT (JSON array, NO markdown):
[
  {
    "name": "UNIQUE product name with brand, size, and variant (e.g., 'Jain Irrigation Turbo Excel 20mm PC Drip Lateral')",
    "model_number": "Unique model with timestamp (e.g., 'TE-20-40-2.0-${timestamp}')",
    "subcategory": "Specific subcategory",
    "description": "2-3 paragraphs with technical details, benefits, applications, compatibility. Mention specific features that differentiate this product.",
    "features": [
      "5-7 UNIQUE features specific to this product",
      "UV resistance level (e.g., 500/1000/2000 hours)",
      "Specific certifications: ISO 9001, ISO 14001, NSF, ASTM",
      "Exact water savings: 30-70%",
      "Installation method and ease",
      "Warranty period: 1-5 years"
    ],
    "applications": [
      "Specific crops with acreage: Tomatoes (0.5-10 acres), Peppers (greenhouse), etc",
      "Soil types: Sandy, Loamy, Clay",
      "Climate: Arid, Semi-arid, Tropical",
      "Water source: Borehole, River, Municipal"
    ],
    "specifications": [
      {"name": "Material", "value": "Specific material grade", "unit": ""},
      {"name": "Diameter", "value": "Exact size", "unit": "mm"},
      {"name": "Wall Thickness", "value": "Exact thickness", "unit": "mm"},
      {"name": "Emitter Spacing", "value": "Exact spacing", "unit": "cm"},
      {"name": "Flow Rate", "value": "Exact flow", "unit": "L/hr"},
      {"name": "Working Pressure", "value": "Range", "unit": "bar"},
      {"name": "Max Pressure", "value": "Exact", "unit": "bar"},
      {"name": "Temperature Range", "value": "Range", "unit": "°C"}
    ],
    "variants": [
      {"name": "Specific length/size", "price": "Realistic KSH price", "in_stock": true/false},
      {"name": "Different length/size", "price": "Different price", "in_stock": true/false}
    ]
  }
]

Generate ${productCount} COMPLETELY UNIQUE products. NO DUPLICATES. Focus on VARIETY in brands, sizes, specifications, and price points.`;

            // 3. Call Gemini API
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: prompt,
                                    },
                                ],
                            },
                        ],
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Failed to generate content");
            }

            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedText) {
                throw new Error("No content generated");
            }

            // 4. Parse JSON Response
            let parsedData: any[];
            try {
                // Clean up markdown code blocks if present
                const cleanJson = generatedText.replace(/```json\n?|\n?```/g, "").trim();
                parsedData = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Failed to parse JSON:", generatedText);
                throw new Error("Failed to parse generated content");
            }

            // 5. Save to ai_product_suggestions for review
            for (const product of parsedData) {
                await supabase.from('ai_product_suggestions').insert({
                    name: product.name,
                    category: product.subcategory?.includes('drip') ? 'drip_irrigation' :
                        product.subcategory?.includes('sprinkler') ? 'sprinkler_systems' :
                            product.subcategory?.includes('filter') ? 'filtration_systems' :
                                product.subcategory?.includes('control') ? 'control_systems' : 'accessories',
                    description: product.description,
                    price_range: product.variants?.length > 0
                        ? `KSH ${Math.min(...product.variants.map((v: any) => parseFloat(v.price)))} - ${Math.max(...product.variants.map((v: any) => parseFloat(v.price)))}`
                        : 'Contact for pricing',
                    estimated_price: product.variants?.[0]?.price ? parseFloat(product.variants[0].price) : null,
                    target_crops: [], // Will be extracted from applications
                    technical_specs: {
                        model_number: product.model_number,
                        subcategory: product.subcategory,
                        specifications: product.specifications,
                        variants: product.variants
                    },
                    features: product.features || [],
                    applications: product.applications || [],
                    search_volume: 0,
                    status: 'pending',
                    created_by: 'market_research'
                });
            }

            // 6. Pass data to parent component (for backward compatibility)
            onGenerate(parsedData);
            setIsOpen(false);

            toast({
                title: "Success",
                description: `Generated ${parsedData.length} product suggestions! View them in AI Product Research tab.`,
            });
        } catch (error: any) {
            console.error("Generation error:", error);
            toast({
                title: "Research Failed",
                description: error.message || "An error occurred while researching products.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="gap-2 bg-gradient-to-r from-blue-500/10 to-green-500/10 border-blue-200 hover:border-blue-300 dark:border-blue-800 dark:hover:border-blue-700"
                >
                    <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent font-medium">
                        AI Market Research
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        AI Market Research
                    </DialogTitle>
                    <DialogDescription>
                        Research popular irrigation products from the market and generate product suggestions
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="category">Product Category</Label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">Select a category...</option>

                            {/* Drip Irrigation */}
                            <optgroup label="🌊 Drip Irrigation Systems">
                                <option value="drip tape and laterals">Drip Tape & Laterals (all sizes)</option>
                                <option value="inline drippers and emitters">Inline Drippers & Emitters</option>
                                <option value="button drippers and online emitters">Button Drippers & Online Emitters</option>
                                <option value="pressure compensating emitters">Pressure Compensating Emitters</option>
                                <option value="micro tubing and spaghetti tubes">Micro Tubing & Spaghetti Tubes</option>
                                <option value="dripper stakes and assemblies">Dripper Stakes & Assemblies</option>
                            </optgroup>

                            {/* Sprinkler Systems */}
                            <optgroup label="💧 Sprinkler Systems">
                                <option value="pop-up spray heads">Pop-up Spray Heads</option>
                                <option value="rotary sprinklers and gear drives">Rotary Sprinklers & Gear Drives</option>
                                <option value="impact sprinklers">Impact Sprinklers (Brass & Plastic)</option>
                                <option value="micro sprinklers">Micro Sprinklers (360°, 180°, 90°)</option>
                                <option value="foggers and misters">Foggers & Misters</option>
                                <option value="agricultural sprinklers">Agricultural Sprinklers (Big Guns)</option>
                            </optgroup>

                            {/* Filtration */}
                            <optgroup label="🔍 Filtration Systems">
                                <option value="screen filters">Screen Filters (all mesh sizes)</option>
                                <option value="disc filters">Disc Filters (all micron ratings)</option>
                                <option value="sand media filters">Sand Media Filters</option>
                                <option value="sand separators">Sand Separators (Hydrocyclone)</option>
                                <option value="y-filters">Y-Filters</option>
                                <option value="self-cleaning filters">Self-Cleaning Filters</option>
                            </optgroup>

                            {/* Valves */}
                            <optgroup label="🔧 Valves & Flow Control">
                                <option value="solenoid valves">Solenoid Valves (24V AC/DC)</option>
                                <option value="ball valves">Ball Valves (PVC & Brass)</option>
                                <option value="gate valves">Gate Valves</option>
                                <option value="check valves">Check Valves (Non-return)</option>
                                <option value="air release valves">Air Release Valves</option>
                                <option value="pressure relief valves">Pressure Relief Valves</option>
                                <option value="flush valves">Flush Valves</option>
                            </optgroup>

                            {/* Pressure Regulation */}
                            <optgroup label="📊 Pressure Regulation">
                                <option value="inline pressure regulators">Inline Pressure Regulators</option>
                                <option value="pressure reducing valves">Pressure Reducing Valves</option>
                                <option value="pressure sustaining valves">Pressure Sustaining Valves</option>
                            </optgroup>

                            {/* Pipes & Fittings */}
                            <optgroup label="🔩 Pipes & Fittings">
                                <option value="pvc pipes and fittings">PVC Pipes & Fittings (all sizes)</option>
                                <option value="hdpe pipes and fittings">HDPE Pipes & Fittings</option>
                                <option value="pe pipes and laterals">PE Pipes & Laterals</option>
                                <option value="compression fittings">Compression Fittings</option>
                                <option value="threaded fittings">Threaded Fittings (BSP/NPT)</option>
                                <option value="quick connectors">Quick Connectors & Snap-fit</option>
                                <option value="barbed fittings">Barbed Fittings</option>
                            </optgroup>

                            {/* Pumps */}
                            <optgroup label="⚡ Pumps & Motors">
                                <option value="centrifugal pumps">Centrifugal Pumps</option>
                                <option value="submersible pumps">Submersible Pumps (Borehole)</option>
                                <option value="booster pumps">Booster Pumps</option>
                                <option value="dosing pumps">Dosing Pumps (Fertigation)</option>
                                <option value="solar pumps">Solar Pumps</option>
                            </optgroup>

                            {/* Controllers & Automation */}
                            <optgroup label="🤖 Controllers & Automation">
                                <option value="irrigation controllers and timers">Irrigation Controllers & Timers</option>
                                <option value="smart controllers">Smart Controllers (WiFi/Weather-based)</option>
                                <option value="fertigation controllers">Fertigation Controllers (EC/pH)</option>
                                <option value="moisture sensors">Moisture Sensors</option>
                                <option value="rain sensors">Rain Sensors</option>
                                <option value="flow meters">Flow Meters</option>
                            </optgroup>

                            {/* Fertigation */}
                            <optgroup label="🌱 Fertigation Equipment">
                                <option value="venturi injectors">Venturi Injectors</option>
                                <option value="fertilizer tanks">Fertilizer Tanks & Mixing Tanks</option>
                                <option value="ec ph meters">EC/pH Meters & Monitors</option>
                            </optgroup>

                            {/* Greenhouse */}
                            <optgroup label="🏠 Greenhouse Irrigation">
                                <option value="overhead greenhouse sprinklers">Overhead Sprinklers & Misting</option>
                                <option value="boom irrigation systems">Boom Irrigation Systems</option>
                                <option value="ebb and flow systems">Ebb & Flow Systems</option>
                                <option value="hanging basket systems">Hanging Basket Systems</option>
                            </optgroup>

                            {/* Agricultural Materials */}
                            <optgroup label="🌾 Agricultural Materials">
                                <option value="mulch film">Mulch Film (Black, Silver, Biodegradable)</option>
                                <option value="shade nets">Shade Nets (all percentages)</option>
                                <option value="greenhouse plastic">Greenhouse Plastic & UV Film</option>
                                <option value="insect nets">Insect Nets & Bird Nets</option>
                                <option value="ground cover">Ground Cover & Weed Barrier</option>
                                <option value="grow bags">Grow Bags & Planting Bags</option>
                            </optgroup>

                            {/* Accessories */}
                            <optgroup label="🔨 Accessories & Tools">
                                <option value="goof plugs and end caps">Goof Plugs & End Caps</option>
                                <option value="lateral stakes and pegs">Lateral Stakes & Pegs</option>
                                <option value="pipe clamps and saddles">Pipe Clamps & Saddles</option>
                                <option value="hole punches">Hole Punches & Installation Tools</option>
                                <option value="backflow preventers">Backflow Preventers</option>
                                <option value="water meters">Water Meters</option>
                                <option value="pressure gauges">Pressure Gauges</option>
                                <option value="hose connectors">Hose Connectors & Adapters</option>
                                <option value="teflon tape and sealants">Teflon Tape & Thread Sealants</option>
                            </optgroup>

                            {/* Complete Systems */}
                            <optgroup label="📦 Complete Systems">
                                <option value="complete drip irrigation kits">Complete Drip Irrigation Kits</option>
                                <option value="complete sprinkler systems">Complete Sprinkler Systems</option>
                                <option value="greenhouse irrigation packages">Greenhouse Irrigation Packages</option>
                                <option value="home garden kits">Home Garden Irrigation Kits</option>
                            </optgroup>

                            {/* Comprehensive */}
                            <optgroup label="🌍 Comprehensive Research">
                                <option value="all irrigation products comprehensive">ALL Irrigation Products (Comprehensive)</option>
                                <option value="all drip irrigation products">ALL Drip Irrigation Products</option>
                                <option value="all sprinkler products">ALL Sprinkler Products</option>
                                <option value="all filtration products">ALL Filtration Products</option>
                                <option value="all agricultural materials">ALL Agricultural Materials</option>
                            </optgroup>
                        </select>
                        <p className="text-sm text-muted-foreground">
                            Select a specific category or choose comprehensive research
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="count">Number of Products</Label>
                        <Input
                            id="count"
                            type="number"
                            min="10"
                            max="100"
                            value={productCount}
                            onChange={(e) => setProductCount(Number(e.target.value))}
                        />
                        <p className="text-sm text-muted-foreground">
                            How many products to generate (10-100)
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleResearch}
                        disabled={loading || !category.trim()}
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Researching Market...
                            </>
                        ) : (
                            <>
                                <Search className="mr-2 h-4 w-4" />
                                Research & Generate Products
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AIMarketResearch;
