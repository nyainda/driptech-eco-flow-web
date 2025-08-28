import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, Phone, Mail, ChevronDown, Droplets, Gift, Clock, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Auto-rotate banners
  useEffect(() => {
    const visibleBanners = getVisibleBanners();
    if (visibleBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => 
        (prevIndex + 1) % visibleBanners.length
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [banners, dismissedBanners]);

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
    }
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
      {/* Discount Banner - Option 1: Above top bar */}
      {showBanner && currentBanner && (
        <div className={`relative overflow-hidden transition-all duration-300 ${
          isExpiringSoon(currentBanner.valid_until)
            ? 'bg-gradient-to-r from-orange-500 to-red-500'
            : 'bg-gradient-to-r from-primary to-primary/80'
        } text-primary-foreground`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse" />
          </div>
          
          <div className="relative py-2 px-4">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
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
                    <span>{formatDate(currentBanner.valid_until)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                {hasMultipleBanners && (
                  <div className="flex gap-1">
                    {visibleBanners.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentBannerIndex(index)}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                          index === currentBannerIndex 
                            ? 'bg-primary-foreground' 
                            : 'bg-primary-foreground/40 hover:bg-primary-foreground/60'
                        }`}
                        aria-label={`Go to banner ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCloseBanner(currentBanner.id)}
                  className="text-primary-foreground hover:bg-primary-foreground/20 h-6 w-6 p-0 ml-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
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
            
            {/* Alternative: Compact banner in top bar */}
            {!showBanner && currentBanner && (
              <div className="hidden lg:flex items-center gap-2 text-xs">
                <Gift className="h-3 w-3 text-primary" />
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {currentBanner.discount} OFF
                </Badge>
                <span className="text-primary font-medium">{currentBanner.title}</span>
              </div>
            )}
            
            <div className="hidden md:flex items-center gap-4">
              <span>Professional Irrigation Solutions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
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
            <NavigationMenuList>
              {navigation.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.items ? (
                    <>
                      <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 transition-colors">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid w-[400px] gap-3 p-4">
                          {item.items.map((subItem) => (
                            <NavigationMenuLink key={subItem.href} asChild>
                              <Link
                                to={subItem.href}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group"
                              >
                                <div className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                                  {subItem.title}
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
                        className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/50 hover:text-primary focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
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
                <Button variant="ghost" size="icon" className="lg:hidden hover:bg-muted/50">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-6 py-6">
                  {/* Mobile Banner */}
                  {currentBanner && (
                    <div className={`p-4 rounded-lg ${
                      isExpiringSoon(currentBanner.valid_until)
                        ? 'bg-gradient-to-r from-orange-500 to-red-500'
                        : 'bg-gradient-to-r from-primary to-primary/80'
                    } text-primary-foreground`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="h-4 w-4" />
                        <Badge variant="secondary" className="bg-white text-primary font-bold text-xs">
                          {currentBanner.discount} OFF
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{currentBanner.title}</h4>
                      <p className="text-xs opacity-90">{currentBanner.description}</p>
                      {currentBanner.valid_until && (
                        <p className="text-xs opacity-80 mt-2">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatDate(currentBanner.valid_until)}
                        </p>
                      )}
                    </div>
                  )}

                  {navigation.map((item) => (
                    <div key={item.title} className="space-y-3">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      {item.items ? (
                        <div className="space-y-2 pl-4">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.href}
                              to={subItem.href}
                              className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {subItem.title}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <Link
                          to={item.href}
                          className="block text-sm text-muted-foreground hover:text-primary transition-colors pl-4"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.title}
                        </Link>
                      )}
                    </div>
                  ))}
                  
                  <div className="space-y-3 pt-6 border-t">
                    <QuoteModal>
                      <Button variant="outline" className="w-full">
                        Get Quote
                      </Button>
                    </QuoteModal>
                    <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="premium" className="w-full">
                        Contact Us
                      </Button>
                    </Link>
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