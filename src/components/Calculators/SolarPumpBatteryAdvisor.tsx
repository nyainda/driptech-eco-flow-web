import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Cpu,
  Gauge,
  Info,
  Search,
  Sparkles,
  Sun,
  Waves,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BATTERY_BANK_DATASET,
  CONTROLLER_DATASET,
  PUMP_REFERENCE_DATASET,
  PumpDatasetCategory,
  PumpReferenceSpec,
  SOLAR_PANEL_DATASET,
  SolarPanelSpec,
} from "@/data/solarPumpBatteryDataset";
import { recommendHardwareForDesign } from "@/lib/hardwareRecommendationEngine";
import { PumpSolarInputs, PumpSolarResult } from "@/lib/pumpSolarSizing";

interface SolarPumpBatteryAdvisorProps {
  inputs: PumpSolarInputs;
  result: PumpSolarResult;
  /** Optional callback to apply a selected PV panel spec directly into the active calculation */
  onApplySolarPanel?: (panel: SolarPanelSpec) => void;
  /** Optional callback to apply battery chemistry / hybrid mode into the active calculation */
  onApplyBatteryChoice?: (chemistry: "lifepo4" | "tubular_gel", backupHours?: number) => void;
  /** Optional callback to load a reference pump's curve specs into the calculator/curve audit */
  onApplyReferencePump?: (pump: PumpReferenceSpec) => void;
  /** Compact heading when embedded inside Admin */
  compactAdminMode?: boolean;
}

