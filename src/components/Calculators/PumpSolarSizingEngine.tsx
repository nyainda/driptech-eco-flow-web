import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  Cable,
  CheckCircle2,
  ClipboardCheck,
  CloudSun,
  Copy,
  Database,
  Download,
  Droplets,
  FileDown,
  Gauge,
  Info,
  MessageCircle,
  RotateCcw,
  Settings2,
  Sun,
  Thermometer,
  Waves,
  Wrench,
  Zap,
} from "lucide-react";
import { dataService } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, getProductPath } from "@/lib/productUrl";
import { SITE_COMPANY } from "@/config/company";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import PumpReportBudgetTab from "@/components/Calculators/PumpReportBudgetTab";
import PumpCurveVisualizer from "@/components/Calculators/PumpCurveVisualizer";
import {
  downloadPumpSolarReportFile,
  openPumpSolarReportPdf,
} from "@/lib/pumpReportPdf";
import {
  decodeDesignFromParam,
  deleteLocalSavedReport,
  fetchSharedReportByCode,
  generatePumpReportCode,
  listLocalSavedReports,
  SavedPumpReportRecord,
  savePumpSolarReport,
} from "@/services/pumpReportService";
import {
  applyKenyaSolarRegionPreset,
  AreaUnit,
  barFromPressureUnit,
  BatteryChemistry,
  BOREHOLE_CASING_LABELS,
  BoreholeCasingInch,
  calculatePumpSolarSystem,
  CatalogPumpProduct,
  CustomCostFigures,
  CustomProjectMetadata,
  DEFAULT_CUSTOM_COST_FIGURES,
  DEFAULT_CUSTOM_PROJECT_META,
  DEFAULT_PUMP_SOLAR_INPUTS,
  DemandMode,
  DUST_SOILING_META,
  DustSoilingEnv,
  FlowUnit,
  getInnerDiameterForPreset,
  getRegionPshForSeason,
  IrrigationMethod,
  KENYA_CROP_PRESETS,
  KENYA_PIPE_PRESETS,
  KENYA_SOLAR_REGIONS,
  matchCatalogPumps,
  METHOD_DEFAULTS,
  PIPE_MATERIAL_META,
  PipeMaterial,
  PipeSegmentInput,
  PipeSegmentResult,
  PowerSupplyMode,
  pressureFromBar,
  PressureUnit,
  PumpSolarInputs,
  PumpSolarResult,
  SKY_CONDITION_PRESETS,
  SkyConditionPreset,
  SOLAR_PANEL_PRESETS,
  SolarSeasonMode,
  WaterSourceType,
} from "@/lib/pumpSolarSizing";

interface ScenarioPreset {
  id: string;
  label: string;
  badge: string;
  patch: (base: PumpSolarInputs) => PumpSolarInputs;
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "borehole_drip_2acre",
    label: "2-Acre Solar Borehole Drip",
    badge: "Most Common",
    patch: () => ({
      ...DEFAULT_PUMP_SOLAR_INPUTS,
    }),
  },
  {
    id: "commercial_10acre",
    label: "10-Acre Commercial Farm",
    badge: "High Flow",
    patch: () =>
      applyKenyaSolarRegionPreset(
        {
          ...DEFAULT_PUMP_SOLAR_INPUTS,
          areaValue: 10,
          areaUnit: "acres",
          cropWaterDepthMm: 5.5,
          zonesCount: 8,
          simultaneousZones: 2,
          operatingHoursPerDay: 6,
          boreholeCasingInch: "6",
          boreholeTotalDepthM: 140,
          staticWaterDepthM: 75,
          drawdownM: 15,
          groundElevationGainM: 12,
          dischargeHeightM: 3,
          workingPressureBar: 1.2,
          primaryPipe: {
            ...DEFAULT_PUMP_SOLAR_INPUTS.primaryPipe,
            nominalOdMm: 63,
            innerDiameterMm: getInnerDiameterForPreset(63, "hdpe"),
            lengthM: 100,
          },
          secondaryPipe: {
            ...DEFAULT_PUMP_SOLAR_INPUTS.secondaryPipe,
            nominalOdMm: 75,
            innerDiameterMm: getInnerDiameterForPreset(75, "hdpe"),
            lengthM: 400,
          },
          powerMode: "solar_hybrid",
          controllerMinVmpV: 110,
          controllerMaxVocV: 450,
          cableLengthM: 115,
        },
        "eastern_machakos_kitui",
        "worst_cloudy",
      ),
  },
  {
    id: "river_sprinkler_5acre",
    label: "5-Acre River Sprinkler Setup",
    badge: "Surface Suction",
    patch: () =>
      applyKenyaSolarRegionPreset(
        {
          ...DEFAULT_PUMP_SOLAR_INPUTS,
          areaValue: 5,
          areaUnit: "acres",
          cropWaterDepthMm: 6.0,
          irrigationMethod: "overhead_sprinkler",
          applicationEfficiencyPct: 75,
          zonesCount: 5,
          simultaneousZones: 1,
          operatingHoursPerDay: 6.5,
          sourceType: "surface_suction",
          staticWaterDepthM: 4.5,
          drawdownM: 0,
          groundElevationGainM: 18,
          dischargeHeightM: 1.5,
          workingPressureBar: 3.0,
          suctionPipe: {
            label: "Suction Line (River / Dam to Pump)",
            enabled: true,
            material: "hdpe",
            nominalOdMm: 75,
            innerDiameterMm: getInnerDiameterForPreset(75, "hdpe"),
            lengthM: 18,
          },
          primaryPipe: {
            label: "Pump Discharge Header",
            enabled: true,
            material: "gi_new",
            nominalOdMm: 63,
            innerDiameterMm: getInnerDiameterForPreset(63, "gi_new"),
            lengthM: 15,
          },
          secondaryPipe: {
            label: "Mainline Delivery Pipe (River to Field)",
            enabled: true,
            material: "hdpe",
            nominalOdMm: 75,
            innerDiameterMm: getInnerDiameterForPreset(75, "hdpe"),
            lengthM: 320,
          },
          powerMode: "solar_dc",
          controllerMinVmpV: 90,
          controllerMaxVocV: 250,
          cableLengthM: 45,
        },
        "rift_nakuru_naivasha",
        "worst_cloudy",
      ),
  },
  {
    id: "custom_pump_audit",
    label: "Audit Any Existing Pump",
    badge: "Curve Check",
    patch: () => ({
      ...DEFAULT_PUMP_SOLAR_INPUTS,
      demandMode: "direct_flow",
      directFlowValue: 4.5,
      directFlowUnit: "m3h",
      operatingHoursPerDay: 5,
      staticWaterDepthM: 65,
      drawdownM: 12,
      customPump: {
        ...DEFAULT_PUMP_SOLAR_INPUTS.customPump,
        enabled: true,
        name: "Existing / Client Borehole Pump",
        maxFlowM3h: 5.5,
        maxHeadM: 125,
        ratedPowerW: 1100,
      },
    }),
  },
];

interface PipeSegmentEditorProps {
  title: string;
  segment: PipeSegmentInput;
  segmentResult: PipeSegmentResult;
  onChange: (next: PipeSegmentInput) => void;
  allowToggle?: boolean;
}

