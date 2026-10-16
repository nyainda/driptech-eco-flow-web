import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, MessageCircle, Info } from "lucide-react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import SEOHead from "@/components/common/SEOHead";
import { SITE_COMPANY } from "@/config/company";

const money = (value: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);

const IrrigationCostCalculator = () => {
  const [acres, setAcres] = useState("1");
  const [rowSpacing, setRowSpacing] = useState("0.75");
  const [wastePercent, setWastePercent] = useState("10");
  const [pricePerMetre, setPricePerMetre] = useState("");
  const [filterFittings, setFilterFittings] = useState("");
  const [pumpBudget, setPumpBudget] = useState("");
  const [installation, setInstallation] = useState("");

  const estimate = useMemo(() => {
    const area = Math.max(0, Number(acres) || 0) * 4046.856;
    const spacing = Number(rowSpacing);
    const allowance = Math.max(0, Number(wastePercent) || 0);
    const lineMetres = spacing > 0 ? area / spacing : 0;
    const requiredMetres = lineMetres * (1 + allowance / 100);
    const hasAnyPrice = [pricePerMetre, filterFittings, pumpBudget, installation].some((v) => v.trim() !== "");
    const dripline = pricePerMetre.trim() ? requiredMetres * Math.max(0, Number(pricePerMetre) || 0) : null;
    const extras = [filterFittings, pumpBudget, installation].map((v) => v.trim() ? Math.max(0, Number(v) || 0) : null);
    const total = (dripline ?? 0) + extras.reduce<number>((sum, value) => sum + (value ?? 0), 0);
    const complete = Boolean(pricePerMetre.trim()) && extras.every((v) => v !== null);
    return { area, lineMetres, requiredMetres, dripline, extras, total, hasAnyPrice, complete };
  }, [acres, rowSpacing, wastePercent, pricePerMetre, filterFittings, pumpBudget, installation]);

  const quoteText = encodeURIComponent(
    `Hello DripTech Eco Flow, please help me verify an irrigation estimate. Farm size: ${acres} acre(s). Row spacing used: ${rowSpacing} m. Estimated dripline including ${wastePercent}% allowance: ${Math.ceil(estimate.requiredMetres).toLocaleString()} m. My entered-price estimate: ${estimate.hasAnyPrice ? money(estimate.total) + (estimate.complete ? " (all cost fields entered)" : " (partial; some costs not entered)") : "not priced yet"}. Please confirm crop layout, water source, filtration, pump sizing and a proper quotation.`
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Drip Irrigation Cost Calculator Kenya | DripTech Eco Flow"
        description="Estimate dripline length and build your own preliminary irrigation budget for a Kenyan farm. Enter your prices, review assumptions and request a verified quotation from DripTech Eco Flow."
        url={`${SITE_COMPANY.url}/irrigation-cost-calculator-kenya`}
      />
      <Header />
      <main>
        <section className="dt-section border-b border-border">
          <div className="dt-container max-w-5xl">
            <p className="dt-section-label mb-3">Free farm planning tool</p>
            <h1 className="dt-section-title max-w-4xl">Drip irrigation cost calculator for Kenya</h1>
            <p className="dt-section-subtitle mt-5 max-w-3xl">
              Estimate a preliminary dripline quantity and build a budget using prices you enter. This is a planning aid—not a fixed DripTech price or a final engineering design.
            </p>
          </div>
        </section>
        <section className="dt-section">
          <div className="dt-container grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <div className="dt-card p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <Calculator className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Your farm and budget</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium">Farm area (acres)
                  <input type="number" min="0.01" step="0.01" value={acres} onChange={(e) => setAcres(e.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-base" />
                </label>
                <label className="block text-sm font-medium">Distance between crop rows (metres)
                  <input type="number" min="0.1" step="0.05" value={rowSpacing} onChange={(e) => setRowSpacing(e.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-base" />
                </label>
                <label className="block text-sm font-medium">Extra allowance for layout (%) 
                  <input type="number" min="0" max="50" step="1" value={wastePercent} onChange={(e) => setWastePercent(e.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-base" />
                </label>
                <label className="block text-sm font-medium">Dripline price per metre (KSh)
                  <input type="number" min="0" step="0.01" value={pricePerMetre} onChange={(e) => setPricePerMetre(e.target.value)} placeholder="Enter supplier price" className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-base" />
                </label>
                <label className="block text-sm font-medium">Filters, pipes and fittings budget (KSh)
                  <input type="number" min="0" step="100" value={filterFittings} onChange={(e) => setFilterFittings(e.target.value)} placeholder="Enter estimate" className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-base" />
                </label>
                <label className="block text-sm font-medium">Pump / water supply budget (KSh)
                  <input type="number" min="0" step="100" value={pumpBudget} onChange={(e) => setPumpBudget(e.target.value)} placeholder="Enter estimate or 0 if not needed" className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-base" />
                </label>
                <label className="block text-sm font-medium sm:col-span-2">Installation and other costs (KSh)
                  <input type="number" min="0" step="100" value={installation} onChange={(e) => setInstallation(e.target.value)} placeholder="Enter estimate or 0 if not applicable" className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-base" />
                </label>
              </div>
            </div>
            <aside className="space-y-5">
              <div className="dt-card p-6 sm:p-8">
                <h2 className="text-xl font-bold">Your planning estimate</h2>
                <p className="mt-5 text-sm text-muted-foreground">Field area</p>
                <p className="text-2xl font-bold">{estimate.area.toLocaleString("en-KE", { maximumFractionDigits: 0 })} m²</p>
                <p className="mt-4 text-sm text-muted-foreground">Estimated dripline before allowance</p>
                <p className="text-xl font-semibold">{Math.ceil(estimate.lineMetres).toLocaleString("en-KE")} m</p>
                <p className="mt-4 text-sm text-muted-foreground">Dripline including allowance</p>
                <p className="text-2xl font-bold text-primary">{Math.ceil(estimate.requiredMetres).toLocaleString("en-KE")} m</p>
                <div className="my-5 border-t border-border" />
                <p className="text-sm text-muted-foreground">Total of costs you entered</p>
                <p className="text-3xl font-bold">{estimate.hasAnyPrice ? money(estimate.total) : "Add your prices"}</p>
                {estimate.hasAnyPrice && !estimate.complete && <p className="mt-2 text-sm text-muted-foreground">This is a partial total because one or more cost fields are blank.</p>}
                {estimate.complete && <p className="mt-2 text-sm text-muted-foreground">All four cost categories have been entered; verify quantities and specifications before relying on this budget.</p>}
                <a href={`https://wa.me/254723407849?text=${quoteText}`} target="_blank" rel="noreferrer" className="dt-btn-primary mt-6 inline-flex w-full items-center justify-center gap-2">
                  <MessageCircle className="h-4 w-4" /> Verify with DripTech
                </a>
                <Link to="/products/drip" className="dt-btn-secondary mt-3 inline-flex w-full items-center justify-center">Browse drip products</Link>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-5">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="text-sm leading-6 text-muted-foreground">
                    <strong className="text-foreground">Important assumptions</strong>
                    <p className="mt-2">The line-length estimate assumes the whole plot is planted in rows and uses area ÷ row spacing. Headlands, paths, field shape, multiple lines per bed, crop spacing, pressure zones and mainlines can change the real quantity.</p>
                    <p className="mt-2">The tool does not size a pump or guarantee a final system price. Ask for a farm-specific layout using your crop, dimensions, water source, available flow and elevation.</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default IrrigationCostCalculator;
