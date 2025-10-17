import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  Send,
  CheckCircle,
  MessageCircle,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const footerLinks = {
    products: [
      { title: "Drip Irrigation Systems", href: "/products/drip" },
      { title: "Sprinkler Systems", href: "/products/sprinklers" },
      { title: "Filtration Systems", href: "/products/filtration" },
      { title: "Control Systems", href: "/products/controls" },
      { title: "Accessories", href: "/products/accessories" },
    ],
    services: [
      { title: "System Design", href: "/services/design" },
      { title: "Installation", href: "/services/installation" },
      { title: "Maintenance", href: "/services/maintenance" },
      { title: "Training", href: "/services/training" },
      { title: "Consultation", href: "/services/consultation" },
    ],
    company: [
      { title: "About Us", href: "/about" },
      { title: "Our Team", href: "/team" },
      { title: "Careers", href: "/careers" },
      { title: "Certifications", href: "/certifications" },
      { title: "News & Events", href: "/news" },
    ],
    resources: [
      { title: "Installation Guides", href: "/resources/guides" },
      { title: "Technical Support", href: "/support" },
      { title: "Product Catalog", href: "/catalog" },
      { title: "Case Studies", href: "/case-studies" },
      { title: "Blog", href: "/blog" },
    ],
  };

  const socialLinks = [
    {
      icon: Facebook,
      href: "https://facebook.com/driptech-eco-flow",
      label: "Facebook",
    },
    {
      icon: Twitter,
      href: "https://twitter.com/dripechoflow",
      label: "Twitter",
    },
    {
      icon: Linkedin,
      href: "https://linkedin.com/company/driptech-eco-flow",
      label: "LinkedIn",
    },
    {
      icon: Youtube,
      href: "https://youtube.com/driptech-eco-flow",
      label: "YouTube",
    },
    {
      icon: Instagram,
      href: "https://instagram.com/driptech-eco-flow",
      label: "Instagram",
    },
  ];

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setTimeout(() => {
        setIsSubscribed(true);
        setEmail("");
        setTimeout(() => setIsSubscribed(false), 3000);
      }, 500);
    }
  };

  return (
    <footer className="bg-background border-t border-border">
      {/* Newsletter Section */}
      <div className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Stay Updated with Industry Insights
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Get the latest irrigation technology updates, maintenance tips,
              and industry best practices delivered to your inbox.
            </p>

            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md mx-auto"
            >
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-9 sm:h-10 text-sm"
                required
              />
              <Button
                type="submit"
                className="sm:w-auto w-full h-9 sm:h-10 text-sm"
                disabled={isSubscribed}
              >
                {isSubscribed ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Subscribed!
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Subscribe
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground mb-2">
                DripTech
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Leading provider of advanced irrigation solutions, helping
                farmers and growers maximize efficiency while conserving water
                resources.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Driptech</p>
                  <p>Agricultural Technology</p>
                  <p>Nairobi, Kenya</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 mb-1">
                    <a
                      href="tel:0114575401"
                      className="hover:text-foreground transition-colors"
                    >
                      0114575401
                    </a>
                    <a
                      href="https://wa.me/0114575401"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 transition-colors"
                      aria-label="WhatsApp 0114575401"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="tel:0114575401"
                      className="hover:text-foreground transition-colors"
                    >
                      0114575401
                    </a>
                    <a
                      href="https://wa.me/0114575401"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 transition-colors"
                      aria-label="WhatsApp 0114575401"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <a
                    href="mailto:driptechs.info@gmail.com"
                    className="hover:text-foreground transition-colors block"
                  >
                    driptechs.info@gmail.com
                  </a>
                  <a
                    href="mailto:driptech2025@gmail.com"
                    className="hover:text-foreground transition-colors block"
                  >
                    driptech2025@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  Mon-Fri: 8AM-6PM EST
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Products</h4>
            <ul className="space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {currentYear} DripTech Irrigation Solutions. All rights
              reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <a
                href="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/cookies"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
