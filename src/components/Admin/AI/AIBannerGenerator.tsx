import { useState, useEffect } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Wand2, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIBannerGeneratorProps {
    onGenerate: (data: any) => void;
}

const AIBannerGenerator = ({ onGenerate }: AIBannerGeneratorProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [topic, setTopic] = useState("");
    const [discountType, setDiscountType] = useState("percentage"); // percentage, fixed, bogo
    const [season, setSeason] = useState("general");
    const [apiKey, setApiKey] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        fetchApiKey();
    }, []);

    const fetchApiKey = async () => {
        try {
            const { data, error } = await supabase
                .from("system_settings")
                .select("setting_value")
                .eq("setting_key", "gemini_api_key")
                .single();

            if (error) throw error;
            if (data) setApiKey(data.setting_value);
        } catch (error) {
            console.error("Error fetching API key:", error);
        }
    };

    const generateContent = async () => {
        if (!apiKey) {
            toast({
                title: "API Key Missing",
                description: "Please configure the Gemini API key in system settings.",
                variant: "destructive",
            });
            return;
        }

        if (!topic) {
            toast({
                title: "Topic Required",
                description: "Please enter a topic or focus for the banner.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const prompt = `
        You are a marketing expert for DripTech Eco Flow, an irrigation solutions company.
        Generate a catchy and effective discount banner content based on the following details:
        
        Topic/Focus: ${topic}
        Discount Type: ${discountType}
        Season/Context: ${season}
        
        Please generate a JSON object with the following fields:
        1. discount: The discount offer (e.g., "20% OFF", "$50 OFF", "Buy 1 Get 1 Free"). Make it attractive.
        2. title: A short, punchy headline (max 40 characters).
        3. description: A compelling description (max 100 characters) that encourages action.
        4. valid_until: A date string (YYYY-MM-DD) representing a reasonable expiration date (e.g., 2 weeks or 1 month from now).
        
        Ensure the tone is professional yet urgent and exciting.
        Return ONLY the JSON object, no markdown formatting.
      `;

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
                                parts: [{ text: prompt }],
                            },
                        ],
                    }),
                },
            );

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            const generatedText = data.candidates[0].content.parts[0].text;

            // Clean up the response if it contains markdown code blocks
            const cleanJson = generatedText.replace(/```json|```/g, "").trim();
            const parsedData = JSON.parse(cleanJson);

            onGenerate(parsedData);
            setOpen(false);
            toast({
                title: "Content Generated",
                description: "Banner content has been generated successfully.",
            });
        } catch (error: any) {
            console.error("Generation error:", error);
            toast({
                title: "Generation Failed",
                description: error.message || "Failed to generate content",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200 hover:border-purple-300 hover:from-purple-500/20 hover:to-blue-500/20 text-purple-700 dark:text-purple-300"
                >
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Generate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-purple-500" />
                        Generate Banner Content
                    </DialogTitle>
                    <DialogDescription>
                        Use AI to create compelling discount banners for your campaigns.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="topic">Campaign Focus</Label>
                        <Input
                            id="topic"
                            placeholder="e.g., Summer Sale, New Arrival, Holiday Special"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Discount Type</Label>
                        <Select value={discountType} onValueChange={setDiscountType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percentage">Percentage Off</SelectItem>
                                <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                                <SelectItem value="bogo">Buy One Get One</SelectItem>
                                <SelectItem value="shipping">Free Shipping</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="season">Season / Context</Label>
                        <Select value={season} onValueChange={setSeason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select season" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General / All Year</SelectItem>
                                <SelectItem value="spring">Spring Planting</SelectItem>
                                <SelectItem value="summer">Summer Irrigation</SelectItem>
                                <SelectItem value="autumn">Harvest Season</SelectItem>
                                <SelectItem value="winter">Winter Maintenance</SelectItem>
                                <SelectItem value="holiday">Holiday / Festive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={generateContent}
                        disabled={loading || !topic}
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
                                Generate Banner
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AIBannerGenerator;
