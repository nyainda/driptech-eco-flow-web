import React, { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ClipboardList, FileUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Quote, QuoteStatus, Customer } from "@/types/Quote";

interface QuoteFormProps {
  quote?: Quote | null;
  customer?: Customer | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  includeVat: boolean;
  setIncludeVat: (include: boolean) => void;
  vatRate: number;
  setVatRate: (rate: number) => void;
  date?: DateRange;
  setDate: (date: DateRange | undefined) => void;
}

const IRRIGATION_QUOTATION_TEMPLATE = `DETAILED IRRIGATION TECHNICAL & COMMERCIAL SCHEDULE
(Complete the bracketed fields using confirmed product data, site measurements and supplier quotations.)

1. PROJECT / DESIGN BASIS
Project location: [Site / county]
Irrigated area: [Acres / hectares]
Crop and spacing: [Crop, row spacing, plant spacing]
System proposed: [Drip / rain gun / sprinkler / mixed]
Water source: [Borehole / river / dam / tank / other]
Available source flow: [L/s or m³/h – confirmed]
Elevation / terrain: [Levels, slope and relevant site notes]
Design assumptions and information pending: [List]

2. RAIN GUNS / SPRAY GUNS
Selected model(s): [PY30 / PY40 / PY50 / FSN50 / FSC50 / FSW40 / FS35 / FS40 / other]
Quantity: [No.]
Inlet / connection: [Size and thread/flange]
Nozzle configuration: [Main + auxiliary/spreader nozzle sizes]
Operating pressure: [bar – manufacturer data]
Flow at stated pressure: [m³/h or L/min – manufacturer data]
Wetted radius / diameter at stated pressure: [m – manufacturer data]
Accessories: [Tripod / adaptor / nozzle set / clamps / seals – included or separately priced]
Performance reference: [Manufacturer datasheet / source]

3. RAIN GUN TRIPOD STANDS
Product: Drip Tech Adjustable Tripod Stand for Rain Guns
Selected variant: [1-inch inlet / 1.5-inch inlet / 2-inch inlet]
Quantity: [No.]
Connection / adaptor compatibility: [Confirm against selected rain gun]
Supply status: [Included / separately priced]
Notes: Heavy-duty adjustable support for stable rain-gun positioning; confirm exact connection before ordering.

4. DRIP TAPE (0.30 mm / 0.40 mm)
Thickness: [0.30 / 0.40 mm]
Nominal diameter: [mm]
Emitter spacing: [cm]
Emitter discharge at test pressure: [L/h]
Operating pressure range: [bar]
Filtration requirement: [Mesh / micron – supplier data]
Roll length: [m]
Quantity: [Rolls]
Price basis: [KES per roll]
Manufacturer / SKU: [Exact product]

5. RAIN HOSE
Diameter / bore: [mm / inch]
Construction / pressure rating: [Confirmed supplier data]
Length per roll: [m]
Quantity: [Rolls]
Connectors, clamps, end caps and repair pieces: [Included / optional / excluded]
Price basis: [KES per roll]
SKU / model: [Exact product]

6. HOSES & PIPEWORK (AS APPLICABLE)
Layflat: [Diameter, grade, working pressure, roll length, quantity]
Canvas hose: [Diameter, construction, coupling, pressure rating, length]
Flexible PVC: [Diameter, reinforced status, delivery/suction use, pressure rating]
Micro-spray tube: [Diameter, coil length, compatible emitters]
Fittings / valves / adaptors: [Type, size, quantity]
Confirm suction hose is vacuum-rated where used on pump intake.

7. PUMPING EQUIPMENT
Pump / engine make and model: [Exact model]
Fuel / power: [Petrol / diesel / electric; rated power]
Suction / discharge sizes: [Inlet and outlet]
Required duty point: [Flow + total dynamic head]
Pump curve / performance reference: [Datasheet]
Suction lift, static elevation and pipe/hose losses: [Calculated / confirmed]
Fuel consumption / warranty / service: [Supplier data]
Accessories: [Strainer, foot valve, couplings, base, etc. – included or separate]
Selection note: Final pump selection is based on required flow and total dynamic head, not maximum flow or maximum head alone.

8. COMMERCIAL & DELIVERY TERMS
MOQ / pack size: [Per SKU / roll / unit]
Price basis: [Retail / wholesale / project]
VAT: [Inclusive / exclusive; applicable rate]
Delivery destination: [Location]
Lead time: [Confirmed duration]
Delivery / transport charge: [KES or included]
Payment terms: [Deposit / balance / milestones]
Quotation validity: [Number of days]
Availability: [In stock / limited / procurement lead time]
Warranty / after-sales: [Supplier-confirmed terms]
Accessories: [Clearly list included, optional-priced and excluded items]

9. DESIGN SCOPE, ASSUMPTIONS & EXCLUSIONS
Design deliverables: [Layout, hydraulic calculations, equipment schedule, drawings, etc.]
Supply scope: [Items included in this quotation]
Installation / commissioning: [Included / excluded / separately quoted]
Civil works, power, source development and permits: [Included / excluded]
Client responsibilities / site information required: [List]
Important: Performance values and specifications must match the selected SKU and manufacturer datasheet. Do not leave unverified placeholders in the final customer quotation.`;

