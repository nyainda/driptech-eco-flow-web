import { useState, useEffect } from "react";
import {
    ArrowRight,
    Leaf,
    Droplets,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWhatsAppProducts } from "@/hooks/useWhatsAppProducts";

const HeroSectionVibe = () => {
    const [scrolled, setScrolled] = useState(false);
    const { products, loading: productsLoading } = useWhatsAppProducts();
    const [currentProductIndex, setCurrentProductIndex] = useState(0);

    // Dynamic background effect based on mouse movement
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);

        const handleMouseMove = (e: MouseEvent) => {
            // Subtle parallax calculation
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

    // Rotate products specifically for the "Vibe" card
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

    return (
        <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-emerald-50 dark:bg-emerald-950 transition-colors duration-300">

            {/* 1. Immersive Background Layer */}
            <div className="absolute inset-0 z-0">
                {/* Main Hero Image - Using the highest quality one */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[2000ms] ease-out will-change-transform opacity-60 dark:opacity-40"
                    style={{
                        backgroundImage: `url('/hero-bg-new-desktop.webp')`, // Using the known good asset
                        transform: `scale(1.1) translate(${mousePosition.x * -1}px, ${mousePosition.y * -1}px)`
                    }}
                />

                {/* Organic Overlay - Adapts to Light/Dark */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-transparent dark:from-emerald-950/90 dark:via-emerald-900/60 dark:to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-emerald-50/80 dark:to-emerald-950" />

                {/* Floating Elements / Particles */}
                <div className="absolute top-20 right-20 w-64 h-64 bg-yellow-400/20 dark:bg-yellow-400/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* 2. Content Container */}
            <div className="container relative z-10 px-4 mx-auto h-full flex flex-col justify-center pt-20 pb-20 lg:pb-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                    {/* Left: Text Content (7 cols) */}
                    <div className="col-span-1 lg:col-span-7 space-y-8 lg:pr-12">

                        {/* Trust Badge - Themed */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/50 dark:bg-white/10 backdrop-blur-md border border-emerald-200 dark:border-white/20 hover:bg-emerald-200/50 dark:hover:bg-white/20 transition-colors animate-fade-in-up md:mx-0 mx-auto cursor-default">
                            <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-100 tracking-wide uppercase">
                                Kenya's #1 Smart Irrigation Specialists
                            </span>
                        </div>

                        {/* Main Heading - Editorial Style + Original Copy */}
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-emerald-950 dark:text-white leading-[1.1] tracking-tight animate-fade-in-up delay-100 text-center md:text-left">
                            Transform Your <br />
                            <span className="text-emerald-600 dark:text-emerald-400">Agriculture</span> <br />
                            With Smart Drip Irrigation
                        </h1>

                        {/* Original Subline */}
                        <p className="text-lg md:text-xl text-emerald-800 dark:text-emerald-100/80 leading-relaxed max-w-xl animate-fade-in-up delay-200 text-center md:text-left mx-auto md:mx-0 border-l-4 border-emerald-500 pl-6">
                            Affordable smart drip irrigation kits, sprinklers, and water pumps for smallholder and commercial farmers.
                            Increase yields by <span className="text-emerald-600 dark:text-emerald-400 font-bold">40-60%</span> while reducing water usage by <span className="text-blue-600 dark:text-blue-400 font-bold">50%</span>.
                        </p>

                        {/* Action Buttons - Restored Functionality & Themed */}
                        <div className="flex flex-col sm:flex-row gap-5 pt-4 justify-center md:justify-start animate-fade-in-up delay-300">
                            <Button
                                onClick={makePhoneCall}
                                className="h-14 px-8 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-lg font-semibold shadow-[0_0_40px_-10px_rgba(37,211,102,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(37,211,102,0.7)] group border-none"
                            >
                                <span className="mr-2 group-hover:rotate-12 transition-transform">📞</span>
                                Call: 0794494515
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>

                            <Button
                                variant="outline"
                                className="h-14 px-8 rounded-full border-emerald-200 dark:border-white/20 bg-white/50 dark:bg-white/5 text-emerald-900 dark:text-white backdrop-blur-sm hover:bg-emerald-100 dark:hover:bg-white/20 hover:border-emerald-300 dark:hover:border-white/40 transition-all text-lg font-medium"
                                onClick={openWhatsApp}
                            >
                                <span className="mr-2 text-xl">💬</span>
                                WhatsApp Us
                            </Button>
                        </div>

                        {/* Trust Indicators - Clean List (Themed) */}
                        <div className="pt-8 flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm font-medium text-emerald-700 dark:text-emerald-100/70 border-t border-emerald-200 dark:border-white/10 animate-fade-in-up delay-500">
                            {["Quality Guaranteed", "Professional Installation", "Local Kenyan Business"].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* Right: Floating Product Card (5 cols) - VISIBLE ON MOBILE NOW (Themed) */}
                    <div className="col-span-1 lg:col-span-5 relative mt-8 lg:mt-0 animate-fade-in-up delay-300 block">

                        {/* Decorative Background Blob behind card */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/20 rounded-full blur-[80px] -z-10 animate-pulse-slow" />

                        {/* The "Glass" Card - Adjusted padding for mobile & Themed */}
                        <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl transition-transform duration-300 hover:scale-[1.02] group mx-auto max-w-md lg:max-w-none">

                            {/* Card Header - Cleaned up */}
                            <div className="flex justify-between items-center mb-4 sm:mb-6">
                                <div>
                                    <h3 className="text-emerald-950 dark:text-white font-bold text-lg sm:text-xl tracking-tight">DripTech EcoFlow</h3>
                                    <p className="text-emerald-700/80 dark:text-emerald-200/80 text-xs sm:text-sm">Premium Irrigation Systems</p>
                                </div>
                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                                    <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                            </div>

                            {/* Product Image Area */}
                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-white/10 dark:to-white/5 mb-4 sm:mb-6 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] dark:group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all">
                                {currentProduct?.images?.[0] ? (
                                    <img
                                        src={currentProduct.images[0]}
                                        alt={currentProduct.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-emerald-300/50 dark:text-white/50">
                                        <Droplets className="w-12 h-12 sm:w-16 sm:h-16 animate-bounce" />
                                    </div>
                                )}

                                {/* Floating Price Tag */}
                                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lg border border-emerald-100 dark:border-transparent">
                                    <span className="text-emerald-900 font-bold text-sm sm:text-base">
                                        KSh {currentProduct?.price?.toLocaleString() || "Best Price"}
                                    </span>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="space-y-3 sm:space-y-4">
                                <h4 className="text-xl sm:text-2xl font-bold text-emerald-950 dark:text-white line-clamp-1">
                                    {currentProduct?.name || "Smart Drip Kit"}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2.5 py-1 sm:px-3 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] sm:text-xs font-medium">
                                        Water Saving
                                    </span>
                                    <span className="px-2.5 py-1 sm:px-3 rounded-lg bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-[10px] sm:text-xs font-medium">
                                        Smart IoT
                                    </span>
                                </div>
                                <Button
                                    className="w-full rounded-xl bg-emerald-950 dark:bg-white text-white dark:text-emerald-900 hover:bg-emerald-900 dark:hover:bg-emerald-50 font-bold h-10 sm:h-11"
                                    onClick={openWhatsApp}
                                >
                                    Inquire on WhatsApp
                                </Button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            {/* Scroll Indicator */}
            {!scrolled && (
                <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-60 dark:opacity-80 cursor-pointer hidden sm:flex" onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}>
                    <span className="text-xs text-emerald-900 dark:text-white/60 uppercase tracking-widest">Explore</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-emerald-900 dark:from-white to-transparent" />
                </div>
            )}

            <style>{`
                .animate-pulse-slow {
                    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </section>
    );
};

export default HeroSectionVibe;
