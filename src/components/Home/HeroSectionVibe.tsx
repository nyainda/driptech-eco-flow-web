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

/* ─── Category Configs ─────────────────────────────────────────────── */
const CATEGORY_CONFIG: Record<string, {
    label: string; icon: LucideIcon; badge: string;
    headline: string; headlineAccent: string; description: string;
    stats: { value: string; label: string }[]; link: string;
}> = {
    drip_irrigation: {
        label: "Drip Irrigation", icon: Droplets, badge: "Kenya's #1 Drip System",
        headline: "Precision Watering,", headlineAccent: "Maximum Yield",
        description: "Deliver water directly to roots with near-zero evaporation — from ¼ acre to 100+ acres.",
        stats: [{ value: "50%", label: "Less Water" }, { value: "60%", label: "More Yield" }, { value: "5yr", label: "Warranty" }],
        link: "/products/drip",
    },
    sprinkler_systems: {
        label: "Sprinkler Systems", icon: Zap, badge: "Wide-Area Coverage",
        headline: "Uniform Coverage,", headlineAccent: "Zero Water Waste",
        description: "Blanket large fields evenly with precision pressure regulation and smart scheduling.",
        stats: [{ value: "5×", label: "Coverage" }, { value: "40%", label: "Water Saved" }, { value: "360°", label: "Rotation" }],
        link: "/products/sprinklers",
    },
    filtration_systems: {
        label: "Filtration", icon: Filter, badge: "Protect Your Investment",
        headline: "Clean Water,", headlineAccent: "Longer System Life",
        description: "Multi-stage filtration removes 99.9% of sediment — protecting drippers and extending lifespan.",
        stats: [{ value: "99.9%", label: "Filtration" }, { value: "3×", label: "System Life" }, { value: "Low", label: "Maintenance" }],
        link: "/products/filtration",
    },
    control_systems: {
        label: "Control Systems", icon: Settings, badge: "Smart Farm Technology",
        headline: "Automate Everything,", headlineAccent: "Farm Smarter",
        description: "Manage your farm from your phone. Timer controllers, soil sensors, and IoT valves work 24/7.",
        stats: [{ value: "24/7", label: "Automation" }, { value: "80%", label: "Labour Saved" }, { value: "IoT", label: "Connected" }],
        link: "/products/controls",
    },
    accessories: {
        label: "Complete Kits", icon: LayoutGrid, badge: "Ready in a Day",
        headline: "All-In-One Kits,", headlineAccent: "Ready to Install",
        description: "Everything in one box — drippers, pipes, fittings, filter, valve. Installed within 24 hours.",
        stats: [{ value: "1 Day", label: "Install" }, { value: "All-In", label: "One Box" }, { value: "Free", label: "Site Visit" }],
        link: "/irrigation-kits",
    },
    pumps: {
        label: "Water Pumps", icon: Zap, badge: "High-Pressure Pumping",
        headline: "Reliable Pumps,", headlineAccent: "Peak Farm Flow",
        description: "Solar, electric, and petrol pumps — from borehole extraction to field distribution.",
        stats: [{ value: "Solar", label: "Powered" }, { value: "High", label: "Pressure" }, { value: "24/7", label: "Reliable" }],
        link: "/products/pumps",
    },
    water_pumps: {
        label: "Water Pumps", icon: Zap, badge: "High-Pressure Pumping",
        headline: "Reliable Pumps,", headlineAccent: "Peak Farm Flow",
        description: "Solar, electric, and petrol pumps — from borehole extraction to field distribution.",
        stats: [{ value: "Solar", label: "Powered" }, { value: "High", label: "Pressure" }, { value: "24/7", label: "Reliable" }],
        link: "/products/pumps",
    },
    tools: {
        label: "Farm Tools", icon: Settings, badge: "Professional Grade",
        headline: "Quality Tools,", headlineAccent: "Built to Last",
        description: "Professional irrigation installation tools — hole punchers, pipe cutters, end caps, and connectors.",
        stats: [{ value: "Pro", label: "Grade" }, { value: "Durable", label: "Build" }, { value: "Easy", label: "Use" }],
        link: "/products/tools",
    },
    pipes: {
        label: "Pipes & Hoses", icon: Filter, badge: "UV-Resistant Grade",
        headline: "Strong Pipes,", headlineAccent: "Zero Leaks",
        description: "UV-resistant LDPE and HDPE pipes in all sizes — mainline, sub-mainline, and lateral lines.",
        stats: [{ value: "UV", label: "Resistant" }, { value: "HDPE", label: "Grade" }, { value: "All Sizes", label: "Available" }],
        link: "/products/pipes",
    },
    valves: {
        label: "Valves & Fittings", icon: Settings, badge: "Precision Control",
        headline: "Smart Valves,", headlineAccent: "Precise Control",
        description: "Ball valves, solenoids, check valves, and pressure regulators — full control of every water line.",
        stats: [{ value: "Precise", label: "Control" }, { value: "Low", label: "Leakage" }, { value: "Long", label: "Lifespan" }],
        link: "/products/valves",
    },
    fittings: {
        label: "Fittings", icon: Settings, badge: "Leak-Proof Connections",
        headline: "Secure Fittings,", headlineAccent: "Tight Connections",
        description: "Barbed connectors, tees, elbows, couplers, and reducing fittings — every joint sealed perfectly.",
        stats: [{ value: "100%", label: "Leak-Proof" }, { value: "All Sizes", label: "Available" }, { value: "Durable", label: "Build" }],
        link: "/products/fittings",
    },
    sensors: {
        label: "Smart Sensors", icon: Zap, badge: "IoT Farm Tech",
        headline: "Smart Sensors,", headlineAccent: "Real-Time Data",
        description: "Soil moisture, rain, and flow sensors that automate your irrigation based on live field conditions.",
        stats: [{ value: "Live", label: "Data" }, { value: "Auto", label: "Irrigation" }, { value: "IoT", label: "Connected" }],
        link: "/products/sensors",
    },
    garden_irrigation: {
        label: "Garden Irrigation", icon: Droplets, badge: "Home & Garden",
        headline: "Beautiful Gardens,", headlineAccent: "Zero Effort",
        description: "Micro-drip kits and garden soaker hoses for home gardens, greenhouses, and flower beds.",
        stats: [{ value: "Easy", label: "Install" }, { value: "Low", label: "Water Use" }, { value: "Lush", label: "Results" }],
        link: "/products/garden",
    },
};

