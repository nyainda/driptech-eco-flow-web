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
import { Sparkles, Loader2, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AISuccessStoryGeneratorProps {
    onGenerate: (data: SuccessStoryData) => void;
}

interface SuccessStoryData {
    title: string;
    description: string;
    client_name: string;
    client_company: string;
    results: string;
}

const AISuccessStoryGenerator = ({ onGenerate }: AISuccessStoryGeneratorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [storyPrompt, setStoryPrompt] = useState("");
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!storyPrompt.trim()) {
            toast({
                title: "Error",
                description: "Please describe the success story you want to create",
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

            const prompt = `You are a marketing specialist for an irrigation company. Generate a compelling success story based on this description: "${storyPrompt}"

=== SUCCESS STORY GUIDELINES ===
1. Focus on the transformation: Challenge -> Solution -> Result
2. Use persuasive and professional language
3. Highlight specific metrics (yield increase, water saved, cost reduction)
4. Create a realistic client profile

=== OUTPUT FORMAT (JSON ONLY, NO MARKDOWN) ===
{
  "title": "Catchy headline (e.g., 'How We Helped XYZ Farm Double Their Yield')",
  "description": "Detailed narrative (2-3 paragraphs) explaining the client's problem, our solution, and the outcome.",
  "client_name": "Realistic client name",
  "client_company": "Farm or Company Name",
  "results": "Bulleted list of key achievements (e.g., '• 50% Water Savings\n• 30% Yield Increase\n• ROI in 6 months')"
}

Generate an inspiring success story.`;

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

            let parsedData: SuccessStoryData;
            try {
                const cleanJson = generatedText.replace(/```json\n?|\n?```/g, "").trim();
                parsedData = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Failed to parse JSON:", generatedText);
                throw new Error("Failed to parse generated content");
            }

            onGenerate(parsedData);
            setIsOpen(false);
            setStoryPrompt("");

            toast({
                title: "Success",
                description: "Success story generated successfully!",
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
                    className="gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-200 hover:border-amber-300 dark:border-amber-800 dark:hover:border-amber-700"
                >
                    <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent font-medium">
                        Generate with AI
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-600" />
                        AI Success Story Generator
                    </DialogTitle>
                    <DialogDescription>
                        Describe the client's success and AI will craft a compelling story.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="story-prompt">Success Story Details</Label>
                        <Textarea
                            id="story-prompt"
                            value={storyPrompt}
                            onChange={(e) => setStoryPrompt(e.target.value)}
                            placeholder="E.g., Helped a smallholder farmer in Machakos switch from flood to drip irrigation, resulting in 3x harvest."
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-sm text-muted-foreground">
                            Mention the client, the problem they faced, and the specific results achieved.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !storyPrompt.trim()}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Story
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AISuccessStoryGenerator;
