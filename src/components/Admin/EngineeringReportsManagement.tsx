import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Building2,
  CheckCircle2,
  CloudSun,
  Compass,
  Database,
  Download,
  Droplets,
  FileDown,
  FileSpreadsheet,
  FolderOpen,
  Gauge,
  MessageCircle,
  Printer,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Sun,
  UserCheck,
  Waves,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import { SITE_COMPANY } from "@/config/company";
import PumpCurveVisualizer from "@/components/Calculators/PumpCurveVisualizer";
import BOQSectionBuilder, {
  type BOQItem,
  type BOQSection,
  type CatalogueProduct,
} from "@/components/Admin/Quote/BOQSectionBuilder";
import {
  BoreholeCasingInch,
  CatalogPumpProduct,
  DEFAULT_PUMP_SOLAR_INPUTS,
  KENYA_SOLAR_REGIONS,
  PowerSupplyMode,
  PumpSolarInputs,
  WaterSourceType,
} from "@/lib/pumpSolarSizing";
import {
  ClientReportMetadata,
  computeCompleteEngineeringDesign,
  DamStorageConfig,
  DamStorageMode,
  DEFAULT_CLIENT_REPORT_META,
  DEFAULT_DAM_CONFIG,
  DEFAULT_FIELD_CONFIG,
  FieldIrrigationConfig,
  FieldSystemType,
  generateAdminEngReportCode,
  generateAutoEngineeringBoq,
  HydraulicCouplingMode,
} from "@/lib/engineeringReportEngine";
import {
  downloadFullClientEngineeringReportHtml,
  openFullClientEngineeringReportPdf,
} from "@/lib/fullEngineeringReportPdf";
import {
  AdminPumpReportRow,
  AdminReportStatus,
  fetchAdminEngineeringReports,
  pushEngineeringBoqToOfficialQuote,
  saveAdminEngineeringDossier,
  StoredAdminEngineeringBundle,
  updateAdminReportStatus,
} from "@/services/pumpReportService";

interface CrmCustomer {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  city: string;
}

const ADMIN_PRESET_TEMPLATES: Array<{
  id: string;
  label: string;
  badge: string;
  field: Partial<FieldIrrigationConfig>;
  dam: Partial<DamStorageConfig>;
  coupling: HydraulicCouplingMode;
  pumpPatch: Partial<PumpSolarInputs>;
}> = [
  {
    id: "borehole_solar_drip",
    label: "2-Acre Solar Borehole + Drip",
    badge: "Popular Horticulture",
    field: { systemType: "drip", acres: 2, zones: 2, rowSpacingM: 1.0, cropName: "Tomatoes & Capsicum" },
    dam: { mode: "none" },
    coupling: "direct_pressurized",
    pumpPatch: {
      sourceType: "borehole",
      staticWaterDepthM: 55,
      drawdownM: 10,
      groundElevationGainM: 6,
      powerMode: "solar_hybrid",
    },
  },
  {
    id: "sprinkler_surface",
    label: "5-Acre River/Dam Sprinkler Grid",
    badge: "Overhead Crops",
    field: {
      systemType: "sprinkler",
      acres: 5,
      zones: 4,
      sprinklerSpacingM: 12,
      sprinklerWorkingBar: 2.8,
      cropName: "Maize, Fodder & Beans",
    },
    dam: { mode: "none" },
    coupling: "direct_pressurized",
    pumpPatch: {
      sourceType: "surface_suction",
      staticWaterDepthM: 3.5,
      drawdownM: 0.5,
      groundElevationGainM: 8,
      powerMode: "solar_hybrid",
    },
  },
  {
    id: "raingun_fodder",
    label: "10-Acre Pasture Rain Gun",
    badge: "High Pressure",
    field: {
      systemType: "raingun",
      acres: 10,
      zones: 4,
      raingunWettingRadiusM: 32,
      raingunFlowM3h: 18,
      raingunWorkingBar: 4.2,
      raingunHydrants: 8,
      cropName: "Napier Grass / Rhodes Pasture",
    },
    dam: { mode: "none" },
    coupling: "direct_pressurized",
    pumpPatch: {
      sourceType: "surface_suction",
      staticWaterDepthM: 3,
      drawdownM: 0.5,
      groundElevationGainM: 5,
      powerMode: "ac_grid_backup",
    },
  },
  {
    id: "pan_liner_drip",
    label: "3-Acre Borehole + HDPE Water Pan + Drip",
    badge: "Combined Pan + Drip",
    field: { systemType: "drip", acres: 3, zones: 3, cropName: "Hass Avocado & Vegetables" },
    dam: { mode: "hdpe_dam_liner", topLengthM: 18, topWidthM: 14, depthM: 3, linerThicknessMm: 0.75 },
    coupling: "fill_storage_tank",
    pumpPatch: {
      sourceType: "borehole",
      staticWaterDepthM: 70,
      drawdownM: 12,
      powerMode: "solar_dc",
      operatingHoursPerDay: 6.5,
    },
  },
];

const formatKes = (val?: number | null) =>
  val && val > 0 ? `KES ${Math.round(val).toLocaleString("en-KE")}` : "Pending Quote";

