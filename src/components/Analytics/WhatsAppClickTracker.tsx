import { useEffect } from "react";
import { trackWhatsAppClick } from "@/lib/whatsappAnalytics";

const WhatsAppClickTracker = () => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;

      trackWhatsAppClick(
        link.href,
        link.dataset.whatsappSource || link.getAttribute("aria-label") || link.textContent || "website link",
      );
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
};

export default WhatsAppClickTracker;
