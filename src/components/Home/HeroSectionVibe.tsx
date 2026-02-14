import { useState, useEffect } from "react";
import { ArrowRight, Phone, MessageCircle, Leaf, Droplets, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWhatsAppProducts } from "@/hooks/useWhatsAppProducts";

const HeroSectionImproved = () => {
    const [scrolled, setScrolled] = useState(false);
    const { products, loading: productsLoading } = useWhatsAppProducts();
    const [currentProductIndex, setCurrentProductIndex] = useState(0);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);

        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 20;
            const y = (e.clientY / window.innerHeight) * 20;
            setMousePosition({ x, y });
        };
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    useEffect(() => {
        if (products.length > 0) {
            const interval = setInterval(() => {
                setCurrentProductIndex((prev) => (prev + 1) % products.length);
            }, 6000);
            return () => clearInterval(interval);
        }
    }, [products]);

    const currentProduct = products[currentProductIndex];

    const openWhatsApp = () => {
        const phone = "254794494515";
        const message = encodeURIComponent("Hi DripTech! I'm interested in your irrigation systems.");
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    };

    const makePhoneCall = () => {
        window.open(`tel:+254794494515`, "_self");
    };

    // SEO Structured Data
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "DripTech Smart Irrigation Systems",
        "description": "Affordable smart drip irrigation kits, sprinklers, and water pumps for smallholder and commercial farmers in Kenya. Increase yields by 40-60% while reducing water usage by 50%.",
        "brand": { "@type": "Brand", "name": "DripTech" },
        "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "KES",
            "lowPrice": currentProduct?.price || "5000",
            "availability": "https://schema.org/InStock"
        }
    };

    return (
        <>
            {/* SEO Structured Data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

            <section
                className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background"
                itemScope
                itemType="https://schema.org/Product"
            >
                {/* Font Imports */}
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400&display=swap');
                `}</style>

                {/* ORIGINAL Background with YOUR Image - Enhanced */}
                <div className="absolute inset-0 z-0">
                    {/* YOUR Hero Image with Parallax */}
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[2000ms] ease-out will-change-transform opacity-80 dark:opacity-60"
                        style={{
                            backgroundImage: `url('/hero-bg-new-desktop.webp')`,
                            transform: `scale(1.1) translate(${mousePosition.x * -1}px, ${mousePosition.y * -1}px)`
                        }}
                    />

                    {/* Better Light Theme Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/30 to-background/60 dark:hidden" />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/70 dark:hidden" />

                    {/* Better Dark Theme - Consistent with App Theme */}
                    <div className="hidden dark:block absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/75 to-background/85" />

                        {/* Natural glow from corners using Theme Colors */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px]" />
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />

                        {/* Subtle texture */}
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        }} />
                    </div>

                    {/* Floating Elements - Adjusted for both themes */}
                    <div className="absolute top-20 right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float-slow" />
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float-slow animation-delay-1000" />
                </div>

                {/* Main Content Container */}
                <div className="container relative z-10 px-4 mx-auto h-full flex flex-col justify-center pt-20 pb-20 lg:pb-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                        {/* Left: YOUR ORIGINAL CONTENT - Enhanced Typography */}
                        <div className="col-span-1 lg:col-span-7 space-y-8 lg:pr-12">

                            {/* YOUR Trust Badge - Better Styling */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 backdrop-blur-md border border-border hover:bg-muted/50 transition-all duration-300 animate-fade-in-up md:mx-0 mx-auto cursor-default shadow-lg">
                                <Leaf className="w-4 h-4 text-accent" />
                                <span className="text-sm font-medium text-foreground tracking-wide uppercase">
                                    Kenya's #1 Smart Irrigation Specialists
                                </span>
                            </div>

                            {/* YOUR ORIGINAL HEADLINE - Better Typography */}
                            <h1
                                className="text-4xl md:text-5xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight animate-fade-in-up delay-100 text-center md:text-left"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                                itemProp="name"
                            >
                                Transform Your <br />
                                <span className="text-accent italic">Agriculture</span> <br />
                                With Smart Drip Irrigation
                            </h1>

                            {/* YOUR ORIGINAL SUBLINE - Enhanced Readability */}
                            <p
                                className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl animate-fade-in-up delay-200 text-center md:text-left mx-auto md:mx-0 border-l-4 border-accent pl-6 bg-muted/10 backdrop-blur-sm py-4 rounded-r-lg"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                                itemProp="description"
                            >
                                Affordable smart drip irrigation kits, sprinklers, and water pumps for smallholder and commercial farmers.
                                Increase yields by <span className="text-accent font-bold">40-60%</span> while reducing water usage by <span className="text-primary font-bold">50%</span>.
                            </p>

                            {/* YOUR ORIGINAL Action Buttons - Enhanced with Better Hover States */}
                            <div className="flex flex-col sm:flex-row gap-5 pt-4 justify-center md:justify-start animate-fade-in-up delay-300">
                                <Button
                                    onClick={makePhoneCall}
                                    size="lg"
                                    className="h-14 px-8 rounded-full bg-[#25D366] hover:bg-[#1ea952] dark:bg-[#25D366] dark:hover:bg-[#20bd5a] text-white text-lg font-semibold shadow-[0_0_40px_-10px_rgba(37,211,102,0.5)] hover:shadow-[0_0_60px_-10px_rgba(37,211,102,0.8)] transition-all duration-300 hover:scale-105 group border-none"
                                    aria-label="Call DripTech at 0794494515"
                                >
                                    <span className="mr-2 text-xl group-hover:rotate-12 transition-transform">📞</span>
                                    <span style={{ fontFamily: "'Outfit', sans-serif" }}>Call: 0794494515</span>
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-14 px-8 rounded-full border-2 border-accent/50 bg-background/50 backdrop-blur-sm text-foreground hover:bg-accent hover:text-white hover:border-accent transition-all duration-300 hover:scale-105 text-lg font-medium shadow-lg group"
                                    onClick={openWhatsApp}
                                    aria-label="Contact DripTech on WhatsApp"
                                >
                                    <span className="mr-2 text-xl">💬</span>
                                    <span style={{ fontFamily: "'Outfit', sans-serif" }}>WhatsApp Us</span>
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>

                            {/* YOUR ORIGINAL Trust Indicators - Better Dark Theme */}
                            <div className="pt-8 flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground border-t border-border animate-fade-in-up delay-500">
                                {["Quality Guaranteed", "Professional Installation", "Local Kenyan Business"].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-accent" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>

                        </div>

                        {/* Right: YOUR ORIGINAL Product Card - Better Dark Theme */}
                        <div className="col-span-1 lg:col-span-5 relative mt-8 lg:mt-0 animate-fade-in-up delay-300 block">

                            {/* Enhanced Background Glow */}
                            {/* Enhanced Background Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent/20 rounded-full blur-[80px] -z-10 animate-pulse-slow" />

                            {/* YOUR Product Card - Better Dark Theme Styling */}
                            <div className="relative bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-5 sm:p-6 shadow-2xl transition-transform duration-300 hover:scale-[1.02] group mx-auto max-w-md lg:max-w-none">

                                {/* Card Header - Better Dark Contrast */}
                                <div className="flex justify-between items-center mb-4 sm:mb-6">
                                    <div>
                                        <h3 className="text-card-foreground font-bold text-lg sm:text-xl tracking-tight"
                                            style={{ fontFamily: "'Playfair Display', serif" }}>
                                            DripTech EcoFlow
                                        </h3>
                                        <p className="text-muted-foreground text-xs sm:text-sm">
                                            Premium Irrigation Systems
                                        </p>
                                    </div>
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
                                        <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                                    </div>
                                </div>

                                {/* Product Image Area - Better Dark Styling */}
                                <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted/50 mb-4 sm:mb-6 group-hover:shadow-lg transition-all">
                                    {currentProduct?.images?.[0] ? (
                                        <img
                                            src={currentProduct.images[0]}
                                            alt={`${currentProduct.name} - Smart Drip Irrigation System`}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            itemProp="image"
                                            loading="eager"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full text-muted-foreground/50">
                                            <Droplets className="w-12 h-12 sm:w-16 sm:h-16 animate-bounce" />
                                        </div>
                                    )}

                                    {/* Price Tag - Better Dark Styling */}
                                    <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-background/95 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lg border border-border">
                                        <span className="text-foreground font-bold text-sm sm:text-base" itemProp="price">
                                            KSh {currentProduct?.price?.toLocaleString() || "Best Price"}
                                        </span>
                                    </div>
                                </div>

                                {/* Product Info - Better Dark Contrast */}
                                <div className="space-y-3 sm:space-y-4">
                                    <h4 className="text-xl sm:text-2xl font-bold text-card-foreground line-clamp-1">
                                        {currentProduct?.name || "Smart Drip Kit"}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2.5 py-1 sm:px-3 rounded-lg bg-accent/10 border border-accent/20 text-accent-foreground text-[10px] sm:text-xs font-medium">
                                            Water Saving
                                        </span>
                                        <span className="px-2.5 py-1 sm:px-3 rounded-lg bg-primary/10 border border-primary/20 text-primary-foreground text-[10px] sm:text-xs font-medium">
                                            Smart IoT
                                        </span>
                                    </div>
                                    <Button
                                        size="lg"
                                        className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-10 sm:h-11 transition-all duration-300 hover:scale-[1.02] border-none"
                                        onClick={openWhatsApp}
                                    >
                                        Inquire on WhatsApp
                                    </Button>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>

                {/* YOUR Scroll Indicator - Better Dark Styling */}
                {!scrolled && (
                    <div
                        className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-60 cursor-pointer hidden sm:flex"
                        onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
                    >
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Explore</span>
                        <div className="w-[1px] h-12 bg-gradient-to-b from-foreground to-transparent" />
                    </div>
                )}

                <style>{`
                    @keyframes fade-in-up {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    @keyframes float-slow {
                        0%, 100% {
                            transform: translateY(0) translateX(0);
                        }
                        50% {
                            transform: translateY(-20px) translateX(10px);
                        }
                    }

                    .animate-fade-in-up {
                        animation: fade-in-up 0.8s ease-out forwards;
                    }

                    .animate-float-slow {
                        animation: float-slow 8s ease-in-out infinite;
                    }

                    .animate-pulse-slow {
                        animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }

                    .animation-delay-1000 {
                        animation-delay: 1s;
                    }

                    .delay-100 { animation-delay: 100ms; }
                    .delay-200 { animation-delay: 200ms; }
                    .delay-300 { animation-delay: 300ms; }
                    .delay-500 { animation-delay: 500ms; }
                `}</style>
            </section>
        </>
    );
};

export default HeroSectionImproved;
