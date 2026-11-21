import { lazy, Suspense, useState } from "react";
import { MessageCircle } from "lucide-react";

const loadWhatsAppContact = () => import("@/components/common/WhatsAppContact");
const WhatsAppContact = lazy(loadWhatsAppContact);

/**
 * Lightweight floating launcher for the WhatsApp inquiry dialog so home routes
 * do not eagerly bundle Dialog, Tabs, Card, and dataService on initial paint.
 */
export default function LazyWhatsAppContact() {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return (
      <Suspense fallback={null}>
        <WhatsAppContact variant="floating" defaultOpen />
      </Suspense>
    );
  }

  return (
    <button
      type="button"
      onMouseEnter={() => {
        void loadWhatsAppContact();
      }}
      onFocus={() => {
        void loadWhatsAppContact();
      }}
      onClick={() => setActivated(true)}
      className="hidden md:inline-flex fixed bottom-8 right-8 z-50 h-14 min-w-[210px] items-center gap-3 rounded-full bg-[hsl(var(--dt-whatsapp))] px-5 text-white shadow-[0_10px_30px_hsl(var(--dt-whatsapp)/0.28)] transition-all duration-200 hover:-translate-y-1 hover:bg-[hsl(var(--dt-whatsapp)/0.92)] hover:shadow-[0_14px_34px_hsl(var(--dt-whatsapp)/0.35)]"
      aria-label="Contact us on WhatsApp"
      title="Open WhatsApp and choose what you need"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
        <MessageCircle className="h-5 w-5" />
      </span>
      <span className="hidden text-left sm:block whitespace-nowrap">
        <span className="block text-xs font-medium text-white/95">Need a hand?</span>
        <span className="block text-sm font-bold leading-tight">Chat on WhatsApp</span>
      </span>
    </button>
  );
}