const QuoteForm: React.FC<QuoteFormProps> = ({
  quote,
  customer,
  onSubmit,
  onCancel,
  includeVat,
  setIncludeVat,
  vatRate,
  setVatRate,
  date,
  setDate,
}) => {
  const pdfInputRef = useRef<HTMLInputElement>(null);\n  const [pdfImporting, setPdfImporting] = useState(false);\n  const [formData, setFormData] = useState({
    project_type: quote?.project_type || "",
    crop_type: quote?.crop_type || "",
    area_size: quote?.area_size?.toString() || "",
    water_source: quote?.water_source || "",
    terrain_info: quote?.terrain_info || "",
    notes: quote?.notes || "",
    status: quote?.status || ("draft" as QuoteStatus),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      area_size: parseFloat(formData.area_size) || undefined,
      customer_id: customer?.id,
      include_vat: includeVat,
      vat_rate: vatRate,
      valid_until: date?.to?.toISOString(),
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const importQuotationPdf = async (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      window.alert("Please select a PDF file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      window.alert("PDF is too large. Please use a file under 20 MB.");
      return;
    }
    setPdfImporting(true);
    try {
      // PDF.js is loaded only when an admin imports a PDF (keeps the normal quote form bundle light).
      // @ts-ignore - PDF.js is loaded from its browser ESM CDN build at runtime.
      const pdfjs = await import(/* @vite-ignore */ "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
      const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const text = content.items
          .map((item: { str?: string }) => item.str || "")
          .join(" ")
          .replace(/\\s+/g, " ")
          .trim();
        if (text) pages.push(`--- PDF page ${pageNumber} ---\\n${text}`);
      }
      const extracted = pages.join("\\n\\n");
      if (!extracted.trim()) {
        window.alert("No selectable text was found. This PDF may be scanned; OCR is not available in this import yet.");
        return;
      }
      setFormData((previous) => ({
        ...previous,
        notes: previous.notes.trim()
          ? `${previous.notes.trim()}\\n\\n--- IMPORTED PDF: ${file.name} ---\\n${extracted}`
          : `--- IMPORTED PDF: ${file.name} ---\\n${extracted}`,
      }));
      window.alert("PDF text imported into Technical Specifications & Notes. Please review it and manually verify BOQ items and figures before saving.");
    } catch (error) {
      console.error("Quotation PDF import failed:", error);
      window.alert("Could not read this PDF. Try a text-based PDF (not a scan) and check your internet connection.");
    } finally {
      setPdfImporting(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  const insertIrrigationSchedule = () => {
    setFormData((prev) => ({
      ...prev,
      notes: prev.notes.trim()
        ? `${prev.notes.trim()}\n\n${IRRIGATION_QUOTATION_TEMPLATE}`
        : IRRIGATION_QUOTATION_TEMPLATE,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Details</CardTitle>
        <CardDescription>
          Enter project details, BOQ items and any technical or commercial notes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project_type">Project Type</Label>
              <Input
                id="project_type"
                value={formData.project_type}
                onChange={(e) => handleInputChange("project_type", e.target.value)}
                placeholder="e.g., Greenhouse Irrigation"
              />
            </div>
            <div>
              <Label htmlFor="crop_type">Crop Type</Label>
              <Input
                id="crop_type"
                value={formData.crop_type}
                onChange={(e) => handleInputChange("crop_type", e.target.value)}
                placeholder="e.g., Tomatoes"
              />
            </div>
            <div>
              <Label htmlFor="area_size">Area Size (acres)</Label>
              <Input
                type="number"
                step="0.1"
                id="area_size"
                value={formData.area_size}
                onChange={(e) => handleInputChange("area_size", e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div>
              <Label htmlFor="water_source">Water Source</Label>
              <Input
                id="water_source"
                value={formData.water_source}
                onChange={(e) => handleInputChange("water_source", e.target.value)}
                placeholder="e.g., Borehole, River"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="terrain_info">Terrain Information</Label>
            <Textarea
              id="terrain_info"
              value={formData.terrain_info}
              onChange={(e) => handleInputChange("terrain_info", e.target.value)}
              placeholder="Describe the terrain, elevation and soil conditions"
              rows={3}
            />
          </div>

          <section className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label htmlFor="notes" className="text-base font-semibold">
                  Technical Specifications, Commercial Terms & Notes
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  This content is included in the quotation PDF. Use the schedule for a detailed irrigation offer.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={insertIrrigationSchedule}
                className="shrink-0"
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Insert irrigation schedule
              </Button>
            </div>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add technical specifications, commercial terms, inclusions, exclusions and design assumptions…"
              rows={18}
              className="font-mono text-sm leading-6"
            />
            <p className="text-xs text-muted-foreground">
              The template is editable. Replace bracketed prompts with verified values and remove sections that do not apply before sending.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Valid Until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        `${format(date.from, "PPP")} - ${format(date.to, "PPP")}`
                      ) : (
                        format(date.from, "PPP")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* VAT Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include_vat"
                checked={includeVat}
                onCheckedChange={(checked) => setIncludeVat(checked as boolean)}
              />
              <Label htmlFor="include_vat" className="text-sm font-medium">
                Include VAT
              </Label>
            </div>
            {includeVat && (
              <div>
                <Label htmlFor="vat_rate">VAT Rate (%)</Label>
                <Input
                  type="number"
                  id="vat_rate"
                  value={vatRate}
                  onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {quote ? "Update Quote" : "Create Quote"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuoteForm;