export default function SolarPumpBatteryAdvisor({
  inputs,
  result,
  onApplySolarPanel,
  onApplyBatteryChoice,
  onApplyReferencePump,
  compactAdminMode = false,
}: SolarPumpBatteryAdvisorProps) {
  const [advisorTab, setAdvisorTab] = useState<string>("panels");
  const [datasetCategory, setDatasetCategory] = useState<string>("all");
  const [datasetQuery, setDatasetQuery] = useState<string>("");

  const advisor = useMemo(
    () => recommendHardwareForDesign(inputs, result),
    [inputs, result],
  );

  // Selected panel for the top Min vs Required Hero (either matches inputs.panelWatts or top ranked)
  const activePanelMatch = useMemo(
    () =>
      advisor.panelRecommendations.find(
        (r) => Math.abs(r.panel.pmaxW - inputs.panelWatts) <= 15 && r.isFitPossible,
      ) ?? advisor.topPanelRecommendation,
    [advisor, inputs.panelWatts],
  );

  const filteredRefPumps = useMemo(() => {
    const q = datasetQuery.trim().toLowerCase();
    return PUMP_REFERENCE_DATASET.filter((p) => {
      if (datasetCategory !== "all" && p.category !== (datasetCategory as PumpDatasetCategory)) {
        return false;
      }
      if (!q) return true;
      return [p.name, p.seriesCode, p.categoryLabel, p.bestUseCase, p.driptechMatchKeyword]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [datasetCategory, datasetQuery]);

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
                Complete Solar, Battery &amp; Pump Hardware Dataset
              </Badge>
              <span className="text-xs font-semibold text-muted-foreground">
                {SOLAR_PANEL_DATASET.length} PV Modules • {BATTERY_BANK_DATASET.length} Batteries •{" "}
                {PUMP_REFERENCE_DATASET.length} Pump Families • {CONTROLLER_DATASET.length} Drives
              </span>
            </div>
            <CardTitle className={`mt-1.5 font-heading font-extrabold text-foreground ${compactAdminMode ? "text-lg" : "text-xl"}`}>
              Minimum vs Required Solar Panels, Battery Storage &amp; Pump Selector
            </CardTitle>
            <CardDescription className="mt-1">
              Compare exact panel counts (Minimum Noon Start vs Recommended Cloudy-Safe Design), choose between Mono PERC, N-Type TOPCon, or Bifacial, and verify whether a water tank or LiFePO4/Tubular battery bank fits your farm best.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <Tabs value={advisorTab} onValueChange={setAdvisorTab} className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-1.5 rounded-xl border border-border bg-muted/40 p-1.5 sm:grid-cols-3">
            <TabsTrigger value="panels" className="gap-1.5 py-2 text-xs font-semibold">
              <Sun className="h-3.5 w-3.5 text-primary" />
              1. Solar Panels (Min vs Required)
            </TabsTrigger>
            <TabsTrigger value="batteries" className="gap-1.5 py-2 text-xs font-semibold">
              <BatteryCharging className="h-3.5 w-3.5 text-primary" />
              2. Battery Bank vs Tank Verdict
            </TabsTrigger>
            <TabsTrigger value="dataset" className="gap-1.5 py-2 text-xs font-semibold">
              <Gauge className="h-3.5 w-3.5 text-primary" />
              3. Full Pump &amp; Controller Dataset
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Minimum vs Required Solar Panels + Chemistry Selector */}
          <TabsContent value="panels" className="space-y-5">
            {inputs.powerMode === "ac_grid_generator" && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Your pump is currently set to <strong>AC Grid / Generator</strong>. The panel comparisons below show the equivalent Solar PV array required if converting or adding Solar Hybrid backup to this exact {result.designFlowM3h.toFixed(1)} m³/h @ {result.totalDynamicHeadM.toFixed(0)} m duty.
                </span>
              </div>
            )}

            {/* 3-Tier Minimum vs Required vs Resilience Banner for Active Module */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    1. Minimum Possible Array
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Noon Clear-Sky Floor
                  </Badge>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-foreground">
                  {activePanelMatch.minimumPanels} × {activePanelMatch.panel.pmaxW}W
                </p>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  {activePanelMatch.minimumStringsLabel} = {activePanelMatch.minimumInstalledWp.toLocaleString()} Wp
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  Bare minimum to clear controller start voltage ({inputs.controllerMinVmpV}V) &amp; pump around bright solar noon.{" "}
                  <strong>Will stall under clouds or early/late sun.</strong>
                </p>
              </div>

              <div className="rounded-xl border-2 border-primary bg-primary/[0.07] p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    2. Required Design Array
                  </span>
                  <Badge className="bg-primary text-primary-foreground text-[10px]">
                    Recommended
                  </Badge>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-foreground">
                  {activePanelMatch.recommendedPanels} × {activePanelMatch.panel.pmaxW}W
                </p>
                <p className="text-xs font-bold text-primary">
                  {activePanelMatch.recommendedStringsLabel} = {activePanelMatch.recommendedInstalledWp.toLocaleString()} Wp
                  {activePanelMatch.extraPanelsForBattery > 0
                    ? ` (+${activePanelMatch.extraPanelsForBattery} to recharge battery)`
                    : ""}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-foreground/90">
                  Engineered for your {inputs.peakSunHours} PSH weather, {result.estimatedDayCellTempC.toFixed(0)}°C cell heat, and {inputs.dustMismatchLossPct}% dust loss. Delivers full {result.dailyGrossVolumeM3.toFixed(1)} m³/day reliably.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/25 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    3. Heavy Cloud Resilience
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    +20% Buffer
                  </Badge>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-foreground">
                  {activePanelMatch.resiliencePanels} × {activePanelMatch.panel.pmaxW}W
                </p>
                <p className="text-xs font-bold text-foreground">
                  {activePanelMatch.resilienceInstalledWp.toLocaleString()} Wp Installed
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  Best for misty high-altitude belts (Nyeri, Limuru, Kericho, Kisii) or heavily turbid boreholes without a grid backup.
                </p>
              </div>
            </div>

            {/* Panel Type Comparison Table (All 9 East Africa PV Modules) */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Compare Solar Panel Types for Your {result.recommendedMotorKw.toFixed(2)} kW ({result.nearestStandardHp} HP) Load
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Active Module: <strong>{activePanelMatch.panel.name}</strong>
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[780px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase text-foreground">
                      <th className="px-3 py-2.5">Panel Model &amp; Tech</th>
                      <th className="px-3 py-2.5">Min Start</th>
                      <th className="px-3 py-2.5">Required Count</th>
                      <th className="px-3 py-2.5">String &amp; Cold Voc</th>
                      <th className="px-3 py-2.5">Rack Area</th>
                      <th className="px-3 py-2.5">Which to Buy / Notes</th>
                      {onApplySolarPanel && <th className="px-3 py-2.5 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {advisor.panelRecommendations.map((item) => {
                      const isCurrent = Math.abs(item.panel.pmaxW - inputs.panelWatts) <= 15 && item.panel.id === activePanelMatch.panel.id;
                      return (
                        <tr
                          key={item.panel.id}
                          className={isCurrent ? "bg-primary/[0.06]" : "hover:bg-muted/20"}
                        >
                          <td className="px-3 py-2.5">
                            <div className="font-bold text-foreground">{item.panel.name}</div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px]">
                                {item.panel.technologyLabel} ({item.panel.efficiencyPct}%)
                              </Badge>
                              <Badge
                                variant={item.panel.id === advisor.topPanelRecommendation.panel.id ? "default" : "secondary"}
                                className="text-[10px]"
                              >
                                {item.recommendationTag}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-amber-700 dark:text-amber-300">
                            {item.minimumPanels} pcs
                            <div className="text-[10px] font-normal text-muted-foreground">
                              {item.minimumInstalledWp.toLocaleString()} Wp
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-extrabold text-primary">
                            {item.recommendedPanels} pcs
                            <div className="text-[10px] font-normal text-muted-foreground">
                              {item.recommendedInstalledWp.toLocaleString()} Wp ({item.effectiveWattAtSiteW}W real)
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            {item.isFitPossible ? (
                              <>
                                <span className="font-mono font-bold text-foreground">
                                  {item.recommendedStringsLabel}
                                </span>
                                <div className="text-[10px] text-muted-foreground">
                                  Hot {item.stringHotVmpV}V → Cold {item.stringColdVocV}V
                                </div>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-destructive">
                                <AlertTriangle className="h-3 w-3" /> Voltage mismatch
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            ~{item.estimatedRoofAreaM2} m²
                          </td>
                          <td className="max-w-[260px] px-3 py-2.5 text-[11px] leading-snug text-muted-foreground">
                            {item.fitWarning ? (
                              <span className="text-destructive font-medium">{item.fitWarning}</span>
                            ) : (
                              item.panel.whyChoose
                            )}
                          </td>
                          {onApplySolarPanel && (
                            <td className="px-3 py-2.5 text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant={isCurrent ? "default" : "outline"}
                                disabled={!item.isFitPossible}
                                onClick={() => onApplySolarPanel(item.panel)}
                                className="h-7 px-2.5 text-[11px]"
                              >
                                {isCurrent ? "Selected" : "Use Panel"}
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Battery Bank Sizing vs Water Tank Verdict */}
          <TabsContent value="batteries" className="space-y-4">
            <div
              className={`rounded-xl border p-4 ${
                advisor.batteryVsTankVerdict.preferWaterStorage
                  ? "border-primary/40 bg-primary/[0.06]"
                  : "border-border bg-muted/25"
              }`}
            >
              <div className="flex items-start gap-3">
                {advisor.batteryVsTankVerdict.preferWaterStorage ? (
                  <Waves className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <BatteryCharging className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                )}
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">
                    {advisor.batteryVsTankVerdict.headline}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {advisor.batteryVsTankVerdict.detail}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[780px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase text-foreground">
                    <th className="px-3 py-2.5">Battery Model &amp; Chemistry</th>
                    <th className="px-3 py-2.5">Min Units</th>
                    <th className="px-3 py-2.5">Recommended Bank</th>
                    <th className="px-3 py-2.5">Usable Energy ({advisor.topBatteryRecommendation.backupHoursAssumed}h Backup)</th>
                    <th className="px-3 py-2.5">Cycle Life &amp; Surge Check</th>
                    {onApplyBatteryChoice && <th className="px-3 py-2.5 text-right">Apply</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {advisor.batteryRecommendations.map((item) => (
                    <tr
                      key={item.battery.id}
                      className={
                        item.battery.id === advisor.topBatteryRecommendation.battery.id
                          ? "bg-primary/[0.05]"
                          : "hover:bg-muted/20"
                      }
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-foreground">{item.battery.name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {item.battery.chemistryLabel} ({item.battery.maxDodPct}% DoD)
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {item.recommendationTag}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">{item.battery.bestUseCase}</p>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-foreground">
                        {item.minimumUnitsCount} pcs
                        <div className="text-[10px] text-muted-foreground">
                          {item.unitsPerSeriesString}S × {item.minimumParallelStrings}P ({item.targetBusVoltageV}V)
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-extrabold text-primary">
                        {item.recommendedUnitsCount} pcs
                        <div className="text-[10px] font-normal text-muted-foreground">
                          {item.unitsPerSeriesString}S × {item.recommendedParallelStrings}P ({item.targetBusVoltageV}V DC)
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <strong>{item.installedUsableKwh} kWh usable</strong>
                        <div className="text-[10px] text-muted-foreground">
                          {item.installedNominalKwh} kWh total (Req: {item.requiredUsableKwh} kWh)
                        </div>
                      </td>
                      <td className="max-w-[230px] px-3 py-2.5 text-[11px]">
                        <div className="font-semibold text-foreground">
                          ~{item.battery.cycleLifeAtDod.toLocaleString()} cycles • Max {item.continuousKwCapacity} kW
                        </div>
                        {item.surgeWarning ? (
                          <div className="mt-0.5 text-destructive font-medium">{item.surgeWarning}</div>
                        ) : (
                          <div className="mt-0.5 text-primary inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Safe motor surge margin
                          </div>
                        )}
                      </td>
                      {onApplyBatteryChoice && (
                        <td className="px-3 py-2.5 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onApplyBatteryChoice(
                                item.battery.chemistry === "lifepo4" ? "lifepo4" : "tubular_gel",
                                item.backupHoursAssumed,
                              )
                            }
                            className="h-7 px-2.5 text-[11px]"
                          >
                            Enable Hybrid
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB 3: Complete Reference Pumps & MPPT Controllers Dataset */}
          <TabsContent value="dataset" className="space-y-5">
            {/* Compatible Controllers / Drives */}
            <div className="space-y-2.5">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <Cpu className="h-4 w-4 text-primary" />
                Recommended Solar Pump Controllers / VFDs for {result.recommendedMotorKw.toFixed(2)} kW ({result.nearestStandardHp} HP)
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {advisor.controllerRecommendations.map((ctrl) => (
                  <div key={ctrl.id} className="rounded-xl border border-border bg-muted/15 p-3.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-foreground">{ctrl.name}</span>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {ctrl.mpptMinV}–{ctrl.maxVocV} V
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-primary font-semibold">{ctrl.outputVoltageDesc}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{ctrl.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Searchable Complete Reference Pump Dataset */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Reference Pump Dataset ({PUMP_REFERENCE_DATASET.length} Standard Kenya Farm Pump Classes)
                </h3>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={datasetQuery}
                      onChange={(e) => setDatasetQuery(e.target.value)}
                      placeholder="Filter HP, borehole, booster..."
                      className="h-8 w-52 pl-8 text-xs"
                    />
                  </div>
                  <select
                    aria-label="Filter pump dataset category"
                    value={datasetCategory}
                    onChange={(e) => setDatasetCategory(e.target.value)}
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                  >
                    <option value="all">All Pump Types ({PUMP_REFERENCE_DATASET.length})</option>
                    <option value="solar_dc_submersible">Solar DC Submersible</option>
                    <option value="ac_hybrid_submersible">3-Phase AC + VFD Submersible</option>
                    <option value="solar_surface_booster">Solar Surface Booster</option>
                    <option value="ac_surface_centrifugal">Electric Multi-Stage Booster</option>
                    <option value="engine_high_pressure">High-Pressure Engine Pump</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {filteredRefPumps.map((pump) => {
                  const rankedMatch = advisor.referencePumpMatches.find((m) => m.pump.id === pump.id);
                  return (
                    <div
                      key={pump.id}
                      className={`flex flex-col justify-between rounded-xl border p-3.5 text-xs ${
                        rankedMatch?.canMeetDuty && rankedMatch.isWithinPor
                          ? "border-primary/45 bg-primary/[0.04]"
                          : "border-border bg-background"
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {pump.categoryLabel}
                          </Badge>
                          {rankedMatch ? (
                            <Badge
                              variant={rankedMatch.isWithinPor ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {rankedMatch.matchBadge}
                            </Badge>
                          ) : (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {pump.seriesCode}
                            </span>
                          )}
                        </div>
                        <h4 className="mt-1.5 font-bold text-foreground">{pump.name}</h4>
                        <p className="mt-1 text-[11px] text-muted-foreground">{pump.bestUseCase}</p>
                        <div className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-lg bg-muted/30 p-2 text-[11px]">
                          <div>
                            <span className="text-muted-foreground block">Power</span>
                            <strong>{pump.powerHp} HP / {pump.ratedKw} kW</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">BEP Duty</span>
                            <strong className="text-primary">{pump.bepFlowM3h} m³/h @ {pump.bepHeadM}m</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Max Ceiling</span>
                            <strong>{pump.maxFlowM3h} m³/h • {pump.maxHeadM}m</strong>
                          </div>
                        </div>
                      </div>

                      {onApplyReferencePump && (
                        <div className="mt-3 flex justify-end border-t border-border/60 pt-2.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onApplyReferencePump(pump)}
                            className="h-7 px-3 text-[11px] font-semibold"
                          >
                            Test on Live Q–H Curve &amp; Custom Check
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
