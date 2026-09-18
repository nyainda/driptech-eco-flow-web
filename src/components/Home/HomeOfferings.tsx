import ProductsShowcase from "@/components/Home/ProductsShowcase";
import { ArrowRight, CheckCircle2, MessageCircle, Sprout } from "lucide-react";
import { Link } from "react-router-dom";

/** Keep the homepage focused on the catalogue rather than hiding products behind service tabs. */
const HomeOfferings = () => (
  <>
    <ProductsShowcase hideStats hideBenefits />
    <section className="border-t border-border bg-muted/30 py-12 sm:py-16" aria-labelledby="kit-callout-title">
      <div className="dt-container">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-6 shadow-sm sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-primary/10" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <Sprout className="h-4 w-4" aria-hidden="true" />
              Complete kits
            </div>
            <h2 id="kit-callout-title" className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Prefer one package instead of a long parts list?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Choose a kit by plot size and crop. Each package brings the main lines, filter and fittings together, with help available before you order.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-foreground sm:grid-cols-3">
              {["Sized for your plot", "Parts grouped together", "Installation help available"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mt-6 flex shrink-0 flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
            <Link to="/irrigation-kits" className="dt-btn-primary inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap">
              View irrigation kits <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="https://wa.me/254723407849?text=Hi%20DripTech%20%E2%80%94%20please%20help%20me%20choose%20an%20irrigation%20kit."
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[hsl(var(--dt-whatsapp)/0.35)] px-5 py-2.5 text-sm font-semibold text-[hsl(var(--dt-whatsapp))] transition-colors hover:bg-[hsl(var(--dt-whatsapp)/0.08)]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Ask about a kit
            </a>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default HomeOfferings;
