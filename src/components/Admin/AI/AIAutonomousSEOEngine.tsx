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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Rocket, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIAutonomousSEOEngineProps {
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

// Kenya-focused irrigation topics for rotation
const TOPIC_CATEGORIES = [
    {
        value: "drip_irrigation_systems",
        label: "Drip Irrigation Systems",
        keywords: "drip irrigation Kenya, drip system setup, drip tape installation"
    },
    {
        value: "solar_irrigation",
        label: "Solar Irrigation",
        keywords: "solar water pump Kenya, solar irrigation cost, off-grid irrigation"
    },
    {
        value: "irrigation_costs",
        label: "Irrigation Costs in Kenya",
        keywords: "irrigation cost per acre Kenya, drip irrigation price, irrigation investment"
    },
    {
        value: "greenhouse_irrigation",
        label: "Greenhouse Irrigation",
        keywords: "greenhouse irrigation Kenya, tomato irrigation, greenhouse drip system"
    },
    {
        value: "smart_irrigation",
        label: "Smart Irrigation & Automation",
        keywords: "automated irrigation Kenya, smart farming, irrigation controller"
    },
    {
        value: "irrigation_maintenance",
        label: "Irrigation Maintenance & Mistakes",
        keywords: "irrigation maintenance tips, common irrigation mistakes, drip system care"
    },
    {
        value: "water_management",
        label: "Water Management for Farms",
        keywords: "water conservation Kenya, farm water efficiency, irrigation scheduling"
    }
];

const AIAutonomousSEOEngine = ({ onGenerate }: AIAutonomousSEOEngineProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState("");
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!selectedTopic) {
            toast({
                title: "Topic Required",
                description: "Please select a topic category for the blog post",
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

            const topic = TOPIC_CATEGORIES.find(t => t.value === selectedTopic);
            if (!topic) throw new Error("Invalid topic selected");

            // 2. Construct SEO-optimized prompt for Kenya-specific content
            const prompt = `You are a practical field writer specializing in irrigation for Kenyan farmers. Write a clear, useful blog post about "${topic.label}".

=== TARGET AUDIENCE ===
- Small & medium-scale farmers in Kenya
- Agribusiness owners
- Greenhouse farmers
- Irrigation buyers & decision-makers

=== TONE & STYLE ===
- Clear, practical, confident
- Simple English (avoid jargon)
- Kenyan context: KES currency, local crops (tomatoes, peppers, kale, cabbage, onions, maize), Kenyan climate and regions
- No fluff, no generic AI phrasing
- Actionable advice

=== SEO REQUIREMENTS ===
- Target keywords: ${topic.keywords}
- Optimize for featured snippets
- Target long-tail keywords (e.g., "drip irrigation cost per acre Kenya")
- Include money keywords where relevant (e.g., "buy drip irrigation kit Kenya")
- Problem-solving focus

=== CONTENT STRUCTURE (CRITICAL - PROPER HTML) ===
1. **Introduction** (150-200 words)
   - Problem-focused hook
   - Use <p> tags with proper spacing
   - Include primary keyword naturally

2. **Main Content** (3-5 sections)
   - Each section with <h2> heading
   - Subsections with <h3> where needed
   - Use <p> tags for paragraphs
   - Use <ul><li> or <ol><li> for lists
   - Use <strong> for emphasis, <em> for subtle emphasis
   - Include practical tips and real-world examples

3. **FAQ Section** (CRITICAL - Accordion-Ready Format)
   - Minimum 5 FAQs
   - Structure EXACTLY as follows:
   
   <div class="faq-section">
     <h2>Frequently Asked Questions</h2>
     <div class="faq-item">
       <h3 class="faq-question">Question 1 here?</h3>
       <div class="faq-answer">
         <p>Answer paragraph with helpful information.</p>
       </div>
     </div>
     <div class="faq-item">
       <h3 class="faq-question">Question 2 here?</h3>
       <div class="faq-answer">
         <p>Answer paragraph.</p>
         <ul><li>Bullet point if needed</li></ul>
       </div>
     </div>
     <!-- Repeat for all 5+ FAQs -->
   </div>

4. **Call-to-Action Section**
   - Strong CTA encouraging action
   - Include WhatsApp consultation offer
   - Professional irrigation assessment mention
   - Use <div class="cta-section"> wrapper
   - Example CTA text: "Ready to transform your farm with efficient irrigation? Contact DripTech today for a free consultation. Call us or WhatsApp for a professional irrigation assessment tailored to your farm's needs."

=== INTERNAL LINKING (MANDATORY) ===
Naturally include 3-4 internal links with relevant anchor text:
- <a href="/irrigation-kits" class="internal-link">explore our irrigation kits</a>
- <a href="/products" class="internal-link">browse drip irrigation products</a>
- <a href="/success-stories" class="internal-link">see how farmers are succeeding</a>
- <a href="/contact" class="internal-link">get a free consultation</a>

=== KENYA-SPECIFIC REQUIREMENTS ===
- Reference local crops: tomatoes, kale (sukuma wiki), peppers, cabbage, onions, maize
- Use KES for pricing (if mentioned, use estimates like "KES 50,000 - 150,000")
- Mention Kenyan regions where relevant (e.g., Rift Valley, Central Kenya)
- Reference Kenyan climate challenges (dry seasons, water scarcity)
- NO fabricated statistics - use general best practices

=== WORD COUNT ===
1,200 - 1,800 words total

=== OUTPUT FORMAT (JSON ONLY, NO MARKDOWN) ===
{
  "title": "Compelling, SEO-friendly title (50-60 characters)",
  "slug": "url-friendly-slug-from-title",
  "excerpt": "Engaging 150-160 character summary that hooks readers and includes primary keyword",
  "content": "Full blog post in HTML format with proper structure as specified above. MUST include properly formatted FAQ section and CTA section.",
  "tags": ["5-8 relevant tags", "irrigation", "kenya", "farming", "drip-systems"],
  "seo_title": "SEO-optimized title with primary keyword (55-60 characters)",
  "seo_description": "Meta description with keywords and value proposition (150-160 characters)",
  "reading_time": 7
}

Generate professional, valuable content that educates and engages Kenyan farmers. Focus on practical solutions and actionable advice.`;

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

            // 5. Validate content structure
            if (!parsedData.content.includes('class="faq-section"')) {
                console.warn("Generated content missing FAQ section structure");
            }

            // 6. Pass data to parent component
            onGenerate(parsedData);
            setIsOpen(false);
            setSelectedTopic("");

            toast({
                title: "Success",
                description: `SEO-optimized blog post generated for "${topic.label}"!`,
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
                    <Rocket className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-medium">
                        SEO Content Engine
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-green-600" />
                        Autonomous SEO Content Engine
                    </DialogTitle>
                    <DialogDescription>
                        Generate Kenya-focused, SEO-optimized irrigation blog posts. All content is created as DRAFT for your review.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="topic-category">Topic Category</Label>
                        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                            <SelectTrigger id="topic-category">
                                <SelectValue placeholder="Select a topic category" />
                            </SelectTrigger>
                            <SelectContent>
                                {TOPIC_CATEGORIES.map((topic) => (
                                    <SelectItem key={topic.value} value={topic.value}>
                                        {topic.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Choose a topic category. The AI will generate SEO-optimized content with proper structure, FAQs, and internal links.
                        </p>
                    </div>

                    {selectedTopic && (
                        <div className="rounded-lg bg-muted p-4 space-y-2">
                            <h4 className="font-medium text-sm">Content Features:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>✓ 1,200-1,800 words, Kenya-focused</li>
                                <li>✓ Proper HTML structure with semantic tags</li>
                                <li>✓ Accordion-ready FAQ section (5+ questions)</li>
                                <li>✓ Internal links to products & services</li>
                                <li>✓ SEO-optimized for Google featured snippets</li>
                                <li>✓ Created as DRAFT for your approval</li>
                            </ul>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !selectedTopic}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating SEO Content...
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

export default AIAutonomousSEOEngine;
