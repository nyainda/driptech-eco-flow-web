import { MapPin, Phone, Mail, ArrowUpRight, MessageCircle, Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import NewsletterSubscription from "@/components/Newsletter/NewsletterSubscription";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";

const footerGroups = [
  { title: "Products", links: [
    ["Drip irrigation", "/products/drip"], ["Sprinkler systems", "/products/sprinklers"],
    ["Pumps & motors", "/products/pumps"], ["Irrigation kits", "/irrigation-kits"], ["View catalogue", "/products"],
  ] },
  { title: "Support", links: [
    ["System design", "/services#system-design"], ["Technician services", "/technician-services"],
    ["Installation guides", "/installation-guides"], ["Technical support", "/technical-support"], ["Contact us", "/contact"],
  ] },
  { title: "Company", links: [
    ["About DripTech", "/about"], ["Projects", "/projects"], ["Success stories", "/success-stories"],
    ["Blog", "/blog"], ["News", "/news"],
  ] },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-[hsl(var(--surface))] text-foreground">
      <div className="border-b border-border bg-background">
        <div className="dt-container py-10 sm:py-12">
          <NewsletterSubscription variant="default" showDescription />
        </div>
      </div>

      <div className="dt-container py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Link to="/" className="inline-flex items-baseline gap-2" aria-label="DripTech Eco Flow home">
              <span className="font-heading text-xl font-bold tracking-tight">DripTech</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Eco Flow</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Practical irrigation equipment, system design and installation support for farms across Kenya.
            </p>
            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              <a className="flex items-start gap-3 transition-colors hover:text-primary" href="https://maps.google.com/?q=Nairobi,Kenya" target="_blank" rel="noreferrer"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Nairobi, Kenya · delivery nationwide</a>
              <a className="flex items-center gap-3 transition-colors hover:text-primary" href="tel:0723407849"><Phone className="h-4 w-4 shrink-0 text-primary" />0723 407 849</a>
              <a className="flex items-center gap-3 transition-colors hover:text-primary" href="mailto:info@dripstech.co.ke"><Mail className="h-4 w-4 shrink-0 text-primary" />info@dripstech.co.ke</a>
            </div>
            <button type="button" onClick={() => openTrackedWhatsApp("https://wa.me/254723407849?text=Hi%20DripTech%20Eco%20Flow%2C%20I%20would%20like%20help%20with%20an%20irrigation%20solution.", "footer WhatsApp inquiry")} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-[hsl(var(--whatsapp))] px-4 text-sm font-semibold text-white transition-colors hover:bg-[hsl(var(--whatsapp)/0.9)]">
              <MessageCircle className="h-4 w-4" />Chat on WhatsApp <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
            <div className="mt-5 flex items-center gap-3">
              <a href="https://www.tiktok.com/@driptech.ecoflow" target="_blank" rel="noreferrer" aria-label="DripTech on TikTok" className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M16.5 2h-3v13.2a2.8 2.8 0 1 1-2-2.68V9.4a5.8 5.8 0 1 0 5 5.75V8.8a7.35 7.35 0 0 0 4 1.2V7A4.35 4.35 0 0 1 16.5 2Z" />
                </svg>
              </a>
              <a href="https://www.facebook.com/dripstech" target="_blank" rel="noreferrer" aria-label="DripTech on Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://www.instagram.com/dripstech" target="_blank" rel="noreferrer" aria-label="DripTech on Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="storefront-eyebrow mb-4">{group.title}</h2>
              <ul className="space-y-3">
                {group.links.map(([label, href]) => <li key={href}><Link className="storefront-link" to={href}>{label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="dt-container flex flex-col gap-3 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {currentYear} DripTech Eco Flow. All rights reserved.</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2"><Link className="hover:text-primary" to="/privacy">Privacy</Link><Link className="hover:text-primary" to="/terms">Terms</Link><Link className="hover:text-primary" to="/cookies">Cookies</Link><Link className="hover:text-primary" to="/certifications">Certifications</Link><Link className="hover:text-primary" to="/careers">Careers</Link></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
