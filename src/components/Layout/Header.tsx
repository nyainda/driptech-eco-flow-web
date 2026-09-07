import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  X,
  Phone,
  Mail,
  ChevronDown,
  Droplets,
  Gift,
  Clock,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Layers,
  Zap,
  Filter,
  Settings,
  Box,
  LayoutGrid,
  FileText,
  Book,
  Video,
  LifeBuoy,
  BarChart3,
  Users,
  Search,
  Wrench,
  Leaf,
  TreePine,
  Shield,
  Package,
  Droplet,
  Sun,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import SearchManager from "./SearchManager";
import { Link } from "react-router-dom";
import QuoteModal from "@/components/Home/QuoteModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface DiscountBannerData {
  id: string;
  discount: string;
  title: string;
  description: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
}

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch active banners
  const { data: banners = [] } = useQuery({
    queryKey: ["header-discount-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_banners" as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const activeBanners =
        data?.filter((banner: DiscountBannerData) => {
          if (!banner.valid_until) return true;
          return new Date(banner.valid_until) >= new Date();
        }) || [];

      return activeBanners as DiscountBannerData[];
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Load 
  useEffect(() => {
    const dismissed = getDismissedBanners();
    setDismissedBanners(dismissed);
  }, []);

  // Auto-rotate banners with smooth transitions
  useEffect(() => {
    const visibleBanners = getVisibleBanners();
    if (visibleBanners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentBannerIndex(
          (prevIndex) => (prevIndex + 1) % visibleBanners.length,
        );
        setIsTransitioning(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners, dismissedBanners, isPaused]);


  const getDismissedBanners = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const dismissed = sessionStorage.getItem("headerDismissedBanners");
      return dismissed ? JSON.parse(dismissed) : [];
    } catch {
      return [];
    }
  };

  const saveDismissedBanners = (dismissed: string[]) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(
        "headerDismissedBanners",
        JSON.stringify(dismissed),
      );
    } catch (error) {
      console.warn("Failed to save dismissed banners:", error);
    }
  };

  const getVisibleBanners = () => {
    return banners.filter((banner) => !dismissedBanners.includes(banner.id));
  };

  const handleCloseBanner = (bannerId: string) => {
    const newDismissed = [...dismissedBanners, bannerId];
    setDismissedBanners(newDismissed);
    saveDismissedBanners(newDismissed);

    const remainingBanners = getVisibleBanners().filter(
      (b) => b.id !== bannerId,
    );
    if (remainingBanners.length === 0) {
      setShowBanner(false);
    } else {
      // Adjust current index if needed
      const newIndex =
        currentBannerIndex >= remainingBanners.length ? 0 : currentBannerIndex;
      setCurrentBannerIndex(newIndex);
    }
  };

  const handleManualNavigation = (index: number) => {
    if (index === currentBannerIndex) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentBannerIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  const handlePrevBanner = () => {
    const visibleBanners = getVisibleBanners();
    const newIndex =
      currentBannerIndex === 0
        ? visibleBanners.length - 1
        : currentBannerIndex - 1;
    handleManualNavigation(newIndex);
  };

  const handleNextBanner = () => {
    const visibleBanners = getVisibleBanners();
    const newIndex = (currentBannerIndex + 1) % visibleBanners.length;
    handleManualNavigation(newIndex);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "ends tomorrow";
    if (diffDays <= 7) return `ends in ${diffDays} days`;

    return `ends ${date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`;
  };

  const isExpiringSoon = (validUntil?: string) => {
    if (!validUntil) return false;
    const date = new Date(validUntil);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  const navigation = [
    {
      title: "Products",
      items: [
        {
          title: "Drip Irrigation",
          href: "/products/drip",
          description: "Precision watering for every plant",
          icon: Droplets,
        },
        {
          title: "Sprinkler Systems",
          href: "/products/sprinklers",
          description: "Efficient wide-area coverage",
          icon: Zap,
        },
        {
          title: "Pumps & Motors",
          href: "/products/pumps",
          description: "Reliable water pumping solutions",
          icon: Zap,
        },
        {
          title: "Pipes & Fittings",
          href: "/products/pipes",
          description: "Durable pipes and connectors",
          icon: Wrench,
        },
        {
          title: "Filtration Systems",
          href: "/products/filtration",
          description: "Clean water for system longevity",
          icon: Filter,
        },
        {
          title: "Control Systems",
          href: "/products/controls",
          description: "Smart automation for your farm",
          icon: Settings,
        },
        {
          title: "Solar Irrigation",
          href: "/products/solar",
          description: "Off-grid solar-powered irrigation",
          icon: Sun,
        },
        {
          title: "Fertigation Systems",
          href: "/products/fertigation",
          description: "Fertilizer injection with irrigation",
          icon: Leaf,
        },
        {
          title: "Greenhouse Systems",
          href: "/products/greenhouse",
          description: "Complete greenhouse irrigation",
          icon: TreePine,
        },
        {
          title: "Emitters & Drippers",
          href: "/products/emitters",
          description: "Precision drip emitters and tape",
          icon: Droplet,
        },
        {
          title: "Valves & Regulators",
          href: "/products/valves",
          description: "Flow control and pressure regulation",
          icon: Shield,
        },
        {
          title: "Water Storage",
          href: "/products/storage",
          description: "Tanks and reservoirs for farms",
          icon: Package,
        },
        {
          title: "Rain Guns",
          href: "/products/rain-guns",
          description: "High-impact rotating sprinklers",
          icon: Droplets,
        },
        {
          title: "Accessories",
          href: "/products/accessories",
          description: "Essential components and tools",
          icon: Box,
        },
        {
          title: "Filters & Strainers",
          href: "/products/filters-strainers",
          description: "Screen and disc filters for clean water",
          icon: Package,
        },
        {
          title: "Controllers & Timers",
          href: "/products/controllers",
          description: "Automated irrigation scheduling",
          icon: Package,
        },
        {
          title: "Mulching Materials",
          href: "/products/mulching",
          description: "Plastic mulch film for moisture retention",
          icon: Package,
        },
        {
          title: "Greenhouse Accessories",
          href: "/products/greenhouse-accessories",
          description: "Nets, shading and greenhouse fittings",
          icon: Package,
        },
        {
          title: "Growing Media",
          href: "/products/growing-media",
          description: "Coco peat, perlite and substrates",
          icon: Package,
        },
        {
          title: "Seedling Trays & Nursery",
          href: "/products/seedlings",
          description: "Propagation trays and nursery supplies",
          icon: Package,
        },
        {
          title: "Borehole Equipment",
          href: "/products/borehole",
          description: "Submersible pumps and borehole fittings",
          icon: Package,
        },
        {
          title: "Irrigation Kits",
          href: "/irrigation-kits",
          description: "All-in-one solutions for quick setup",
          icon: LayoutGrid,
        },
      ],
    },
    {
      title: "Services",
      items: [
        { title: "System Design", href: "/services/design" },
        { title: "Installation", href: "/services/installation" },
        { title: "Maintenance", href: "/services/maintenance" },
        { title: "Training", href: "/services/training" },
        { title: "Technician Services", href: "/technician-services" },
        { title: "Consultation", href: "/services/consultation" },
      ],
    },
    { title: "Projects", href: "/projects" },
    {
      title: "Resources",
      items: [
        {
          title: "Product Catalog",
          href: "/products",
          description: "Browse our full range of solutions",
          icon: Book,
        },
        {
          title: "Installation Guides",
          href: "/installation-guides",
          description: "Step-by-step setup instructions",
          icon: FileText,
        },
        {
          title: "Video Tutorials",
          href: "/videos",
          description: "Watch and learn from experts",
          icon: Video,
        },
        {
          title: "Technical Support",
          href: "/technical-support",
          description: "Get help when you need it",
          icon: LifeBuoy,
        },
        {
          title: "Case Studies",
          href: "/case-studies",
          description: "Real-world success stories",
          icon: BarChart3,
        },
        {
          title: "Technicians",
          href: "/technicians",
          description: "Find certified local experts",
          icon: Users,
        },
      ],
    },
    { title: "About", href: "/about" },
    { title: "Contact", href: "/contact" },
  ];

  const visibleBanners = getVisibleBanners();
  const currentBanner = visibleBanners[currentBannerIndex];
  const hasMultipleBanners = visibleBanners.length > 1;

  return (
    <header className="sticky top-0 z-50 w-full" role="banner">
      {/* Enhanced Discount Banner */}
      {showBanner && currentBanner && (
        <div
          className={`relative overflow-hidden group transition-all duration-500 ${isExpiringSoon(currentBanner.valid_until)
            ? "bg-gradient-to-r from-red-600 via-orange-500 to-red-600"
            : "bg-primary"
            } text-primary-foreground shadow-inner`}
        >
          {/* Animated Glow Effect */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.4),transparent)] animate-pulse" />

          {/* Progress bar for auto-rotation */}
          {hasMultipleBanners && !isPaused && (
            <div className="absolute bottom-0 left-0 h-0.5 bg-white/20 w-full">
              <div
                className="h-full bg-white transition-all duration-5000 ease-linear"
                style={{
                  width: isTransitioning ? "100%" : "0%",
                  animation: isTransitioning
                    ? "none"
                    : "progressBar 5s linear forwards",
                }}
              />
            </div>
          )}

          <div
            className={`relative py-1 sm:py-1.5 px-2 sm:px-4 transition-all duration-500 ${isTransitioning
              ? "opacity-0 translate-y-2"
              : "opacity-100 translate-y-0"
              }`}
          >
            <div className="container mx-auto flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0 overflow-hidden">
                {hasMultipleBanners && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevBanner}
                      className="p-1 rounded-full hover:bg-white/20 transition-all active:scale-90"
                      aria-label="Previous offer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleNextBanner}
                      className="p-1 rounded-full hover:bg-white/20 transition-all active:scale-90"
                      aria-label="Next offer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
                  <div className="hidden sm:flex items-center justify-center w-6 h-6 rounded-full bg-white/20 flex-shrink-0">
                    <Gift className="h-3.5 w-3.5 animate-bounce" />
                  </div>
                  <Badge
                    variant="secondary"
                    className={`font-bold text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 whitespace-nowrap flex-shrink-0 ${isExpiringSoon(currentBanner.valid_until)
                      ? "bg-white text-red-600"
                      : "bg-white text-primary"
                      }`}
                  >
                    {currentBanner.discount} OFF
                  </Badge>

                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="font-semibold text-[11px] sm:text-sm truncate leading-tight">
                      {currentBanner.title}
                    </span>
                    <span className="opacity-80 text-xs hidden xl:inline-block border-l border-white/30 pl-2 truncate">
                      {currentBanner.description}
                    </span>
                  </div>
                </div>

                {currentBanner.valid_until && (
                  <div
                    className={`flex items-center gap-1.5 text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-black/10 transition-all ${isExpiringSoon(currentBanner.valid_until)
                      ? "animate-pulse bg-red-900/20 font-bold"
                      : "opacity-90"
                      }`}
                  >
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(currentBanner.valid_until)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {hasMultipleBanners && (
                  <button
                    onClick={togglePause}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  </button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCloseBanner(currentBanner.id)}
                  className="text-white hover:bg-white/20 h-7 w-7 p-0 ml-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes progressBar { from { width: 0%; } to { width: 100%; } }
          `}</style>
        </div>
      )}

      {/* Premium Top Bar */}
      <div className="bg-background/95 backdrop-blur-md border-b border-border hidden sm:block">
        <div className="container mx-auto px-4">
          <div className="flex h-10 items-center justify-between text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-6">
              <a
                href="tel:0757716018"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <div className="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Phone className="h-3 w-3 text-primary" />
                </div>
                <span>0757716018</span>
              </a>
              <a
                href="mailto:info@driptech.co.ke"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <div className="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Mail className="h-3 w-3 text-primary" />
                </div>
                <span>info@driptech.co.ke</span>
              </a>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 py-1 px-3 bg-accent/10 text-accent rounded-full font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span>Professional Irrigation Solutions</span>
              </div>
              <div className="flex items-center gap-4 border-l border-border/50 pl-6">
                <div className="flex items-center gap-1.5 opacity-80">
                  <Clock className="h-3 w-3" />
                  <span>Mon - Fri: 8am - 5pm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-background/95 backdrop-blur-xl border-b border-border shadow-sm dark:shadow-none sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 flex h-16 sm:h-[72px] lg:h-20 items-center justify-between gap-3 sm:gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-all duration-300 group flex-shrink-0"
          >
            <div className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 lg:w-14 lg:h-14 bg-primary rounded-xl sm:rounded-2xl shadow-lg group-hover:shadow-primary/30 transition-all duration-500 group-hover:rotate-6 group-hover:scale-105 border border-white/20">
              <Droplets className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl lg:text-2xl font-black text-foreground tracking-tighter leading-none">
                DripTech
              </span>
              <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-bold text-primary uppercase tracking-[0.25em] sm:tracking-[0.3em] mt-1">
                Eco Flow
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-0.5 lg:gap-2">
              {navigation.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.items ? (
                    <>
                      <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 transition-all duration-200 rounded-xl px-2 lg:px-4 py-2 text-xs lg:text-sm font-semibold text-foreground hover:text-primary">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className={`grid ${item.items.length > 5 ? "grid-cols-2 w-[550px]" : "grid-cols-1 w-[300px]"} gap-2 p-5 bg-background/95 backdrop-blur-xl border shadow-2xl rounded-2xl`}>
                          <div className="col-span-full mb-4 flex items-center justify-between border-b border-border/50 pb-3">
                            <div>
                              <h4 className="text-sm font-bold text-foreground">
                                {item.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Explore our {item.title.toLowerCase()}
                              </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                              {(() => {
                                const Icon = item.items[0].icon;
                                return Icon ? <Icon className="h-5 w-5 text-primary/60" /> : null;
                              })()}
                            </div>
                          </div>
                          {item.items.map((subItem: any) => (
                            <NavigationMenuLink key={subItem.href} asChild>
                              <Link
                                to={subItem.href}
                                className="flex items-start gap-4 select-none rounded-xl p-3 leading-none no-underline outline-none transition-all duration-300 hover:bg-primary/5 group border border-transparent hover:border-primary/10"
                              >
                                {subItem.icon && (
                                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                    {(() => {
                                      const Icon = subItem.icon;
                                      return Icon ? <Icon className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors" /> : null;
                                    })()}
                                  </div>
                                )}
                                <div className="space-y-1">
                                  <div className="text-[13px] font-bold leading-tight group-hover:text-primary transition-colors">
                                    {subItem.title}
                                  </div>
                                  {subItem.description && (
                                    <p className="line-clamp-1 text-[11px] leading-snug text-muted-foreground group-hover:text-muted-foreground/80">
                                      {subItem.description}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <NavigationMenuLink asChild>
                      <Link
                        to={item.href || '#'}
                        className="group inline-flex h-10 w-max items-center justify-center rounded-xl bg-transparent px-2 lg:px-4 py-2 text-xs lg:text-sm font-semibold transition-all duration-300 hover:bg-muted/50 text-foreground hover:text-primary focus:outline-none"
                      >
                        {item.title}
                      </Link>
                    </NavigationMenuLink>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* CTA Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
            <div className="flex items-center gap-0.5 sm:gap-1.5 pr-1.5 sm:pr-2 border-r border-border/50 mr-0.5">
              <span className="flex md:hidden 2xl:flex"><SearchManager /></span>
              <ThemeToggle />
            </div>

            <QuoteModal>
              <Button
                variant="outline"
                className="hidden md:flex h-9 xl:h-10 px-3 lg:px-4 xl:px-6 rounded-xl border-primary/20 hover:border-primary hover:bg-primary/5 text-primary hover:text-primary transition-all duration-300 font-bold text-xs lg:text-sm"
              >
                Get Quote
              </Button>
            </QuoteModal>

            <Link to="/contact" className="hidden md:block">
              <Button
                variant="premium"
                className="h-9 xl:h-10 px-3 lg:px-4 xl:px-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 font-bold text-xs lg:text-sm"
              >
                Contact Us
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden hover:bg-muted/50 h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[min(100vw,420px)] p-0 bg-background border-l shadow-2xl flex flex-col"
              >
                {/* Mobile Header */}
                <SheetHeader className="p-5 border-b border-border/80 text-left sm:text-left space-y-0 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl shadow-lg">
                        <Droplets className="h-5.5 w-5.5 text-white animate-pulse" />
                      </div>
                      <div>
                        <SheetTitle className="font-extrabold text-foreground text-lg tracking-tight leading-none">
                          DripTech
                        </SheetTitle>
                        <SheetDescription className="text-[10px] font-bold text-primary uppercase tracking-wider mt-1">
                          Eco Flow
                        </SheetDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="h-9 w-9 rounded-xl hover:bg-muted text-foreground"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Mode Toggle - Only visible on mobile */}
                </SheetHeader>

                {/* Scrollable Navigation */}
                <div className="flex-1 overflow-y-auto pt-6 pb-20 custom-scrollbar bg-background">
                  <div className="px-6 space-y-8">
                    {/* Active Offers Section if any */}
                    {visibleBanners.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[11px] font-bold text-foreground/70 uppercase tracking-[0.2em]">
                            Active Offers
                          </h3>
                        </div>
                        <div className={`p-5 rounded-2xl border ${isExpiringSoon(currentBanner?.valid_until) ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50" : "bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/30"} relative overflow-hidden group`}>
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className={isExpiringSoon(currentBanner?.valid_until) ? "bg-red-600 text-white" : "bg-primary text-white"}>
                                {currentBanner?.discount} OFF
                              </Badge>
                              {currentBanner?.valid_until && (
                                <span className={`text-[10px] font-bold ${isExpiringSoon(currentBanner.valid_until) ? "text-red-600 dark:text-red-400 animate-pulse" : "text-primary dark:text-primary"}`}>
                                  {formatDate(currentBanner.valid_until)}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-foreground mb-1 leading-tight">{currentBanner?.title}</h4>
                            <p className="text-xs text-foreground/70 leading-relaxed">{currentBanner?.description}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Main Nav links */}
                    <nav className="space-y-6">
                      {navigation.map((item) => (
                        <div key={item.title} className="space-y-3">
                          <h3 className="text-[11px] font-bold text-foreground/70 uppercase tracking-[0.2em] px-1">
                            {item.title}
                          </h3>
                          <div className="grid gap-1">
                            {item.items ? (
                              item.items.map((subItem: any) => (
                                <Link
                                  key={subItem.href}
                                  to={subItem.href}
                                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-all group border border-transparent hover:border-border"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {subItem.icon && (
                                    <div className="w-9 h-9 rounded-lg bg-muted/50 dark:bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                      {(() => {
                                        const Icon = subItem.icon;
                                        return Icon ? <Icon className="h-4.5 w-4.5 text-foreground/60 group-hover:text-primary" /> : null;
                                      })()}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                      {subItem.title}
                                    </div>
                                    <div className="text-[11px] text-foreground/60 truncate">
                                      {subItem.description || "Learn more"}
                                    </div>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </Link>
                              ))
                            ) : (
                              <Link
                                to={item.href || '#'}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-all group border border-transparent hover:border-border"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <div className="text-sm font-bold text-foreground group-hover:text-primary">
                                  {item.title}
                                </div>
                                <ChevronRight className="h-4 w-4 text-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Fixed Mobile Bottom Actions */}
                <div className="p-6 border-t border-border/80 bg-card">
                  <div className="flex gap-3 mb-6">
                    <QuoteModal>
                      <Button variant="outline" className="flex-1 h-12 rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-bold">
                        Quote
                      </Button>
                    </QuoteModal>
                    <Link to="/contact" className="flex-[2]" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="premium" className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                        Contact Us
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-center justify-around">
                    <a href="tel:0757716018" className="flex flex-col items-center gap-1.5 group">
                      <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold text-foreground/70">Call</span>
                    </a>
                    <a href="mailto:info@driptech.co.ke" className="flex flex-col items-center gap-1.5 group">
                      <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold text-foreground/70">Email</span>
                    </a>
                    <button
                      className="flex flex-col items-center gap-1.5 group cursor-pointer border-none bg-transparent p-0 outline-none"
                      onClick={() => document.getElementById('search-trigger')?.click()}
                      aria-label="Search"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                        <Search className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold text-foreground/70">Search</span>
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