const PipeSegmentEditor = ({
  title,
  segment,
  segmentResult,
  onChange,
  allowToggle = false,
}: PipeSegmentEditorProps) => {
  const statusStyles =
    segmentResult.status === "critical"
      ? "border-destructive/40 bg-destructive/5"
      : segmentResult.status === "caution"
        ? "border-primary/40 bg-primary/5"
        : "border-border bg-muted/25";

  return (
    <div className={`rounded-xl border p-4 transition-colors ${statusStyles}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{title}</span>
          {segment.enabled && (
            <Badge
              variant={segmentResult.status === "critical" ? "destructive" : "secondary"}
              className="text-[11px]"
            >
              {segmentResult.velocityMs.toFixed(2)} m/s • {segmentResult.frictionLossM.toFixed(1)} m loss
            </Badge>
          )}
        </div>

        {allowToggle && (
          <div className="flex items-center gap-2">
            <Label htmlFor={`toggle-${title}`} className="text-xs text-muted-foreground">
              Include
            </Label>
            <Switch
              id={`toggle-${title}`}
              checked={segment.enabled}
              onCheckedChange={(checked) => onChange({ ...segment, enabled: checked })}
            />
          </div>
        )}
      </div>

      {segment.enabled && (
        <>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Material (C)</Label>
              <Select
                value={segment.material}
                onValueChange={(val: PipeMaterial) =>
                  onChange({
                    ...segment,
                    material: val,
                    innerDiameterMm: getInnerDiameterForPreset(segment.nominalOdMm, val),
                  })
                }
              >
                <SelectTrigger className="h-9 bg-card text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PIPE_MATERIAL_META) as PipeMaterial[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {PIPE_MATERIAL_META[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nominal Size (OD)</Label>
              <Select
                value={String(segment.nominalOdMm)}
                onValueChange={(val) => {
                  const od = Number(val);
                  onChange({
                    ...segment,
                    nominalOdMm: od,
                    innerDiameterMm: getInnerDiameterForPreset(od, segment.material),
                  });
                }}
              >
                <SelectTrigger className="h-9 bg-card text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KENYA_PIPE_PRESETS.map((preset) => (
                    <SelectItem key={preset.nominalOdMm} value={String(preset.nominalOdMm)}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">True ID (mm)</Label>
              <Input
                type="number"
                min={10}
                max={300}
                step={0.2}
                value={segment.innerDiameterMm}
                onChange={(e) =>
                  onChange({
                    ...segment,
                    innerDiameterMm: Math.max(10, Number(e.target.value) || 10),
                  })
                }
                className="h-9 bg-card text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Run Length (m)</Label>
              <Input
                type="number"
                min={0}
                max={10000}
                value={segment.lengthM}
                onChange={(e) =>
                  onChange({
                    ...segment,
                    lengthM: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="h-9 bg-card text-xs"
              />
            </div>

            {segment.material === "custom" && (
              <div className="space-y-1 sm:col-span-4">
                <Label className="text-xs text-muted-foreground">
                  Custom Hazen-Williams C Factor (70–160)
                </Label>
                <Input
                  type="number"
                  min={70}
                  max={160}
                  value={segment.customC ?? 135}
                  onChange={(e) =>
                    onChange({
                      ...segment,
                      customC: Math.max(70, Math.min(160, Number(e.target.value) || 135)),
                    })
                  }
                  className="h-9 max-w-[200px] bg-card text-xs"
                />
              </div>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{segmentResult.statusMessage}</span>
            {segmentResult.recommendedUpgradedOdMm && segmentResult.upgradedFrictionLossM !== null && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs font-semibold text-primary"
                onClick={() =>
                  onChange({
                    ...segment,
                    nominalOdMm: segmentResult.recommendedUpgradedOdMm!,
                    innerDiameterMm: getInnerDiameterForPreset(
                      segmentResult.recommendedUpgradedOdMm!,
                      segment.material,
                    ),
                  })
                }
              >
                Upgrade to {segmentResult.recommendedUpgradedOdMm} mm (saves{" "}
                {(segmentResult.frictionLossM - segmentResult.upgradedFrictionLossM).toFixed(1)} m head)
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const PumpSolarSizingEngine = () => {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<PumpSolarInputs>(DEFAULT_PUMP_SOLAR_INPUTS);
  const [projectMeta, setProjectMeta] = useState<CustomProjectMetadata>(DEFAULT_CUSTOM_PROJECT_META);
  const [customCosts, setCustomCosts] = useState<CustomCostFigures>(DEFAULT_CUSTOM_COST_FIGURES);
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>("bar");
  const [activeTab, setActiveTab] = useState<string>("demand");
  const [activePresetId, setActivePresetId] = useState<string>("borehole_drip_2acre");
  const [catalogPumps, setCatalogPumps] = useState<CatalogPumpProduct[]>([]);
  const [loadingPumps, setLoadingPumps] = useState<boolean>(true);
  const [selectedCurvePumpId, setSelectedCurvePumpId] = useState<string | null>(null);
  const [copiedSpec, setCopiedSpec] = useState<boolean>(false);
  const [savingDb, setSavingDb] = useState<boolean>(false);
  const [lastSavedCode, setLastSavedCode] = useState<string | null>(null);
  const [lastShareUrl, setLastShareUrl] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<SavedPumpReportRecord[]>(() =>
    listLocalSavedReports(),
  );

  useEffect(() => {
    let active = true;
    const loadPumps = async () => {
      try {
        const raw = await dataService.getProducts({ category: "pumps_motors", limit: 100 });
        if (active && Array.isArray(raw)) {
          setCatalogPumps(raw as CatalogPumpProduct[]);
        }
      } catch (err) {
        console.error("Unable to load pumps catalog:", err);
      } finally {
        if (active) setLoadingPumps(false);
      }
    };
    void loadPumps();

    // Hydrate from shared permalink (?design= or ?report=)
    const search = typeof window !== "undefined" ? window.location.search : "";
    if (search) {
      const qs = new URLSearchParams(search);
      const encoded = qs.get("design");
      const code = qs.get("report");
      if (encoded) {
        const decoded = decodeDesignFromParam(encoded);
        if (decoded && active) {
          setInputs(decoded.inputs);
          setProjectMeta(decoded.projectMeta);
          setCustomCosts(decoded.customCosts);
          if (decoded.reportCode) setLastSavedCode(decoded.reportCode);
          toast({
            title: "Shared design loaded",
            description: "All farm, pipe, solar, and budget inputs have been restored.",
          });
        }
      } else if (code) {
        void fetchSharedReportByCode(code).then((found) => {
          if (found && active) {
            setInputs(found.inputs);
            setProjectMeta(found.projectMeta);
            setCustomCosts(found.customCosts);
            setLastSavedCode(found.reportCode);
            toast({
              title: `Loaded report ${found.reportCode}`,
              description: "Restored sizing design from database.",
            });
          }
        });
      }
    }

    return () => {
      active = false;
    };
  }, [toast]);

  const result: PumpSolarResult = useMemo(() => calculatePumpSolarSystem(inputs), [inputs]);
  const matchedPumps = useMemo(
    () => matchCatalogPumps(catalogPumps, inputs, result),
    [catalogPumps, inputs, result],
  );

  const applyScenario = (preset: ScenarioPreset) => {
    setActivePresetId(preset.id);
    setInputs(preset.patch);
    if (preset.id === "custom_pump_audit") {
      setActiveTab("expert");
    }
  };

  const applySolarRegion = (regionId: string) => {
    setInputs((prev) => applyKenyaSolarRegionPreset(prev, regionId));
  };

  const applySeasonMode = (season: SolarSeasonMode) => {
    setInputs((prev) => {
      const region = KENYA_SOLAR_REGIONS.find((r) => r.id === prev.solarRegionId);
      return {
        ...prev,
        solarSeasonMode: season,
        peakSunHours: region ? getRegionPshForSeason(region, season) : prev.peakSunHours,
      };
    });
  };

  const buildSpecSummaryText = () => {
    const topPump = matchedPumps[0];
    const solarLine =
      inputs.powerMode === "ac_grid_generator"
        ? `Power: KPLC/Generator (${result.recommendedGeneratorKva.toFixed(1)} kVA min generator, ~${result.dailyEnergyKwh.toFixed(1)} kWh/day)`
        : `Solar PV Array: ${result.installedArrayWp.toLocaleString()} Wp (${result.parallelStrings} string(s) x ${result.panelsInSeries} x ${inputs.panelWatts} W | ${result.stringVmpV.toFixed(0)}V Vmp / ${result.stringColdVocV.toFixed(0)}V cold Voc)`;

    return [
      `DRIPTECH PUMP & SOLAR SIZING SPEC`,
      `Design Flow: ${result.designFlowM3h.toFixed(2)} m3/h (${result.designFlowLpm.toFixed(0)} L/min) | Daily Demand: ${result.dailyGrossVolumeM3.toFixed(1)} m3/day`,
      `Total Dynamic Head (TDH): ${result.totalDynamicHeadM.toFixed(1)} m (${(result.totalDynamicHeadM / 10.197).toFixed(2)} bar)`,
      ` - Static+Drawdown: ${(result.staticWaterLiftM + result.drawdownM).toFixed(1)} m | Elevation+Tank: ${(result.elevationGainM + result.dischargeHeightM).toFixed(1)} m`,
      ` - Working Pressure: ${result.workingPressureHeadM.toFixed(1)} m | Filters/Pipes/Fittings: ${(result.filtrationValveLossM + result.totalPipeFrictionM + result.fittingsMinorLossM).toFixed(1)} m`,
      `Recommended Motor Power: ${result.nearestStandardHp} HP (${result.recommendedMotorKw.toFixed(2)} kW req)`,
      solarLine,
      `Cable Spec (${inputs.cableLengthM} m one-way): ${result.recommendedCableMm2} mm2 (${result.actualVoltageDropPct.toFixed(2)}% V-drop)`,
      `Recommended Buffer Tank: ${result.recommendedTankLiters.toLocaleString()} L (${result.recommendedTankM3} m3)`,
      topPump
        ? `Top Matched DripTech Pump: ${topPump.product.name} (${topPump.product.model_number || "SKU"}) - est. ${topPump.estimatedFlowAtTDHM3h.toFixed(1)} m3/h @ ${result.totalDynamicHeadM.toFixed(0)}m TDH`
        : `Pump Match: Custom / heavy-duty sizing requested`,
    ].join("\n");
  };

  const handleCopySpec = async () => {
    try {
      await navigator.clipboard.writeText(buildSpecSummaryText());
      setCopiedSpec(true);
      toast({
        title: "Engineering spec copied",
        description: "Share it directly with your site engineer or technician.",
      });
      setTimeout(() => setCopiedSpec(false), 2200);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please use WhatsApp export or Print to save your sizing sheet.",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppExport = () => {
    const summary = buildSpecSummaryText();
    const url = `https://wa.me/${SITE_COMPANY.whatsappNumber}?text=${encodeURIComponent(summary)}`;
    openTrackedWhatsApp(url, "pump solar calculator whatsapp export");
  };

  const getReportPayload = (reportCode?: string) => ({
    reportCode: reportCode || lastSavedCode || generatePumpReportCode(),
    inputs,
    result,
    projectMeta,
    customCosts,
    matchedPumps,
    shareUrl: lastShareUrl || undefined,
  });

  const handleOpenPdfReport = () => {
    openPumpSolarReportPdf(getReportPayload());
  };

  const handleDownloadHtmlReport = () => {
    const payload = getReportPayload();
    downloadPumpSolarReportFile(payload);
    toast({
      title: "Engineering report downloaded",
      description: `Saved DripTech-Pump-Solar-Report-${payload.reportCode}.html`,
    });
  };

  const handleSaveReport = async (requestReview: boolean) => {
    setSavingDb(true);
    try {
      const outcome = await savePumpSolarReport({
        inputs,
        result,
        projectMeta,
        customCosts,
        matchedPumps,
        requestEngineerReview: requestReview,
      });
      setLastSavedCode(outcome.reportCode);
      setLastShareUrl(outcome.shareUrl);
      setSavedReports(listLocalSavedReports());

      if (navigator?.clipboard?.writeText) {
        void navigator.clipboard.writeText(outcome.shareUrl).catch(() => {});
      }

      toast({
        title: `Saved: ${outcome.reportCode}`,
        description: `${outcome.message} Share link copied to clipboard.`,
      });
    } finally {
      setSavingDb(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!lastShareUrl) return;
    try {
      await navigator.clipboard.writeText(lastShareUrl);
      toast({
        title: "Share link copied",
        description: "Anyone opening this URL loads your exact sizing inputs.",
      });
    } catch {
      // ignore
    }
  };

  // Visual proportions for the hydraulic TDH stacked bar
  const tdhStaticBlock = Math.max(0, result.staticWaterLiftM + result.drawdownM);
  const tdhElevBlock = Math.max(0, result.elevationGainM + result.dischargeHeightM);
  const tdhPressureBlock = result.workingPressureHeadM;
  const tdhLossBlock =
    result.filtrationValveLossM + result.totalPipeFrictionM + result.fittingsMinorLossM;
  const tdhBarTotal = Math.max(
    1,
    tdhStaticBlock + tdhElevBlock + tdhPressureBlock + tdhLossBlock,
  );

  const selectedRegion = KENYA_SOLAR_REGIONS.find((r) => r.id === inputs.solarRegionId);

  return (
    <div className="space-y-8">
      {/* 1. Quick Preset Scenario Strip */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Quick Engineering Scenarios
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Load a typical Kenyan farm layout, then adjust every pipe, elevation, pump curve, or solar panel spec below.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyScenario(SCENARIO_PRESETS[0])}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset Defaults
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {SCENARIO_PRESETS.map((preset) => {
              const isActive = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyScenario(preset)}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                    isActive
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                    {preset.badge}
                  </span>
                  <span className="mt-1.5 font-heading text-sm font-bold text-foreground">
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Main Split Calculator Workbench */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left: Complex Inputs Workbench */}
        <div className="space-y-6 lg:col-span-7">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1.5 sm:grid-cols-5">
              <TabsTrigger value="demand" className="py-2 text-xs font-semibold sm:text-xs">
                1. Flow Demand
              </TabsTrigger>
              <TabsTrigger value="hydraulics" className="py-2 text-xs font-semibold sm:text-xs">
                2. Pipes &amp; TDH
              </TabsTrigger>
              <TabsTrigger value="solar" className="py-2 text-xs font-semibold sm:text-xs">
                3. Solar &amp; Cable
              </TabsTrigger>
              <TabsTrigger value="expert" className="py-2 text-xs font-semibold sm:text-xs">
                4. Any Pump / Pro
              </TabsTrigger>
              <TabsTrigger
                value="report"
                className="col-span-2 py-2 text-xs font-semibold sm:col-span-1 sm:text-xs"
              >
                5. Report &amp; Costs
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: WATER DEMAND & BLOCK ROTATION */}
            <TabsContent value="demand" className="mt-4 space-y-5">
              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
                    <Droplets className="h-5 w-5 text-primary" />
                    Water Demand &amp; Zone Scheduling
                  </CardTitle>
                  <CardDescription>
                    Compute peak design flow from crop water depth &amp; acreage, active emitters/sprinklers, or enter an exact flow rate directly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(
                      [
                        { id: "crop_area", title: "By Crop & Area", desc: "Acres / Ha & ETc mm" },
                        { id: "emitter_block", title: "By Emitters / Guns", desc: "Count x unit flow" },
                        { id: "direct_flow", title: "Direct Flow Target", desc: "m³/h, L/h or L/min" },
                      ] as Array<{ id: DemandMode; title: string; desc: string }>
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setInputs((p) => ({ ...p, demandMode: mode.id }))}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          inputs.demandMode === mode.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        <div className="text-sm font-bold text-foreground">{mode.title}</div>
                        <div className="text-xs text-muted-foreground">{mode.desc}</div>
                      </button>
                    ))}
                  </div>

                  {inputs.demandMode === "crop_area" && (
                    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Kenya Crop Water Preset (auto-sets daily mm &amp; method)
                        </Label>
                        <Select
                          onValueChange={(cropId) => {
                            const crop = KENYA_CROP_PRESETS.find((c) => c.id === cropId);
                            if (!crop) return;
                            const mDef = METHOD_DEFAULTS[crop.defaultMethod];
                            setInputs((p) => ({
                              ...p,
                              cropWaterDepthMm: crop.waterDepthMm,
                              irrigationMethod: crop.defaultMethod,
                              applicationEfficiencyPct: mDef.efficiencyPct,
                              workingPressureBar: mDef.defaultPressureBar,
                            }));
                          }}
                        >
                          <SelectTrigger className="bg-card">
                            <SelectValue placeholder="Choose crop preset (optional)..." />
                          </SelectTrigger>
                          <SelectContent>
                            {KENYA_CROP_PRESETS.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.label} ({c.waterDepthMm} mm/day)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="area-val">Irrigated Farm Size</Label>
                          <div className="flex gap-2">
                            <Input
                              id="area-val"
                              type="number"
                              min={0.05}
                              step={0.25}
                              value={inputs.areaValue}
                              onChange={(e) =>
                                setInputs((p) => ({
                                  ...p,
                                  areaValue: Math.max(0.05, Number(e.target.value) || 0.05),
                                }))
                              }
                              className="bg-card"
                            />
                            <Select
                              value={inputs.areaUnit}
                              onValueChange={(val: AreaUnit) =>
                                setInputs((p) => ({ ...p, areaUnit: val }))
                              }
                            >
                              <SelectTrigger className="w-28 bg-card">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="acres">Acres</SelectItem>
                                <SelectItem value="hectares">Hectares</SelectItem>
                                <SelectItem value="sqm">m²</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="etc-depth">Peak Crop Demand (mm/day)</Label>
                          <Input
                            id="etc-depth"
                            type="number"
                            min={1}
                            max={20}
                            step={0.5}
                            value={inputs.cropWaterDepthMm}
                            onChange={(e) =>
                              setInputs((p) => ({
                                ...p,
                                cropWaterDepthMm: Math.max(0.5, Number(e.target.value) || 1),
                              }))
                            }
                            className="bg-card"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label>Irrigation Method</Label>
                          <Select
                            value={inputs.irrigationMethod}
                            onValueChange={(val: IrrigationMethod) => {
                              const def = METHOD_DEFAULTS[val];
                              setInputs((p) => ({
                                ...p,
                                irrigationMethod: val,
                                applicationEfficiencyPct: def.efficiencyPct,
                                workingPressureBar: def.defaultPressureBar,
                              }));
                            }}
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(METHOD_DEFAULTS) as IrrigationMethod[]).map((m) => (
                                <SelectItem key={m} value={m}>
                                  {METHOD_DEFAULTS[m].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {inputs.demandMode === "emitter_block" && (
                    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="emitter-count">Active Emitters / Sprinklers per Shift</Label>
                        <Input
                          id="emitter-count"
                          type="number"
                          min={1}
                          value={inputs.emitterCount}
                          onChange={(e) =>
                            setInputs((p) => ({
                              ...p,
                              emitterCount: Math.max(1, Number(e.target.value) || 1),
                            }))
                          }
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="emitter-flow">Unit Flow per Emitter/Nozzle</Label>
                        <Input
                          id="emitter-flow"
                          type="number"
                          min={0.1}
                          step={0.2}
                          value={inputs.emitterFlowRate}
                          onChange={(e) =>
                            setInputs((p) => ({
                              ...p,
                              emitterFlowRate: Math.max(0.1, Number(e.target.value) || 0.1),
                            }))
                          }
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Flow Unit</Label>
                        <Select
                          value={inputs.emitterFlowUnit}
                          onValueChange={(val: "lph" | "m3h") =>
                            setInputs((p) => ({ ...p, emitterFlowUnit: val }))
                          }
                        >
                          <SelectTrigger className="bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lph">Liters / hour (L/h)</SelectItem>
                            <SelectItem value="m3h">Cubic meters / hour (m³/h)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {inputs.demandMode === "direct_flow" && (
                    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="direct-flow">Required Pump Discharge Flow</Label>
                        <Input
                          id="direct-flow"
                          type="number"
                          min={0.1}
                          step={0.5}
                          value={inputs.directFlowValue}
                          onChange={(e) =>
                            setInputs((p) => ({
                              ...p,
                              directFlowValue: Math.max(0.1, Number(e.target.value) || 0.1),
                            }))
                          }
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Flow Unit</Label>
                        <Select
                          value={inputs.directFlowUnit}
                          onValueChange={(val: FlowUnit) =>
                            setInputs((p) => ({ ...p, directFlowUnit: val }))
                          }
                        >
                          <SelectTrigger className="bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="m3h">m³/hour (Cubic meters/hr)</SelectItem>
                            <SelectItem value="lph">L/hour (Liters/hr)</SelectItem>
                            <SelectItem value="lpm">L/min (Liters/min)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Daily Hours & Zone Scheduling */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <Label>Daily Pumping Hours</Label>
                        <span className="font-bold text-primary">{inputs.operatingHoursPerDay} hrs/day</span>
                      </div>
                      <Slider
                        min={1}
                        max={16}
                        step={0.5}
                        value={[inputs.operatingHoursPerDay]}
                        onValueChange={([val]) =>
                          setInputs((p) => ({ ...p, operatingHoursPerDay: val }))
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="zones-count">Total Farm Zones / Blocks</Label>
                      <Input
                        id="zones-count"
                        type="number"
                        min={1}
                        max={24}
                        value={inputs.zonesCount}
                        onChange={(e) =>
                          setInputs((p) => {
                            const zones = Math.max(1, Math.round(Number(e.target.value) || 1));
                            return {
                              ...p,
                              zonesCount: zones,
                              simultaneousZones: Math.min(p.simultaneousZones, zones),
                            };
                          })
                        }
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="app-eff">Application Efficiency (%)</Label>
                      <Input
                        id="app-eff"
                        type="number"
                        min={45}
                        max={98}
                        value={inputs.applicationEfficiencyPct}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            applicationEfficiencyPct: Math.max(45, Math.min(98, Number(e.target.value) || 90)),
                          }))
                        }
                        className="bg-card"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: WATER SOURCE, ELEVATIONS & MULTI-PIPE FRICTION */}
            <TabsContent value="hydraulics" className="mt-4 space-y-5">
              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
                    <Waves className="h-5 w-5 text-primary" />
                    Water Source, Elevations &amp; Operating Pressure
                  </CardTitle>
                  <CardDescription>
                    Calculates true Total Dynamic Head (TDH) including altitude-adjusted suction limits and working bar pressure.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(
                      [
                        { id: "borehole", title: "Borehole / Deep Well", desc: "Submersible multi-stage" },
                        { id: "surface_suction", title: "River / Dam / Sump", desc: "Surface suction pump" },
                        { id: "tank_booster", title: "Tank / Line Booster", desc: "Flooded suction pressure boost" },
                      ] as Array<{ id: WaterSourceType; title: string; desc: string }>
                    ).map((src) => (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() =>
                          setInputs((p) => ({
                            ...p,
                            sourceType: src.id,
                            suctionPipe: {
                              ...p.suctionPipe,
                              enabled: src.id === "surface_suction",
                            },
                            staticWaterDepthM:
                              src.id === "surface_suction"
                                ? Math.min(p.staticWaterDepthM, 5)
                                : src.id === "tank_booster"
                                  ? 0
                                  : Math.max(p.staticWaterDepthM, 30),
                          }))
                        }
                        className={`rounded-xl border p-3 text-left transition-all ${
                          inputs.sourceType === src.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        <div className="text-sm font-bold text-foreground">{src.title}</div>
                        <div className="text-xs text-muted-foreground">{src.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {inputs.sourceType !== "tank_booster" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="static-depth">
                          {inputs.sourceType === "borehole"
                            ? "Static Water Level Depth (m)"
                            : "Vertical Suction Lift (m)"}
                        </Label>
                        <Input
                          id="static-depth"
                          type="number"
                          min={0}
                          max={inputs.sourceType === "surface_suction" ? 10 : 400}
                          step={0.5}
                          value={inputs.staticWaterDepthM}
                          onChange={(e) =>
                            setInputs((p) => ({
                              ...p,
                              staticWaterDepthM: Math.max(0, Number(e.target.value) || 0),
                            }))
                          }
                          className="bg-card"
                        />
                      </div>
                    )}

                    {inputs.sourceType === "borehole" && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="drawdown-m">Pumping Drawdown Allowance (m)</Label>
                          <Input
                            id="drawdown-m"
                            type="number"
                            min={0}
                            max={120}
                            value={inputs.drawdownM}
                            onChange={(e) =>
                              setInputs((p) => ({
                                ...p,
                                drawdownM: Math.max(0, Number(e.target.value) || 0),
                              }))
                            }
                            className="bg-card"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Borehole Casing Size</Label>
                          <Select
                            value={inputs.boreholeCasingInch}
                            onValueChange={(val: BoreholeCasingInch) =>
                              setInputs((p) => ({ ...p, boreholeCasingInch: val }))
                            }
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(BOREHOLE_CASING_LABELS) as BoreholeCasingInch[]).map(
                                (key) => (
                                  <SelectItem key={key} value={key}>
                                    {BOREHOLE_CASING_LABELS[key]}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="bh-depth">Total Borehole Depth (m)</Label>
                          <Input
                            id="bh-depth"
                            type="number"
                            min={10}
                            max={500}
                            value={inputs.boreholeTotalDepthM}
                            onChange={(e) =>
                              setInputs((p) => ({
                                ...p,
                                boreholeTotalDepthM: Math.max(10, Number(e.target.value) || 80),
                              }))
                            }
                            className="bg-card"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="bh-yield">Tested Safe Yield (m³/h, optional)</Label>
                          <Input
                            id="bh-yield"
                            type="number"
                            min={0.1}
                            max={200}
                            step={0.5}
                            placeholder="e.g. 5.0"
                            value={inputs.boreholeSafeYieldM3h ?? ""}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              setInputs((p) => ({
                                ...p,
                                boreholeSafeYieldM3h: val ? Math.max(0.1, Number(val) || 0.1) : null,
                              }));
                            }}
                            className="bg-card"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="elev-gain">Ground Elevation Gain (+up / -down m)</Label>
                      <Input
                        id="elev-gain"
                        type="number"
                        min={-100}
                        max={300}
                        value={inputs.groundElevationGainM}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            groundElevationGainM: Number(e.target.value) || 0,
                          }))
                        }
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="site-altitude">Site Altitude (m ASL)</Label>
                      <Input
                        id="site-altitude"
                        type="number"
                        min={0}
                        max={4000}
                        step={50}
                        value={inputs.siteAltitudeM}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            siteAltitudeM: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="discharge-ht">Tank / Standpipe Discharge Height (m)</Label>
                      <Input
                        id="discharge-ht"
                        type="number"
                        min={0}
                        max={50}
                        step={0.5}
                        value={inputs.dischargeHeightM}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            dischargeHeightM: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="working-bar">Working Field Pressure</Label>
                        <button
                          type="button"
                          onClick={() => setInputs((p) => ({ ...p, workingPressureBar: 0.2 }))}
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          Fill Tank (0.2 bar)
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <Input
                          id="working-bar"
                          type="number"
                          min={0}
                          max={200}
                          step={pressureUnit === "bar" ? 0.1 : 1}
                          value={pressureFromBar(inputs.workingPressureBar, pressureUnit)}
                          onChange={(e) =>
                            setInputs((p) => ({
                              ...p,
                              workingPressureBar: barFromPressureUnit(
                                Math.max(0, Number(e.target.value) || 0),
                                pressureUnit,
                              ),
                            }))
                          }
                          className="bg-card"
                        />
                        <Select
                          value={pressureUnit}
                          onValueChange={(val: PressureUnit) => setPressureUnit(val)}
                        >
                          <SelectTrigger className="w-20 shrink-0 bg-card text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bar">bar</SelectItem>
                            <SelectItem value="psi">psi</SelectItem>
                            <SelectItem value="m">m</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="filter-loss">Filter + Fertigation + Valve Loss (m)</Label>
                      <Input
                        id="filter-loss"
                        type="number"
                        min={0}
                        max={20}
                        step={0.5}
                        value={inputs.filtrationValveLossM}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            filtrationValveLossM: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="bg-card"
                      />
                    </div>
                  </div>

                  {inputs.sourceType === "surface_suction" && (
                    <div className="rounded-lg border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground">
                      At <strong>{inputs.siteAltitudeM} m</strong> elevation, maximum safe atmospheric suction duty (lift + suction pipe loss) is{" "}
                      <strong className="text-foreground">
                        {result.maxPracticalSuctionLiftM.toFixed(1)} m
                      </strong>
                      . Current total suction duty:{" "}
                      <strong
                        className={
                          result.totalSuctionDutyM > result.maxPracticalSuctionLiftM
                            ? "text-destructive"
                            : "text-primary"
                        }
                      >
                        {result.totalSuctionDutyM.toFixed(1)} m
                      </strong>
                      .
                    </div>
                  )}

                  {/* Pipe Segments */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-heading text-sm font-bold text-foreground">
                          Multi-Segment Hazen-Williams Pipeline Solver
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Uses true PN10 inner diameters (not nominal OD) and alerts if water velocity exceeds 1.8 m/s.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="fittings-pct" className="text-xs text-muted-foreground">
                          Fittings/Elbows (%)
                        </Label>
                        <Input
                          id="fittings-pct"
                          type="number"
                          min={0}
                          max={40}
                          value={inputs.fittingsLossPct}
                          onChange={(e) =>
                            setInputs((p) => ({
                              ...p,
                              fittingsLossPct: Math.max(0, Number(e.target.value) || 0),
                            }))
                          }
                          className="h-8 w-20 bg-card text-xs"
                        />
                      </div>
                    </div>

                    {inputs.sourceType === "surface_suction" && (
                      <PipeSegmentEditor
                        title="Suction Line (Source to Pump Inlet)"
                        segment={inputs.suctionPipe}
                        segmentResult={result.suctionPipeResult}
                        allowToggle
                        onChange={(suctionPipe) => setInputs((p) => ({ ...p, suctionPipe }))}
                      />
                    )}

                    <PipeSegmentEditor
                      title={
                        inputs.sourceType === "borehole"
                          ? "Section 1: Borehole Riser Pipe"
                          : "Section 1: Pump Discharge Header"
                      }
                      segment={inputs.primaryPipe}
                      segmentResult={result.primaryPipeResult}
                      onChange={(primaryPipe) => setInputs((p) => ({ ...p, primaryPipe }))}
                    />

                    <PipeSegmentEditor
                      title="Section 2: Field Mainline Distribution"
                      segment={inputs.secondaryPipe}
                      segmentResult={result.secondaryPipeResult}
                      allowToggle
                      onChange={(secondaryPipe) => setInputs((p) => ({ ...p, secondaryPipe }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: SOLAR PV, CONTROLLER WINDOW, CABLE & TANK */}
            <TabsContent value="solar" className="mt-4 space-y-5">
              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
                    <Sun className="h-5 w-5 text-primary" />
                    Solar PV Array, Voltage Window, Cable &amp; Storage
                  </CardTitle>
                  <CardDescription>
                    Sizes PV panel strings with cold-morning Voc safety checks, Kenya PSH regions, submersible cable mm², and water storage buffer.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(
                      [
                        { id: "solar_dc", title: "Direct Solar DC (MPPT)", desc: "No batteries; sun-hours pumping" },
                        { id: "solar_hybrid", title: "Solar + Battery Hybrid", desc: "Dawn/dusk + overcast backup" },
                        { id: "ac_grid_generator", title: "KPLC Grid / Generator", desc: "230V / 400V AC induction supply" },
                      ] as Array<{ id: PowerSupplyMode; title: string; desc: string }>
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setInputs((p) => ({ ...p, powerMode: mode.id }))}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          inputs.powerMode === mode.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        <div className="text-sm font-bold text-foreground">{mode.title}</div>
                        <div className="text-xs text-muted-foreground">{mode.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Kenyan Region, Seasonal Design & Weather Physics */}
                  <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Kenya Corridor (PVGIS / NASA POWER Solar &amp; Weather Profile)</Label>
                      <Select value={inputs.solarRegionId} onValueChange={applySolarRegion}>
                        <SelectTrigger className="bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KENYA_SOLAR_REGIONS.map((region) => (
                            <SelectItem key={region.id} value={region.id}>
                              {region.label} ({region.worstMonthPsh} worst / {region.psh} avg PSH)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedRegion && (
                        <p className="text-xs text-muted-foreground">{selectedRegion.note}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Solar Design Weather Season
                      </Label>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {(
                          [
                            {
                              id: "worst_cloudy",
                              title: `Worst Cloudy (${selectedRegion?.worstMonthName || "Jun–Jul"})`,
                              desc: `${selectedRegion?.worstMonthPsh ?? inputs.peakSunHours} PSH • Year-round safe`,
                            },
                            {
                              id: "annual_avg",
                              title: "Annual Average PSH",
                              desc: `${selectedRegion?.psh ?? inputs.peakSunHours} PSH • Standard balanced`,
                            },
                            {
                              id: "dry_peak",
                              title: "Dry Season Clear (Jan–Mar)",
                              desc: `${selectedRegion?.drySeasonPsh ?? inputs.peakSunHours} PSH • Rain-supplemented`,
                            },
                          ] as Array<{ id: SolarSeasonMode; title: string; desc: string }>
                        ).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => applySeasonMode(s.id)}
                            className={`rounded-lg border p-2.5 text-left transition-all ${
                              inputs.solarSeasonMode === s.id
                                ? "border-primary bg-primary/10"
                                : "border-border bg-card hover:border-primary/40"
                            }`}
                          >
                            <div className="text-xs font-bold text-foreground">{s.title}</div>
                            <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="psh-input">Design Peak Sun Hours (PSH h/day)</Label>
                      <Input
                        id="psh-input"
                        type="number"
                        min={3.0}
                        max={8.0}
                        step={0.1}
                        value={inputs.peakSunHours}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            peakSunHours: Math.max(3, Number(e.target.value) || 4.2),
                          }))
                        }
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ambient-day">Peak Daytime Ambient Air (°C)</Label>
                      <Input
                        id="ambient-day"
                        type="number"
                        min={12}
                        max={48}
                        value={inputs.ambientDayTempC}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            ambientDayTempC: Number(e.target.value) || 26,
                          }))
                        }
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="wind-speed">Site Wind Speed (m/s cooling)</Label>
                      <Input
                        id="wind-speed"
                        type="number"
                        min={0.3}
                        max={10}
                        step={0.2}
                        value={inputs.windSpeedMs}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            windSpeedMs: Math.max(0.3, Number(e.target.value) || 1.5),
                          }))
                        }
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="min-temp">Coldest Dawn Air Temp (°C for Voc)</Label>
                      <Input
                        id="min-temp"
                        type="number"
                        min={0}
                        max={30}
                        value={inputs.minMorningTempC}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            minMorningTempC: Number(e.target.value) || 9,
                          }))
                        }
                        className="bg-card"
                      />
                    </div>
                  </div>

                  {inputs.powerMode !== "ac_grid_generator" && (
                    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Solar Module Specification</Label>
                          <Select
                            value={
                              SOLAR_PANEL_PRESETS.find((m) => m.watts === inputs.panelWatts)?.id ||
                              "custom"
                            }
                            onValueChange={(id) => {
                              const mod = SOLAR_PANEL_PRESETS.find((m) => m.id === id);
                              if (!mod) return;
                              setInputs((p) => ({
                                ...p,
                                panelWatts: mod.watts,
                                panelVmp: mod.vmp,
                                panelVoc: mod.voc,
                                panelNoctC: mod.noctC,
                                panelGammaPmaxPct: mod.gammaPmaxPct,
                                panelBetaVocPct: mod.betaVocPct,
                              }));
                            }}
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SOLAR_PANEL_PRESETS.map((mod) => (
                                <SelectItem key={mod.id} value={mod.id}>
                                  {mod.label} (Vmp {mod.vmp}V / Voc {mod.voc}V)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label>Site Dust / Panel Soiling Level</Label>
                          <Select
                            value={inputs.dustSoilingEnv}
                            onValueChange={(val: DustSoilingEnv) =>
                              setInputs((p) => ({
                                ...p,
                                dustSoilingEnv: val,
                                dustMismatchLossPct: DUST_SOILING_META[val].dustMismatchPct,
                              }))
                            }
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(DUST_SOILING_META) as DustSoilingEnv[]).map((key) => (
                                <SelectItem key={key} value={key}>
                                  {DUST_SOILING_META[key].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/25 px-3 py-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Thermometer className="h-3.5 w-3.5 text-primary" />
                          NOCT Cell Temp: <strong className="text-foreground">{result.estimatedDayCellTempC.toFixed(1)}°C</strong>{" "}
                          (Thermal Loss: <strong className="text-foreground">{result.computedThermalLossPct.toFixed(1)}%</strong>)
                        </span>
                        <span className="text-muted-foreground">
                          Recommended Equator Tilt: <strong className="text-foreground">{result.recommendedPanelTiltDeg}°–15°</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Panel Wp</Label>
                          <Input
                            type="number"
                            min={100}
                            max={800}
                            value={inputs.panelWatts}
                            onChange={(e) =>
                              setInputs((p) => ({ ...p, panelWatts: Number(e.target.value) || 550 }))
                            }
                            className="h-9 bg-card text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Module Vmp (V)</Label>
                          <Input
                            type="number"
                            min={15}
                            max={70}
                            step={0.1}
                            value={inputs.panelVmp}
                            onChange={(e) =>
                              setInputs((p) => ({ ...p, panelVmp: Number(e.target.value) || 41.8 }))
                            }
                            className="h-9 bg-card text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Module Voc (V)</Label>
                          <Input
                            type="number"
                            min={18}
                            max={90}
                            step={0.1}
                            value={inputs.panelVoc}
                            onChange={(e) =>
                              setInputs((p) => ({ ...p, panelVoc: Number(e.target.value) || 49.8 }))
                            }
                            className="h-9 bg-card text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Min Start Vmp</Label>
                          <Input
                            type="number"
                            min={24}
                            max={500}
                            value={inputs.controllerMinVmpV}
                            onChange={(e) =>
                              setInputs((p) => ({
                                ...p,
                                controllerMinVmpV: Number(e.target.value) || 70,
                              }))
                            }
                            className="h-9 bg-card text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Max Ctrl Voc</Label>
                          <Input
                            type="number"
                            min={50}
                            max={1000}
                            value={inputs.controllerMaxVocV}
                            onChange={(e) =>
                              setInputs((p) => ({
                                ...p,
                                controllerMaxVocV: Math.max(50, Number(e.target.value) || 200),
                              }))
                            }
                            className="h-9 bg-card text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Pmax Coeff (%/°C)</Label>
                          <Input
                            type="number"
                            min={-0.6}
                            max={-0.15}
                            step={0.01}
                            value={inputs.panelGammaPmaxPct}
                            onChange={(e) =>
                              setInputs((p) => ({
                                ...p,
                                panelGammaPmaxPct: Number(e.target.value) || -0.35,
                              }))
                            }
                            className="h-9 bg-card text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Dust &amp; Mismatch (%)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={20}
                            value={inputs.dustMismatchLossPct}
                            onChange={(e) =>
                              setInputs((p) => ({
                                ...p,
                                dustMismatchLossPct: Number(e.target.value) || 0,
                              }))
                            }
                            className="h-9 bg-card text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">MPPT / Ctrl Eff (%)</Label>
                          <Input
                            type="number"
                            min={80}
                            max={99}
                            value={inputs.controllerEfficiencyPct}
                            onChange={(e) =>
                              setInputs((p) => ({
                                ...p,
                                controllerEfficiencyPct: Number(e.target.value) || 95,
                              }))
                            }
                            className="h-9 bg-card text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {inputs.powerMode === "solar_hybrid" && (
                    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="backup-hrs">Off-Sun Battery Pumping Hours/Day</Label>
                        <Input
                          id="backup-hrs"
                          type="number"
                          min={0.5}
                          max={12}
                          step={0.5}
                          value={inputs.batteryBackupHours}
                          onChange={(e) =>
                            setInputs((p) => ({
                              ...p,
                              batteryBackupHours: Math.max(0.5, Number(e.target.value) || 2),
                            }))
                          }
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Battery Bank Chemistry</Label>
                        <Select
                          value={inputs.batteryChemistry}
                          onValueChange={(val: BatteryChemistry) =>
                            setInputs((p) => ({ ...p, batteryChemistry: val }))
                          }
                        >
                          <SelectTrigger className="bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lifepo4">LiFePO4 Lithium (80% DoD)</SelectItem>
                            <SelectItem value="tubular_lead_acid">
                              Deep-Cycle Lead-Acid / Gel (50% DoD)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {inputs.powerMode === "ac_grid_generator" && (
                    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="kplc-tariff">Grid / Fuel Energy Cost (KES/kWh)</Label>
                        <Input
                          id="kplc-tariff"
                          type="number"
                          min={5}
                          max={120}
                          value={inputs.electricityTariffKesKwh}
                          onChange={(e) =>
                            setInputs((p) => ({
                              ...p,
                              electricityTariffKesKwh: Math.max(0, Number(e.target.value) || 28),
                            }))
                          }
                          className="bg-card"
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3.5 py-2.5">
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            Soft-Starter / VFD Drive
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Cuts AC motor starting surge vs DOL
                          </div>
                        </div>
                        <Switch
                          checked={inputs.usesVfdSoftStart}
                          onCheckedChange={(checked) =>
                            setInputs((p) => ({ ...p, usesVfdSoftStart: checked }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Cable Run & Tank Storage */}
                  <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cable-dist">One-Way Pump Cable Length (m)</Label>
                      <Input
                        id="cable-dist"
                        type="number"
                        min={5}
                        max={1000}
                        value={inputs.cableLengthM}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            cableLengthM: Math.max(5, Number(e.target.value) || 50),
                          }))
                        }
                        className="bg-card"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="vdrop-limit">Max Allowed Voltage Drop (%)</Label>
                      <Input
                        id="vdrop-limit"
                        type="number"
                        min={1}
                        max={6}
                        step={0.5}
                        value={inputs.maxVoltageDropPct}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            maxVoltageDropPct: Math.max(1, Number(e.target.value) || 3),
                          }))
                        }
                        className="bg-card"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tank-autonomy">Water Storage Buffer (Days)</Label>
                      <Input
                        id="tank-autonomy"
                        type="number"
                        min={0.5}
                        max={5}
                        step={0.5}
                        value={inputs.storageAutonomyDays}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            storageAutonomyDays: Math.max(0.5, Number(e.target.value) || 1),
                          }))
                        }
                        className="bg-card"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: EXPERT EFFICIENCY & CUSTOM PUMP CURVE AUDITOR */}
            <TabsContent value="expert" className="mt-4 space-y-5">
              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
                    <Settings2 className="h-5 w-5 text-primary" />
                    Pump Efficiency &amp; Any-Pump Curve Auditor
                  </CardTitle>
                  <CardDescription>
                    Fine-tune hydraulic/motor efficiency or test ANY third-party or existing pump nameplate against your calculated TDH.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="pump-eff">Pump Hydraulic Eff. (%)</Label>
                      <Input
                        id="pump-eff"
                        type="number"
                        min={25}
                        max={85}
                        value={inputs.pumpEfficiencyPct}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            pumpEfficiencyPct: Math.max(25, Math.min(85, Number(e.target.value) || 58)),
                          }))
                        }
                        className="bg-card"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="motor-eff">Motor / BLDC Eff. (%)</Label>
                      <Input
                        id="motor-eff"
                        type="number"
                        min={50}
                        max={95}
                        value={inputs.motorEfficiencyPct}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            motorEfficiencyPct: Math.max(50, Math.min(95, Number(e.target.value) || 84)),
                          }))
                        }
                        className="bg-card"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="safety-factor">Duty Safety Factor (1.0–1.4×)</Label>
                      <Input
                        id="safety-factor"
                        type="number"
                        min={1.0}
                        max={1.4}
                        step={0.05}
                        value={inputs.hydraulicSafetyFactor}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            hydraulicSafetyFactor: Math.max(1.0, Math.min(1.4, Number(e.target.value) || 1.15)),
                          }))
                        }
                        className="bg-card"
                      />
                    </div>
                  </div>

                  {/* Custom Pump Evaluator */}
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-sm font-bold text-foreground">
                          Test Any Pump Nameplate Against Your TDH
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Enter Qmax and Hmax from any pump datasheet to estimate its operating duty flow on your farm.
                        </p>
                      </div>
                      <Switch
                        checked={inputs.customPump.enabled}
                        onCheckedChange={(enabled) =>
                          setInputs((p) => ({
                            ...p,
                            customPump: { ...p.customPump, enabled },
                          }))
                        }
                      />
                    </div>

                    {inputs.customPump.enabled && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="space-y-1 sm:col-span-3">
                            <Label className="text-xs">Pump Label / Model</Label>
                            <Input
                              value={inputs.customPump.name}
                              onChange={(e) =>
                                setInputs((p) => ({
                                  ...p,
                                  customPump: { ...p.customPump, name: e.target.value },
                                }))
                              }
                              className="bg-card"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Max Flow Qmax (m³/h)</Label>
                            <Input
                              type="number"
                              min={0.5}
                              step={0.5}
                              value={inputs.customPump.maxFlowM3h}
                              onChange={(e) =>
                                setInputs((p) => ({
                                  ...p,
                                  customPump: {
                                    ...p.customPump,
                                    maxFlowM3h: Math.max(0.5, Number(e.target.value) || 1),
                                  },
                                }))
                              }
                              className="bg-card"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Max Shutoff Head Hmax (m)</Label>
                            <Input
                              type="number"
                              min={5}
                              step={1}
                              value={inputs.customPump.maxHeadM}
                              onChange={(e) =>
                                setInputs((p) => ({
                                  ...p,
                                  customPump: {
                                    ...p.customPump,
                                    maxHeadM: Math.max(5, Number(e.target.value) || 10),
                                  },
                                }))
                              }
                              className="bg-card"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Motor Power (Watts)</Label>
                            <Input
                              type="number"
                              min={150}
                              step={50}
                              value={inputs.customPump.ratedPowerW}
                              onChange={(e) =>
                                setInputs((p) => ({
                                  ...p,
                                  customPump: {
                                    ...p.customPump,
                                    ratedPowerW: Math.max(150, Number(e.target.value) || 750),
                                  },
                                }))
                              }
                              className="bg-card"
                            />
                          </div>
                        </div>

                        <div
                          className={`rounded-lg border p-3.5 text-xs ${
                            result.customPumpEval.verdict === "optimal"
                              ? "border-primary/40 bg-primary/10 text-foreground"
                              : result.customPumpEval.verdict === "workable"
                                ? "border-border bg-card text-foreground"
                                : "border-destructive/40 bg-destructive/10 text-destructive"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>Curve Audit: {inputs.customPump.name}</span>
                            <Badge
                              variant={
                                result.customPumpEval.verdict === "undersized"
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {result.customPumpEval.verdict === "optimal"
                                ? "Optimal Operating Point"
                                : result.customPumpEval.verdict === "workable"
                                  ? "Marginal Duty Point"
                                  : "Insufficient Headroom"}
                            </Badge>
                          </div>
                          <p className="mt-1.5 leading-relaxed">{result.customPumpEval.summary}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: CUSTOM PROJECT, BUDGET FIGURES, DB SAVE & DOWNLOADABLE REPORT */}
            <TabsContent value="report" className="mt-4">
              <PumpReportBudgetTab
                inputs={inputs}
                result={result}
                projectMeta={projectMeta}
                onChangeProjectMeta={setProjectMeta}
                customCosts={customCosts}
                onChangeCustomCosts={setCustomCosts}
                matchedPumps={matchedPumps}
                savedReports={savedReports}
                savingDb={savingDb}
                lastSavedCode={lastSavedCode}
                lastShareUrl={lastShareUrl}
                onSaveReport={handleSaveReport}
                onCopyShareLink={handleCopyShareLink}
                onDownloadPdfReport={handleOpenPdfReport}
                onDownloadHtmlReport={handleDownloadHtmlReport}
                onLoadSavedReport={(rec) => {
                  setInputs(rec.inputs);
                  setProjectMeta(rec.projectMeta);
                  setCustomCosts(rec.customCosts);
                  setLastSavedCode(rec.reportCode);
                  setLastShareUrl(rec.shareUrl);
                  toast({
                    title: `Loaded ${rec.reportCode}`,
                    description: rec.projectMeta.projectName,
                  });
                }}
                onDeleteSavedReport={(code) => {
                  setSavedReports(deleteLocalSavedReport(code));
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Live Engineering Results Dashboard */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:col-span-5">
          {/* Primary Duty Point Card */}
          <Card className="border-primary/25 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <span className="dt-badge-primary">Calculated Duty Point</span>
                <span className="text-xs font-medium text-muted-foreground">
                  Wire-to-water eff: {result.wireToWaterEfficiencyPct.toFixed(0)}%
                </span>
              </div>
              <CardTitle className="mt-1 font-heading text-xl font-bold text-foreground">
                Pump &amp; Hydraulic Summary
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 3 Big KPI Tiles */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Flow Rate Q
                  </div>
                  <div className="mt-1 font-heading text-xl font-extrabold text-foreground sm:text-2xl">
                    {result.designFlowM3h.toFixed(1)}
                    <span className="ml-1 text-xs font-semibold text-muted-foreground">m³/h</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {result.designFlowLpm.toFixed(0)} L/min
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Total Head TDH
                  </div>
                  <div className="mt-1 font-heading text-xl font-extrabold text-primary sm:text-2xl">
                    {result.totalDynamicHeadM.toFixed(1)}
                    <span className="ml-1 text-xs font-semibold text-muted-foreground">m</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {(result.totalDynamicHeadM / 10.197).toFixed(2)} bar eq.
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Motor Size
                  </div>
                  <div className="mt-1 font-heading text-xl font-extrabold text-foreground sm:text-2xl">
                    {result.nearestStandardHp}
                    <span className="ml-1 text-xs font-semibold text-muted-foreground">HP</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {result.recommendedMotorKw.toFixed(2)} kW min
                  </div>
                </div>
              </div>

              {/* Head Breakdown Stacked Bar */}
              <div className="rounded-xl border border-border bg-background/70 p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>TDH Composition Breakdown</span>
                  <span className="text-muted-foreground">
                    {result.dailyGrossVolumeM3.toFixed(1)} m³/day ({result.effectiveDailyPumpHours}h)
                  </span>
                </div>

                <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    style={{ width: `${(tdhStaticBlock / tdhBarTotal) * 100}%` }}
                    className="bg-primary"
                    title="Static depth + Drawdown"
                  />
                  <div
                    style={{ width: `${(tdhElevBlock / tdhBarTotal) * 100}%` }}
                    className="bg-primary/65"
                    title="Elevation + Discharge tank"
                  />
                  <div
                    style={{ width: `${(tdhPressureBlock / tdhBarTotal) * 100}%` }}
                    className="bg-secondary-foreground/45"
                    title="Working pressure"
                  />
                  <div
                    style={{ width: `${(tdhLossBlock / tdhBarTotal) * 100}%` }}
                    className="bg-destructive/65"
                    title="Pipes + Filters + Fittings"
                  />
                </div>

                <div className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-1 text-[11px] text-muted-foreground sm:grid-cols-2">
                  <div className="flex justify-between gap-2">
                    <span>Static + Drawdown:</span>
                    <strong className="whitespace-nowrap text-foreground">{tdhStaticBlock.toFixed(1)} m</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Elevation + Tank:</span>
                    <strong className="whitespace-nowrap text-foreground">{tdhElevBlock.toFixed(1)} m</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Working Bar Head:</span>
                    <strong className="whitespace-nowrap text-foreground">{tdhPressureBlock.toFixed(1)} m</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Friction + Filters:</span>
                    <strong className="whitespace-nowrap text-foreground">{tdhLossBlock.toFixed(1)} m</strong>
                  </div>
                </div>
              </div>

              {/* Solar PV / Power & Electrical Spec */}
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                    {inputs.powerMode === "ac_grid_generator" ? (
                      <>
                        <Zap className="h-3.5 w-3.5" /> Grid / Generator Sizing
                      </>
                    ) : (
                      <>
                        <Sun className="h-3.5 w-3.5" /> Solar PV Array &amp; Strings
                      </>
                    )}
                  </span>
                  <Badge variant="outline" className="text-[11px]">
                    {result.specificEnergyKwhPerM3.toFixed(2)} kWh/m³
                  </Badge>
                </div>

                {inputs.powerMode !== "ac_grid_generator" ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-muted-foreground">Installed PV Array:</span>
                      <span className="whitespace-nowrap font-heading text-base font-extrabold text-foreground">
                        {result.installedArrayWp.toLocaleString()} Wp ({result.solarPanelCount} × {inputs.panelWatts}W)
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 text-muted-foreground">
                      <span>String Topology:</span>
                      <strong className="text-foreground">
                        {result.parallelStrings}P × {result.panelsInSeries}S ({result.stringVmpV.toFixed(0)}V Vmp / {result.stringColdVocV.toFixed(0)}V cold Voc)
                      </strong>
                    </div>
                    {inputs.powerMode === "solar_hybrid" && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Battery Bank Required:</span>
                        <strong className="flex items-center gap-1 text-foreground">
                          <BatteryCharging className="h-3.5 w-3.5 text-primary" />
                          {result.batteryRequiredKwh.toFixed(1)} kWh usable
                        </strong>
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] ${
                        result.vocSafetyStatus === "ok"
                          ? "bg-primary/10 text-foreground"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {result.vocSafetyMessage}
                    </div>

                    {/* Weather & Cloud Cover Pump Performance Simulator */}
                    <div className="rounded-lg border border-border bg-card p-2.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground">
                          <CloudSun className="h-3.5 w-3.5 text-primary" />
                          Sunlight &amp; Cloud Pumping Simulator
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          VFD/Ctrl ≥ {result.recommendedVfdKw.toFixed(1)} kW
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {(Object.keys(SKY_CONDITION_PRESETS) as SkyConditionPreset[]).map((sky) => (
                          <button
                            key={sky}
                            type="button"
                            onClick={() =>
                              setInputs((p) => ({
                                ...p,
                                skyCondition: sky,
                                skyIrradianceWm2: SKY_CONDITION_PRESETS[sky].wm2,
                              }))
                            }
                            className={`rounded border px-1.5 py-1 text-[10px] font-semibold transition-colors ${
                              inputs.skyCondition === sky
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {sky === "clear_sun"
                              ? "Clear 950W"
                              : sky === "light_cloud"
                                ? "Cloud 650W"
                                : "Heavy 380W"}
                          </button>
                        ))}
                      </div>
                      <p
                        className={`text-[11px] leading-snug ${
                          result.cloudSimulation.canLiftWater
                            ? "text-muted-foreground"
                            : "font-medium text-destructive"
                        }`}
                      >
                        {result.cloudSimulation.summary}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Daily Energy Draw:</span>
                      <strong className="text-foreground">{result.dailyEnergyKwh.toFixed(1)} kWh/day</strong>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Estimated Energy Cost:</span>
                      <strong className="text-foreground">
                        KSh {Math.round(result.estimatedGridDailyCostKes).toLocaleString()}/day (KSh{" "}
                        {result.estimatedCostPerM3Kes.toFixed(1)}/m³)
                      </strong>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Minimum Generator Size:</span>
                      <strong className="text-foreground">
                        {result.recommendedGeneratorKva.toFixed(1)} kVA (
                        {inputs.usesVfdSoftStart ? "with VFD/Soft-Start" : "DOL starting surge"})
                      </strong>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Cable className="h-3.5 w-3.5 text-primary" />
                    Cable ({inputs.cableLengthM}m):{" "}
                    <strong className="text-foreground">{result.recommendedCableMm2} mm²</strong> (
                    {result.actualVoltageDropPct.toFixed(2)}% V-drop)
                  </span>
                  <span className="text-muted-foreground">
                    Tank Buffer:{" "}
                    <strong className="text-foreground">
                      {result.recommendedTankLiters.toLocaleString()} L
                    </strong>
                  </span>
                </div>
              </div>

              {/* Engineering Alerts */}
              {result.alerts.length > 0 && (
                <div className="space-y-2">
                  {result.alerts.map((alert, idx) => (
                    <div
                      key={`${alert.title}-${idx}`}
                      className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                        alert.severity === "critical"
                          ? "border-destructive/40 bg-destructive/10 text-foreground"
                          : "border-primary/30 bg-primary/5 text-foreground"
                      }`}
                    >
                      {alert.severity === "critical" ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      ) : (
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      )}
                      <div>
                        <div className="font-bold">{alert.title}</div>
                        <p className="mt-0.5 leading-relaxed text-muted-foreground">{alert.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Export & Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 print:hidden">
                <Button
                  type="button"
                  onClick={handleOpenPdfReport}
                  className="col-span-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Save / Download PDF Report
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadHtmlReport}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download File
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={savingDb}
                  onClick={() => handleSaveReport(false)}
                >
                  <Database className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  {savingDb ? "Saving..." : "Save to DB"}
                </Button>
                <Button
                  type="button"
                  onClick={handleWhatsAppExport}
                  className="bg-[hsl(var(--dt-whatsapp))] text-white hover:bg-[hsl(var(--dt-whatsapp)/0.9)]"
                  size="sm"
                >
                  <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                  WhatsApp Brief
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleCopySpec}>
                  {copiedSpec ? (
                    <>
                      <ClipboardCheck className="mr-1.5 h-3.5 w-3.5 text-primary" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Copy Spec
                    </>
                  )}
                </Button>
                <Link
                  to={`/contact?topic=design-boq&flow=${result.designFlowM3h.toFixed(
                    1,
                  )}&tdh=${result.totalDynamicHeadM.toFixed(0)}`}
                  className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                >
                  <Wrench className="h-3.5 w-3.5 text-primary" />
                  Request Full Engineering Design &amp; BOQ
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2.5 Interactive Pump Q-H Curve & BEP Visualizer */}
      <div id="pump-curve-section" className="scroll-mt-24 pt-2">
        <PumpCurveVisualizer
          result={result}
          matchedPumps={matchedPumps}
          customPumpSpecs={
            inputs.customPump.enabled
              ? {
                  label: inputs.customPump.name,
                  maxFlowM3h: inputs.customPump.maxFlowM3h,
                  maxHeadM: inputs.customPump.maxHeadM,
                }
              : undefined
          }
          selectedPumpId={selectedCurvePumpId}
        />
      </div>

      {/* 3. Live DripTech Pump Equipment Recommendations */}
      <section aria-labelledby="matched-pumps-heading" className="pt-2">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="dt-section-label mb-1">Matched Inventory From Catalogue</p>
            <h2 id="matched-pumps-heading" className="dt-section-title">
              Recommended DripTech Pumps for {result.designFlowM3h.toFixed(1)} m³/h @{" "}
              {result.totalDynamicHeadM.toFixed(0)} m TDH
            </h2>
          </div>
          <Link
            to="/products/pumps"
            className="inline-flex items-center text-xs font-bold text-primary hover:underline sm:text-sm"
          >
            Browse All {catalogPumps.length || ""} Pumps &amp; Motors
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>

        {loadingPumps ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="h-56 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : matchedPumps.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {matchedPumps.map((match) => {
              const { product, specs } = match;
              const imgUrl = Array.isArray(product.images) ? product.images[0] : null;
              return (
                <Card
                  key={product.id}
                  className="flex flex-col justify-between overflow-hidden border-border bg-card transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center gap-3 border-b border-border/70 bg-muted/20 p-4">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={product.name}
                          className="h-16 w-16 shrink-0 rounded-lg border border-border bg-card object-contain p-1"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
                          <Gauge className="h-7 w-7" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant={match.fitStatus === "optimal" ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {match.fitStatus === "optimal"
                              ? "Optimal Headroom"
                              : match.fitStatus === "workable"
                                ? "Verify Curve"
                                : "Check Specs"}
                          </Badge>
                          {product.model_number && (
                            <span className="truncate font-mono text-[10px] text-muted-foreground">
                              {product.model_number}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1 line-clamp-2 font-heading text-sm font-bold text-foreground">
                          {product.name}
                        </h3>
                      </div>
                    </div>

                    <CardContent className="space-y-3 p-4 text-xs">
                      <p className="leading-relaxed text-muted-foreground">{match.fitReason}</p>

                      <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/20 p-2.5">
                        <div>
                          <div className="text-[10px] text-muted-foreground">Datasheet Max</div>
                          <div className="font-bold text-foreground">
                            {specs.maxFlowM3h ?? "?"} m³/h • {specs.maxHeadM ?? "?"} m
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground">Est. @ Your TDH</div>
                          <div className="font-bold text-primary">
                            {match.estimatedFlowAtTDHM3h > 0
                              ? `${match.estimatedFlowAtTDHM3h.toFixed(1)} m³/h`
                              : "Consult Team"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground">Motor / Solar</div>
                          <div className="font-semibold text-foreground">
                            {specs.ratedHp ? `${specs.ratedHp} HP` : "—"}
                            {specs.recommendedSolarW ? ` • ${specs.recommendedSolarW}W PV` : ""}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground">Catalogue Price</div>
                          <div className="font-bold text-foreground">
                            {formatPrice(product.price)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border/70 p-3">
                    {specs.maxFlowM3h && specs.maxHeadM && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-2.5 text-xs font-semibold"
                        onClick={() => {
                          setSelectedCurvePumpId(product.id);
                          document
                            .getElementById("pump-curve-section")
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                      >
                        <Activity className="mr-1 h-3.5 w-3.5 text-primary" />
                        Plot Curve
                      </Button>
                    )}
                    <Link
                      to={getProductPath(product)}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      View Specs
                    </Link>
                    {typeof product.price === "number" && product.price > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-2.5 text-xs font-semibold"
                        onClick={() => {
                          setCustomCosts((prev) => ({
                            ...prev,
                            includeInReport: true,
                            pumpUnitKes: product.price ?? prev.pumpUnitKes,
                          }));
                          setActiveTab("report");
                          toast({
                            title: "Pump price added to budget",
                            description: `${product.name} (${formatPrice(product.price)}) set in Report & Costs tab.`,
                          });
                        }}
                      >
                        Use Price
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 flex-1 bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90"
                      onClick={() => {
                        const msg = `Hi DripTech, my farm needs ${result.designFlowM3h.toFixed(
                          1,
                        )} m3/h at ${result.totalDynamicHeadM.toFixed(
                          0,
                        )} m TDH (${result.installedArrayWp} Wp solar). Please quote ${product.name} (${
                          product.model_number || ""
                        }).`;
                        openTrackedWhatsApp(
                          `https://wa.me/${SITE_COMPANY.whatsappNumber}?text=${encodeURIComponent(msg)}`,
                          `pump match quote: ${product.name}`,
                        );
                      }}
                    >
                      Quote Pump
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-border bg-card p-6 sm:p-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Activity className="h-4 w-4 text-primary" />
                  <span>
                    Custom Heavy-Duty Pump Sizing Recommended ({result.designFlowM3h.toFixed(1)} m³/h @{" "}
                    {result.totalDynamicHeadM.toFixed(0)} m TDH)
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Your calculated duty point ({result.nearestStandardHp} HP,{" "}
                  {result.totalDynamicHeadM.toFixed(0)} m head) sits outside our standard shelf stock
                  under the current power/source filter — or you can split zones / try{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary underline"
                    onClick={() =>
                      setInputs((p) => ({ ...p, powerMode: "solar_hybrid" }))
                    }
                  >
                    Solar Hybrid VFD AC
                  </button>
                  . We source custom Lorentz, Pedrollo, Dayliff &amp; Doyin commercial pumps up to 30 HP.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleWhatsAppExport}
                className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Request Custom Pump Quote
              </Button>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
};

export default PumpSolarSizingEngine;