const PREFERRED_ORDER = [
    "drip_irrigation", "sprinkler_systems", "pumps", "water_pumps",
    "filtration_systems", "control_systems", "pipes", "valves",
    "fittings", "tools", "sensors", "garden_irrigation", "accessories",
];

function buildFallbackConfig(cat: string) {
    const label = cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
        label, icon: LayoutGrid, badge: "DripTech Products",
        headline: `${label},`, headlineAccent: "Built for Kenya",
        description: `Quality ${label.toLowerCase()} products for smallholder and commercial farmers.`,
        stats: [{ value: "Quality", label: "Grade" }, { value: "Local", label: "Support" }, { value: "Warranty", label: "Included" }],
        link: `/products/${cat}`,
    };
}

const TRUST = ["Quality Guaranteed", "Certified Installation", "Local Kenyan Business"];

/* ─────────────────────────────────────────────────────── */
const HeroSectionVibe = () => {
    const [current, setCurrent] = useState(0);
    const [animKey, setAnimKey] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isTransitioning, setIsTransitioning] = useState(false);
    const progressKey = useRef(0);

    const { products } = useWhatsAppProducts();

    const slides = useMemo(() => {
        const byCategory: Record<string, typeof products> = {};
        for (const p of products) {
            if (!byCategory[p.category]) byCategory[p.category] = [];
            byCategory[p.category].push(p);
        }
        const allCats = Object.keys(byCategory).filter(
            (cat) => byCategory[cat].some((p) => p.images?.length)
        );
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

    const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const d = touchStart - e.changedTouches[0].clientX;
        if (Math.abs(d) > 48) d > 0 ? goNext() : goPrev();
        setTouchStart(null);
    };

    const slide = slides[current];
    const isLoading = products.length === 0;

    // Rotating product card index
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

        @keyframes hfu { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hfu-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes progressFill { from{width:0%} to{width:100%} }

        .hfu   { animation:hfu .48s cubic-bezier(.16,1,.3,1) both }
        .hfu-1 { animation-delay:40ms }
        .hfu-2 { animation-delay:80ms }
        .hfu-3 { animation-delay:120ms }
        .hfu-4 { animation-delay:160ms }
        .hfu-5 { animation-delay:200ms }

        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}

        .nav-btn {
          width:38px;height:38px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          background:hsl(var(--card)/.9);
          border:1px solid hsl(var(--border)/.8);
          color:hsl(var(--foreground));
          cursor:pointer;flex-shrink:0;
          backdrop-filter:blur(8px);
          box-shadow:0 2px 8px rgba(0,0,0,.2);
          transition:background .15s,transform .15s;
        }
        .nav-btn:hover{background:hsl(var(--card));transform:scale(1.06)}

        .chip {
          display:inline-flex;align-items:center;gap:4px;
          padding:.3rem .7rem;border-radius:99px;
          font-size:.65rem;font-weight:700;white-space:nowrap;cursor:pointer;
          border:1px solid hsl(var(--border));
          background:hsl(var(--card)/.9);
          color:hsl(var(--foreground));
          backdrop-filter:blur(8px);
          box-shadow:0 1px 4px rgba(0,0,0,.12);
          transition:background .15s;
          flex-shrink:0;
        }
        .chip:hover{background:hsl(var(--card))}
        .chip-active{
          background:hsl(var(--primary))!important;
          border-color:hsl(var(--primary))!important;
          color:hsl(var(--primary-foreground))!important;
        }

        /* Glass panel for mobile content overlay */
        .glass-panel {
          background:hsl(var(--background)/.82);
          backdrop-filter:blur(20px);
          -webkit-backdrop-filter:blur(20px);
          border-top:1px solid hsl(var(--border)/.5);
        }

        /* Solid panel for desktop text */
        .tp {
          background:hsl(var(--card)/.93);
          backdrop-filter:blur(12px);
          -webkit-backdrop-filter:blur(12px);
          border:1px solid hsl(var(--border)/.65);
        }

        .sp {
          display:flex;flex-direction:column;align-items:center;
          padding:.4rem .7rem;border-radius:.6rem;
          background:hsl(var(--card)/.85);
          backdrop-filter:blur(8px);
          border:1px solid hsl(var(--border)/.6);
          min-width:56px;flex-shrink:0;
        }
      `}</style>

            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org", "@type": "Product",
                    name: "DripTech Smart Irrigation Systems",
                    description: "Affordable smart irrigation kits, sprinklers, and water pumps for farmers in Kenya.",
                    brand: { "@type": "Brand", name: "DripTech" },
                }),
            }} />

            <section
                className="relative w-full bg-background overflow-hidden"
                style={{ height: "100svh" }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                aria-label="DripTech — irrigation solutions"
            >
                {/* ═══ BACKGROUND ═══ */}
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
                                                ? `translate(${mousePos.x * -0.12}px,${mousePos.y * -0.12}px) scale(1.02)`
                                                : "scale(1.02)",
                                            transition: "transform 2s ease-out",
                                        }}
                                        loading={i === 0 ? "eager" : "lazy"}
                                    />
                                )}
                                {/*
                  MOBILE  : top-to-bottom gradient — image breathes at top, dark at bottom for text
                  DESKTOP : left-to-right gradient — text readable on left, image visible on right
                */}
                                <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-black/10 via-black/20 to-background/97" />
                                <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-background/92 via-background/55 to-transparent" />
                                <div className="absolute inset-0 hidden lg:block bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                            </div>
                        );
                    })}
                </div>

                {/* ═══ LAYOUT ═══ */}
                <div className="relative z-10 h-full flex flex-col">

                    {/* ── MOBILE LAYOUT (hidden on lg+) ── */}
                    <div className="flex-1 flex flex-col justify-end lg:hidden pb-0">
                        {isLoading ? (
                            <div className="glass-panel p-4 flex flex-col gap-3">
                                {[60, 45, 35].map((w, i) => (
                                    <div key={i} className="h-5 bg-muted/50 rounded-lg animate-pulse" style={{ width: `${w}%` }} />
                                ))}
                            </div>
                        ) : slide ? (
                            <div key={animKey} className="glass-panel px-4 pt-4 pb-2">
                                {/* Badge row */}
                                <div className="hfu flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                                        <Leaf className="w-3 h-3 flex-shrink-0" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{slide.badge}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full tp">
                                        <slide.icon className="w-3 h-3 text-primary flex-shrink-0" />
                                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider leading-none">{slide.label}</span>
                                    </span>
                                </div>

                                {/* Headline */}
                                <h1
                                    className="hfu hfu-1 font-black leading-[1.06] tracking-tight text-foreground mb-2"
                                    style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.7rem, 7.5vw, 2.4rem)" }}
                                >
                                    {slide.headline}<br />
                                    <span className="text-accent">{slide.headlineAccent}</span>
                                </h1>

                                {/* Description — plain, no panel, save vertical space */}
                                <p className="hfu hfu-2 text-xs text-foreground/90 leading-relaxed mb-2.5 line-clamp-2"
                                    style={{ fontFamily: "'Outfit', sans-serif" }}>
                                    {slide.description}
                                </p>

                                {/* Stats row */}
                                <div className="hfu hfu-3 flex gap-2 mb-3">
                                    {slide.stats.map((s) => (
                                        <div key={s.label} className="sp">
                                            <span className="text-sm font-black text-foreground tabular-nums leading-none">{s.value}</span>
                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide mt-0.5 leading-none">{s.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA buttons */}
                                <div className="hfu hfu-4 flex gap-2 mb-3">
                                    <Button
                                        onClick={call}
                                        size="sm"
                                        className="flex-1 h-10 rounded-full bg-[#25D366] hover:bg-[#1ea952] text-white font-bold text-xs border-none shadow-md"
                                        style={{ fontFamily: "'Outfit', sans-serif" }}
                                    >
                                        <Phone className="w-3.5 h-3.5 mr-1.5" /> Call Now
                                    </Button>
                                    <Button
                                        onClick={openWhatsApp}
                                        size="sm"
                                        className="flex-1 h-10 rounded-full font-bold text-xs shadow-md"
                                        style={{ fontFamily: "'Outfit', sans-serif" }}
                                    >
                                        💬 WhatsApp
                                    </Button>
                                    <Link to={slide.link}>
                                        <Button variant="outline" size="sm" className="h-10 w-10 rounded-full tp border-border p-0 flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-foreground" />
                                        </Button>
                                    </Link>
                                </div>

                                {/* Trust strip */}
                                <div className="hfu hfu-5 flex items-center justify-between border-t border-border/40 pt-2 pb-1">
                                    {TRUST.map((item) => (
                                        <div key={item} className="flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3 text-accent flex-shrink-0" />
                                            <span className="text-[9px] text-foreground/80 font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* ── DESKTOP LAYOUT (hidden below lg) ── */}
                    <div className="hidden lg:flex flex-1 items-center">
                        <div className="w-full container mx-auto px-6 lg:px-8">
                            {isLoading ? (
                                <div className="flex flex-col gap-4 max-w-md">
                                    {[70, 50, 40].map((w, i) => (
                                        <div key={i} className="h-7 bg-muted/60 rounded-xl animate-pulse" style={{ width: `${w}%` }} />
                                    ))}
                                </div>
                            ) : slide ? (
                                <div className="grid grid-cols-12 gap-10 xl:gap-12 items-center">

                                    {/* Desktop text column */}
                                    <div key={animKey} className="col-span-7 flex flex-col gap-4">
                                        <div className="hfu flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 tp" style={{ borderRadius: "99px" }}>
                                                <Leaf className="w-3.5 h-3.5 text-accent" />
                                                <span className="text-xs font-bold text-foreground uppercase tracking-widest">{slide.badge}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 tp" style={{ borderRadius: "99px" }}>
                                                <slide.icon className="w-3.5 h-3.5 text-primary" />
                                                <span className="text-xs font-extrabold text-foreground uppercase tracking-widest">{slide.label}</span>
                                            </span>
                                        </div>

                                        <h1
                                            className="hfu hfu-2 font-black leading-[1.06] tracking-tight text-foreground"
                                            style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.4rem, 4.5vw, 4.25rem)", maxWidth: "16ch" }}
                                        >
                                            {slide.headline}<br />
                                            <span className="text-accent">{slide.headlineAccent}</span>
                                        </h1>

                                        <p
                                            className="hfu hfu-3 text-sm xl:text-base text-foreground leading-relaxed tp"
                                            style={{
                                                fontFamily: "'Outfit', sans-serif",
                                                borderLeft: "3px solid hsl(var(--primary))",
                                                borderRadius: "0 .5rem .5rem 0",
                                                padding: ".6rem .8rem .6rem .85rem",
                                                maxWidth: "44ch",
                                            }}
                                        >
                                            {slide.description}
                                        </p>

                                        <div className="hfu hfu-4 flex flex-wrap gap-2">
                                            {slide.stats.map((s) => (
                                                <div key={s.label} className="sp">
                                                    <span className="text-xl font-black text-foreground tabular-nums leading-none">{s.value}</span>
                                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-1 leading-none">{s.label}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="hfu hfu-5 flex gap-3">
                                            <Button onClick={call} size="default"
                                                className="h-11 px-5 rounded-full bg-[#25D366] hover:bg-[#1ea952] text-white font-bold border-none shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                                                <Phone className="w-4 h-4 mr-2" />
                                                <span style={{ fontFamily: "'Outfit', sans-serif" }}>Call Now</span>
                                            </Button>
                                            <Button onClick={openWhatsApp} size="default"
                                                className="h-11 px-5 rounded-full font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                                                <span className="mr-2">💬</span>
                                                <span style={{ fontFamily: "'Outfit', sans-serif" }}>WhatsApp</span>
                                            </Button>
                                            <Link to={slide.link}>
                                                <Button variant="outline" size="default"
                                                    className="h-11 px-5 rounded-full tp border-border text-foreground hover:bg-muted font-semibold group">
                                                    View {slide.label}
                                                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                </Button>
                                            </Link>
                                        </div>

                                        <div className="hfu flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border/50 pt-3">
                                            {TRUST.map((item) => (
                                                <div key={item} className="flex items-center gap-1.5">
                                                    <CheckCircle className="h-3.5 w-3.5 text-accent" />
                                                    <span className="text-xs text-foreground font-medium">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Desktop product card */}
                                    <div key={`card-${animKey}`} className="col-span-5 flex justify-center items-center"
                                        style={{ animation: "hfu .6s .1s cubic-bezier(.16,1,.3,1) both" }}>
                                        <div className="relative w-full max-w-[330px] xl:max-w-[360px]">
                                            <div className="relative bg-card/92 backdrop-blur-2xl border border-border rounded-2xl p-4 shadow-2xl overflow-hidden">
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
                                                        <img src={cardProduct.images[0]} alt={`${cardProduct.name} — DripTech`}
                                                            className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full">
                                                            <slide.icon className="w-12 h-12 text-muted-foreground/20" />
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-2 right-2 bg-card/95 backdrop-blur-sm px-2 py-1 rounded-md border border-border shadow">
                                                        <span className="text-foreground font-bold text-xs">
                                                            KSh {cardProduct?.price?.toLocaleString() ?? "—"}
                                                        </span>
                                                    </div>
                                                    {slide.products.length > 1 && (
                                                        <div className="absolute top-2 left-2 flex gap-1 items-center">
                                                            {slide.products.slice(0, 5).map((_, pi) => (
                                                                <span key={pi} className="block rounded-full transition-all"
                                                                    style={{
                                                                        width: pi === cardIdx ? 10 : 6, height: 6,
                                                                        background: pi === cardIdx ? "hsl(var(--primary))" : "rgba(255,255,255,.4)",
                                                                    }} />
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
                                                            <span key={s.label}
                                                                className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/50 text-[10px] font-medium text-muted-foreground">
                                                                {s.value} {s.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <Button size="sm" className="w-full rounded-lg h-8 font-semibold text-xs hover:scale-[1.02] transition-transform"
                                                        onClick={openWhatsApp}>
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

                    {/* ═══ NAV STRIP (both mobile & desktop) ═══ */}
                    <div className="flex-shrink-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-3 pb-safe">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-3">
                            {/* Category chips */}
                            {slides.length > 1 && (
                                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-2.5"
                                    style={{ paddingBottom: 4, paddingRight: 20 }}>
                                    {slides.map((s, i) => (
                                        <button key={s.category} onClick={() => goTo(i)}
                                            aria-label={`View ${s.label}`} aria-pressed={i === current}
                                            className={`chip${i === current ? " chip-active" : ""}`}>
                                            <s.icon className="w-2.5 h-2.5 flex-shrink-0" />
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Prev / dots / next */}
                            <div className="flex items-center justify-between gap-3">
                                <button className="nav-btn" onClick={goPrev} aria-label="Previous">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-1.5">
                                    {slides.map((_, i) => (
                                        <button key={i} onClick={() => goTo(i)}
                                            aria-label={`Slide ${i + 1}`}
                                            className="relative overflow-hidden rounded-full focus:outline-none transition-all duration-300"
                                            style={{
                                                width: i === current ? 24 : 7, height: 7,
                                                background: i === current ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/.35)",
                                            }}>
                                            {i === current && (
                                                <span key={progressKey.current}
                                                    className="absolute inset-y-0 left-0 rounded-full"
                                                    style={{
                                                        background: "hsl(var(--primary-foreground)/.3)",
                                                        animation: "progressFill 6s linear forwards",
                                                        animationPlayState: isPaused ? "paused" : "running",
                                                    }} />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <button className="nav-btn" onClick={goNext} aria-label="Next">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {slides.length > 1 && (
                                <p className="text-center text-[9px] text-muted-foreground/40 font-medium mt-1.5 tabular-nums">
                                    {current + 1} / {slides.length}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default HeroSectionVibe;
