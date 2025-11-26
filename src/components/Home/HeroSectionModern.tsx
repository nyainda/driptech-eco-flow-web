import { useState, useEffect } from "react";
import {
    ArrowRight,
    Phone,
    Droplets,
    Award,
    Users,
    CheckCircle,
    Play,
    Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const HeroSectionModern = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 20,
                y: (e.clientY / window.innerHeight) * 20,
            });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const whatsappNumber = "254114575401";
    const openWhatsApp = () => {
        const message = encodeURIComponent(
            "Hi DripTech! I'm interested in your irrigation systems."
        );
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
    };

    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-slate-900">
            {/* Background Image with Parallax-like effect */}
            {/* Background Image with Parallax-like effect */}
            <div
                className="absolute inset-0 z-0 transition-transform duration-100 ease-out"
                style={{
                    transform: `translate(${mousePosition.x * -1}px, ${mousePosition.y * -1}px) scale(1.05)`
                }}
            >
                <img
                    srcSet="
                        https://images.unsplash.com/photo-1574943320219-553eb213f72d?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=75 640w,
                        https://images.unsplash.com/photo-1574943320219-553eb213f72d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=75 1024w,
                        https://images.unsplash.com/photo-1574943320219-553eb213f72d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80 1920w,
                        https://images.unsplash.com/photo-1574943320219-553eb213f72d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80 2070w
                    "
                    sizes="100vw"
                    src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                    alt="Lush green farm with irrigation system"
                    className="absolute inset-0 w-full h-full object-cover"
                    fetchPriority="high"
                    loading="eager"
                />
                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/40" />
            </div>

            {/* Animated Particles/Glow */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left Column: Content */}
                    <div className="space-y-8 max-w-2xl">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm animate-fade-in">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-sm font-medium text-emerald-400">
                                #1 Smart Irrigation Solutions in Kenya
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                            Transform Your Farm With <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                Precision Irrigation
                            </span>
                        </h1>

                        {/* Description */}
                        <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
                            Maximize yields and save up to 50% water with our advanced drip kits,
                            sprinklers, and smart automation systems. Professional installation
                            nationwide.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                                size="lg"
                                onClick={openWhatsApp}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                            >
                                <Phone className="mr-2 h-5 w-5" />
                                Get Free Quote
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-slate-600 text-white hover:bg-white/10 hover:text-white px-8 py-6 text-lg rounded-full backdrop-blur-sm transition-all hover:scale-105"
                            >
                                <Play className="mr-2 h-5 w-5 fill-current" />
                                Watch Demo
                            </Button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="pt-8 flex items-center gap-6 text-sm text-slate-400 border-t border-slate-800/50">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                <span>5-Year Warranty</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                <span>ISO Certified</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                <span>Nationwide Delivery</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Visuals/Stats */}
                    <div className="relative hidden lg:block">
                        {/* Main Glass Card */}
                        <div className="relative z-10 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl transform transition-transform hover:scale-[1.02] duration-500">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="h-12 w-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                                        <Droplets className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white">50%</h3>
                                    <p className="text-sm text-slate-400">Water Savings</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-12 w-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
                                        <Award className="h-6 w-6 text-emerald-400" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white">2x</h3>
                                    <p className="text-sm text-slate-400">Yield Increase</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-12 w-12 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-4">
                                        <Users className="h-6 w-6 text-amber-400" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white">500+</h3>
                                    <p className="text-sm text-slate-400">Happy Farmers</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-12 w-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                                        <Star className="h-6 w-6 text-purple-400" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white">4.9</h3>
                                    <p className="text-sm text-slate-400">Average Rating</p>
                                </div>
                            </div>

                            {/* Decorative line */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-b-3xl opacity-50" />
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute -top-10 -right-10 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl animate-bounce duration-[3000ms]">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Installation</p>
                                    <p className="text-sm font-bold text-white">Completed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSectionModern;
