import {
  Award,
  FileCheck2,
  MapPinned,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";

const capabilities = [
  {
    icon: FileCheck2,
    badge: "Same-Day BOQs",
    title: "Custom Hydraulic Design & BOQ",
    detail:
      "Itemized bills of quantities sized to your crop spacing, water source, and field elevation.",
  },
  {
    icon: ShieldCheck,
    badge: "UV-Stabilized",
    title: "Genuine Field-Grade Equipment",
    detail:
      "Heavy-duty HDPE pipes, turbulent & PC driplines, disc filters, and high-efficiency pumps.",
  },
  {
    icon: Truck,
    badge: "All 47 Counties",
    title: "Nationwide Dispatch Across Kenya",
    detail:
      "Reliable delivery to Nairobi, Nakuru, Eldoret, Nanyuki, Meru, Machakos, Kisumu & coastal farms.",
  },
  {
    icon: Wrench,
    badge: "Full Installation",
    title: "Certified Installation & Handover",
    detail:
      "Experienced irrigation technicians for headworks assembly, zoning, and agronomic commissioning.",
  },
];

/** Executive confidence band highlighting DripTech's engineering & supply capabilities. */
const TrustStrip = () => (
  <section
    className="border-b border-border bg-card/90 backdrop-blur-sm"
    aria-label="Why farms and commercial estates choose DripTech EcoFlow"
  >
    {/* Compact 1-row horizontal pill ticker on mobile so shoppers reach Products immediately */}
    <div className="sm:hidden">
      <div className="dt-container py-2.5">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 scrollbar-hide">
          {capabilities.map(({ icon: Icon, badge, title }) => (
            <div
              key={title}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-2.5 py-1.5 text-[11px] font-bold text-foreground shadow-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Full 4-column executive capability cards + assurance strip on tablet & desktop */}
    <div className="hidden sm:block dt-container py-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {capabilities.map(({ icon: Icon, badge, title, detail }) => (
          <div
            key={title}
            className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-background/70 p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {badge}
                </span>
              </div>
              <h2 className="font-heading text-sm sm:text-base font-bold text-foreground">
                {title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom corporate assurance strip */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Award className="h-4 w-4 text-primary shrink-0" />
          <span>
            Serving Smallholder Farms, Commercial Estates, Greenhouses, NGOs & Institutions
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          <span className="inline-flex items-center gap-1">
            <MapPinned className="h-3.5 w-3.5 text-primary" /> Nairobi Dispatch Hub
          </span>
          <span>•</span>
          <span>Corporate LPO & Proforma Invoicing</span>
          <span>•</span>
          <span>M-Pesa & Bank Settlement</span>
        </div>
      </div>
    </div>
  </section>
);

export default TrustStrip;
