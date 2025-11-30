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

interface AIBlogGeneratorProps {
    onGenerate: (data: BlogData) => void;
}

interface BlogData {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    tags: string[];
    seo_title: string;
    seo_description: string;
    reading_time: number;
}

const AIBlogGenerator = ({ onGenerate }: AIBlogGeneratorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [blogPrompt, setBlogPrompt] = useState("");
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!blogPrompt.trim()) {
            toast({
                title: "Error",
                description: "Please describe the blog post you want to create",
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

            // 2. Construct prompt for blog generation
            const prompt = `You are an expert content writer specializing in irrigation, agriculture, and sustainable farming. Generate a comprehensive, SEO-optimized blog post based on: "${blogPrompt}"

=== BLOG WRITING GUIDELINES ===
1. Write engaging, informative content for farmers, agricultural businesses, and irrigation professionals
2. Use clear, accessible language while maintaining technical accuracy
3. Include practical tips, real-world examples, and actionable advice
4. Optimize for SEO with relevant keywords naturally integrated
5. Structure content with clear headings and subheadings
6. Target reading time: 5-10 minutes (800-1500 words)

=== CONTENT TOPICS ===
- Drip irrigation systems and techniques
- Water conservation and efficiency
- Crop-specific irrigation strategies
- Modern farming technologies
- Sustainable agriculture practices
- Irrigation system maintenance
- Cost-benefit analysis of irrigation
- Climate-smart agriculture
- Greenhouse irrigation
- Fertigation techniques

=== OUTPUT FORMAT (JSON ONLY, NO MARKDOWN) ===
{
  "title": "Compelling, SEO-friendly title (50-60 characters)",
  "slug": "url-friendly-slug-from-title",
  "excerpt": "Engaging 150-160 character summary that hooks readers",
  "content": "Full blog post in HTML format with <h2>, <h3>, <p>, <ul>, <ol>, <strong>, <em> tags. Include:
    - Introduction paragraph (hook + overview)
    - 3-5 main sections with <h2> headings
    - Subsections with <h3> where needed
    - Bullet points or numbered lists for tips
    - Conclusion with call-to-action
    - 800-1500 words total",
  "tags": ["5-8 relevant tags", "irrigation", "agriculture", "water-conservation", "drip-systems", "farming-tips"],
  "seo_title": "SEO-optimized title with primary keyword (55-60 characters)",
  "seo_description": "Meta description with keywords and value proposition (150-160 characters)",
  "reading_time": 7
}

=== EXAMPLE TOPICS ===
- "How to Choose the Right Drip Irrigation System for Your Farm"
- "10 Water-Saving Tips for Greenhouse Growers"
- "The Complete Guide to Fertigation: Boost Crop Yields by 30%"
- "Drip Tape vs Drip Laterals: Which is Best for Your Crops?"
- "Reducing Irrigation Costs: A Farmer's Guide to Efficiency"

Generate professional, valuable content that educates and engages readers.`;

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
            let parsedData: BlogData;
            try {
                const cleanJson = generatedText.replace(/```json\n?|\n?```/g, "").trim();
                parsedData = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Failed to parse JSON:", generatedText);
                throw new Error("Failed to parse generated content");
            }

            // 5. Pass data to parent component
            onGenerate(parsedData);
            setIsOpen(false);
            setBlogPrompt("");

            toast({
                title: "Success",
                description: "Blog post generated successfully!",
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
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-purple-600" />
                        AI Blog Post Generator
                    </DialogTitle>
                    <DialogDescription>
                        Describe the blog topic and AI will generate a complete, SEO-optimized article for you.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="blog-prompt">Blog Topic</Label>
                        <Textarea
                            id="blog-prompt"
                            value={blogPrompt}
                            onChange={(e) => setBlogPrompt(e.target.value)}
                            placeholder="E.g., How to set up drip irrigation for tomato farming, Benefits of micro-sprinklers in greenhouses, Water conservation tips for farmers"
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-sm text-muted-foreground">
                            Be specific about the topic, target audience, and key points you want covered.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !blogPrompt.trim()}
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
                                Generate Blog Post
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AIBlogGenerator;
