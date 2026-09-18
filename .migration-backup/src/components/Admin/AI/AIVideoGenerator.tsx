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
import { Sparkles, Loader2, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIVideoGeneratorProps {
    onGenerate: (data: VideoData) => void;
}

interface VideoData {
    title: string;
    description: string;
    category: string;
    tags: string[];
}

const AIVideoGenerator = ({ onGenerate }: AIVideoGeneratorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [videoPrompt, setVideoPrompt] = useState("");
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!videoPrompt.trim()) {
            toast({
                title: "Error",
                description: "Please describe the video content",
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

            const prompt = `You are a video content strategist for an irrigation company. Generate optimized video metadata based on this description: "${videoPrompt}"

=== VIDEO METADATA GUIDELINES ===
1. Create a catchy, click-worthy title (YouTube style)
2. Write a detailed description including key timestamps/topics if applicable
3. Select appropriate tags for SEO
4. Choose a relevant category

=== OUTPUT FORMAT (JSON ONLY, NO MARKDOWN) ===
{
  "title": "Engaging Video Title (e.g., 'How to Install Drip Tape in 5 Easy Steps')",
  "description": "Comprehensive video description. Include a hook, summary of content, and call to action.",
  "category": "One of: 'Tutorials', 'Product Reviews', 'Case Studies', 'Company News', 'Events'",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"]
}

Generate optimized video metadata.`;

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

            let parsedData: VideoData;
            try {
                const cleanJson = generatedText.replace(/```json\n?|\n?```/g, "").trim();
                parsedData = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Failed to parse JSON:", generatedText);
                throw new Error("Failed to parse generated content");
            }

            onGenerate(parsedData);
            setIsOpen(false);
            setVideoPrompt("");

            toast({
                title: "Success",
                description: "Video metadata generated successfully!",
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
                    className="gap-2 bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700"
                >
                    <Sparkles className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent font-medium">
                        Generate with AI
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-red-600" />
                        AI Video Metadata Generator
                    </DialogTitle>
                    <DialogDescription>
                        Describe your video content and AI will generate optimized titles, descriptions, and tags.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="video-prompt">Video Content</Label>
                        <Textarea
                            id="video-prompt"
                            value={videoPrompt}
                            onChange={(e) => setVideoPrompt(e.target.value)}
                            placeholder="E.g., A tutorial on how to clean disc filters, or a review of the new Rain Bird sprinkler."
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-sm text-muted-foreground">
                            What is the video about? Who is it for?
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !videoPrompt.trim()}
                        className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Metadata
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AIVideoGenerator;
