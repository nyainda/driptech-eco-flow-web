import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Droplets,
    Zap,
    Filter,
    Settings,
    LayoutGrid,
    CheckCircle,
    Leaf,
    Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWhatsAppProducts } from "@/hooks/useWhatsAppProducts";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

const CATEGORY_CONFIG: Record<
    string,
    {
        label: string;
        icon: LucideIcon;
        badge: string;
        headline: string;
        headlineAccent: string;
        description: string;
        stats: { value: string; label: string }[];
        link: string;
    }
> = {
    drip_irrigation: {
        label: "Drip Irrigation",
        icon: Droplets,
        badge: "Kenya's #1 Drip System",
        headline: "Precision Watering,",
        headlineAccent: "Maximum Yield",
        description: "Deliver water directly to roots with near-zero evaporation — from ¼ acre to 100+ acres.",
        stats: [
            { value: "50%", label: "Less Water" },
            { value: "60%", label: "More Yield" },
            { value: "5yr", label: "Warranty" },
        ],
        link: "/products/drip",
    },
    sprinkler_systems: {
        label: "Sprinkler Systems",
        icon: Zap,
        badge: "Wide-Area Coverage",
        headline: "Uniform Coverage,",
        headlineAccent: "Zero Water Waste",
        description: "Blanket large fields evenly with precision pressure regulation and smart scheduling.",
        stats: [
            { value: "5×", label: "Coverage" },
            { value: "40%", label: "Water Saved" },
            { value: "360°", label: "Rotation" },
        ],
        link: "/products/sprinklers",
    },
    filtration_systems: {
        label: "Filtration",
        icon: Filter,
        badge: "Protect Your Investment",
        headline: "Clean Water,",
        headlineAccent: "Longer System Life",
        description: "Multi-stage filtration removes 99.9% of sediment — protecting drippers and extending lifespan.",
        stats: [
            { value: "99.9%", label: "Filtration" },
            { value: "3×", label: "System Life" },
            { value: "Low", label: "Maintenance" },
        ],
        link: "/products/filtration",
    },
    control_systems: {
        label: "Control Systems",
        icon: Settings,
        badge: "Smart Farm Technology",
        headline: "Automate Everything,",
        headlineAccent: "Farm Smarter",
        description: "Manage your farm from your phone. Timer controllers, soil sensors, and IoT valves work 24/7.",
        stats: [
            { value: "24/7", label: "Automation" },
            { value: "80%", label: "Labour Saved" },
            { value: "IoT", label: "Connected" },
        ],
        link: "/products/controls",
    },
    accessories: {
        label: "Complete Kits",
        icon: LayoutGrid,
        badge: "Ready in a Day",
        headline: "All-In-One Kits,",
        headlineAccent: "Ready to Install",
        description: "Everything in one box — drippers, pipes, fittings, filter, valve. Installed within 24 hours.",
        stats: [
            { value: "1 Day", label: "Install" },
            { value: "All-In", label: "One Box" },
            { value: "Free", label: "Site Visit" },
        ],
        link: "/irrigation-kits",
    },
    pumps: {
        label: "Water Pumps",
        icon: Zap,
        badge: "High-Pressure Pumping",
        headline: "Reliable Pumps,",
        headlineAccent: "Peak Farm Flow",
        description: "Solar, electric, and petrol pumps — from borehole extraction to field distribution across any terrain.",
        stats: [
            { value: "Solar", label: "Powered" },
            { value: "High", label: "Pressure" },
            { value: "24/7", label: "Reliable" },
        ],
        link: "/products/pumps",
    },
    water_pumps: {
        label: "Water Pumps",
        icon: Zap,
        badge: "High-Pressure Pumping",
        headline: "Reliable Pumps,",
        headlineAccent: "Peak Farm Flow",
        description: "Solar, electric, and petrol pumps — from borehole extraction to field distribution across any terrain.",
        stats: [
            { value: "Solar", label: "Powered" },
            { value: "High", label: "Pressure" },
            { value: "24/7", label: "Reliable" },
        ],
        link: "/products/pumps",
    },
    tools: {
        label: "Farm Tools",
        icon: Settings,
        badge: "Professional Grade",
        headline: "Quality Tools,",
        headlineAccent: "Built to Last",
        description: "Professional irrigation installation tools — hole punchers, pipe cutters, end caps, and connectors.",
        stats: [
            { value: "Pro", label: "Grade" },
            { value: "Durable", label: "Build" },
            { value: "Easy", label: "Use" },
        ],
        link: "/products/tools",
    },
    pipes: {
        label: "Pipes & Hoses",
        icon: Filter,
        badge: "UV-Resistant Grade",
        headline: "Strong Pipes,",
        headlineAccent: "Zero Leaks",
        description: "UV-resistant LDPE and HDPE pipes in all sizes — mainline, sub-mainline, and lateral lines.",
        stats: [
            { value: "UV", label: "Resistant" },
            { value: "HDPE", label: "Grade" },
            { value: "All Sizes", label: "Available" },
        ],
        link: "/products/pipes",
    },
    valves: {
        label: "Valves & Fittings",
        icon: Settings,
        badge: "Precision Control",
        headline: "Smart Valves,",
        headlineAccent: "Precise Control",
        description: "Ball valves, solenoids, check valves, and pressure regulators — full control of every water line.",
        stats: [
            { value: "Precise", label: "Control" },
            { value: "Low", label: "Leakage" },
            { value: "Long", label: "Lifespan" },
        ],
        link: "/products/valves",
    },
    fittings: {
        label: "Fittings",
        icon: Settings,
        badge: "Leak-Proof Connections",
        headline: "Secure Fittings,",
        headlineAccent: "Tight Connections",
        description: "Barbed connectors, tees, elbows, couplers, and reducing fittings — every joint sealed perfectly.",
        stats: [
            { value: "100%", label: "Leak-Proof" },
            { value: "All Sizes", label: "Available" },
            { value: "Durable", label: "Build" },
        ],
        link: "/products/fittings",
    },
    sensors: {
        label: "Smart Sensors",
        icon: Zap,
        badge: "IoT Farm Tech",
        headline: "Smart Sensors,",
        headlineAccent: "Real-Time Data",
        description: "Soil moisture, rain, and flow sensors that automate your irrigation based on live field conditions.",
        stats: [
            { value: "Live", label: "Data" },
            { value: "Auto", label: "Irrigation" },
            { value: "IoT", label: "Connected" },
        ],
        link: "/products/sensors",
    },
    garden_irrigation: {
        label: "Garden Irrigation",
        icon: Droplets,
        badge: "Home & Garden",
        headline: "Beautiful Gardens,",
        headlineAccent: "Zero Effort",
        description: "Micro-drip kits and garden soaker hoses for home gardens, greenhouses, and flower beds.",
        stats: [
            { value: "Easy", label: "Install" },
            { value: "Low", label: "Water Use" },
            { value: "Lush", label: "Results" },
        ],
        link: "/products/garden",
    },
};

