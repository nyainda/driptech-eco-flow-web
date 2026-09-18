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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIIrrigationKitGeneratorProps {
    onGenerate: (data: IrrigationKitData) => void;
}

interface IrrigationKitData {
    name: string;
    description: string;
    category: string;
    target_crop: string;
    maintenance_level: "low" | "medium" | "high";
    kit_type: string;
    recommended_crops: string[];
    components: {
        main_components: string[];
        included_services: string[];
    };
}

const AIIrrigationKitGenerator = ({ onGenerate }: AIIrrigationKitGeneratorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [kitPrompt, setKitPrompt] = useState("");
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!kitPrompt.trim()) {
            toast({
                title: "Error",
                description: "Please describe the irrigation kit you want to create",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
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

            const prompt = `You are an agricultural engineer and product expert for DripTech Eco Flow. Generate a detailed irrigation kit specification based on this description: "${kitPrompt}"

=== KIT GUIDELINES ===
1. Create a professional, commercially viable irrigation kit
2. Include specific technical components
3. Suggest appropriate crops and maintenance levels

=== OUTPUT FORMAT (JSON ONLY, NO MARKDOWN) ===
{
  "name": "Professional Kit Name (e.g., 'Pro-Yield Drip Kit - 1 Acre')",
  "description": "Detailed technical description (2-3 sentences) highlighting efficiency and suitability.",
  "category": "One of: 'Drip Irrigation', 'Sprinkler System', 'Greenhouse', 'Hydroponic'",
  "target_crop": "Primary crop type (e.g., 'Vegetables', 'Orchards', 'General')",
  "maintenance_level": "One of: 'low', 'medium', 'high'",
  "kit_type": "One of: 'basic_drip', 'advanced_drip', 'sprinkler_system', 'greenhouse_kit', 'hydroponic_kit', 'smart_irrigation'",
  "recommended_crops": ["Crop 1", "Crop 2", "Crop 3"],
  "components": {
    "main_components": ["Component 1", "Component 2", "Component 3", "Component 4"],
    "included_services": ["Service 1", "Service 2"]
  }
}

Generate a high-quality kit specification.`;

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

            let parsedData: IrrigationKitData;
            try {
                const cleanJson = generatedText.replace(/```json\n?|\n?```/g, "").trim();
                parsedData = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Failed to parse JSON:", generatedText);
                throw new Error("Failed to parse generated content");
            }

            onGenerate(parsedData);
            setIsOpen(false);
            setKitPrompt("");

            toast({
                title: "Success",
                description: "Irrigation kit generated successfully!",
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
                    className="gap-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-200 hover:border-blue-300 dark:border-blue-800 dark:hover:border-blue-700"
                >
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                        AI Generate Kit
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        AI Irrigation Kit Generator
                    </DialogTitle>
                    <DialogDescription>
                        Describe the irrigation needs and AI will design a kit specification.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="kit-prompt">Kit Requirements</Label>
                        <Textarea
                            id="kit-prompt"
                            value={kitPrompt}
                            onChange={(e) => setKitPrompt(e.target.value)}
                            placeholder="E.g., A low-cost drip irrigation kit for 1/4 acre vegetable garden, suitable for rural farmers with limited water supply."
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-sm text-muted-foreground">
                            Mention the size, crop type, water source, and target user.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !kitPrompt.trim()}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Kit
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AIIrrigationKitGenerator;
