import { useState, useEffect } from "react";
import {
    ArrowRight,
    Phone,
    Mail,
    Droplets,
    Award,
    Users,
    CheckCircle,
    Play,
    Star,
    Sprout,
    Leaf,
    Zap,
    ShieldCheck,
    ShoppingBag,
    Tag,
    Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWhatsAppProducts } from "@/hooks/useWhatsAppProducts";

const HeroSection = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentProductIndex, setCurrentProductIndex] = useState(0);
    const [fadeProduct, setFadeProduct] = useState(true);

    const { products, loading: productsLoading } = useWhatsAppProducts();

    const whatsappNumber = "254114575401";
    const openWhatsApp = () => {
        const message = encodeURIComponent(
            "Hi DripTech! I'm interested in your irrigation systems."
        );
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
    };

    const makePhoneCall = (number: string) => {
        window.open(`tel:+${number}`, "_self");
    };

    const features = [
        {
            icon: Zap,
            text: "Smart IoT Systems",
            desc: "Automated precision control",
        },
        {
            icon: Droplets,
            text: "Water Conservation",
            desc: "Up to 40% water savings",
        },
        {
            icon: ShieldCheck,
            text: "5-Year Warranty",
            desc: "Complete peace of mind",
        },
    ];

    // Rotate products
    useEffect(() => {
        if (products.length > 0) {
            const interval = setInterval(() => {
                setFadeProduct(false);
                setTimeout(() => {
                    setCurrentProductIndex((prev) => (prev + 1) % products.length);
                    setFadeProduct(true);
                }, 500);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [products]);

    const currentProduct = products[currentProductIndex];

    return (
        <section className="relative min-h-[90vh] flex items-center bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden transition-colors duration-300">
            {/* Background Image - Optimized for LCP */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop"
                    alt="Modern agricultural irrigation system in Kenya"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-10000 ease-in-out hover:scale-105"
                    fetchPriority="high"
                    loading="eager"
                />
                {/* Professional Gradient Overlay - Adapts to Dark Mode */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/40 dark:from-slate-950/95 dark:via-slate-950/90 dark:to-slate-950/60" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Left Column: Content */}
                    <div className="space-y-8 max-w-2xl animate-fade-in-up">
                        {/* Trust Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm hover:bg-white/20 transition-colors cursor-default">
                            <Leaf className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-semibold text-white tracking-wide uppercase">
                                Kenya's #1 Smart Irrigation Specialists
                            </span>
                        </div>

                        {/* Headline - Clean, Bold, Professional */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight drop-shadow-lg">
                            Transform Your <br />
                            <span className="text-emerald-400">Agriculture</span> <br />
                            With Smart Irrigation
                        </h1>

                        {/* Description - Clear Value Prop */}
                        <p className="text-lg md:text-xl text-slate-200 dark:text-slate-300 leading-relaxed max-w-xl font-medium drop-shadow-md border-l-4 border-emerald-500 pl-6">
                            Quality irrigation materials including driplines, sprinklers, and smart systems.
                            Increase yields by <span className="text-emerald-400 font-bold">40-60%</span> while reducing water usage by <span className="text-blue-400 font-bold">50%</span>.
                        </p>

                        {/* Key Features Grid (Mobile/Tablet friendly) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            {features.map((feature, index) => (
                                <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                                    <feature.icon className="h-6 w-6 text-emerald-400 mb-2" />
                                    <div className="text-white font-semibold text-sm">{feature.text}</div>
                                    <p className="text-slate-400 text-xs">{feature.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* CTA Buttons - Solid, Professional */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                                size="lg"
                                onClick={() => makePhoneCall(whatsappNumber)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:translate-y-[-2px] border-none w-full sm:w-auto"
                                aria-label="Call 0111 409 454"
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <Phone className="h-5 w-5" />
                                    <span className="font-semibold">Call: 0111 409 454</span>
                                </div>
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                onClick={openWhatsApp}
                                className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-emerald-900 px-8 py-6 text-lg rounded-xl backdrop-blur-sm transition-all hover:translate-y-[-2px] w-full sm:w-auto"
                                aria-label="Contact us on WhatsApp"
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-xl">💬</span>
                                    <span className="font-semibold">WhatsApp Us</span>
                                </div>
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => window.location.href = 'mailto:info@driptech.com'}
                                className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-emerald-900 px-8 py-6 text-lg rounded-xl backdrop-blur-sm transition-all hover:translate-y-[-2px] w-full sm:w-auto"
                                aria-label="Send us an email"
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <Mail className="h-5 w-5" />
                                    <span className="font-semibold">Email Us</span>
                                </div>
                            </Button>
                        </div>

                        {/* Trust Indicators - Clean List */}
                        <div className="pt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-300 border-t border-white/10">
                            {["Quality Guaranteed", "Professional Installation", "Local Kenyan Business"].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Dynamic Product Showcase - Fully Responsive */}
                    <div className="relative mt-8 lg:mt-0 w-full max-w-lg mx-auto lg:mx-0 lg:ml-auto">
                        {/* Main Card - Premium Glassmorphism */}
                        <div className="relative bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/20 dark:border-slate-700/30 transform transition-all duration-500 hover:shadow-emerald-500/10 hover:scale-[1.02] overflow-hidden">

                            {/* Decorative gradient orb */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl -z-0" />

                            {/* Header Section with Logo */}
                            <div className="relative z-10 flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3 flex-1">
                                    {/* Logo */}
                                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden bg-white dark:bg-slate-800 p-1.5 shadow-lg flex-shrink-0">
                                        <img
                                            src="/favicon.svg"
                                            alt="DripTech EcoFlow"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <h3 className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live Products</h3>
                                        </div>
                                        <p className="text-slate-900 dark:text-white text-base sm:text-lg md:text-xl font-black tracking-tight leading-tight">
                                            DripTech EcoFlow Products
                                        </p>
                                    </div>
                                </div>

                                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
                                    <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                            </div>

                            {/* Dynamic Product Display */}
                            <div className="relative z-10 min-h-[280px] sm:min-h-[320px] flex items-center justify-center">
                                {productsLoading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading collection...</p>
                                    </div>
                                ) : products.length > 0 ? (
                                    <div className={`w-full transition-all duration-700 ${fadeProduct ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">

                                            {/* Product Image Area with Gradient Overlay */}
                                            <div className="aspect-[4/3] w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden">
                                                {currentProduct.images && currentProduct.images.length > 0 ? (
                                                    <>
                                                        <img
                                                            src={currentProduct.images[0]}
                                                            alt={currentProduct.name}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                        {/* Gradient overlay for better text contrast */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-500">
                                                        <ImageIcon className="h-12 sm:h-16 w-12 sm:w-16 mb-2 opacity-30" />
                                                        <span className="text-xs font-medium">No Image</span>
                                                    </div>
                                                )}

                                                {/* Premium Price Tag */}
                                                {currentProduct.price && (
                                                    <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-xl backdrop-blur-sm border border-white/20">
                                                        KSh {currentProduct.price.toLocaleString()}
                                                    </div>
                                                )}

                                                {/* Category Badge */}
                                                <div className="absolute top-3 left-3">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                                                        <Tag className="h-3 w-3 text-emerald-400" />
                                                        <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                                                            {currentProduct.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Product Details Area */}
                                            <div className="p-4 sm:p-5 md:p-6">
                                                <h4 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                    {currentProduct.name}
                                                </h4>

                                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                                                    {currentProduct.description || "Premium quality irrigation equipment for professional farming results."}
                                                </p>

                                                <Button
                                                    onClick={openWhatsApp}
                                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:shadow-emerald-900/30 transition-all h-10 sm:h-11 text-sm sm:text-base font-semibold rounded-xl"
                                                    aria-label="Inquire about this product on WhatsApp"
                                                >
                                                    <span className="mr-2">💬</span>
                                                    Inquire on WhatsApp
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Progress Indicators */}
                                        <div className="flex justify-center gap-1.5 mt-5 sm:mt-6">
                                            {products.slice(0, 5).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 ${i === currentProductIndex % 5
                                                        ? 'w-6 sm:w-8 bg-gradient-to-r from-emerald-500 to-teal-500'
                                                        : 'w-1.5 sm:w-2 bg-slate-300 dark:bg-slate-600'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-500 dark:text-slate-400 py-12">
                                        <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">Check out our full catalog below!</p>
                                    </div>
                                )}
                            </div>

                            {/* Enhanced Stats Row with Icons */}
                            <div className="relative z-10 mt-6 sm:mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 sm:gap-4">
                                <div className="text-center group cursor-default">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">500+</div>
                                    <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Happy Clients</div>
                                </div>
                                <div className="text-center group cursor-default">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Droplets className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">2M+</div>
                                    <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Liters Saved</div>
                                </div>
                                <div className="text-center group cursor-default">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 fill-amber-500" />
                                    </div>
                                    <div className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">4.9</div>
                                    <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Rating</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
        </section>
    );
};

export default HeroSection;
