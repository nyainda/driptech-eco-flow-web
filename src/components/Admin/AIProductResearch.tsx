import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, CheckCircle, XCircle, Plus, BarChart3, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
    getAISuggestions,
    updateSuggestionStatus,
    deleteSuggestion,
    getSearchAnalytics
} from '@/services/aiProductService';

interface SearchAnalytic {
    query: string;
    count: number;
    categories: string[];
}

interface AISuggestion {
    id: string;
    name: string;
    category: string;
    description: string;
    price_range: string;
    estimated_price: number;
    target_crops: string[];
    features: string[];
    applications: string[];
    search_volume: number;
    status: 'pending' | 'approved' | 'rejected' | 'created';
    created_at: string;
}

export default function AIProductResearch() {
    const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
    const [analytics, setAnalytics] = useState<SearchAnalytic[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);

    useEffect(() => {
        loadSuggestions();
        loadAnalytics();
    }, []);

    const loadSuggestions = async () => {
        try {
            const data = await getAISuggestions();
            setSuggestions(data);
        } catch (error) {
            console.error('Failed to load suggestions:', error);
            toast({
                title: 'Error',
                description: 'Failed to load AI suggestions',
                variant: 'destructive'
            });
        }
    };

    const loadAnalytics = async () => {
        try {
            const data = await getSearchAnalytics(30);
            setAnalytics(data.slice(0, 20)); // Top 20
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    };

    const analyzeSearchTrends = async () => {
        setAnalyzing(true);
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
                setAnalyzing(false);
                return;
            }

            // 2. Get search analytics
            const searchData = await getSearchAnalytics(30);

            if (searchData.length === 0) {
                toast({
                    title: "No Search Data",
                    description: "No search queries found in the last 30 days. Users need to search first.",
                    variant: "destructive",
                });
                setAnalyzing(false);
                return;
            }

            const topQueries = searchData.slice(0, 20);

            // 3. Call Gemini API to analyze trends
            const prompt = `You are an irrigation equipment expert. Analyze these search queries from a Kenyan irrigation website:

${JSON.stringify(topQueries, null, 2)}

Based on these searches, generate 15 product suggestions that would satisfy user demand. For each product, provide:

{
  "suggestions": [
    {
      "name": "Professional product name",
      "category": "drip_irrigation | sprinkler_systems | filtration_systems | control_systems | accessories",
      "description": "2-3 paragraphs describing the product, its benefits, and applications",
      "price_range": "KSH X,XXX - X,XXX",
      "estimated_price": XXXX,
      "target_crops": ["Tomatoes", "Peppers", "etc"],
      "technical_specs": {
        "material": "LDPE/PVC/etc",
        "size": "16mm/etc",
        "flow_rate": "2.0 L/hr/etc"
      },
      "features": ["Feature 1", "Feature 2", "etc"],
      "applications": ["Greenhouse", "Open field", "etc"],
      "search_volume": <count from queries>
    }
  ]
}

Make products realistic, market-accurate, and aligned with Kenyan irrigation needs. Output ONLY valid JSON, no markdown.`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }]
                    })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Gemini API failed');
            }

            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedText) {
                throw new Error('No content generated from Gemini');
            }

            // 4. Parse JSON response
            const cleanJson = generatedText.replace(/```json\n?|\n?```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            // 5. Save suggestions to Supabase
            const suggestions = parsed.suggestions || [];

            for (const suggestion of suggestions) {
                await supabase.from('ai_product_suggestions').insert({
                    name: suggestion.name,
                    category: suggestion.category,
                    description: suggestion.description,
                    price_range: suggestion.price_range,
                    estimated_price: suggestion.estimated_price,
                    target_crops: suggestion.target_crops,
                    technical_specs: suggestion.technical_specs,
                    features: suggestion.features,
                    applications: suggestion.applications,
                    search_volume: suggestion.search_volume || 0,
                    status: 'pending'
                });
            }

            toast({
                title: 'Analysis Complete',
                description: `Generated ${suggestions.length} product suggestions`
            });

            await loadSuggestions();
        } catch (error: any) {
            toast({
                title: 'Analysis Failed',
                description: error.message || 'Failed to analyze search trends',
                variant: 'destructive'
            });
        } finally {
            setAnalyzing(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await updateSuggestionStatus(id, 'approved');
            toast({
                title: 'Approved',
                description: 'Product suggestion approved. You can now create it.'
            });
            await loadSuggestions();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to approve suggestion',
                variant: 'destructive'
            });
        }
    };

    const handleReject = async (id: string) => {
        try {
            await updateSuggestionStatus(id, 'rejected');
            toast({
                title: 'Rejected',
                description: 'Product suggestion rejected'
            });
            await loadSuggestions();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to reject suggestion',
                variant: 'destructive'
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this suggestion?')) return;

        try {
            await deleteSuggestion(id);
            toast({
                title: 'Deleted',
                description: 'Product suggestion deleted'
            });
            await loadSuggestions();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete suggestion',
                variant: 'destructive'
            });
        }
    };

    const handleCreateProduct = async (suggestion: AISuggestion) => {
        try {
            // Extract data from technical_specs
            const specs = suggestion.technical_specs as any;
            const variants = specs?.variants || [];
            const specifications = specs?.specifications || [];

            // Prepare product data
            const productData = {
                name: suggestion.name,
                model_number: specs?.model_number || '',
                category: suggestion.category as any,
                subcategory: specs?.subcategory || '',
                description: suggestion.description,
                price: suggestion.estimated_price,
                in_stock: variants.length > 0 ? variants.some((v: any) => v.in_stock) : true,
                featured: false,
                images: [],
                features: suggestion.features,
                applications: suggestion.applications,
                specifications: specifications?.reduce((acc: any, spec: any) => {
                    if (spec.name && spec.value) {
                        acc[spec.name] = spec.unit ? `${spec.value} ${spec.unit}` : spec.value;
                    }
                    return acc;
                }, {}),
                technical_specs: specifications?.reduce((acc: any, spec: any) => {
                    if (spec.name && spec.value) {
                        acc[spec.name] = { value: spec.value, unit: spec.unit || '' };
                    }
                    return acc;
                }, {}),
                variants: variants.length > 0 ? variants.map((v: any) => ({
                    name: v.name,
                    price: parseFloat(v.price),
                    in_stock: v.in_stock
                })) : null
            };

            // Insert into products table
            const { error } = await supabase.from('products').insert([productData]);

            if (error) throw error;

            // Update suggestion status to 'created'
            await updateSuggestionStatus(suggestion.id, 'created');

            toast({
                title: 'Product Created',
                description: `${suggestion.name} has been added to your product catalog!`
            });

            await loadSuggestions();
        } catch (error: any) {
            console.error('Failed to create product:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create product',
                variant: 'destructive'
            });
        }
    };


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Product Research</h2>
                    <p className="text-sm text-muted-foreground">
                        Analyze search trends and get AI-powered product suggestions
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowAnalytics(!showAnalytics)}
                    >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        {showAnalytics ? 'Hide' : 'Show'} Analytics
                    </Button>
                    <Button
                        onClick={analyzeSearchTrends}
                        disabled={analyzing}
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Analyze Trends
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Search Analytics */}
            {showAnalytics && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Top Search Queries (Last 30 Days)
                        </CardTitle>
                        <CardDescription>
                            What users are searching for on your site
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            {analytics.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{item.query}</p>
                                        {item.categories.length > 0 && (
                                            <div className="flex gap-1 mt-1">
                                                {item.categories.map((cat, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs">
                                                        {cat}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Badge variant="secondary">{item.count} searches</Badge>
                                </div>
                            ))}
                            {analytics.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">
                                    No search data available yet
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* AI Suggestions */}
            <div>
                <h3 className="text-lg font-semibold mb-4">
                    AI Product Suggestions ({suggestions.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {suggestions.map((suggestion) => (
                        <Card key={suggestion.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-base">{suggestion.name}</CardTitle>
                                    <Badge
                                        variant={
                                            suggestion.status === 'approved'
                                                ? 'default'
                                                : suggestion.status === 'rejected'
                                                    ? 'destructive'
                                                    : 'secondary'
                                        }
                                    >
                                        {suggestion.status}
                                    </Badge>
                                </div>
                                <CardDescription>{suggestion.category}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {suggestion.description}
                                </p>

                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium">Price Range:</span>{' '}
                                        {suggestion.price_range}
                                    </div>
                                    {suggestion.target_crops && suggestion.target_crops.length > 0 && (
                                        <div>
                                            <span className="font-medium">Target Crops:</span>{' '}
                                            {suggestion.target_crops.join(', ')}
                                        </div>
                                    )}
                                    {suggestion.search_volume > 0 && (
                                        <div>
                                            <span className="font-medium">Search Volume:</span>{' '}
                                            {suggestion.search_volume}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {suggestion.status === 'pending' && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => handleApprove(suggestion.id)}
                                            >
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => handleReject(suggestion.id)}
                                            >
                                                <XCircle className="mr-1 h-3 w-3" />
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                    {suggestion.status === 'approved' && (
                                        <Button
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleCreateProduct(suggestion)}
                                        >
                                            <Plus className="mr-1 h-3 w-3" />
                                            Create Product
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(suggestion.id)}
                                    >
                                        <XCircle className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {suggestions.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Suggestions Yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Click "Analyze Trends" to generate AI-powered product suggestions based on user searches
                            </p>
                            <Button onClick={analyzeSearchTrends} disabled={analyzing}>
                                {analyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        Analyze Trends Now
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
