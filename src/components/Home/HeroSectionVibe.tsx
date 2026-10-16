import { ArrowRight, CheckCircle2, Leaf, MessageCircle, ShieldCheck, Truck, Users, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

const metrics = [
  { value: "Crop-fit", label: "System guidance", icon: Leaf },
  { value: "Clear", label: "Product details", icon: CheckCircle2 },
  { value: "Direct", label: "WhatsApp support", icon: MessageCircle },
  { value: "Nationwide", label: "Service enquiries", icon: Wrench },
];

const benefits = [
  { icon: ShieldCheck, title: "Quality equipment", detail: "Built for real farms" },
  { icon: Users, title: "Expert guidance", detail: "Get the right solution" },
  { icon: Truck, title: "Delivery options", detail: "Confirm timing for your location" },
];

export default function HeroSectionVibe() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background" aria-labelledby="home-hero-title">
      <div className="dt-container relative py-7 sm:py-10 lg:py-12">
        <div className="relative min-h-[500px] overflow-hidden rounded-[20px] border border-border bg-card shadow-sm sm:min-h-[560px] lg:min-h-[600px]">
          <picture>
            <source media="(max-width: 640px)" srcSet="/hero-bg-new-mobile.webp" />
            <source media="(max-width: 1024px)" srcSet="/hero-bg-new-tablet.webp" />
            <img
              src="/hero-bg-new-desktop.webp"
              alt="Irrigated crop rows on a Kenyan farm"
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority="high"
              decoding="async"
              width="1920"
              height="1080"
            />
          </picture>

          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/82 via-48% to-background/10 lg:from-background/95 lg:via-background/72 lg:to-transparent" />

          <div className="relative flex min-h-[500px] items-end px-5 py-7 sm:min-h-[560px] sm:px-8 sm:py-9 lg:min-h-[600px] lg:items-center lg:px-12">
            <div className="max-w-2xl">
              <p className="dt-section-label mb-3">Smart irrigation solutions</p>
              <h1 id="home-hero-title" className="font-heading text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-[hsl(var(--dt-green-900))] sm:text-5xl lg:text-6xl xl:text-7xl">
                Healthy Crops.
                <br />
                <span className="text-[hsl(var(--dt-green-700))]">Higher Yields.</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[hsl(var(--dt-green-900)/0.82)] sm:text-base sm:leading-7">
                Quality irrigation equipment and expert support for a more productive and sustainable farm.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
                <Link to="/products" className="dt-btn-primary inline-flex items-center gap-2 shadow-sm">
                  Explore products <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={"https://wa.me/254723407849?text=" + encodeURIComponent("Hi DripTech! I need help choosing irrigation equipment.")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-[10px] border border-primary/30 bg-card/85 px-4 py-2.5 text-sm font-bold text-foreground backdrop-blur-sm transition-colors hover:bg-card"
                >
                  <MessageCircle className="h-4 w-4" /> Talk to our experts
                </a>
              </div>

              <div className="mt-6 grid max-w-2xl grid-cols-2 gap-x-5 gap-y-3 border-t border-[hsl(var(--dt-green-900)/0.15)] pt-5 sm:grid-cols-4">
                {metrics.map(({ value, label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-[hsl(var(--dt-green-700))]" />
                    <div>
                      <p className="font-mono text-sm font-black text-[hsl(var(--dt-green-900))]">{value}</p>
                      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[hsl(var(--dt-green-900)/0.65)]">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute right-5 top-5 hidden w-[220px] rounded-2xl border border-white/30 bg-[hsl(var(--dt-green-900)/0.94)] p-4 text-white shadow-lg backdrop-blur-md sm:block lg:right-8 lg:top-12 lg:w-[240px]">
              <p className="font-heading text-xl font-bold leading-tight">Better irrigation.<br />Healthier crops.<br />Higher yields.</p>
              <div className="mt-4 space-y-3 border-t border-white/15 pt-3">
                {benefits.map(({ icon: Icon, title, detail }) => (
                  <div key={title} className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--dt-gold-400))]" />
                    <div>
                      <p className="text-[11px] font-bold">{title}</p>
                      <p className="text-[9px] text-white/65">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-background">
        <div className="dt-container grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {[
            ["Quality equipment", "Built for real farms"],
            ["Expert guidance", "Get the right solution"],
            ["Delivery options", "Confirm timing for your location"],
            ["Local support", "We're here to help"],
          ].map(([title, detail], index) => {
            const Icon = [ShieldCheck, Users, Truck, CheckCircle2][index];
            return (
              <div key={title} className="flex gap-3 px-0 py-4 sm:px-5 lg:px-6">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-foreground">{title}</p>
                  <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
