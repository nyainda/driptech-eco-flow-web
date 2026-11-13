import { MapPin, Phone, Mail, ArrowUpRight, MessageCircle, Facebook, Instagram } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import NewsletterSubscription from "@/components/Newsletter/NewsletterSubscription";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import { unlockStaffPortal } from "@/components/Admin/StealthAdminGate";

const footerGroups = [
  { title: "Products & Pricing", links: [
    ["Drip irrigation", "/products/drip"], ["HDPE dam liners", "/dam-liners-kenya"], ["Sprinkler systems", "/products/sprinklers"],
    ["Pumps & solar", "/solar-irrigation-pumps-kenya"], ["Irrigation kits & prices", "/drip-irrigation-kit-price-kenya"], ["View full catalogue", "/products"],
  ] },
  { title: "Engineering & Guides", links: [
    ["All 100+ Kenya guides", "/irrigation-guides-kenya"], ["Irrigation cost calculator", "/irrigation-cost-calculator-kenya"], ["System design & BOQ", "/services#system-design"],
    ["Installation guides", "/installation-guides"], ["Technical support", "/technical-support"], ["Counties we serve", "/irrigation-areas-kenya"],
  ] },
  { title: "Company", links: [
    ["About DripTech", "/about"], ["Completed projects", "/projects"], ["Case studies", "/case-studies"],
    ["Success stories", "/success-stories"], ["Blog & news", "/blog"], ["Contact us", "/contact"],
  ] },
];

const seoQuickLinks = [
  ["Drip Irrigation Kenya", "/drip-irrigation-kenya"],
  ["Dam Liner Prices Kenya", "/dam-liner-prices-kenya"],
  ["1 Acre Drip Kit Cost", "/one-acre-drip-irrigation-system-kenya"],
  ["1/8, 1/4 & 1/2 Acre Kits", "/eighth-quarter-half-acre-drip-kit-kenya"],
  ["Tomato Drip Irrigation", "/drip-irrigation-for-tomatoes-kenya"],
  ["Onion Drip Irrigation", "/drip-irrigation-for-onions-kenya"],
  ["Avocado Orchard Drip", "/drip-irrigation-for-avocado-kenya"],
  ["Pixie Orange Irrigation", "/drip-irrigation-for-citrus-pixie-oranges-kenya"],
  ["Button Drippers Kenya", "/button-dripper-orchard-irrigation-kenya"],
  ["Rain Gun Sprinklers", "/rain-gun-sprinkler-prices-kenya"],
  ["Pop-Up Lawn Sprinklers", "/pop-up-lawn-sprinklers-kenya"],
  ["Shade Nets & Greenhouses", "/shade-net-greenhouse-prices-kenya"],
  ["HDPE Pipe Prices", "/hdpe-pipe-prices-kenya"],
  ["Dripline Prices (1000m)", "/dripline-prices-kenya"],
];

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const handleCopyrightClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (e.detail === 3) {
      unlockStaffPortal();
      navigate("/admin");
    }
  };

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
              <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Serving farms across Kenya</div>
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

      <div className="border-t border-border/80 bg-background/50">
        <div className="dt-container py-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Popular Kenya Irrigation & Engineering Guides
            </span>
            <Link to="/irrigation-guides-kenya" className="text-xs font-semibold text-primary hover:underline">
              Browse All 100+ Guides →
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {seoQuickLinks.map(([label, href]) => (
              <Link key={href} to={href} className="transition-colors hover:text-primary hover:underline">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border pb-20 md:pb-0">
        <div className="dt-container flex flex-col gap-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span
            onClick={handleCopyrightClick}
            className="select-none cursor-default"
          >
            © {currentYear} DripTech Eco Flow. All rights reserved.
          </span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link className="hover:text-primary" to="/privacy">Privacy</Link>
            <Link className="hover:text-primary" to="/terms">Terms</Link>
            <Link className="hover:text-primary" to="/cookies">Cookies</Link>
            <Link className="hover:text-primary" to="/certifications">Certifications</Link>
            <Link className="hover:text-primary" to="/careers">Careers</Link>
          </div>
          <Link
            to="/blue-digital-solutions"
            aria-label="Powered by Blue Digital Solutions — view digital services"
            className="group inline-flex w-fit items-center gap-2 rounded-lg border border-border/80 bg-card/60 px-3 py-2 transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Powered by</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-black tracking-tight text-primary-foreground shadow-sm">BD</span>
            <span className="text-xs font-semibold text-foreground transition-colors group-hover:text-primary">Blue Digital Solutions</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
