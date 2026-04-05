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
    Phone,
    MessageCircle,
    Star,
    ShieldCheck,
} from "lucide-react";
import { useWhatsAppProducts } from "@/hooks/useWhatsAppProducts";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

/* ─── Category Configs ─────────────────────────────────────────────── */
const CATEGORY_CONFIG: Record<string, {
    label: string; icon: LucideIcon; badge: string;
    headline: string; headlineAccent: string; description: string;
    stats: { value: string; label: string }[]; link: string;
    color: string; fallbackImage: string;
}> = {
    drip_irrigation: {
        label: "Drip", icon: Droplets, badge: "Kenya's #1 Choice",
        headline: "Precision Watering,", headlineAccent: "Maximum Yield",
        description: "Water delivered directly to roots. Near-zero evaporation. From ¼ acre to 100+ acres.",
        stats: [{ value: "50%", label: "Less Water" }, { value: "60%", label: "More Yield" }, { value: "5yr", label: "Warranty" }],
        link: "/products/drip", color: "#10b981",
        fallbackImage: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=80",
    },
    sprinkler_systems: {
        label: "Sprinklers", icon: Zap, badge: "Wide Area Coverage",
        headline: "Uniform Coverage,", headlineAccent: "Zero Waste",
        description: "Blanket large fields evenly with precision pressure regulation and smart scheduling.",
        stats: [{ value: "5×", label: "Coverage" }, { value: "40%", label: "Water Saved" }, { value: "360°", label: "Rotation" }],
        link: "/products/sprinklers", color: "#06b6d4",
        fallbackImage: "https://images.unsplash.com/photo-1563880748-3e4bfe0dae5b?w=1920&q=80",
    },
    filtration_systems: {
        label: "Filtration", icon: Filter, badge: "Protect Your System",
        headline: "Clean Water,", headlineAccent: "Longer Life",
        description: "Multi-stage filtration removes 99.9% of sediment. Protects drippers, extends system lifespan.",
        stats: [{ value: "99.9%", label: "Filtration" }, { value: "3×", label: "System Life" }, { value: "Low", label: "Maintenance" }],
        link: "/products/filtration", color: "#8b5cf6",
        fallbackImage: "https://images.unsplash.com/photo-1553530666-aa57c929c8a0?w=1920&q=80",
    },
    control_systems: {
        label: "Controls", icon: Settings, badge: "Smart Farm Tech",
        headline: "Automate Everything,", headlineAccent: "Farm Smarter",
        description: "Run your farm from your phone. IoT valves, soil sensors, and auto-timers — 24/7.",
        stats: [{ value: "24/7", label: "Automation" }, { value: "80%", label: "Labour Saved" }, { value: "IoT", label: "Connected" }],
        link: "/products/controls", color: "#f59e0b",
        fallbackImage: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1920&q=80",
    },
    accessories: {
        label: "Full Kits", icon: LayoutGrid, badge: "Ready in a Day",
        headline: "All-In-One Kits,", headlineAccent: "Installed Fast",
        description: "Everything in one box — drippers, pipes, fittings, filter, valve. Ready within 24 hours.",
        stats: [{ value: "1 Day", label: "Install" }, { value: "All-In", label: "One Box" }, { value: "Free", label: "Site Visit" }],
        link: "/irrigation-kits", color: "#10b981",
        fallbackImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80",
    },
};

const CATEGORY_ORDER = ["drip_irrigation", "sprinkler_systems", "filtration_systems", "control_systems", "accessories"];

interface Slide {
    category: string;
    label: string;
    products: any[];
    config: typeof CATEGORY_CONFIG[string];
}

