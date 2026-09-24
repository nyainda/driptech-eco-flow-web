import { Headphones, MapPinned, ShieldCheck, Wrench } from "lucide-react";

const capabilities = [
  { icon: Wrench, title: "Design, supply & install", detail: "Support from planning to handover" },
  { icon: MapPinned, title: "Delivery across Kenya", detail: "Equipment for gardens and farms" },
  { icon: Headphones, title: "Technical sizing help", detail: "Talk through crops, water and acreage" },
  { icon: ShieldCheck, title: "Parts you can maintain", detail: "Practical systems and after-sales help" },
];

/** A compact, claim-led confidence band using only services already offered by DripTech. */
const TrustStrip = () => (
  <section className="border-b border-border bg-[hsl(var(--surface))]" aria-label="How DripTech helps">
    <div className="dt-container grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
      {capabilities.map(({ icon: Icon, title, detail }) => (
        <div key={title} className="flex gap-3 px-0 py-5 sm:px-5 lg:px-6">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{detail}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default TrustStrip;
