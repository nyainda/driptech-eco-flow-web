import { Link, useLocation } from "react-router-dom";
import { BookOpen, Droplets, MessageCircle, Phone, ShoppingBag } from "lucide-react";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";

const HIDDEN_PREFIXES = ["/admin", "/dt-ops-console"];

export default function MobileActionBar() {
  const { pathname } = useLocation();

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const handleWhatsApp = () => {
    const pageUrl =
      typeof window !== "undefined" ? window.location.href : "https://dripstech.co.ke";
    const text = `Hi DripTech EcoFlow, I'm browsing ${pageUrl} on mobile and need help sizing or quoting irrigation equipment.`;
    openTrackedWhatsApp(
      `https://wa.me/254723407849?text=${encodeURIComponent(text)}`,
      "Mobile bottom dock WhatsApp",
    );
  };

  return (
    <nav
      aria-label="Mobile quick actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/85 bg-background/95 px-1.5 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-[0_-8px_28px_rgba(0,0,0,0.1)] backdrop-blur-lg md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-center gap-1">
        <Link
          to="/products"
          className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold leading-none transition-colors ${
            pathname.startsWith("/products")
              ? "bg-primary/12 text-primary"
              : "text-foreground/80 hover:bg-muted"
          }`}
        >
          <ShoppingBag className="h-4 w-4 shrink-0" />
          <span>Shop</span>
        </Link>

        <Link
          to="/irrigation-kits"
          className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold leading-none transition-colors ${
            pathname.startsWith("/irrigation-kits")
              ? "bg-primary/12 text-primary"
              : "text-foreground/80 hover:bg-muted"
          }`}
        >
          <Droplets className="h-4 w-4 shrink-0" />
          <span>Kits</span>
        </Link>

        <Link
          to="/irrigation-guides-kenya"
          className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold leading-none transition-colors ${
            pathname.startsWith("/irrigation-guides-kenya")
              ? "bg-primary/12 text-primary"
              : "text-foreground/80 hover:bg-muted"
          }`}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span>Guides</span>
        </Link>

        <a
          href="tel:0723407849"
          className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold leading-none text-foreground/80 transition-colors hover:bg-muted"
        >
          <Phone className="h-4 w-4 shrink-0 text-primary" />
          <span>Call</span>
        </a>

        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl bg-[hsl(var(--dt-whatsapp))] px-1 py-1.5 text-[10px] font-extrabold leading-none text-white shadow-sm transition-opacity active:opacity-90"
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span>WhatsApp</span>
        </button>
      </div>
    </nav>
  );
}
