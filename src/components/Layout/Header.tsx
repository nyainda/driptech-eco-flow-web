import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, ChevronDown, Droplets } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Link } from "react-router-dom";
import QuoteModal from "@/components/Home/QuoteModal";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import driptechLogo from "@/assets/driptech-logo.png";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      {/* Top Bar */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex h-10 items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>0114575401</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <span className="hidden sm:inline">driptech2025@gmail.com</span>
                <span className="sm:hidden">driptech2025@gmail.com</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <span>driptechs.info@gmail.com</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <span>Irrigation Solutions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
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
                      <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid w-[400px] gap-3 p-4">
                          {item.items.map((subItem) => (
                            <NavigationMenuLink key={subItem.href} asChild>
                              <Link
                                to={subItem.href}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              >
                                <div className="text-sm font-medium leading-none">
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
                        className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/50 focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
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
              <Button variant="outline" className="hidden md:flex">
                Get Quote
              </Button>
            </QuoteModal>
            <Link to="/contact">
              <Button variant="premium">
                Contact Us
              </Button>
            </Link>
            
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-6 py-6">
                  {navigation.map((item) => (
                    <div key={item.title} className="space-y-3">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      {item.items && (
                        <div className="space-y-2 pl-4">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.href}
                              to={subItem.href}
                              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {subItem.title}
                            </Link>
                          ))}
                        </div>
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