export default function HeroSectionVibe() {
    const { products, loading: isLoading } = useWhatsAppProducts();
    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const progressKey = useRef(0);

    const slides: Slide[] = useMemo(() => {
        return CATEGORY_ORDER
            .map(cat => {
                const config = CATEGORY_CONFIG[cat];
                if (!config) return null;
                const prods = products.filter((p: any) => p.category === cat);
                return { category: cat, label: config.label, products: prods, config };
            })
            .filter(Boolean) as Slide[];
    }, [products]);

    const goTo = useCallback((idx: number) => {
        if (idx === current) return;
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrent(idx);
            progressKey.current++;
            setIsTransitioning(false);
        }, 280);
    }, [current]);

    const goNext = useCallback(() => goTo((current + 1) % Math.max(slides.length, 1)), [current, slides.length, goTo]);
    const goPrev = useCallback(() => goTo((current - 1 + Math.max(slides.length, 1)) % Math.max(slides.length, 1)), [current, slides.length, goTo]);

    useEffect(() => {
        if (isPaused || slides.length <= 1) return;
        const t = setTimeout(goNext, 6000);
        return () => clearTimeout(t);
    }, [current, isPaused, slides.length, goNext]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        const dx = touchStartX.current - e.changedTouches[0].clientX;
        const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
        if (Math.abs(dx) > 50 && dy < 60) dx > 0 ? goNext() : goPrev();
    };

    const slide = slides[current];
    const config = slide?.config;
    const accentColor = config?.color ?? "#10b981";

    const whatsappOpen = () => window.open("https://wa.me/254794494515", "_blank");
    const phoneCall = () => window.open("tel:+254794494515");

    /* ── Loading skeleton ── */
    if (isLoading || slides.length === 0) {
        return (
            <section className="relative w-full bg-neutral-950" style={{ height: "100svh", minHeight: 580 }}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-neutral-950 to-neutral-950 animate-pulse" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="h-3 bg-white/10 rounded-full w-28 mb-5" />
                    <div className="h-10 bg-white/10 rounded-xl w-3/4 mb-2" />
                    <div className="h-10 bg-emerald-500/25 rounded-xl w-1/2 mb-6" />
                    <div className="flex gap-2 mb-5">
                        {[1, 2, 3].map(i => <div key={i} className="flex-1 h-14 bg-white/8 rounded-xl" />)}
                    </div>
                    <div className="h-14 bg-white/10 rounded-2xl mb-3" />
                    <div className="h-12 bg-white/6 rounded-2xl" />
                </div>
            </section>
        );
    }

    return (
        <>
            <style>{`
                @keyframes fadeUp {
                    from { opacity:0; transform:translateY(18px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                @keyframes progressFill {
                    from { width:0%; }
                    to   { width:100%; }
                }
                @keyframes ctaPulse {
                    0%,100% { box-shadow:0 0 0 0 rgba(16,185,129,.45); }
                    60%     { box-shadow:0 0 0 10px rgba(16,185,129,0); }
                }
                .hfu  { animation:fadeUp .52s cubic-bezier(.16,1,.3,1) both; }
                .d1   { animation-delay:0ms; }
                .d2   { animation-delay:55ms; }
                .d3   { animation-delay:110ms; }
                .d4   { animation-delay:165ms; }
                .d5   { animation-delay:215ms; }
                .scrollbar-hide::-webkit-scrollbar{display:none}
                .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
                .dot-fill{animation:progressFill 6s linear forwards;}
                .cta-main{animation:ctaPulse 2.8s infinite;}
            `}</style>

            <section
                className="relative w-full overflow-hidden bg-neutral-950"
                style={{ height: "100svh", minHeight: 580 }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                aria-label="DripTech — Smart Irrigation Solutions Kenya"
            >
                {/* ══ BACKGROUND ══ */}
                <div className="absolute inset-0 z-0">
                    {slides.map((s, i) => {
                        const img = s.products[0]?.images?.[0];
                        return (
                            <div key={s.category} className="absolute inset-0"
                                style={{ opacity: i === current ? (isTransitioning ? 0 : 1) : 0, transition: "opacity 0.55s ease" }}>
                                <img
                                    src={img || s.config.fallbackImage}
                                    alt={s.label}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    style={{ objectPosition: "center 40%" }}
                                    loading={i === 0 ? "eager" : "lazy"}
                                />
                            </div>
                        );
                    })}

                    {/* Mobile gradient — heavy dark at bottom for text readability */}
                    <div className="absolute inset-0 lg:hidden"
                        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 25%, rgba(8,8,8,0.82) 55%, rgba(8,8,8,0.98) 100%)" }} />
                    {/* Desktop gradient — dark on left, open on right */}
                    <div className="absolute inset-0 hidden lg:block"
                        style={{ background: "linear-gradient(105deg, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.88) 38%, rgba(8,8,8,0.35) 65%, rgba(8,8,8,0.05) 100%)" }} />
                    <div className="absolute inset-0 hidden lg:block"
                        style={{ background: "linear-gradient(to top, rgba(8,8,8,0.75) 0%, transparent 35%)" }} />
                </div>

                {/* ══════════════════════════════════════════
                    MOBILE CONTENT  (hidden on lg+)
                ══════════════════════════════════════════ */}
                <div className="lg:hidden absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end pb-safe">
                    <div className="px-5 pb-8 pt-3 space-y-3.5">

                        {/* Category chips */}
                        <div className="hfu d1 flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1">
                            {slides.map((s, i) => {
                                const Icon = s.config.icon;
                                const active = i === current;
                                return (
                                    <button key={s.category} onClick={() => goTo(i)}
                                        className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold border transition-all duration-250"
                                        style={{
                                            background: active ? accentColor : "rgba(255,255,255,0.07)",
                                            borderColor: active ? accentColor : "rgba(255,255,255,0.11)",
                                            color: active ? "#fff" : "rgba(255,255,255,0.55)",
                                            minHeight: 38,
                                        }}>
                                        <Icon className="w-3 h-3" />
                                        {s.config.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Badge */}
                        {config && (
                            <div className="hfu d1">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                                    style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}44`, color: accentColor }}>
                                    <Star className="w-2.5 h-2.5" fill="currentColor" />
                                    {config.badge}
                                </span>
                            </div>
                        )}

                        {/* Headline */}
                        {config && (
                            <div key={`mh-${current}`} className="hfu d2">
                                <h1 className="text-[2.1rem] leading-[1.06] font-black tracking-tight text-white">
                                    {config.headline}
                                    <br />
                                    <span style={{ color: accentColor }}>{config.headlineAccent}</span>
                                </h1>
                            </div>
                        )}

                        {/* Description */}
                        {config && (
                            <p key={`md-${current}`} className="hfu d3 text-[0.83rem] text-white/65 leading-[1.6] max-w-xs">
                                {config.description}
                            </p>
                        )}

                        {/* Stats row */}
                        {config && (
                            <div key={`ms-${current}`} className="hfu d3 flex gap-2">
                                {config.stats.map(st => (
                                    <div key={st.label}
                                        className="flex-1 rounded-xl py-2.5 text-center border"
                                        style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.09)" }}>
                                        <p className="text-[1.05rem] font-black text-white leading-none">{st.value}</p>
                                        <p className="text-[8.5px] font-bold uppercase tracking-wide mt-0.5"
                                            style={{ color: "rgba(255,255,255,0.38)" }}>{st.label}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* CTA buttons */}
                        <div className="hfu d4 flex flex-col gap-2.5 pt-0.5">
                            <button
                                onClick={whatsappOpen}
                                className="cta-main flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl font-bold text-[0.92rem] text-white transition-transform active:scale-95"
                                style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)` }}>
                                <MessageCircle className="w-4 h-4" />
                                WhatsApp — Free Quote
                            </button>
                            <button
                                onClick={phoneCall}
                                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-[0.88rem] border transition-transform active:scale-95"
                                style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.13)", color: "rgba(255,255,255,0.85)" }}>
                                <Phone className="w-3.5 h-3.5" />
                                Call 0794 494 515
                            </button>
                        </div>

                        {/* Trust + nav dots row */}
                        <div className="hfu d5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {["Quality Guaranteed", "Free Site Visit"].map(t => (
                                    <div key={t} className="flex items-center gap-1">
                                        <ShieldCheck className="w-2.5 h-2.5 flex-shrink-0" style={{ color: accentColor }} />
                                        <span className="text-[8.5px] font-semibold text-white/35 whitespace-nowrap">{t}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Dots */}
                            <div className="flex items-center gap-1.5">
                                {slides.map((_, i) => (
                                    <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}
                                        className="relative overflow-hidden rounded-full transition-all duration-300 focus:outline-none"
                                        style={{ width: i === current ? 20 : 6, height: 6, background: i === current ? accentColor : "rgba(255,255,255,0.22)" }}>
                                        {i === current && (
                                            <span key={progressKey.current} className="absolute inset-y-0 left-0 rounded-full dot-fill"
                                                style={{ background: "rgba(255,255,255,0.32)", animationPlayState: isPaused ? "paused" : "running" }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════
                    DESKTOP CONTENT  (hidden below lg)
                ══════════════════════════════════════════ */}
                <div className="hidden lg:flex absolute inset-0 z-10 items-center">
                    <div className="w-full max-w-7xl mx-auto px-10 xl:px-16 flex items-center gap-16 xl:gap-20">

                        {/* ── Left: text ── */}
                        <div className="flex-1 max-w-xl space-y-6">

                            {/* Category pills */}
                            <div className="hfu d1 flex flex-wrap gap-2">
                                {slides.map((s, i) => {
                                    const Icon = s.config.icon;
                                    const active = i === current;
                                    return (
                                        <button key={s.category} onClick={() => goTo(i)}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-250 cursor-pointer"
                                            style={{
                                                background: active ? accentColor : "rgba(255,255,255,0.06)",
                                                borderColor: active ? accentColor : "rgba(255,255,255,0.10)",
                                                color: active ? "#fff" : "rgba(255,255,255,0.50)",
                                            }}>
                                            <Icon className="w-3 h-3" />
                                            {s.config.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Badge */}
                            {config && (
                                <div className="hfu d2">
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full"
                                        style={{ background: `${accentColor}1E`, border: `1px solid ${accentColor}45`, color: accentColor }}>
                                        <Star className="w-3 h-3" fill="currentColor" />
                                        {config.badge}
                                    </span>
                                </div>
                            )}

                            {/* Headline */}
                            {config && (
                                <div key={`dh-${current}`} className="hfu d3">
                                    <h1 className="text-5xl xl:text-[3.6rem] font-black tracking-[-0.02em] text-white leading-[1.04]">
                                        {config.headline}
                                        <br />
                                        <span style={{ color: accentColor }}>{config.headlineAccent}</span>
                                    </h1>
                                </div>
                            )}

                            {/* Description */}
                            {config && (
                                <p key={`dd-${current}`} className="hfu d4 text-lg text-white/60 leading-relaxed max-w-md">
                                    {config.description}
                                </p>
                            )}

                            {/* Stats */}
                            {config && (
                                <div key={`ds-${current}`} className="hfu d4 flex gap-3">
                                    {config.stats.map(st => (
                                        <div key={st.label} className="rounded-2xl px-5 py-3.5 border"
                                            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.09)" }}>
                                            <p className="text-2xl font-black text-white">{st.value}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
                                                style={{ color: "rgba(255,255,255,0.38)" }}>{st.label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* CTAs */}
                            <div className="hfu d5 flex items-center gap-3">
                                <button onClick={whatsappOpen}
                                    className="cta-main flex items-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-sm text-white transition-transform hover:scale-[1.03] active:scale-95"
                                    style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)` }}>
                                    <MessageCircle className="w-4 h-4" />
                                    WhatsApp Free Quote
                                </button>
                                <Link to={config?.link ?? "/products"}
                                    className="flex items-center gap-2 px-6 py-4 rounded-2xl font-semibold text-sm border transition-all hover:bg-white/8 active:scale-95"
                                    style={{ borderColor: "rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.82)" }}>
                                    View Products
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {/* Trust badges */}
                            <div className="hfu d5 flex items-center gap-5">
                                {["Quality Guaranteed", "Certified Installation", "Local Kenyan Business"].map(t => (
                                    <div key={t} className="flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5" style={{ color: accentColor }} />
                                        <span className="text-xs font-medium text-white/38">{t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Right: product card ── */}
                        {slide?.products?.[0] && (
                            <div className="flex-shrink-0 w-72 xl:w-80">
                                <div key={`card-${current}`}
                                    className="hfu d3 rounded-3xl overflow-hidden border"
                                    style={{ background: "rgba(15,15,15,0.72)", borderColor: "rgba(255,255,255,0.10)", backdropFilter: "blur(24px)" }}>

                                    {/* Image */}
                                    {slide.products[0]?.images?.[0] && (
                                        <div className="relative h-44 overflow-hidden">
                                            <img src={slide.products[0].images[0]} alt={slide.products[0].name}
                                                className="w-full h-full object-cover" />
                                            <div className="absolute inset-0"
                                                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent 60%)" }} />
                                            <div className="absolute top-3 right-3 rounded-xl px-2.5 py-1.5 text-center"
                                                style={{ background: accentColor }}>
                                                <p className="text-[9px] font-bold text-white/75 uppercase tracking-wide leading-none mb-0.5">Boost</p>
                                                <p className="text-[1.1rem] font-black text-white leading-none">{slide.config.stats[1]?.value}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider mb-1"
                                                style={{ color: accentColor }}>{slide.config.label}</p>
                                            <p className="font-bold text-white text-sm leading-snug line-clamp-2">
                                                {slide.products[0].name}
                                            </p>
                                            {slide.products[0].price && (
                                                <p className="text-xl font-black text-white mt-1.5">
                                                    KSh {slide.products[0].price.toLocaleString()}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            {slide.config.stats.map(s => (
                                                <span key={s.label} className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                                                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.60)" }}>
                                                    {s.value} {s.label}
                                                </span>
                                            ))}
                                        </div>

                                        <button onClick={whatsappOpen}
                                            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-transform hover:scale-[1.02] active:scale-95"
                                            style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)` }}>
                                            Inquire on WhatsApp
                                        </button>
                                    </div>
                                </div>

                                {/* Nav dots */}
                                <div className="flex items-center justify-center gap-2 mt-5">
                                    <button onClick={goPrev} aria-label="Previous"
                                        className="w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:bg-white/10"
                                        style={{ borderColor: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.55)" }}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <div className="flex items-center gap-1.5">
                                        {slides.map((_, i) => (
                                            <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}
                                                className="relative overflow-hidden rounded-full transition-all duration-300 focus:outline-none"
                                                style={{ width: i === current ? 20 : 6, height: 6, background: i === current ? accentColor : "rgba(255,255,255,0.20)" }}>
                                                {i === current && (
                                                    <span key={progressKey.current} className="absolute inset-y-0 left-0 rounded-full dot-fill"
                                                        style={{ background: "rgba(255,255,255,0.30)", animationPlayState: isPaused ? "paused" : "running" }} />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={goNext} aria-label="Next"
                                        className="w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:bg-white/10"
                                        style={{ borderColor: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.55)" }}>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
