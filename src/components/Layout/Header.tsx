import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, Phone, Mail, ChevronDown, Droplets, Gift, Clock, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
    queryKey: ['header-discount-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discount_banners' as any)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const activeBanners = data?.filter((banner: DiscountBannerData) => {
        if (!banner.valid_until) return true;
        return new Date(banner.valid_until) >= new Date();
      }) || [];

      return activeBanners as DiscountBannerData[];
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Load dismissed banners
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
        setCurrentBannerIndex((prevIndex) => 
          (prevIndex + 1) % visibleBanners.length
        );
        setIsTransitioning(false);
      }, 300); // Half of transition duration
      
    }, 5000); // 5 seconds per banner

    return () => clearInterval(interval);
  }, [banners, dismissedBanners, isPaused]);

  const getDismissedBanners = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const dismissed = sessionStorage.getItem('headerDismissedBanners');
      return dismissed ? JSON.parse(dismissed) : [];
    } catch {
      return [];
    }
  };

  const saveDismissedBanners = (dismissed: string[]) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('headerDismissedBanners', JSON.stringify(dismissed));
    } catch (error) {
      console.warn('Failed to save dismissed banners:', error);
    }
  };

  const getVisibleBanners = () => {
    return banners.filter(banner => !dismissedBanners.includes(banner.id));
  };

  const handleCloseBanner = (bannerId: string) => {
    const newDismissed = [...dismissedBanners, bannerId];
    setDismissedBanners(newDismissed);
    saveDismissedBanners(newDismissed);

    const remainingBanners = getVisibleBanners().filter(b => b.id !== bannerId);
    if (remainingBanners.length === 0) {
      setShowBanner(false);
    } else {
      // Adjust current index if needed
      const newIndex = currentBannerIndex >= remainingBanners.length ? 0 : currentBannerIndex;
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
    const newIndex = currentBannerIndex === 0 
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
    
    if (diffDays === 1) return 'ends tomorrow';
    if (diffDays <= 7) return `ends in ${diffDays} days`;
    
    return `ends ${date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric'
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
        { title: "Drip Irrigation", href: "/products/drip" },
        { title: "Sprinkler Systems", href: "/products/sprinklers" },
        { title: "Filtration Systems", href: "/products/filtration" },
        { title: "Control Systems", href: "/products/controls" },
        { title: "Accessories", href: "/products/accessories" },
      ]
    },
    {
      title: "Services",
      items: [
        { title: "System Design", href: "/services/design" },
        { title: "Installation", href: "/services/installation" },
        { title: "Maintenance", href: "/services/maintenance" },
        { title: "Training", href: "/services/training" },
        { title: "Consultation", href: "/services/consultation" },
      ]
    },
    { title: "Projects", href: "/projects" },
    {
      title: "Resources",
      items: [
        { title: "Product Catalog", href: "/products" },
        { title: "Installation Guides", href: "/installation-guides" },
        { title: "Technical Support", href: "/technical-support" },
        { title: "Case Studies", href: "/case-studies" },
        { title: "Technicians", href: "/technicians" },
      ]
    },
    { title: "About", href: "/about" },
    { title: "Contact", href: "/contact" },
  ];

  const visibleBanners = getVisibleBanners();
  const currentBanner = visibleBanners[currentBannerIndex];
  const hasMultipleBanners = visibleBanners.length > 1;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      {/* Enhanced Discount Banner with Smooth Transitions */}
      {showBanner && currentBanner && (
        <div className={`relative overflow-hidden transition-all duration-600 ${
          isExpiringSoon(currentBanner.valid_until)
            ? 'bg-gradient-to-r from-orange-500 to-red-500'
            : 'bg-gradient-to-r from-primary to-primary/80'
        } text-primary-foreground`}>
          
          {/* Animated background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse" />
          </div>
          
          {/* Progress bar for auto-rotation */}
          {hasMultipleBanners && !isPaused && (
            <div className="absolute bottom-0 left-0 h-0.5 bg-primary-foreground/30 w-full">
              <div 
                className="h-full bg-primary-foreground transition-all duration-5000 ease-linear"
                style={{ 
                  width: isTransitioning ? '100%' : '0%',
                  animation: isTransitioning ? 'none' : 'progressBar 5s linear forwards'
                }}
              />
            </div>
          )}
          
          <div className={`relative py-2 px-4 transition-all duration-600 ${
            isTransitioning ? 'opacity-0 transform translate-x-2' : 'opacity-100 transform translate-x-0'
          }`}>
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Navigation arrows for multiple banners */}
                {hasMultipleBanners && (
                  <button
                    onClick={handlePrevBanner}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-primary-foreground/20 transition-colors"
                    aria-label="Previous offer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}

                <Gift className="h-4 w-4 animate-bounce flex-shrink-0" />
                <Badge 
                  variant="secondary" 
                  className={`font-bold text-xs px-2 py-0.5 flex-shrink-0 ${
                    isExpiringSoon(currentBanner.valid_until)
                      ? 'bg-white text-red-600 animate-pulse' 
                      : 'bg-white text-primary'
                  }`}
                >
                  {currentBanner.discount} OFF
                </Badge>
                
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm mr-2">
                    {currentBanner.title}
                  </span>
                  <span className="opacity-90 text-sm hidden sm:inline">
                    {currentBanner.description}
                  </span>
                </div>
                
                {currentBanner.valid_until && (
                  <div className={`flex items-center gap-1 text-xs opacity-90 flex-shrink-0 ${
                    isExpiringSoon(currentBanner.valid_until) ? 'animate-pulse font-semibold' : ''
                  }`}>
                    <Clock className="h-3 w-3" />
                    <span className="hidden sm:inline">{formatDate(currentBanner.valid_until)}</span>
                    <span className="sm:hidden">Limited time</span>
                  </div>
                )}

                {/* Next arrow */}
                {hasMultipleBanners && (
                  <button
                    onClick={handleNextBanner}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-primary-foreground/20 transition-colors"
                    aria-label="Next offer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                {/* Banner counter */}
                {hasMultipleBanners && (
                  <span className="text-xs opacity-75 hidden sm:inline">
                    {currentBannerIndex + 1} / {visibleBanners.length}
                  </span>
                )}

                {/* Pause/Play button */}
                {hasMultipleBanners && (
                  <button
                    onClick={togglePause}
                    className="p-1 rounded-full hover:bg-primary-foreground/20 transition-colors"
                    aria-label={isPaused ? "Resume auto-rotation" : "Pause auto-rotation"}
                  >
                    {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  </button>
                )}

                {/* Banner indicators */}
                {hasMultipleBanners && (
                  <div className="flex gap-1">
                    {visibleBanners.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleManualNavigation(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentBannerIndex 
                            ? 'bg-primary-foreground scale-110' 
                            : 'bg-primary-foreground/40 hover:bg-primary-foreground/60'
                        }`}
                        aria-label={`Go to offer ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCloseBanner(currentBanner.id)}
                  className="text-primary-foreground hover:bg-primary-foreground/20 h-6 w-6 p-0 ml-2"
                  aria-label="Close banner"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Custom CSS for progress animation */}
          <style>{`
            @keyframes progressBar {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* Top Bar with Enhanced Contact Info */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex h-10 items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Phone className="h-3 w-3" />
                <a href="tel:0114575401" className="hover:underline">0114575401</a>
              </div>
              <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="h-3 w-3" />
                <a href="mailto:driptech2025@gmail.com" className="hover:underline">
                  <span className="hidden sm:inline">driptech2025@gmail.com</span>
                  <span className="sm:hidden">Contact</span>
                </a>
              </div>
              <div className="hidden md:flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="h-3 w-3" />
                <a href="mailto:driptechs.info@gmail.com" className="hover:underline">
                  driptechs.info@gmail.com
                </a>
              </div>
            </div>
            
            {/* Compact banner indicator in top bar when main banner is hidden */}
            {!showBanner && hasMultipleBanners && (
              <div className="hidden lg:flex items-center gap-2 text-xs">
                <Gift className="h-3 w-3 text-primary" />
                <span className="text-primary font-medium">
                  {visibleBanners.length} Active Offers
                </span>
              </div>
            )}
            
            <div className="hidden md:flex items-center gap-4">
              <span>Professional Irrigation Solutions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header - Rest of the component remains the same */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Droplets className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">DripTech</span>
              <span className="text-xs text-muted-foreground">Irrigation Solutions</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="gap-1">
              {navigation.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.items ? (
                    <>
                      <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 transition-all duration-200 rounded-xl px-4 py-2 font-medium">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid w-[420px] gap-2 p-5 bg-background/95 backdrop-blur-xl border shadow-xl rounded-xl">
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                              {item.title}
                            </h4>
                            <div className="w-12 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full mt-1"></div>
                          </div>
                          {item.items.map((subItem) => (
                            <NavigationMenuLink key={subItem.href} asChild>
                              <Link
                                to={subItem.href}
                                className="block select-none rounded-xl p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:shadow-md group border border-transparent hover:border-muted"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-medium leading-tight group-hover:text-primary transition-colors duration-200">
                                    {subItem.title}
                                  </div>
                                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 text-primary" />
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
                        to={item.href}
                        className="group inline-flex h-10 w-max items-center justify-center rounded-xl bg-transparent px-4 py-2 font-medium transition-all duration-200 hover:bg-muted/50 hover:text-primary hover:shadow-sm focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
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
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <QuoteModal>
              <Button variant="outline" className="hidden md:flex hover:bg-primary hover:text-primary-foreground transition-colors">
                Get Quote
              </Button>
            </QuoteModal>
            <Link to="/contact">
              <Button variant="premium" className="shadow-lg hover:shadow-xl transition-shadow">
                Contact Us
              </Button>
            </Link>
            
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden hover:bg-muted/50 h-10 w-10 rounded-xl">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[90vw] max-w-md p-0 bg-background/98 backdrop-blur-xl border-l shadow-2xl">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                        <Droplets className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="font-bold text-foreground text-xl">DripTech</span>
                        <p className="text-xs text-muted-foreground">Irrigation Solutions</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="h-9 w-9 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto scrollbar-thin">
                    <div className="p-4 space-y-6">
                      {/* Enhanced Mobile Banner with navigation */}
                      {visibleBanners.length > 0 && (
                        <div className="space-y-3">
                          {hasMultipleBanners && (
                            <div className="flex items-center justify-between px-1">
                              <span className="text-sm font-medium text-muted-foreground">
                                Active Offers ({visibleBanners.length})
                              </span>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handlePrevBanner}
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-muted/50"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs px-2 py-1 bg-muted rounded-md font-medium min-w-[3rem] text-center">
                                  {currentBannerIndex + 1}/{visibleBanners.length}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleNextBanner}
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-muted/50"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          <div className={`p-4 rounded-xl transition-all duration-500 shadow-lg border ${
                            isExpiringSoon(currentBanner?.valid_until)
                              ? 'bg-gradient-to-br from-orange-500/90 via-red-500/90 to-red-600/90 border-red-400/20'
                              : 'bg-gradient-to-br from-primary/90 via-primary/90 to-primary/80 border-primary/20'
                          } text-primary-foreground relative overflow-hidden`}>
                            
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-2">
                                <Gift className="h-4 w-4" />
                                <Badge variant="secondary" className="bg-white text-primary font-bold text-xs px-2 py-0.5">
                                  {currentBanner?.discount} OFF
                                </Badge>
                              </div>
                              <h4 className="font-bold text-sm mb-1.5 leading-tight">{currentBanner?.title}</h4>
                              <p className="text-xs opacity-95 leading-relaxed mb-2">{currentBanner?.description}</p>
                              {currentBanner?.valid_until && (
                                <div className={`flex items-center gap-1.5 text-xs ${
                                  isExpiringSoon(currentBanner.valid_until) ? 'animate-pulse font-semibold' : 'opacity-90'
                                }`}>
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDate(currentBanner.valid_until)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {hasMultipleBanners && (
                            <div className="flex justify-center gap-1.5">
                              {visibleBanners.map((_, index) => (
                                <Button
                                  key={index}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleManualNavigation(index)}
                                  className={`w-2 h-2 p-0 rounded-full transition-all duration-300 ${
                                    index === currentBannerIndex 
                                      ? 'bg-primary scale-125' 
                                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Navigation Menu */}
                      <nav className="space-y-4">
                        {navigation.map((item) => (
                          <div key={item.title} className="space-y-2">
                            <div className="flex items-center gap-2.5 px-1">
                              <div className="w-1 h-5 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                              <h3 className="font-semibold text-foreground text-base tracking-tight">{item.title}</h3>
                            </div>
                            {item.items ? (
                              <div className="space-y-0.5 ml-3 pl-2 border-l border-border/50">
                                {item.items.map((subItem) => (
                                  <Link
                                    key={subItem.href}
                                    to={subItem.href}
                                    className="flex items-center justify-between py-2.5 px-3 text-muted-foreground hover:text-primary hover:bg-muted/40 rounded-lg transition-all duration-200 text-sm font-medium group min-h-[44px]"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                                      {subItem.title}
                                    </span>
                                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <Link
                                to={item.href}
                                className="flex items-center justify-between py-2.5 px-3 ml-3 text-muted-foreground hover:text-primary hover:bg-muted/40 rounded-lg transition-all duration-200 text-sm font-medium group min-h-[44px]"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                                  {item.title}
                                </span>
                                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                              </Link>
                            )}
                          </div>
                        ))}
                      </nav>
                    </div>
                  </div>

                  {/* Fixed Bottom Actions */}
                  <div className="p-4 space-y-3 border-t border-border/50 bg-gradient-to-r from-muted/20 to-muted/10 backdrop-blur-sm">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="grid grid-cols-2 gap-2">
                        <QuoteModal>
                          <Button 
                            variant="outline" 
                            className="h-11 text-sm font-medium rounded-xl border hover:border-primary hover:bg-primary/5 transition-all duration-200 min-h-[44px]"
                          >
                            Get Quote
                          </Button>
                        </QuoteModal>
                        <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button 
                            variant="premium" 
                            className="w-full h-11 text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 min-h-[44px]"
                          >
                            Contact Us
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="flex items-center justify-center gap-6 pt-2 border-t border-border/30">
                      <a 
                        href="tel:0114575401" 
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors min-h-[44px] py-2"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span className="font-medium">Call Us</span>
                      </a>
                      <a 
                        href="mailto:driptech2025@gmail.com" 
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors min-h-[44px] py-2"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span className="font-medium">Email</span>
                      </a>
                    </div>
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