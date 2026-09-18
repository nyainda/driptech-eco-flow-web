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
import { Sparkles, Loader2, Newspaper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AINewsGeneratorProps {
    onGenerate: (data: NewsData) => void;
}

interface NewsData {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    tags: string[];
    author: string;
    reading_time: number;
}

const AINewsGenerator = ({ onGenerate }: AINewsGeneratorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newsPrompt, setNewsPrompt] = useState("");
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!newsPrompt.trim()) {
            toast({
                title: "Error",
                description: "Please describe the news article you want to create",
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

            const prompt = `You are a professional news writer covering irrigation, agriculture, and agribusiness. Generate a timely, newsworthy article based on: "${newsPrompt}"

=== NEWS WRITING GUIDELINES ===
1. Write in journalistic style: clear, concise, factual
2. Lead with the most important information (inverted pyramid)
3. Include relevant quotes, statistics, and expert opinions
4. Maintain objectivity and credibility
5. Use active voice and strong verbs
6. Target reading time: 3-5 minutes (400-800 words)

=== NEWS CATEGORIES ===
- Industry announcements and product launches
- Agricultural technology innovations
- Water conservation initiatives
- Government policies and regulations
- Market trends and analysis
- Success stories and case studies
- Event coverage and trade shows
- Research findings and studies
- Company news and partnerships
- Seasonal farming updates

=== OUTPUT FORMAT (JSON ONLY, NO MARKDOWN) ===
{
  "title": "Compelling news headline (60-80 characters, action-oriented)",
  "slug": "url-friendly-slug-from-title",
  "excerpt": "Lead paragraph summarizing who, what, when, where, why (150-200 characters)",
  "content": "Full news article in HTML format with <p>, <strong>, <em>, <blockquote> tags. Include:
    - Lead paragraph (most important facts)
    - Supporting paragraphs with details
    - Quotes from stakeholders/experts
    - Background context
    - Future implications
    - 400-800 words total",
  "tags": ["4-6 relevant tags", "irrigation-news", "agriculture", "technology", "water-management", "industry-update"],
  "author": "DripTech Editorial Team",
  "reading_time": 4
}

=== EXAMPLE NEWS TOPICS ===
- "Kenya Launches National Drip Irrigation Subsidy Program for Small-Scale Farmers"
- "New Smart Irrigation Controller Reduces Water Usage by 40% in Field Tests"
- "DripTech Partners with Leading Greenhouse Operators to Expand Micro-Irrigation"
- "Study Shows Drip Irrigation Increases Tomato Yields by 35% in Arid Regions"
- "Government Announces KES 2 Billion Fund for Agricultural Modernization"

Generate factual, engaging news content that informs readers about important developments.`;

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

            let parsedData: NewsData;
            try {
                const cleanJson = generatedText.replace(/```json\n?|\n?```/g, "").trim();
                parsedData = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Failed to parse JSON:", generatedText);
                throw new Error("Failed to parse generated content");
            }

            onGenerate(parsedData);
            setIsOpen(false);
            setNewsPrompt("");

            toast({
                title: "Success",
                description: "News article generated successfully!",
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
                    className="gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200 hover:border-green-300 dark:border-green-800 dark:hover:border-green-700"
                >
                    <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-medium">
                        Generate with AI
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Newspaper className="h-5 w-5 text-green-600" />
                        AI News Article Generator
                    </DialogTitle>
                    <DialogDescription>
                        Describe the news story and AI will generate a professional news article.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="news-prompt">News Topic</Label>
                        <Textarea
                            id="news-prompt"
                            value={newsPrompt}
                            onChange={(e) => setNewsPrompt(e.target.value)}
                            placeholder="E.g., New government subsidy for drip irrigation, Company launches smart irrigation controller, Study shows water savings from micro-sprinklers"
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-sm text-muted-foreground">
                            Provide key facts: who, what, when, where, why. Include any specific details or quotes.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !newsPrompt.trim()}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate News Article
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AINewsGenerator;