/* Preferred display order — additional DB categories will follow after */
const PREFERRED_ORDER = [
    "drip_irrigation", "sprinkler_systems", "pumps", "water_pumps",
    "filtration_systems", "control_systems", "pipes", "valves",
    "fittings", "tools", "sensors", "garden_irrigation", "accessories",
];

/* Generate a sensible fallback config for any unknown category */
function buildFallbackConfig(cat: string) {
    const label = cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
        label,
        icon: LayoutGrid,
        badge: "DripTech Products",
        headline: `${label},`,
        headlineAccent: "Built for Kenya",
        description: `Quality ${label.toLowerCase()} products for smallholder and commercial farmers across Kenya.`,
        stats: [
            { value: "Quality", label: "Grade" },
            { value: "Local", label: "Support" },
            { value: "Warranty", label: "Included" },
        ],
        link: `/products/${cat}`,
    };
}

const TRUST = ["Quality Guaranteed", "Certified Installation", "Local Kenyan Business"];

/* ─────────────────────────────────────────────── */
const HeroSectionImproved = () => {
    const [current, setCurrent] = useState(0);
    const [animKey, setAnimKey] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [scrolled, setScrolled] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const progressKey = useRef(0);

    const { products } = useWhatsAppProducts();

    const slides = useMemo(() => {
        /* Group ALL products by category */
        const byCategory: Record<string, typeof products> = {};
        for (const p of products) {
            if (!byCategory[p.category]) byCategory[p.category] = [];
            byCategory[p.category].push(p);
        }
        /* Only categories that have at least one product with an image */
        const allCats = Object.keys(byCategory).filter(
            (cat) => byCategory[cat].some((p) => p.images?.length)
        );
        /* Preferred order first, then any remaining categories alphabetically */
        const ordered = [
            ...PREFERRED_ORDER.filter((c) => allCats.includes(c)),
            ...allCats.filter((c) => !PREFERRED_ORDER.includes(c)).sort(),
        ];
        return ordered.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat] ?? buildFallbackConfig(cat);
            const featured = [...byCategory[cat]]
                .filter((p) => p.images?.length)
                .sort((a, b) => (b.images?.length ?? 0) - (a.images?.length ?? 0))
                .slice(0, 30);
            return { ...cfg, category: cat, products: featured };
        });
    }, [products]);

    useEffect(() => {
        if (slides.length && current >= slides.length) { setCurrent(0); setAnimKey((k) => k + 1); }
    }, [slides.length, current]);

    const goTo = useCallback((index: number) => {
        if (isTransitioning || index === current || !slides.length) return;
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrent(index); setAnimKey((k) => k + 1); progressKey.current++; setIsTransitioning(false);
        }, 80);
    }, [current, isTransitioning, slides.length]);

    const goNext = useCallback(() => slides.length && goTo((current + 1) % slides.length), [current, goTo, slides.length]);
    const goPrev = useCallback(() => slides.length && goTo((current - 1 + slides.length) % slides.length), [current, goTo, slides.length]);

    useEffect(() => {
        if (isPaused || slides.length <= 1) return;
        const t = setInterval(goNext, 6000);
        return () => clearInterval(t);
    }, [isPaused, goNext, slides.length]);

    useEffect(() => {
        const h = (e: MouseEvent) => setMousePos({ x: (e.clientX / window.innerWidth) * 10, y: (e.clientY / window.innerHeight) * 10 });
        window.addEventListener("mousemove", h);
        return () => window.removeEventListener("mousemove", h);
    }, []);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", h);
        return () => window.removeEventListener("scroll", h);
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const d = touchStart - e.changedTouches[0].clientX;
        if (Math.abs(d) > 48) d > 0 ? goNext() : goPrev();
        setTouchStart(null);
    };

    const slide = slides[current];
    const isLoading = products.length === 0;

    const [cardIdx, setCardIdx] = useState(0);
    useEffect(() => { setCardIdx(0); }, [current]);
    useEffect(() => {
        if (!slide || slide.products.length <= 1) return;
        const t = setInterval(() => setCardIdx((i) => (i + 1) % slide.products.length), 4000);
        return () => clearInterval(t);
    }, [slide]);
    const cardProduct = slide?.products[cardIdx];

    const call = () => window.open("tel:+254794494515", "_self");
    const openWhatsApp = () => {
        const msg = encodeURIComponent(`Hi DripTech! I'm interested in ${slide?.label ?? "your irrigation systems"}.`);
        window.open(`https://wa.me/254794494515?text=${msg}`, "_blank");
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,800;0,900;1,800&display=swap');

        @keyframes hfu { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes progressFill { from{width:0%} to{width:100%} }

        .hfu   { animation:hfu .48s cubic-bezier(.16,1,.3,1) both }
        .hfu-1 { animation-delay:45ms }
        .hfu-2 { animation-delay:90ms }
        .hfu-3 { animation-delay:135ms }
        .hfu-4 { animation-delay:180ms }
        .hfu-5 { animation-delay:225ms }
        .hfu-6 { animation-delay:270ms }

        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}

        /* fully opaque nav buttons — readable in both themes on any bg */
        .nav-btn {
          width:36px;height:36px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          background:hsl(var(--card));
          border:1px solid hsl(var(--border));
          color:hsl(var(--foreground));
          cursor:pointer;flex-shrink:0;
          box-shadow:0 1px 4px rgba(0,0,0,.15);
          transition:background .15s,transform .15s;
        }
        .nav-btn:hover{background:hsl(var(--muted));transform:scale(1.06)}
        @media(min-width:640px){.nav-btn{width:40px;height:40px}}

        /* category chips */
        .chip {
          display:inline-flex;align-items:center;gap:4px;
          padding:.28rem .65rem;border-radius:99px;
          font-size:.65rem;font-weight:700;white-space:nowrap;cursor:pointer;
          border:1px solid hsl(var(--border));
          background:hsl(var(--card));color:hsl(var(--foreground));
          box-shadow:0 1px 3px rgba(0,0,0,.1);
          transition:background .15s,border-color .15s;
        }
        .chip:hover{background:hsl(var(--muted))}
        @media(min-width:640px){.chip{font-size:.7rem;padding:.32rem .8rem;gap:5px}}
        .chip-active{
          background:hsl(var(--primary))!important;
          border-color:hsl(var(--primary))!important;
          color:hsl(var(--primary-foreground))!important;
        }

        /* frosted-glass panel — readable on any photo, any theme */
        .tp {
          background:hsl(var(--card)/.93);
          backdrop-filter:blur(12px);
          -webkit-backdrop-filter:blur(12px);
          border:1px solid hsl(var(--border)/.65);
        }

        /* stat pill */
        .sp {
          display:flex;flex-direction:column;align-items:center;
          padding:.35rem .6rem;border-radius:.55rem;
          background:hsl(var(--card)/.93);
          backdrop-filter:blur(8px);
          border:1px solid hsl(var(--border)/.65);
          min-width:54px;
        }
      `}</style>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Product",
                        name: "DripTech Smart Irrigation Systems",
                        description: "Affordable smart drip irrigation kits, sprinklers, and water pumps for smallholder and commercial farmers in Kenya.",
                        brand: { "@type": "Brand", name: "DripTech" },
                    }),
                }}
            />

            <section
                className="relative w-full bg-background overflow-x-hidden"
                style={{ minHeight: "100svh" }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                itemScope itemType="https://schema.org/Product"
                aria-label="DripTech — irrigation solutions"
            >
                {/* ── Background ── */}
                <div className="absolute inset-0 z-0">
                    {isLoading ? (
                        <div className="w-full h-full bg-muted animate-pulse" />
                    ) : slides.map((s, i) => {
                        const img = s.products[0]?.images?.[0];
                        return (
                            <div
                                key={s.category}
                                className="absolute inset-0 transition-opacity duration-700"
                                style={{ opacity: i === current ? (isTransitioning ? 0 : 1) : 0 }}
                            >
                                {img && (
                                    <img
                                        src={img}
                                        alt={`${s.label} — DripTech Kenya`}
                                        className="absolute inset-0 w-full h-full object-cover object-center"
                                        style={{
                                            transform: i === current
                                                ? `translate(${mousePos.x * -0.15}px,${mousePos.y * -0.15}px)`
                                                : "none",
                                            transition: "transform 1.8s ease-out",
                                        }}
                                        loading={i === 0 ? "eager" : "lazy"}
                                    />
                                )}
                                {/* 3-layer overlay: flat tint + left gradient + bottom gradient */}
                                <div className="absolute inset-0 bg-black/30 dark:bg-black/55" />
                                <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                            </div>
                        );
                    })}
                </div>

                {/* ── Content wrapper ── */}
                <div className="relative z-10 flex flex-col" style={{ minHeight: "100svh" }}>

                    {/* Main content */}
                    <div className="flex-1 flex items-start lg:items-center">
                        <div className="w-full container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-0 pb-4">

                            {isLoading ? (
                                <div className="flex flex-col gap-3 max-w-md py-10">
                                    {[75, 55, 40].map((w, i) => (
                                        <div key={i} className="h-6 bg-muted/60 rounded-xl animate-pulse" style={{ width: `${w}%` }} />
                                    ))}
                                </div>
                            ) : slide ? (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-10 xl:gap-12 items-center py-5 lg:py-0">

                                    {/* ── LEFT: text ── */}
                                    <div key={animKey} className="col-span-1 lg:col-span-7 flex flex-col gap-2.5 sm:gap-3.5">

                                        {/*
                      MOBILE: badge + category label inline to save vertical space
                      DESKTOP: stacked
                    */}
                                        <div className="hfu flex flex-wrap items-center gap-2">
                                            {/* Badge pill */}
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 tp" style={{ borderRadius: "99px" }}>
                                                <Leaf className="w-3 h-3 text-accent flex-shrink-0" />
                                                <span className="text-[10px] font-bold text-foreground uppercase tracking-widest leading-none">
                                                    {slide.badge}
                                                </span>
                                            </span>
                                            {/* Category pill */}
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 tp" style={{ borderRadius: "99px" }}>
                                                <slide.icon className="w-3 h-3 text-primary flex-shrink-0" />
                                                <span className="text-[10px] font-extrabold text-foreground uppercase tracking-widest leading-none">
                                                    {slide.label}
                                                </span>
                                            </span>
                                        </div>

                                        {/* Headline — fluid size, never wraps more than 2 lines */}
                                        <h1
                                            className="hfu hfu-2 font-black leading-[1.08] tracking-tight text-foreground"
                                            style={{
                                                fontFamily: "'Playfair Display', serif",
                                                fontSize: "clamp(1.6rem, 6.5vw, 4.25rem)",
                                                maxWidth: "18ch",
                                            }}
                                            itemProp="name"
                                        >
                                            {slide.headline}
                                            <br />
                                            <span className="text-accent">{slide.headlineAccent}</span>
                                        </h1>

                                        {/* Description — solid frosted panel, full foreground text */}
                                        <p
                                            className="hfu hfu-3 text-xs sm:text-sm lg:text-base text-foreground leading-relaxed tp"
                                            style={{
                                                fontFamily: "'Outfit', sans-serif",
                                                borderLeft: "3px solid hsl(var(--primary))",
                                                borderRadius: "0 .5rem .5rem 0",
                                                padding: ".55rem .7rem .55rem .75rem",
                                                maxWidth: "42ch",
                                            }}
                                            itemProp="description"
                                        >
                                            {slide.description}
                                        </p>

                                        {/* Stats — compact pills in a row */}
                                        <div className="hfu hfu-4 flex flex-wrap gap-1.5 sm:gap-2">
                                            {slide.stats.map((s) => (
                                                <div key={s.label} className="sp">
                                                    <span className="text-base sm:text-lg font-black text-foreground tabular-nums leading-none">{s.value}</span>
                                                    <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-0.5 whitespace-nowrap leading-none">{s.label}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* CTA buttons — side-by-side even on mobile */}
                                        <div className="hfu hfu-5 flex flex-row flex-wrap gap-2">
                                            <Button
                                                onClick={call}
                                                size="sm"
                                                className="h-10 px-4 rounded-full bg-[#25D366] hover:bg-[#1ea952] text-white font-bold text-xs sm:text-sm border-none shadow-md hover:shadow-lg hover:scale-[1.02] transition-all group flex-shrink-0"
                                                aria-label="Call DripTech"
                                            >
                                                <Phone className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                                                <span style={{ fontFamily: "'Outfit', sans-serif" }}>Call Now</span>
                                            </Button>

                                            <Button
                                                onClick={openWhatsApp}
                                                size="sm"
                                                className="h-10 px-4 rounded-full font-bold text-xs sm:text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex-shrink-0"
                                                aria-label="WhatsApp DripTech"
                                            >
                                                <span className="mr-1.5">💬</span>
                                                <span style={{ fontFamily: "'Outfit', sans-serif" }}>WhatsApp</span>
                                            </Button>

                                            <Link to={slide.link} className="hidden sm:inline-flex">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-10 px-4 rounded-full tp border-border text-foreground hover:bg-muted text-sm font-semibold group"
                                                >
                                                    View {slide.label}
                                                    <ArrowRight className="ml-1 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                                </Button>
                                            </Link>
                                        </div>

                                        {/* Trust — hidden on very small screens to save space */}
                                        <div className="hfu hfu-6 hidden xs:flex flex-wrap gap-x-4 gap-y-1 text-[10px] sm:text-xs border-t border-border/60 pt-2.5">
                                            {TRUST.map((item) => (
                                                <div key={item} className="flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3 text-accent flex-shrink-0" />
                                                    <span className="text-foreground font-medium">{item}</span>
                                                </div>
                                            ))}
                                        </div>

                                    </div>

                                    {/* ── RIGHT: product card (lg+ only) ── */}
                                    <div
                                        key={`card-${animKey}`}
                                        className="col-span-5 hidden lg:flex justify-center items-center"
                                        style={{ animation: "hfu .6s .1s cubic-bezier(.16,1,.3,1) both" }}
                                    >
                                        <div className="relative w-full max-w-[320px] xl:max-w-[355px]">
                                            <div className="relative bg-card/92 dark:bg-card/85 backdrop-blur-2xl border border-border rounded-2xl p-4 shadow-xl overflow-hidden">
                                                <div className="absolute top-0 inset-x-0 h-[3px] bg-primary" />

                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                            <slide.icon className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-card-foreground text-sm leading-tight">{slide.label}</p>
                                                            <p className="text-muted-foreground text-xs">DripTech EcoFlow</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse block" />
                                                        <span className="text-[9px] font-bold text-accent uppercase tracking-wide">Live</span>
                                                    </div>
                                                </div>

                                                <div className="relative rounded-xl overflow-hidden bg-muted/30 mb-3 aspect-[4/3]">
                                                    {cardProduct?.images?.[0] ? (
                                                        <img
                                                            src={cardProduct.images[0]}
                                                            alt={`${cardProduct.name} — DripTech`}
                                                            className="w-full h-full object-cover"
                                                            itemProp="image"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full">
                                                            <slide.icon className="w-12 h-12 text-muted-foreground/20" />
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-2 right-2 bg-card/95 backdrop-blur-sm px-2 py-1 rounded-md border border-border shadow">
                                                        <span className="text-foreground font-bold text-xs" itemProp="price">
                                                            KSh {cardProduct?.price?.toLocaleString() ?? "—"}
                                                        </span>
                                                    </div>
                                                    {slide.products.length > 1 && (
                                                        <div className="absolute top-2 left-2 flex gap-1 items-center">
                                                            {slide.products.slice(0, 5).map((_, pi) => (
                                                                <span
                                                                    key={pi}
                                                                    className="block rounded-full transition-all"
                                                                    style={{
                                                                        width: pi === cardIdx ? 10 : 6, height: 6,
                                                                        background: pi === cardIdx ? "hsl(var(--primary))" : "rgba(255,255,255,.4)",
                                                                    }}
                                                                />
                                                            ))}
                                                            {slide.products.length > 5 && (
                                                                <span className="text-[9px] text-white/70 font-bold ml-0.5">+{slide.products.length - 5}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <h4 className="font-bold text-card-foreground text-sm leading-snug line-clamp-2">
                                                        {cardProduct?.name ?? `${slide.label} System`}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {slide.stats.map((s) => (
                                                            <span key={s.label} className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/50 text-[10px] font-medium text-muted-foreground">
                                                                {s.value} {s.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <Button size="sm" className="w-full rounded-lg h-8 font-semibold text-xs hover:scale-[1.02] transition-transform" onClick={openWhatsApp}>
                                                        Inquire on WhatsApp
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="absolute -top-3 -right-3 bg-card border border-border rounded-xl px-2.5 py-1.5 shadow-lg">
                                                <p className="text-[9px] text-muted-foreground font-medium">Yield boost</p>
                                                <p className="text-base font-black text-accent">+60%</p>
                                            </div>
                                            <div className="absolute -bottom-3 -left-3 bg-card border border-border rounded-xl px-2.5 py-1.5 shadow-lg">
                                                <p className="text-[9px] text-muted-foreground font-medium">Water saved</p>
                                                <p className="text-base font-black text-primary">50%</p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* ── Navigation strip — sticks to bottom ── */}
                    <div className="mt-auto bg-gradient-to-t from-background/96 via-background/70 to-transparent pt-4 pb-3 sm:pb-5">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">

                            {/* Category chips */}
                            {slides.length > 1 && (
                                <div
                                    className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-2.5"
                                    style={{ paddingBottom: 4, paddingRight: 20 }}
                                >
                                    {slides.map((s, i) => (
                                        <button
                                            key={s.category}
                                            onClick={() => goTo(i)}
                                            aria-label={`View ${s.label}`}
                                            aria-pressed={i === current}
                                            className={`chip${i === current ? " chip-active" : ""}`}
                                            style={{ flexShrink: 0 }}
                                        >
                                            <s.icon className="w-2.5 h-2.5 flex-shrink-0" />
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Prev / dots / next */}
                            <div className="flex items-center justify-between gap-3">
                                <button className="nav-btn" onClick={goPrev} aria-label="Previous">
                                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>

                                <div className="flex items-center gap-1.5">
                                    {slides.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => goTo(i)}
                                            aria-label={`Slide ${i + 1}`}
                                            className="relative overflow-hidden rounded-full focus:outline-none transition-all duration-300"
                                            style={{
                                                width: i === current ? 24 : 7, height: 7,
                                                background: i === current ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/.38)",
                                            }}
                                        >
                                            {i === current && (
                                                <span
                                                    key={progressKey.current}
                                                    className="absolute inset-y-0 left-0 rounded-full"
                                                    style={{
                                                        background: "hsl(var(--primary-foreground)/.28)",
                                                        animation: "progressFill 6s linear forwards",
                                                        animationPlayState: isPaused ? "paused" : "running",
                                                    }}
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <button className="nav-btn" onClick={goNext} aria-label="Next">
                                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            {slides.length > 1 && (
                                <p className="text-center text-[9px] text-muted-foreground/45 font-medium mt-1.5 tabular-nums">
                                    {current + 1} / {slides.length}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scroll hint */}
                {!scrolled && (
                    <button
                        onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
                        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30 hover:opacity-55 transition-opacity animate-bounce border-none bg-transparent cursor-pointer p-0"
                        style={{ bottom: "4.5rem", zIndex: 20 }}
                        aria-label="Scroll down"
                    >
                        <span className="text-[9px] text-foreground uppercase tracking-widest font-bold">Scroll</span>
                        <div className="w-px h-6 bg-gradient-to-b from-foreground/60 to-transparent" />
                    </button>
                )}
            </section>
        </>
    );
};

export default HeroSectionImproved;
