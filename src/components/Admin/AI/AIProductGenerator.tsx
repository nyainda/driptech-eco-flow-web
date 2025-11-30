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
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIProductGeneratorProps {
    onGenerate: (data: ProductData) => void;
}

interface ProductData {
    name: string;
    model_number: string;
    subcategory: string;
    description: string;
    features: string[];
    applications: string[];
    specifications: Array<{ name: string; value: string; unit: string }>;
    variants: Array<{ name: string; price: string; in_stock: boolean }>;
}

const AIProductGenerator = ({ onGenerate }: AIProductGeneratorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [productPrompt, setProductPrompt] = useState("");
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!productPrompt.trim()) {
            toast({
                title: "Error",
                description: "Please describe the product you want to create",
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

            // 2. Construct prompt for product generation with COMPREHENSIVE market knowledge
            const prompt = `You are an expert irrigation equipment specialist with deep knowledge of the COMPLETE global irrigation market. Generate realistic, market-accurate product information based on: "${productPrompt}"

=== COMPREHENSIVE PRODUCT CATEGORIES ===

1. DRIP IRRIGATION SYSTEMS:
   - Drip Tape (inline emitters): 12mm, 16mm, 20mm, 25mm | Wall: 0.15-0.30mm | Spacing: 10-50cm | Flow: 0.6-4.0 L/hr
   - Drip Laterals/Dripline: Pressure compensating (PC) & Non-PC | Surface & Subsurface
   - Inline Drippers: Built-in emitters, various flow rates
   - Online Drippers/Button Drippers: Attachable emitters, 1-8 L/hr
   - Pressure Compensating Emitters: CNL, PCNL technology
   - Adjustable Drippers: 0-70 L/hr variable flow
   - Micro-tubing (Spaghetti tubing): 4mm, 6mm for individual plants
   - Dripper Stakes & Assemblies

2. SPRINKLER SYSTEMS:
   - Pop-up Spray Heads: 2"-12" height, 4'-15' radius
   - Rotary Sprinklers/Gear Drives: 15'-50' radius
   - Impact Sprinklers: Brass/plastic, full/part circle, 20'-100' radius
   - Micro Sprinklers: 360°, 180°, 90° patterns, 1-4m radius
   - Foggers & Misters: For greenhouses, propagation
   - Agricultural Sprinklers: Big guns, traveling systems
   - Rotary Nozzles: Water-efficient, 8'-24' radius

3. FILTRATION SYSTEMS:
   - Screen Filters: 80-200 mesh, 1/2"-4" sizes
   - Disc Filters: 80-200 micron, 1"-4" sizes, 5-200 m³/hr
   - Sand Media Filters: For organic matter, 10-300 m³/hr
   - Sand Separators: Hydrocyclone type, 1"-4"
   - Y-Filters: Inline mesh filters
   - Self-cleaning Filters: Automatic backwash

4. VALVES & FLOW CONTROL:
   - Solenoid Valves: 24V AC/DC, 1/2"-3", normally closed/open
   - Ball Valves: PVC, brass, true union, 1/2"-4"
   - Gate Valves: Manual control, 1"-6"
   - Check Valves: Prevent backflow, 1/2"-4"
   - Air Release Valves: Automatic air venting
   - Pressure Relief Valves: Safety protection
   - Flush Valves: End-of-line cleaning
   - Zone Control Valves: Hydraulic/electric

5. PRESSURE REGULATION:
   - Inline Pressure Regulators: 0.5-4 bar output, 1/2"-2"
   - Pressure Reducing Valves: Adjustable, 1"-4"
   - Pressure Compensating Regulators: Fixed output
   - Pressure Sustaining Valves: Maintain minimum pressure

6. PIPES & FITTINGS:
   - Main Line Pipes: PVC, HDPE | 25mm-315mm | PN 4-16 bar
   - Sub-main Pipes: 32mm-110mm
   - Lateral Pipes: PE, LDPE | 16mm-63mm
   - Fittings: Elbows, Tees, Couplers, Reducers, End caps
   - Compression Fittings: For PE pipes
   - Threaded Fittings: BSP, NPT standards
   - Quick Connectors: Snap-fit, push-fit
   - Barbed Fittings: For flexible tubing

7. PUMPS & MOTORS:
   - Centrifugal Pumps: 0.5-100 HP, various heads
   - Submersible Pumps: Borehole, 0.5-50 HP
   - Booster Pumps: Pressure increase
   - Dosing Pumps: For fertigation
   - Solar Pumps: DC powered, eco-friendly

8. CONTROLLERS & AUTOMATION:
   - Irrigation Controllers/Timers: 2-24 stations, battery/AC
   - Smart Controllers: WiFi, weather-based
   - Fertigation Controllers: EC/pH monitoring
   - Moisture Sensors: Soil moisture monitoring
   - Rain Sensors: Automatic shut-off
   - Flow Meters: Water usage tracking

9. FERTIGATION EQUIPMENT:
   - Venturi Injectors: 1/2"-2", various injection ratios
   - Dosing Pumps: Electric, hydraulic
   - Fertilizer Tanks: 20L-1000L capacity
   - Mixing Tanks: With agitators
   - EC/pH Meters: Monitoring equipment

10. GREENHOUSE IRRIGATION:
    - Overhead Sprinklers: Misting systems
    - Boom Irrigation: Traveling systems
    - Ebb & Flow Systems: Bench irrigation
    - Drip Stakes: For potted plants
    - Hanging Basket Systems

11. ACCESSORIES:
    - Goof Plugs: Seal unused holes
    - Lateral Stakes/Pegs: Secure tubing
    - Pipe Clamps & Saddles
    - Teflon Tape & Thread Sealant
    - Hole Punches: For emitter installation
    - Backflow Preventers
    - Water Meters
    - Pressure Gauges
    - Hose Connectors

=== REALISTIC PRICING GUIDELINES (KSH) ===
Drip Tape: 8-15/m | 100m: 800-1,500 | 200m: 1,600-3,000
Inline Drippers: 5-20 each | PC Drippers: 8-25 each
Drip Laterals: 15-35/m | 100m: 1,500-3,500
Micro Sprinklers: 15-80 each | Impact Sprinklers: 200-2,500
Pop-up Sprays: 150-800 | Rotors: 400-3,000
Screen Filters: 800-8,000 | Disc Filters: 2,000-25,000
Sand Filters: 15,000-150,000 | Sand Separators: 3,000-15,000
Solenoid Valves: 1,500-8,000 | Ball Valves: 50-3,000
Pressure Regulators: 300-2,500 | Air Valves: 400-2,000
PVC Pipes (per 6m): 25mm: 400-800 | 63mm: 1,500-3,000 | 110mm: 3,500-7,000
PE Pipes (per 100m): 16mm: 1,200-2,500 | 32mm: 3,500-6,000
Fittings: 10-800 each | Controllers: 3,000-80,000
Pumps: 8,000-250,000 | Venturi: 800-5,000

=== TECHNICAL SPECIFICATIONS STANDARDS ===
Materials: LDPE, LLDPE, HDPE, PVC, PP, ABS, Brass, Stainless Steel
Pressure Classes: PN 2.5, 4, 6, 8, 10, 16 bar
Pipe Standards: ISO 9001, ISO 14001, ASTM, DIN
Flow Rates: 0.6, 1.0, 1.6, 2.0, 2.3, 4.0, 8.0 L/hr (drip)
Emitter Spacing: 10, 15, 20, 30, 40, 50, 75, 100 cm
Filter Ratings: 80, 100, 120, 130, 155, 200 mesh/micron
Voltage: 24V AC/DC, 110V, 220V, Solar DC

=== LEADING MANUFACTURERS ===
Netafim, Jain Irrigation, Rain Bird, Toro, Hunter, NaanDanJain, Rivulis, Irritec, Azud, Eurodrip, T-Tape, Chapin, DIG, Raindrip

=== OUTPUT FORMAT (JSON ONLY, NO MARKDOWN) ===
{
  "name": "Professional product name matching market standards",
  "model_number": "Realistic model (e.g., DT-1630-16, PCD-2.0-CNL, DF-2-120M, SV-075-24AC)",
  "subcategory": "Choose from: Drip Tape, Drip Laterals, Inline Drippers, Button Drippers, PC Emitters, Micro Sprinklers, Impact Sprinklers, Pop-up Sprays, Rotary Sprinklers, Disc Filters, Screen Filters, Sand Filters, Solenoid Valves, Ball Valves, Pressure Regulators, PVC Pipes, PE Pipes, HDPE Pipes, Fittings, Controllers, Pumps, Venturi Injectors, Fertigation Systems",
  "description": "2-3 paragraphs with technical benefits, applications, compatibility. Mention water efficiency, durability, certifications.",
  "features": [
    "5-7 realistic features: UV resistance, pressure compensation, anti-clogging, self-flushing",
    "Certifications: ISO 9001, NSF, food-grade materials",
    "Installation ease, maintenance-free operation",
    "Water/energy savings percentages",
    "Compatibility with standard systems"
  ],
  "applications": [
    "Specific crops: Tomatoes, Peppers, Cucumbers, Maize, Sugarcane, Bananas, Citrus, Avocados, Coffee, Tea",
    "Settings: Greenhouse, Open field, Orchards, Vineyards, Nurseries, Landscaping",
    "Scale: Small-scale (0.25-2 acres), Medium (2-10 acres), Commercial (10+ acres)"
  ],
  "specifications": [
    {"name": "Material", "value": "LDPE/LLDPE/PVC/HDPE/Brass", "unit": ""},
    {"name": "Size/Diameter", "value": "12/16/20/25/32/63/110mm", "unit": "mm"},
    {"name": "Wall Thickness", "value": "0.15/0.20/0.30/0.40", "unit": "mm"},
    {"name": "Emitter Spacing", "value": "10/20/30/40/50", "unit": "cm"},
    {"name": "Flow Rate", "value": "0.6/1.0/1.6/2.0/2.3/4.0", "unit": "L/hr"},
    {"name": "Working Pressure", "value": "0.5-4.0", "unit": "bar"},
    {"name": "Max Pressure", "value": "4/6/8/10", "unit": "bar"},
    {"name": "Filter Rating", "value": "80/100/120/155/200", "unit": "mesh/micron"}
  ],
  "variants": [
    {"name": "100m Roll/Small/1/2 inch", "price": "1200", "in_stock": true},
    {"name": "200m Roll/Medium/3/4 inch", "price": "2300", "in_stock": true},
    {"name": "500m Roll/Large/1 inch", "price": "5500", "in_stock": false}
  ]
}

Generate content matching REAL irrigation equipment from Netafim, Jain, Rain Bird, Toro standards.`;

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
            let parsedData: ProductData;
            try {
                // Clean up markdown code blocks if present
                const cleanJson = generatedText.replace(/```json\n?|\n?```/g, "").trim();
                parsedData = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Failed to parse JSON:", generatedText);
                throw new Error("Failed to parse generated content");
            }

            // 5. Pass data to parent component
            onGenerate(parsedData);
            setIsOpen(false);
            setProductPrompt("");

            toast({
                title: "Success",
                description: "Product content generated successfully!",
            });
        } catch (error: any) {
            console.error("Generation error:", error);
            toast({
                title: "Generation Failed",
                description: error.message || "An error occurred while generating content.",
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
                    className="gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200 hover:border-purple-300 dark:border-purple-800 dark:hover:border-purple-700"
                >
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-medium">
                        Generate with AI
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-purple-600" />
                        AI Product Generator
                    </DialogTitle>
                    <DialogDescription>
                        Describe the product you want to create and AI will generate all the details for you.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="product-prompt">Product Description</Label>
                        <Textarea
                            id="product-prompt"
                            value={productPrompt}
                            onChange={(e) => setProductPrompt(e.target.value)}
                            placeholder="E.g., 16mm drip irrigation tape for tomato farming with 30cm emitter spacing"
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-sm text-muted-foreground">
                            Be specific about the product type, size, material, and intended use.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !productPrompt.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Product
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AIProductGenerator;
