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
import { Sparkles, Loader2, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIProjectGeneratorProps {
    onGenerate: (data: ProjectData) => void;
}

interface ProjectData {
    name: string;
    description: string;
    location: string;
    project_type: string;
    area_covered: number;
    water_saved: number;
    testimonial: string;
}

const AIProjectGenerator = ({ onGenerate }: AIProjectGeneratorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [projectPrompt, setProjectPrompt] = useState("");
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!projectPrompt.trim()) {
            toast({
                title: "Error",
                description: "Please describe the project you want to create",
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

            const prompt = `You are a project manager for an irrigation company. Generate detailed project information based on this description: "${projectPrompt}"

=== PROJECT DETAILS GUIDELINES ===
1. Generate realistic project details for irrigation installations
2. Create professional descriptions highlighting technical achievements
3. Estimate realistic metrics (area, water savings) based on the project type
4. Write a compelling client testimonial
5. Use Kenyan context (locations, crop types) if applicable

=== OUTPUT FORMAT (JSON ONLY, NO MARKDOWN) ===
{
  "name": "Professional project title (e.g., 'Large Scale Avocado Farm Irrigation - Nyeri')",
  "description": "Detailed project description (2-3 paragraphs) covering the challenge, solution, and outcome.",
  "location": "City/Region (e.g., 'Naivasha, Nakuru County')",
  "project_type": "One of: 'Drip Irrigation', 'Sprinkler System', 'Greenhouse', 'Borehole', 'Landscaping'",
  "area_covered": 10 (number in acres),
  "water_saved": 40 (number in percentage),
  "testimonial": "A glowing quote from the client about the improved yields and efficiency."
}

Generate professional and realistic project data.`;

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

            let parsedData: ProjectData;
            try {
                const cleanJson = generatedText.replace(/```json\n?|\n?```/g, "").trim();
                parsedData = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Failed to parse JSON:", generatedText);
                throw new Error("Failed to parse generated content");
            }

            onGenerate(parsedData);
            setIsOpen(false);
            setProjectPrompt("");

            toast({
                title: "Success",
                description: "Project details generated successfully!",
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
                        Generate with AI
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                        AI Project Generator
                    </DialogTitle>
                    <DialogDescription>
                        Describe the project and AI will generate the details, metrics, and testimonial.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="project-prompt">Project Description</Label>
                        <Textarea
                            id="project-prompt"
                            value={projectPrompt}
                            onChange={(e) => setProjectPrompt(e.target.value)}
                            placeholder="E.g., Installed a 5-acre drip system for a tomato farm in Kitengela, solving water scarcity issues."
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-sm text-muted-foreground">
                            Include key details like size, location, crop type, and main challenges solved.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !projectPrompt.trim()}
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
                                Generate Project
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AIProjectGenerator;