export default function EngineeringReportsManagement() {
  const { toast } = useToast();

  const [studioTab, setStudioTab] = useState<string>("inbox");
  const [reports, setReports] = useState<AdminPumpReportRow[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [reportSearch, setReportSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [catalogProducts, setCatalogProducts] = useState<CatalogueProduct[]>([]);
  const [catalogPumps, setCatalogPumps] = useState<CatalogPumpProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);
  const [crmCustomers, setCrmCustomers] = useState<CrmCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Active design state
  const [meta, setMeta] = useState<ClientReportMetadata>(() => ({
    ...DEFAULT_CLIENT_REPORT_META,
    reportCode: generateAdminEngReportCode(),
  }));
  const [field, setField] = useState<FieldIrrigationConfig>(DEFAULT_FIELD_CONFIG);
  const [dam, setDam] = useState<DamStorageConfig>(DEFAULT_DAM_CONFIG);
  const [couplingMode, setCouplingMode] = useState<HydraulicCouplingMode>("direct_pressurized");
  const [pumpInputs, setPumpInputs] = useState<PumpSolarInputs>(DEFAULT_PUMP_SOLAR_INPUTS);

  // BOQ state + Export flags
  const [boqSections, setBoqSections] = useState<BOQSection[]>([]);
  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [hideUnitPricesInPrint, setHideUnitPricesInPrint] = useState<boolean>(false);
  const [includeCommissioningChecklist, setIncludeCommissioningChecklist] = useState<boolean>(true);
  const [savingDb, setSavingDb] = useState<boolean>(false);
  const [pushingQuote, setPushingQuote] = useState<boolean>(false);

  const loadInboxAndData = useCallback(async () => {
    setLoadingReports(true);
    try {
      const list = await fetchAdminEngineeringReports();
      setReports(list);
    } catch (err) {
      console.error("Failed loading engineering reports:", err);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    loadInboxAndData();

    const loadCatalogAndCustomers = async () => {
      setLoadingCatalog(true);
      try {
        const [{ data: prods }, { data: custs }] = await Promise.all([
          supabase
            .from("products")
            .select("id, name, model_number, category, subcategory, description, price, in_stock, images, specifications")
            .order("name", { ascending: true })
            .limit(600),
          supabase
            .from("customers")
            .select("id, company_name, contact_person, email, phone, city")
            .order("company_name", { ascending: true })
            .limit(300),
        ]);

        if (Array.isArray(prods)) {
          setCatalogProducts(prods as CatalogueProduct[]);
          setCatalogPumps(
            prods.filter((p) => p.category === "pumps_motors") as unknown as CatalogPumpProduct[],
          );
        }
        if (Array.isArray(custs)) {
          setCrmCustomers(custs as CrmCustomer[]);
        }
      } catch (err) {
        console.error("Error loading catalogue/customers:", err);
      } finally {
        setLoadingCatalog(false);
      }
    };

    loadCatalogAndCustomers();
  }, [loadInboxAndData]);

  // Live Complete Engineering Calculations
  const design = useMemo(
    () =>
      computeCompleteEngineeringDesign({
        field,
        dam,
        pumpInputs,
        couplingMode,
        catalogPumps,
      }),
    [field, dam, pumpInputs, couplingMode, catalogPumps],
  );

  // Seed default BOQ automatically on initial render once catalogue loads
  const seededInitialBoqRef = useRef(false);
  useEffect(() => {
    if (!loadingCatalog && !seededInitialBoqRef.current) {
      seededInitialBoqRef.current = true;
      const generated = generateAutoEngineeringBoq({
        design,
        field,
        dam,
        pumpInputs: design.syncedPumpInputs,
        catalogProducts,
      });
      setBoqSections(generated.sections);
      setBoqItems(generated.items);
    }
  }, [loadingCatalog, catalogProducts, design, field, dam]);

  const handleRegenerateBoq = () => {
    const generated = generateAutoEngineeringBoq({
      design,
      field,
      dam,
      pumpInputs: design.syncedPumpInputs,
      catalogProducts,
    });
    setBoqSections(generated.sections);
    setBoqItems(generated.items);
    toast({
      title: "Engineering BOQ Rebuilt",
      description: `Populated ${generated.items.length} line items across ${generated.sections.length} sections from current hydraulic & field design.`,
    });
  };

  const applyPresetTemplate = (presetId: string) => {
    const preset = ADMIN_PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (!preset) return;
    const nextField: FieldIrrigationConfig = { ...DEFAULT_FIELD_CONFIG, ...preset.field };
    const nextDam: DamStorageConfig = { ...DEFAULT_DAM_CONFIG, ...preset.dam };
    const nextPump: PumpSolarInputs = { ...DEFAULT_PUMP_SOLAR_INPUTS, ...preset.pumpPatch };
    setField(nextField);
    setDam(nextDam);
    setCouplingMode(preset.coupling);
    setPumpInputs(nextPump);
    setMeta((prev) => ({
      ...prev,
      reportCode: generateAdminEngReportCode(),
      projectTitle: `${preset.label} Engineering Proposal`,
    }));

    const nextDesign = computeCompleteEngineeringDesign({
      field: nextField,
      dam: nextDam,
      pumpInputs: nextPump,
      couplingMode: preset.coupling,
      catalogPumps,
    });
    const generated = generateAutoEngineeringBoq({
      design: nextDesign,
      field: nextField,
      dam: nextDam,
      pumpInputs: nextDesign.syncedPumpInputs,
      catalogProducts,
    });
    setBoqSections(generated.sections);
    setBoqItems(generated.items);
    toast({ title: `Loaded preset: ${preset.label}` });
  };

  const handleSelectCrmCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const found = crmCustomers.find((c) => c.id === customerId);
    if (!found) return;
    setMeta((prev) => ({
      ...prev,
      clientName: found.contact_person || found.company_name || prev.clientName,
      companyFarmName: found.company_name || prev.companyFarmName,
      clientPhone: found.phone || prev.clientPhone,
      clientEmail: found.email || prev.clientEmail,
      countyLocation: found.city || prev.countyLocation,
    }));
    toast({ title: "Client loaded from CRM", description: found.company_name || found.contact_person });
  };

  const handleLoadClientReport = (row: AdminPumpReportRow) => {
    const savedBundle = (row.result_json as Record<string, unknown> | null)?.adminEngineeringBundle as
      | StoredAdminEngineeringBundle
      | undefined;

    if (savedBundle) {
      setField(savedBundle.field);
      setDam(savedBundle.dam);
      setMeta({ ...DEFAULT_CLIENT_REPORT_META, ...savedBundle.meta, reportCode: row.report_code });
      setCouplingMode(savedBundle.couplingMode || "direct_pressurized");
      if (row.inputs_json) {
        setPumpInputs({ ...DEFAULT_PUMP_SOLAR_INPUTS, ...row.inputs_json });
      }
      setBoqSections(savedBundle.boqSections || []);
      setBoqItems(savedBundle.boqItems || []);
      setStudioTab("boq");
      toast({
        title: `Loaded Engineering Dossier ${row.report_code}`,
        description: "Restored complete field, pump, solar & BOQ state.",
      });
      return;
    }

    // Reconstruct from public calculator submission
    const restoredPump: PumpSolarInputs = row.inputs_json
      ? {
          ...DEFAULT_PUMP_SOLAR_INPUTS,
          ...row.inputs_json,
          suctionPipe: {
            ...DEFAULT_PUMP_SOLAR_INPUTS.suctionPipe,
            ...(row.inputs_json.suctionPipe || {}),
          },
          primaryPipe: {
            ...DEFAULT_PUMP_SOLAR_INPUTS.primaryPipe,
            ...(row.inputs_json.primaryPipe || {}),
          },
          secondaryPipe: {
            ...DEFAULT_PUMP_SOLAR_INPUTS.secondaryPipe,
            ...(row.inputs_json.secondaryPipe || {}),
          },
          customPump: {
            ...DEFAULT_PUMP_SOLAR_INPUTS.customPump,
            ...(row.inputs_json.customPump || {}),
          },
        }
      : {
          ...DEFAULT_PUMP_SOLAR_INPUTS,
          directFlowValue: row.design_flow_m3h || 5,
        };

    const inferredFieldType: FieldSystemType =
      restoredPump.irrigationMethod === "raingun"
        ? "raingun"
        : restoredPump.irrigationMethod === "sprinkler"
          ? "sprinkler"
          : "drip";

    const nextField: FieldIrrigationConfig = {
      ...DEFAULT_FIELD_CONFIG,
      systemType: inferredFieldType,
      acres:
        restoredPump.demandMode === "crop_area" && restoredPump.areaValue > 0
          ? restoredPump.areaValue
          : DEFAULT_FIELD_CONFIG.acres,
      zones: restoredPump.zonesCount || 2,
      simultaneousZones: restoredPump.simultaneousZones || 1,
    };

    setField(nextField);
    setDam(DEFAULT_DAM_CONFIG);
    setPumpInputs(restoredPump);
    setCouplingMode("direct_pressurized");
    setMeta({
      ...DEFAULT_CLIENT_REPORT_META,
      reportCode: row.report_code,
      projectTitle: row.project_name || "Client Pump & Irrigation Engineering Proposal",
      clientName: row.customer_name || "",
      clientPhone: row.customer_phone || "",
      clientEmail: row.customer_email || "",
      countyLocation: row.county || "Kenya",
      siteNotes: row.notes || "",
    });

    const computed = computeCompleteEngineeringDesign({
      field: nextField,
      dam: DEFAULT_DAM_CONFIG,
      pumpInputs: restoredPump,
      couplingMode: "direct_pressurized",
      catalogPumps,
    });
    const generated = generateAutoEngineeringBoq({
      design: computed,
      field: nextField,
      dam: DEFAULT_DAM_CONFIG,
      pumpInputs: computed.syncedPumpInputs,
      catalogProducts,
    });
    setBoqSections(generated.sections);
    setBoqItems(generated.items);
    setStudioTab("field");
    toast({
      title: `Loaded Client Design ${row.report_code}`,
      description: `Populated ${computed.pumpResult.designFlowM3h.toFixed(1)} m³/h @ ${computed.pumpResult.totalDynamicHeadM.toFixed(0)} m TDH and auto-built BOQ.`,
    });
  };

  const handleStatusChange = async (row: AdminPumpReportRow, newStatus: AdminReportStatus) => {
    const res = await updateAdminReportStatus(row.id, newStatus);
    if (res.ok) {
      setReports((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: newStatus } : r)));
      toast({ title: `Report ${row.report_code} marked ${newStatus}` });
    } else {
      toast({
        title: "Status update skipped",
        description: res.error || "Could not update status",
        variant: "destructive",
      });
    }
  };

  const handleSaveToDb = async () => {
    setSavingDb(true);
    try {
      const outcome = await saveAdminEngineeringDossier({
        meta,
        field,
        dam,
        pumpInputs,
        couplingMode,
        design,
        boqSections,
        boqItems,
      });
      if (outcome.ok) {
        toast({ title: "Engineering Report Saved", description: outcome.message });
        loadInboxAndData();
      } else {
        toast({ title: "Save Warning", description: outcome.message, variant: "destructive" });
      }
    } finally {
      setSavingDb(false);
    }
  };

  const handlePushToOfficialQuote = async () => {
    setPushingQuote(true);
    try {
      const res = await pushEngineeringBoqToOfficialQuote({
        customerId: selectedCustomerId || null,
        meta,
        field,
        pumpInputs,
        design,
        boqSections,
        boqItems,
      });
      if (res.ok) {
        toast({
          title: `Created Official Quote ${res.quoteNumber}`,
          description: "Available immediately in Quotes & BOQ for client PDF dispatch and invoicing.",
        });
      } else {
        toast({
          title: "Quote Creation Failed",
          description: res.error,
          variant: "destructive",
        });
      }
    } finally {
      setPushingQuote(false);
    }
  };

  const handleGeneratePdf = () => {
    openFullClientEngineeringReportPdf({
      meta,
      field,
      dam,
      pumpInputs: design.syncedPumpInputs,
      couplingMode,
      design,
      boqSections,
      boqItems,
      hideUnitPricesInPrint,
      includeCommissioningChecklist,
    });
  };

  const handleDownloadHtml = () => {
    downloadFullClientEngineeringReportHtml({
      meta,
      field,
      dam,
      pumpInputs: design.syncedPumpInputs,
      couplingMode,
      design,
      boqSections,
      boqItems,
      hideUnitPricesInPrint,
      includeCommissioningChecklist,
    });
    toast({ title: "HTML Dossier Downloaded", description: `DripTech-Full-Engineering-Report-${meta.reportCode}.html` });
  };

  const boqSubtotal = useMemo(
    () => boqItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
    [boqItems],
  );
  const boqGrandTotal = meta.includeVat
    ? boqSubtotal * (1 + (meta.vatRatePct || 16) / 100)
    : boqSubtotal;

  const handleWhatsAppClient = () => {
    const rawDigits = meta.clientPhone.replace(/\D+/g, "");
    const targetNumber =
      rawDigits.length >= 9
        ? rawDigits.startsWith("0")
          ? `254${rawDigits.slice(1)}`
          : rawDigits
        : SITE_COMPANY.whatsappNumber;
    const text = `Hello ${meta.clientName || "Client"}, DripTech EcoFlow Engineering Proposal (${meta.reportCode}) for ${meta.projectTitle} is ready:\n• System: ${field.acres} acre(s) ${field.systemType.toUpperCase()}${dam.mode !== "none" ? ` + ${design.damSummary.volumeM3} m³ storage` : ""}\n• Pump Duty: ${design.pumpResult.designFlowM3h.toFixed(1)} m³/h @ ${design.pumpResult.totalDynamicHeadM.toFixed(0)} m TDH (${design.pumpResult.nearestStandardHp} HP, ${design.curveAnalysis.operatingPctOfBep}% BEP)\n• Solar PV: ${design.pumpResult.installedArrayWp} Wp (${design.pumpResult.panelsInSeries}S x ${design.pumpResult.parallelStrings}P), ${design.pumpResult.recommendedCableMm2} mm² cable\n• Estimated Total BOQ: KES ${Math.round(boqGrandTotal).toLocaleString("en-KE")}`;
    openTrackedWhatsApp(`https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`, `admin eng whatsapp: ${meta.reportCode}`);
  };

  const filteredReports = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    return reports.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.report_code, r.project_name, r.customer_name, r.customer_phone, r.county, r.recommended_pump_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [reports, reportSearch, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top 1-Click Engineering Action Header */}
      <Card className="border-primary/25 bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
                  1-Click Client Engineering Workbench
                </Badge>
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  {meta.reportCode}
                </span>
              </div>
              <CardTitle className="mt-1.5 text-xl font-extrabold text-foreground">
                Integrated Pump, Solar PV, Drip, Sprinklers &amp; Dam Liner Report Studio
              </CardTitle>
              <CardDescription className="mt-1">
                Load incoming client calculator designs, size complete drip/sprinkler/rain-gun fields with pump Q–H curve audit, generate itemized catalogue BOQs, and export multi-page PDF engineering proposals in 1 click.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegenerateBoq}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5 text-primary" />
                Auto-Build BOQ
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={savingDb}
                onClick={handleSaveToDb}
                className="gap-1.5"
              >
                <Database className="h-3.5 w-3.5 text-primary" />
                {savingDb ? "Saving..." : "Save Dossier"}
              </Button>
              <Button
                type="button"
                onClick={handleGeneratePdf}
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Printer className="h-4 w-4" />
                1-Click Full Client PDF
              </Button>
            </div>
          </div>

          {/* Preset Scenarios + Live KPI Strip */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
              Quick Scenarios:
            </span>
            {ADMIN_PRESET_TEMPLATES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPresetTemplate(preset.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-border bg-muted/20 p-2.5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Field System</p>
              <p className="mt-0.5 text-sm font-extrabold text-foreground capitalize">
                {field.systemType === "none" ? "Pump Only" : `${field.acres} Ac ${field.systemType}`}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {design.fieldSummary.dailyGrossWaterM3.toFixed(1)} m³/day
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-2.5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Pump Duty</p>
              <p className="mt-0.5 text-sm font-extrabold text-primary">
                {design.pumpResult.designFlowM3h.toFixed(1)} m³/h
              </p>
              <p className="text-[11px] text-muted-foreground">
                @ {design.pumpResult.totalDynamicHeadM.toFixed(0)} m TDH
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-2.5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Motor &amp; BEP</p>
              <p className="mt-0.5 text-sm font-extrabold text-foreground">
                {design.pumpResult.nearestStandardHp} HP
              </p>
              <p className="text-[11px] text-primary font-semibold">
                {design.curveAnalysis.operatingPoint.canOperate
                  ? `${design.curveAnalysis.operatingPctOfBep}% of BEP`
                  : "Check Head"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-2.5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Solar PV Array</p>
              <p className="mt-0.5 text-sm font-extrabold text-foreground">
                {design.pumpResult.installedArrayWp > 0
                  ? `${design.pumpResult.installedArrayWp} Wp`
                  : "AC Grid"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {design.pumpResult.solarPanelCount} panels • {design.pumpResult.recommendedCableMm2} mm²
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-2.5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Storage / Liner</p>
              <p className="mt-0.5 text-sm font-extrabold text-foreground">
                {dam.mode === "hdpe_dam_liner"
                  ? `${design.damSummary.volumeM3} m³ Pan`
                  : dam.mode === "elevated_tank"
                    ? `${(design.damSummary.volumeLiters / 1000).toFixed(0)} m³ Tank`
                    : `${(design.pumpResult.recommendedTankLiters / 1000).toFixed(0)} m³ Est.`}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {dam.mode === "hdpe_dam_liner"
                  ? `${design.damSummary.linerAreaSqm} m² (${dam.linerThicknessMm}mm)`
                  : "Buffer reserve"}
              </p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-2.5">
              <p className="text-[10px] font-bold uppercase text-primary">Total BOQ Estimate</p>
              <p className="mt-0.5 text-sm font-extrabold text-foreground">
                {formatKes(boqGrandTotal)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {boqItems.length} items {meta.includeVat ? `(inc. ${meta.vatRatePct}% VAT)` : "(Excl. VAT)"}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Studio Workspace Tabs */}
      <Tabs value={studioTab} onValueChange={setStudioTab} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 rounded-xl border border-border bg-muted/40 p-1.5 sm:grid-cols-4">
          <TabsTrigger value="inbox" className="gap-1.5 py-2 text-xs font-semibold">
            <FolderOpen className="h-3.5 w-3.5 text-primary" />
            1. Client Requests ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="field" className="gap-1.5 py-2 text-xs font-semibold">
            <Droplets className="h-3.5 w-3.5 text-primary" />
            2. Client, Drip/Sprinkler &amp; Dam
          </TabsTrigger>
          <TabsTrigger value="pump_solar" className="gap-1.5 py-2 text-xs font-semibold">
            <Sun className="h-3.5 w-3.5 text-primary" />
            3. Pump, Solar &amp; Q–H Curve
          </TabsTrigger>
          <TabsTrigger value="boq" className="gap-1.5 py-2 text-xs font-semibold">
            <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
            4. Priced BOQ &amp; 1-Click Report
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Saved DB Client Requests & CRM Loader */}
        <TabsContent value="inbox" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-bold">
                    Incoming Client Pump &amp; Solar Designs (`pump_solar_reports` + Inquiries)
                  </CardTitle>
                  <CardDescription>
                    Click any submission below to pull client site figures straight into the Irrigation + Pump + BOQ Studio.
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={loadInboxAndData} className="gap-1.5 self-start">
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingReports ? "animate-spin" : ""}`} />
                  Refresh DB Queue
                </Button>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Search report code (DT-PS / DT-ENG), client name, phone, or county..."
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="quote_requested">Quote Requested</SelectItem>
                    <SelectItem value="saved">Saved Design</SelectItem>
                    <SelectItem value="reviewed">Engineer Reviewed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {loadingReports ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Loading saved engineering reports from database...
                </p>
              ) : filteredReports.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    No saved client pump/solar reports match this filter yet.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use Tab 2 &amp; Quick Scenarios above to build a brand-new full client engineering proposal in one click, or pick an existing client from CRM.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setStudioTab("field")}
                    className="mt-4"
                  >
                    Build New Client Engineering Report →
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReports.map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-primary">
                            {row.report_code}
                          </span>
                          <Badge variant={row.status === "quote_requested" ? "destructive" : "secondary"} className="text-[10px]">
                            {row.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {row.sourceOrigin === "pump_solar_reports"
                              ? "Cloud DB"
                              : row.sourceOrigin === "contact_submission"
                                ? "Inquiry Inbox"
                                : "Local Draft"}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(row.created_at).toLocaleDateString("en-KE")}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground">
                          {row.project_name}
                          {row.customer_name ? ` — ${row.customer_name}` : ""}
                          {row.county ? ` (${row.county})` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.design_flow_m3h} m³/h @ {row.tdh_m} m TDH • {row.recommended_hp} HP •{" "}
                          {row.recommended_pv_wp > 0 ? `${row.recommended_pv_wp} Wp Solar` : "Grid/Boost"} •{" "}
                          Budget: <strong>{formatKes(row.estimated_budget_kes)}</strong>
                          {row.customer_phone ? ` • Tel: ${row.customer_phone}` : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {row.sourceOrigin === "pump_solar_reports" && (
                          <Select
                            value={row.status}
                            onValueChange={(val) => handleStatusChange(row, val as AdminReportStatus)}
                          >
                            <SelectTrigger className="h-8 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="saved">saved</SelectItem>
                              <SelectItem value="quote_requested">quote_requested</SelectItem>
                              <SelectItem value="reviewed">reviewed</SelectItem>
                              <SelectItem value="archived">archived</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleLoadClientReport(row)}
                          className="h-8 gap-1.5 text-xs font-bold"
                        >
                          <Wrench className="h-3.5 w-3.5" />
                          Load &amp; Generate Report
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Client Profile, Drip/Sprinkler/Rain Gun & Dam Liner Config */}
        <TabsContent value="field" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Client & Site Metadata + Coupling */}
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Building2 className="h-4 w-4 text-primary" />
                  Client, Site &amp; Engineer Details
                </CardTitle>
                <CardDescription>
                  Select an existing CRM customer or type client contact details for the PDF cover header.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold">Pull from CRM Customers (Optional)</Label>
                  <Select value={selectedCustomerId} onValueChange={handleSelectCrmCustomer}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose CRM customer profile..." />
                    </SelectTrigger>
                    <SelectContent>
                      {crmCustomers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company_name || c.contact_person} {c.city ? `(${c.city})` : ""} — {c.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="eng-project-title" className="text-xs font-semibold">Project Title</Label>
                    <Input
                      id="eng-project-title"
                      value={meta.projectTitle}
                      onChange={(e) => setMeta({ ...meta, projectTitle: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eng-client-name" className="text-xs font-semibold">Client Name</Label>
                    <Input
                      id="eng-client-name"
                      value={meta.clientName}
                      onChange={(e) => setMeta({ ...meta, clientName: e.target.value })}
                      placeholder="e.g. Samuel Njoroge"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eng-farm-name" className="text-xs font-semibold">Farm / Organization</Label>
                    <Input
                      id="eng-farm-name"
                      value={meta.companyFarmName}
                      onChange={(e) => setMeta({ ...meta, companyFarmName: e.target.value })}
                      placeholder="e.g. Greenleaf Growers Ltd"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eng-client-phone" className="text-xs font-semibold">Client WhatsApp / Phone</Label>
                    <Input
                      id="eng-client-phone"
                      value={meta.clientPhone}
                      onChange={(e) => setMeta({ ...meta, clientPhone: e.target.value })}
                      placeholder="07XX XXX XXX"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eng-client-email" className="text-xs font-semibold">Client Email</Label>
                    <Input
                      id="eng-client-email"
                      value={meta.clientEmail}
                      onChange={(e) => setMeta({ ...meta, clientEmail: e.target.value })}
                      placeholder="client@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eng-county" className="text-xs font-semibold">County / Town Location</Label>
                    <Input
                      id="eng-county"
                      value={meta.countyLocation}
                      onChange={(e) => setMeta({ ...meta, countyLocation: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eng-engineer" className="text-xs font-semibold">Prepared By Engineer</Label>
                    <Input
                      id="eng-engineer"
                      value={meta.engineerName}
                      onChange={(e) => setMeta({ ...meta, engineerName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="eng-notes" className="text-xs font-semibold">Site Survey &amp; Recommendation Remarks</Label>
                  <Textarea
                    id="eng-notes"
                    rows={3}
                    value={meta.siteNotes}
                    onChange={(e) => setMeta({ ...meta, siteNotes: e.target.value })}
                    placeholder="Borehole depth observations, clay/sandy soil infiltration notes, frost or wind considerations..."
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Water Pan HDPE Dam Liner / Storage Section */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Waves className="h-4 w-4 text-primary" />
                  Dam Liner / Water Storage Tank Engineering
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["none", "No Separate Storage"],
                      ["hdpe_dam_liner", "HDPE Dam Liner Pan"],
                      ["elevated_tank", "Elevated Tank Tower"],
                    ] as Array<[DamStorageMode, string]>
                  ).map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDam({ ...dam, mode: val })}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors ${
                        dam.mode === val
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:border-primary/40"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                {dam.mode === "hdpe_dam_liner" && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div>
                      <Label className="text-xs">Top Length (m)</Label>
                      <Input
                        type="number"
                        min={4}
                        value={dam.topLengthM}
                        onChange={(e) => setDam({ ...dam, topLengthM: Math.max(4, Number(e.target.value) || 4) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Top Width (m)</Label>
                      <Input
                        type="number"
                        min={4}
                        value={dam.topWidthM}
                        onChange={(e) => setDam({ ...dam, topWidthM: Math.max(4, Number(e.target.value) || 4) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Depth (m)</Label>
                      <Input
                        type="number"
                        min={1.2}
                        step={0.2}
                        value={dam.depthM}
                        onChange={(e) => setDam({ ...dam, depthM: Math.max(1.2, Number(e.target.value) || 1.2) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Slope Ratio (H:V)</Label>
                      <Input
                        type="number"
                        min={0.5}
                        step={0.1}
                        value={dam.sideSlopeRatio}
                        onChange={(e) => setDam({ ...dam, sideSlopeRatio: Math.max(0.5, Number(e.target.value) || 1) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">HDPE Thickness</Label>
                      <Select
                        value={String(dam.linerThicknessMm)}
                        onValueChange={(v) => setDam({ ...dam, linerThicknessMm: Number(v) as 0.5 | 0.75 | 1.0 })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5">0.5 mm (Light Farm Pan)</SelectItem>
                          <SelectItem value="0.75">0.75 mm (Standard Commercial)</SelectItem>
                          <SelectItem value="1">1.0 mm (Heavy / Rocky Soil)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Anchor Margin (m)</Label>
                      <Input
                        type="number"
                        min={0.8}
                        step={0.1}
                        value={dam.anchorTrenchAllowanceM}
                        onChange={(e) => setDam({ ...dam, anchorTrenchAllowanceM: Math.max(0.8, Number(e.target.value) || 1.5) })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {dam.mode === "elevated_tank" && (
                  <div>
                    <Label className="text-xs">Target Days Autonomous Crop Buffer Reserve</Label>
                    <Input
                      type="number"
                      min={1}
                      max={14}
                      value={dam.targetReserveDays}
                      onChange={(e) => setDam({ ...dam, targetReserveDays: Math.max(1, Number(e.target.value) || 2) })}
                      className="mt-1"
                    />
                  </div>
                )}

                {dam.mode !== "none" && (
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs text-foreground">
                    <strong>Computed Storage Summary:</strong> {design.damSummary.verdict}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Drip / Sprinkler / Rain Gun Field Designer */}
          <Card className="border-border bg-card h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Compass className="h-4 w-4 text-primary" />
                Field Distribution Engineering (Drip / Sprinklers / Rain Gun)
              </CardTitle>
              <CardDescription>
                Calculates emitters, heads, dripline rolls, filtration sizing &amp; exact block flow feeding into pump TDH sizing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    ["drip", "Drip Irrigation"],
                    ["sprinkler", "Sprinkler Grid"],
                    ["raingun", "Rain Gun"],
                    ["none", "Pump/Solar Only"],
                  ] as Array<[FieldSystemType, string]>
                ).map(([t, lbl]) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setField({ ...field, systemType: t })}
                    className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
                      field.systemType === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/40"
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {field.systemType !== "none" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold">Crop / Pasture Name</Label>
                      <Input
                        value={field.cropName}
                        onChange={(e) => setField({ ...field, cropName: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Farm Area (Acres)</Label>
                      <Input
                        type="number"
                        min={0.1}
                        step={0.25}
                        value={field.acres}
                        onChange={(e) => setField({ ...field, acres: Math.max(0.1, Number(e.target.value) || 0.5) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Daily Water Depth (mm/day)</Label>
                      <Input
                        type="number"
                        min={1}
                        step={0.5}
                        value={field.cropWaterMmDay}
                        onChange={(e) => setField({ ...field, cropWaterMmDay: Math.max(1, Number(e.target.value) || 5) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Total Field Zones (Blocks)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={field.zones}
                        onChange={(e) => setField({ ...field, zones: Math.max(1, Number(e.target.value) || 1) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Simultaneous Active Zones</Label>
                      <Input
                        type="number"
                        min={1}
                        max={field.zones}
                        value={field.simultaneousZones}
                        onChange={(e) =>
                          setField({
                            ...field,
                            simultaneousZones: Math.min(field.zones, Math.max(1, Number(e.target.value) || 1)),
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {field.systemType === "drip" && (
                    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/20 p-3.5 sm:grid-cols-3">
                      <div>
                        <Label className="text-[11px]">Bed/Row Spacing (m)</Label>
                        <Input
                          type="number"
                          min={0.3}
                          step={0.1}
                          value={field.rowSpacingM}
                          onChange={(e) => setField({ ...field, rowSpacingM: Math.max(0.3, Number(e.target.value) || 1) })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Lines per Bed</Label>
                        <Input
                          type="number"
                          min={1}
                          max={4}
                          value={field.lateralsPerBed}
                          onChange={(e) => setField({ ...field, lateralsPerBed: Math.max(1, Number(e.target.value) || 1) })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Emitter Spacing (cm)</Label>
                        <Select
                          value={String(field.emitterSpacingCm)}
                          onValueChange={(v) => setField({ ...field, emitterSpacingCm: Number(v) })}
                        >
                          <SelectTrigger className="mt-1 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 cm (Dense Onions)</SelectItem>
                            <SelectItem value="20">20 cm (Standard Veg)</SelectItem>
                            <SelectItem value="30">30 cm (Tomatoes/Maize)</SelectItem>
                            <SelectItem value="40">40 cm (Wide Row)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[11px]">Emitter Flow (L/h)</Label>
                        <Input
                          type="number"
                          min={0.5}
                          step={0.2}
                          value={field.emitterFlowLph}
                          onChange={(e) => setField({ ...field, emitterFlowLph: Math.max(0.5, Number(e.target.value) || 1.6) })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Roll Length (m)</Label>
                        <Select
                          value={String(field.rollLengthM)}
                          onValueChange={(v) => setField({ ...field, rollLengthM: Number(v) })}
                        >
                          <SelectTrigger className="mt-1 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1000">1,000 m Roll</SelectItem>
                            <SelectItem value="500">500 m Roll</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[11px]">Filtration Type</Label>
                        <Select
                          value={field.filtrationType}
                          onValueChange={(v) => setField({ ...field, filtrationType: v as "disc" | "screen" | "sand_media" })}
                        >
                          <SelectTrigger className="mt-1 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disc">120-Mesh Disc Filter</SelectItem>
                            <SelectItem value="screen">120-Mesh Screen Filter</SelectItem>
                            <SelectItem value="sand_media">Sand Media + Disc</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 flex items-center justify-between sm:col-span-3 pt-1">
                        <Label className="text-xs font-semibold">Include Venturi Fertilizer Bypass Kit</Label>
                        <Switch
                          checked={field.includeVenturiFertigation}
                          onCheckedChange={(checked) => setField({ ...field, includeVenturiFertigation: checked })}
                        />
                      </div>
                    </div>
                  )}

                  {field.systemType === "sprinkler" && (
                    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/20 p-3.5">
                      <div>
                        <Label className="text-[11px]">Grid Spacing (m × m)</Label>
                        <Input
                          type="number"
                          min={6}
                          step={1}
                          value={field.sprinklerSpacingM}
                          onChange={(e) => setField({ ...field, sprinklerSpacingM: Math.max(6, Number(e.target.value) || 12) })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Nozzle Flow (m³/h per head)</Label>
                        <Input
                          type="number"
                          min={0.4}
                          step={0.1}
                          value={field.sprinklerNozzleFlowM3h}
                          onChange={(e) => setField({ ...field, sprinklerNozzleFlowM3h: Math.max(0.4, Number(e.target.value) || 1.3) })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Operating Pressure (Bar)</Label>
                        <Input
                          type="number"
                          min={1.5}
                          step={0.2}
                          value={field.sprinklerWorkingBar}
                          onChange={(e) => setField({ ...field, sprinklerWorkingBar: Math.max(1.5, Number(e.target.value) || 2.8) })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Riser Standpipe Height (m)</Label>
                        <Input
                          type="number"
                          min={0.5}
                          step={0.25}
                          value={field.riserHeightM}
                          onChange={(e) => setField({ ...field, riserHeightM: Math.max(0.5, Number(e.target.value) || 1) })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {field.systemType === "raingun" && (
                    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/20 p-3.5">
                      <div>
                        <Label className="text-[11px]">Wetting Radius (m)</Label>
                        <Input
                          type="number"
                          min={18}
                          step={2}
                          value={field.raingunWettingRadiusM}
                          onChange={(e) => setField({ ...field, raingunWettingRadiusM: Math.max(18, Number(e.target.value) || 32) })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Flow per Rain Gun (m³/h)</Label>
                        <Input
                          type="number"
                          min={8}
                          step={1}
                          value={field.raingunFlowM3h}
                          onChange={(e) => setField({ ...field, raingunFlowM3h: Math.max(8, Number(e.target.value) || 18) })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Working Pressure (Bar)</Label>
                        <Input
                          type="number"
                          min={3.0}
                          step={0.2}
                          value={field.raingunWorkingBar}
                          onChange={(e) => setField({ ...field, raingunWorkingBar: Math.max(3, Number(e.target.value) || 4.2) })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Field Hydrant Stations</Label>
                        <Input
                          type="number"
                          min={1}
                          value={field.raingunHydrants}
                          onChange={(e) => setField({ ...field, raingunHydrants: Math.max(1, Number(e.target.value) || 4) })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Computed Field Hydraulic Output Card */}
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-foreground">
                      <span>Computed Field Demand ({field.systemType.toUpperCase()})</span>
                      <span className="text-primary">
                        {design.fieldSummary.activeBlockFlowM3h.toFixed(1)} m³/h @ {design.fieldSummary.requiredWorkingBar.toFixed(1)} bar
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Main/Submain Pipe: <strong>{design.fieldSummary.recommendedMainlineOdMm}mm / {design.fieldSummary.recommendedSubmainOdMm}mm HDPE</strong> •{" "}
                      Filter: <strong>{design.fieldSummary.filtrationRecommendation}</strong>
                    </p>
                    {field.systemType === "drip" && (
                      <p className="text-muted-foreground">
                        Qty Needed: <strong>{design.fieldSummary.bomQuantities.driplineRolls} rolls ({design.fieldSummary.bomQuantities.totalDriplineM.toLocaleString()} m)</strong>,{" "}
                        {design.fieldSummary.bomQuantities.startConnectors} connectors + end caps
                      </p>
                    )}
                    {field.systemType === "sprinkler" && (
                      <p className="text-muted-foreground">
                        Sprinkler Heads: <strong>{design.fieldSummary.bomQuantities.sprinklerHeads} pcs</strong> • Precipitation Rate: <strong>{design.fieldSummary.bomQuantities.precipitationRateMmHr} mm/hr</strong>
                      </p>
                    )}
                    {field.systemType === "raingun" && (
                      <p className="text-muted-foreground">
                        Rain Gun(s): <strong>{design.fieldSummary.bomQuantities.raingunUnits} unit(s)</strong> across {design.fieldSummary.bomQuantities.hydrantOutlets} hydrants
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Pump, Solar Climate, Coupling & Live Interactive Curve Audit */}
        <TabsContent value="pump_solar" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Gauge className="h-4 w-4 text-primary" />
                Water Source, Solar Climate Region &amp; Pump-Field Coupling
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label className="text-xs font-semibold">Pump-to-Field Coupling Mode</Label>
                <Select
                  value={couplingMode}
                  onValueChange={(v) => setCouplingMode(v as HydraulicCouplingMode)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct_pressurized">Direct Pressurized Field Feed</SelectItem>
                    <SelectItem value="fill_storage_tank">Fill Dam Liner / Storage Tank First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Water Source Type</Label>
                <Select
                  value={pumpInputs.sourceType}
                  onValueChange={(v) => setPumpInputs({ ...pumpInputs, sourceType: v as WaterSourceType })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="borehole">Deep Borehole Submersible</SelectItem>
                    <SelectItem value="surface_suction">River / Dam Surface Suction</SelectItem>
                    <SelectItem value="tank_booster">Tank / Pan Booster Pump</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Power Supply Topology</Label>
                <Select
                  value={pumpInputs.powerMode}
                  onValueChange={(v) => setPumpInputs({ ...pumpInputs, powerMode: v as PowerSupplyMode })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solar_hybrid">Solar VFD + AC Hybrid</SelectItem>
                    <SelectItem value="solar_dc">Pure Solar DC Pump</SelectItem>
                    <SelectItem value="grid_ac">3-Phase / 1-Phase Grid AC</SelectItem>
                    <SelectItem value="generator">Diesel Generator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Static Water Depth / Suction Lift (m)</Label>
                <Input
                  type="number"
                  min={0}
                  value={pumpInputs.staticWaterDepthM}
                  onChange={(e) => setPumpInputs({ ...pumpInputs, staticWaterDepthM: Math.max(0, Number(e.target.value) || 0) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Dynamic Drawdown (m)</Label>
                <Input
                  type="number"
                  min={0}
                  value={pumpInputs.drawdownM}
                  onChange={(e) => setPumpInputs({ ...pumpInputs, drawdownM: Math.max(0, Number(e.target.value) || 0) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Terrain Rise &amp; Tank Elevation (m)</Label>
                <Input
                  type="number"
                  value={pumpInputs.groundElevationGainM}
                  onChange={(e) => setPumpInputs({ ...pumpInputs, groundElevationGainM: Number(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Primary Pipe Length (m)</Label>
                <Input
                  type="number"
                  min={5}
                  value={pumpInputs.primaryPipe.lengthM}
                  onChange={(e) =>
                    setPumpInputs({
                      ...pumpInputs,
                      primaryPipe: { ...pumpInputs.primaryPipe, lengthM: Math.max(5, Number(e.target.value) || 10) },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Kenya Solar County Profile</Label>
                <Select
                  value={pumpInputs.solarRegionId}
                  onValueChange={(id) => {
                    const reg = KENYA_SOLAR_REGIONS.find((r) => r.id === id);
                    setPumpInputs({
                      ...pumpInputs,
                      solarRegionId: id,
                      peakSunHours: reg?.worstPsh ?? pumpInputs.peakSunHours,
                      ambientDayTempC: reg?.avgMaxTempC ?? pumpInputs.ambientDayTempC,
                    });
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KENYA_SOLAR_REGIONS.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label} ({r.worstPsh} worst PSH)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Borehole Casing / Yield Ceiling</Label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <Select
                    value={pumpInputs.boreholeCasingInch}
                    onValueChange={(v) => setPumpInputs({ ...pumpInputs, boreholeCasingInch: v as BoreholeCasingInch })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any ID</SelectItem>
                      <SelectItem value="3">3&quot; Slim</SelectItem>
                      <SelectItem value="4">4&quot; Std</SelectItem>
                      <SelectItem value="6">6&quot; Comm</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Yield m3/h"
                    value={pumpInputs.boreholeSafeYieldM3h ?? ""}
                    onChange={(e) =>
                      setPumpInputs({
                        ...pumpInputs,
                        boreholeSafeYieldM3h: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive SVG Pump Q-H Curve & BEP Audit inside Admin */}
          <PumpCurveVisualizer
            result={design.pumpResult}
            matchedPumps={design.matchedPumps}
          />
        </TabsContent>

        {/* TAB 4: Priced BOQ Builder & 1-Click PDF / Official Quote Dispatch */}
        <TabsContent value="boq" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <CloudSun className="h-4 w-4 text-primary" />
                    Commercial Controls &amp; 1-Click Report Export
                  </CardTitle>
                  <CardDescription>
                    Customize VAT, payment terms, unit-price visibility, or push directly to Quotes &amp; Billing.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateBoq}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-primary" />
                  Rebuild BOQ from Current Engineering Inputs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-semibold">Apply 16% VAT</Label>
                  <Switch
                    checked={meta.includeVat}
                    onCheckedChange={(checked) => setMeta({ ...meta, includeVat: checked })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-semibold">Lump-Sum Only (Hide Unit Rates)</Label>
                  <Switch
                    checked={hideUnitPricesInPrint}
                    onCheckedChange={setHideUnitPricesInPrint}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-semibold">Include Megger &amp; Sign-Off Page</Label>
                  <Switch
                    checked={includeCommissioningChecklist}
                    onCheckedChange={setIncludeCommissioningChecklist}
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold">Quote Validity (Days)</Label>
                  <Input
                    type="number"
                    min={7}
                    value={meta.validityDays}
                    onChange={(e) => setMeta({ ...meta, validityDays: Math.max(7, Number(e.target.value) || 30) })}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Commercial Payment Schedule</Label>
                <Input
                  value={meta.paymentTerms}
                  onChange={(e) => setMeta({ ...meta, paymentTerms: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-4">
                <Button
                  type="button"
                  onClick={handleGeneratePdf}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <FileDown className="h-4 w-4" />
                  1-Click Generate Full Client PDF Report
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadHtml}
                  className="gap-2"
                >
                  <Download className="h-4 w-4 text-primary" />
                  Download HTML Dossier
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingDb}
                  onClick={handleSaveToDb}
                  className="gap-2"
                >
                  <Database className="h-4 w-4 text-primary" />
                  {savingDb ? "Saving..." : "Save Report in DB"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pushingQuote}
                  onClick={handlePushToOfficialQuote}
                  className="gap-2"
                >
                  <Send className="h-4 w-4 text-primary" />
                  {pushingQuote ? "Creating Quote..." : "Push BOQ to Official Quote"}
                </Button>
                <Button
                  type="button"
                  onClick={handleWhatsAppClient}
                  className="gap-2 bg-[hsl(var(--dt-whatsapp))] text-white hover:bg-[hsl(var(--dt-whatsapp)/0.9)]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Send WhatsApp Brief
                </Button>
              </div>
            </CardContent>
          </Card>

          <BOQSectionBuilder
            sections={boqSections}
            items={boqItems}
            products={catalogProducts}
            productsLoading={loadingCatalog}
            onSectionsChange={setBoqSections}
            onItemsChange={setBoqItems}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
