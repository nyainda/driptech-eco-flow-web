import React from "react";
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
  MessageCircle,
} from "lucide-react";
import NewsletterSubscription from "@/components/Newsletter/NewsletterSubscription";

const Footer = () => {
  const currentYear = new Date().getFullYear();

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
    { icon: Facebook, href: "https://facebook.com/driptech-eco-flow", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com/dripechoflow", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com/company/driptech-eco-flow", label: "LinkedIn" },
    { icon: Youtube, href: "https://youtube.com/driptech-eco-flow", label: "YouTube" },
    { icon: Instagram, href: "https://instagram.com/driptech-eco-flow", label: "Instagram" },
  ];

  const col = "text-[hsl(var(--dt-stone-50))] font-semibold mb-4";
  const link = "text-sm text-[hsl(var(--dt-stone-400))] hover:text-[hsl(var(--dt-green-300))] transition-colors block";

  return (
    <footer className="bg-[hsl(var(--dt-green-900))] text-[hsl(var(--dt-stone-200))]">
      {/* Newsletter Section */}
      <div className="bg-[hsl(var(--dt-green-800))] border-b border-[hsl(var(--dt-green-700))]">
        <div className="container mx-auto px-4 py-12">
          <NewsletterSubscription variant="default" showDescription={true} />
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[hsl(var(--dt-stone-50))] mb-2">
                DripTech
              </h3>
              <p className="text-[hsl(var(--dt-stone-400))] leading-relaxed">
                Leading provider of advanced irrigation solutions, helping
                farmers and growers maximize efficiency while conserving water
                resources.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[hsl(var(--dt-green-300))] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-[hsl(var(--dt-stone-400))]">
                  <p className="font-medium text-[hsl(var(--dt-stone-50))]">Driptech</p>
                  <p>Agricultural Technology</p>
                  <p>Nairobi, Kenya</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-[hsl(var(--dt-green-300))] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-[hsl(var(--dt-stone-400))]">
                  <div className="flex items-center gap-2 mb-1">
                    <a
                      href="tel:0794494515"
                      className="hover:text-[hsl(var(--dt-stone-50))] transition-colors"
                    >
                      0794494515
                    </a>
                    <a
                      href="https://wa.me/254794494515"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[hsl(var(--dt-whatsapp))] hover:opacity-80 transition-opacity"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="tel:0114575401"
                      className="hover:text-[hsl(var(--dt-stone-50))] transition-colors"
                    >
                      0114575401
                    </a>
                    <a
                      href="https://wa.me/254114575401"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[hsl(var(--dt-whatsapp))] hover:opacity-80 transition-opacity"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-[hsl(var(--dt-green-300))] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-[hsl(var(--dt-stone-400))]">
                  <a
                    href="mailto:driptechs.info@gmail.com"
                    className="hover:text-[hsl(var(--dt-stone-50))] transition-colors block py-1"
                  >
                    driptechs.info@gmail.com
                  </a>
                  <a
                    href="mailto:info@dripstech.co.ke"
                    className="hover:text-[hsl(var(--dt-stone-50))] transition-colors block py-1"
                  >
                    info@dripstech.co.ke
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[hsl(var(--dt-green-300))] flex-shrink-0" />
                <span className="text-sm text-[hsl(var(--dt-stone-400))]">
                  Mon–Fri: 8AM–6PM | Sat: 8AM–1PM
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
                  className="p-2 rounded-lg bg-[hsl(var(--dt-green-700))] hover:bg-[hsl(var(--dt-green-600))] text-[hsl(var(--dt-stone-200))] transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className={col}>Products</h4>
            <ul className="space-y-3">
              {footerLinks.products.map((l) => (
                <li key={l.href}><a href={l.href} className={link}>{l.title}</a></li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className={col}>Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((l) => (
                <li key={l.href}><a href={l.href} className={link}>{l.title}</a></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className={col}>Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((l) => (
                <li key={l.href}><a href={l.href} className={link}>{l.title}</a></li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className={col}>Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((l) => (
                <li key={l.href}><a href={l.href} className={link}>{l.title}</a></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[hsl(var(--dt-green-700))]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-[hsl(var(--dt-stone-400))]">
              © {currentYear} DripTech Irrigation Solutions. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <a href="/privacy" className={link}>Privacy Policy</a>
              <a href="/terms" className={link}>Terms of Service</a>
              <a href="/cookies" className={link}>Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
