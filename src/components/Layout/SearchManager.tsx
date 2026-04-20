import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Package,
    BookOpen,
    Video,
    ExternalLink,
    Droplets,
    Command as CommandIcon,
    X,
    Loader2,
    TrendingUp,
} from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandShortcut,
} from "@/components/ui/command";
import { dataService } from "@/services/dataService";
import { trackSearch } from "@/services/aiProductService";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    type: "product" | "blog" | "video" | "kit";
    url: string;
    image?: string;
    category?: string;
}

const SearchManager = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Handle keyboard shortcut (Ctrl+K or Cmd+K)
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Debounced search logic
    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const [products, kits, blogs, videos] = await Promise.all([
                    dataService.getProducts({ search: query, limit: 5 }),
                    dataService.getIrrigationKits({ search: query, limit: 5 }),
                    dataService.getBlogPostsPaginated({ search: query, limit: 5 }),
                    dataService.getVideos({ search: query, limit: 5 }),
                ]);

                const formattedResults: SearchResult[] = [
                    ...(products || []).map((p: any) => ({
                        id: p.id,
                        title: p.name,
                        subtitle: p.model_number || p.subcategory,
                        type: "product" as const,
                        url: `/products/${p.category || 'all'}/${p.id}`,
                        image: p.images?.[0],
                        category: p.category,
                    })),
                    ...(kits || []).map((k: any) => ({
                        id: k.id,
                        title: k.name,
                        subtitle: `${k.kit_type} • ${k.coverage_area}m²`,
                        type: "kit" as const,
                        url: "/irrigation-kits",
                        image: k.image_url,
                        category: k.category,
                    })),
                    ...(blogs?.posts || []).map((b: any) => ({
                        id: b.id,
                        title: b.title,
                        subtitle: b.blog_categories?.name,
                        type: "blog" as const,
                        url: `/blog/${b.slug}`,
                        image: b.featured_image_url,
                        category: b.blog_categories?.name,
                    })),
                    ...(videos || []).map((v: any) => ({
                        id: v.id,
                        title: v.title,
                        subtitle: v.category,
                        type: "video" as const,
                        url: "/videos",
                        image: v.thumbnail_url,
                        category: v.category,
                    })),
                ];

                setResults(formattedResults);

                // Track search query
                trackSearch(query, undefined, formattedResults.length);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const onSelect = useCallback((url: string) => {
        setOpen(false);
        navigate(url);
    }, [navigate]);

    return (
        <>
            {/* Desktop Search Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                className="hidden md:flex items-center gap-2 group px-4 py-2 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all duration-300 mr-2"
            >
                <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                    Search...
                </span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 ml-4">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            {/* Mobile Search - Exposed via window for access from other components */}
            <button
                className="sr-only"
                id="search-trigger"
                onClick={() => setOpen(true)}
                aria-label="Toggle search"
            />

            <CommandDialog open={open} onOpenChange={setOpen}>
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            Global Search
                        </Badge>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="p-1 rounded-full hover:bg-muted transition-colors"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                <CommandInput
                    placeholder="Search products, kits, news, or guides..."
                    value={query}
                    onValueChange={setQuery}
                />

                <CommandList className="max-h-[60vh]">
                    {isLoading && (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-6 w-6 text-primary animate-spin" />
                            <span className="ml-3 text-sm text-muted-foreground">Searching database...</span>
                        </div>
                    )}

                    {!isLoading && query.length > 0 && results.length === 0 && (
                        <CommandEmpty className="py-10 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <Search className="h-10 w-10 text-muted-foreground/30" />
                                <p className="text-lg font-medium">No results found for "{query}"</p>
                                <p className="text-sm text-muted-foreground">Try using different keywords or categories.</p>
                            </div>
                        </CommandEmpty>
                    )}

                    {!isLoading && query.length === 0 && (
                        <>
                            <CommandGroup heading="AI Quick Actions">
                                <CommandItem onSelect={() => onSelect("/services")}>
                                    <TrendingUp className="mr-3 h-5 w-5 text-primary" />
                                    <span>Calculate ROI & Savings</span>
                                    <CommandShortcut>ROI</CommandShortcut>
                                </CommandItem>
                                <CommandItem onSelect={() => onSelect("/installation-guides")}>
                                    <BookOpen className="mr-3 h-5 w-5 text-primary" />
                                    <span>Browse Installation Guides</span>
                                    <CommandShortcut>Guides</CommandShortcut>
                                </CommandItem>
                                <CommandItem onSelect={() => {
                                    setOpen(false);
                                    const trigger = document.getElementById('quote-trigger');
                                    if (trigger) trigger.click();
                                    else navigate("/contact");
                                }}>
                                    <Droplets className="mr-3 h-5 w-5 text-primary" />
                                    <span>Get Expert Consultation</span>
                                    <CommandShortcut>Quote</CommandShortcut>
                                </CommandItem>
                            </CommandGroup>

                            <CommandGroup heading="Quick Suggestions">
                                <CommandItem onSelect={() => onSelect("/products")}>
                                    <Package className="mr-3 h-5 w-5 text-primary" />
                                    <span>All Products</span>
                                    <CommandShortcut>Browse</CommandShortcut>
                                </CommandItem>
                                <CommandItem onSelect={() => onSelect("/irrigation-kits")}>
                                    <Droplets className="mr-3 h-5 w-5 text-primary" />
                                    <span>Irrigation Kits</span>
                                    <CommandShortcut>Explore</CommandShortcut>
                                </CommandItem>
                                <CommandItem onSelect={() => onSelect("/blog")}>
                                    <BookOpen className="mr-3 h-5 w-5 text-amber-500" />
                                    <span>Blog & Insights</span>
                                    <CommandShortcut>Read</CommandShortcut>
                                </CommandItem>
                                <CommandItem onSelect={() => onSelect("/videos")}>
                                    <Video className="mr-3 h-5 w-5 text-accent" />
                                    <span>Video Tutorials</span>
                                    <CommandShortcut>Watch</CommandShortcut>
                                </CommandItem>
                            </CommandGroup>
                        </>
                    )}

                    {/* Grouped Results */}
                    {results.some(r => r.type === "kit") && (
                        <CommandGroup heading="Irrigation Kits">
                            {results.filter(r => r.type === "kit").map(result => (
                                <SearchResultItem key={result.id} result={result} onSelect={onSelect} />
                            ))}
                        </CommandGroup>
                    )}

                    {results.some(r => r.type === "product") && (
                        <CommandGroup heading="Products">
                            {results.filter(r => r.type === "product").map(result => (
                                <SearchResultItem key={result.id} result={result} onSelect={onSelect} />
                            ))}
                        </CommandGroup>
                    )}

                    {results.some(r => r.type === "blog") && (
                        <CommandGroup heading="Blog Posts">
                            {results.filter(r => r.type === "blog").map(result => (
                                <SearchResultItem key={result.id} result={result} onSelect={onSelect} />
                            ))}
                        </CommandGroup>
                    )}

                    {results.some(r => r.type === "video") && (
                        <CommandGroup heading="Videos">
                            {results.filter(r => r.type === "video").map(result => (
                                <SearchResultItem key={result.id} result={result} onSelect={onSelect} />
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>

                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 text-[10px] sm:text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 font-medium">
                            <span className="px-1.5 py-0.5 rounded border bg-background">ENTER</span> Select
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                            <span className="px-1.5 py-0.5 rounded border bg-background">↑↓</span> Navigate
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" />
                        <span>Search powered by DripTech AI</span>
                    </div>
                </div>
            </CommandDialog>
        </>
    );
};

const SearchResultItem = ({
    result,
    onSelect
}: {
    result: SearchResult;
    onSelect: (url: string) => void
}) => {
    const Icon = {
        product: Package,
        blog: BookOpen,
        video: Video,
        kit: Droplets,
    }[result.type];

    const colorClass = {
        product: "text-primary",
        blog: "text-[hsl(var(--dt-gold-500))]",
        video: "text-accent",
        kit: "text-primary",
    }[result.type];

    return (
        <CommandItem
            onSelect={() => onSelect(result.url)}
            className="flex items-center gap-3 p-3 cursor-pointer group"
        >
            <div className={cn("flex-shrink-0 w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden border border-border/50 group-data-[selected=true]:border-primary/50 group-data-[selected=true]:bg-background")}>
                {result.image ? (
                    <img src={result.image} alt={result.title} className="w-full h-full object-cover" />
                ) : (
                    <Icon className={cn("h-5 w-5", colorClass)} />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate group-data-[selected=true]:text-primary transition-colors">
                    {result.title}
                </p>
                <div className="flex items-center gap-2">
                    {result.category && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] uppercase font-bold text-muted-foreground bg-muted/20">
                            {result.category.replace('_', ' ')}
                        </Badge>
                    )}
                    {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate italic">
                            {result.subtitle}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex-shrink-0 opacity-0 group-data-[selected=true]:opacity-100 transition-opacity">
                <ExternalLink className="h-4 w-4 text-primary" />
            </div>
        </CommandItem>
    );
};

export default SearchManager;
