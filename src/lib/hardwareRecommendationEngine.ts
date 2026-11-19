import {
  BATTERY_BANK_DATASET,
  BatterySpec,
  CONTROLLER_DATASET,
  ControllerSpec,
  PUMP_REFERENCE_DATASET,
  PumpReferenceSpec,
  SOLAR_PANEL_DATASET,
  SolarPanelSpec,
} from "@/data/solarPumpBatteryDataset";
import {
  analyzePumpSystemCurves,
  PumpCurveAnalysis,
  PumpSolarInputs,
  PumpSolarResult,
} from "@/lib/pumpSolarSizing";

const clamp = (val: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, val));

export interface PanelOptionSizingResult {
  panel: SolarPanelSpec;
  isFitPossible: boolean;
  fitWarning: string | null;
  effectiveWattAtSiteW: number;
  hotVmpPerPanelV: number;
  coldVocPerPanelV: number;
  minSeriesForStart: number;
  maxSeriesBeforeOvervoltage: number;
  recommendedSeries: number;
  /** Minimum panels to meet controller start voltage + bright midday pumping */
  minimumPanels: number;
  minimumStringsLabel: string;
  minimumInstalledWp: number;
  /** Required panels to guarantee full daily volume in selected season & PSH */
  recommendedPanels: number;
  recommendedStringsLabel: string;
  recommendedInstalledWp: number;
  recommendedParallel: number;
  /** +20% heavy-overcast / multi-day cloud reserve */
  resiliencePanels: number;
  resilienceInstalledWp: number;
  /** Extra panels if charging a hybrid battery bank */
  extraPanelsForBattery: number;
  stringHotVmpV: number;
  stringColdVocV: number;
  estimatedRoofAreaM2: number;
  score: number;
  recommendationTag: string;
}

export interface BatteryOptionSizingResult {
  battery: BatterySpec;
  targetBusVoltageV: number;
  backupHoursAssumed: number;
  requiredUsableKwh: number;
  unitsPerSeriesString: number;
  minimumParallelStrings: number;
  minimumUnitsCount: number;
  recommendedParallelStrings: number;
  recommendedUnitsCount: number;
  installedNominalKwh: number;
  installedUsableKwh: number;
  continuousKwCapacity: number;
  canHandlePumpSurge: boolean;
  surgeWarning: string | null;
  score: number;
  recommendationTag: string;
}

export interface ReferencePumpMatchResult {
  pump: PumpReferenceSpec;
  curve: PumpCurveAnalysis;
  canMeetDuty: boolean;
  isWithinPor: boolean;
  casingOk: boolean;
  score: number;
  matchBadge: string;
  summary: string;
}

export interface CompleteHardwareAdvisorOutput {
  panelRecommendations: PanelOptionSizingResult[];
  topPanelRecommendation: PanelOptionSizingResult;
  batteryRecommendations: BatteryOptionSizingResult[];
  topBatteryRecommendation: BatteryOptionSizingResult;
  controllerRecommendations: ControllerSpec[];
  referencePumpMatches: ReferencePumpMatchResult[];
  batteryVsTankVerdict: {
    preferWaterStorage: boolean;
    headline: string;
    detail: string;
    tankSizeLitres: number;
  };
  summaryBullets: string[];
}

function parseDimAreaM2(dimensionsMm: string): number {
  const m = dimensionsMm.match(/(\d+)\s*x\s*(\d+)/i);
  if (!m) return 2.2;
  return (Number(m[1]) / 1000) * (Number(m[2]) / 1000);
}

export function evaluateSolarPanelOption(
  panel: SolarPanelSpec,
  inputs: PumpSolarInputs,
  result: PumpSolarResult,
): PanelOptionSizingResult {
  const cellTempC = Math.max(25, result.estimatedDayCellTempC || 48);
  const hotDelta = Math.max(0, cellTempC - 25);
  const coldDelta = Math.max(0, 25 - clamp(inputs.minMorningTempC, -5, 30));

  const tempPmaxCoeff = Math.abs(panel.tempCoeffPmaxPct) / 100;
  const tempVocCoeff = Math.abs(panel.tempCoeffVocPct) / 100;

  const pmaxTempFactor = Math.max(0.68, 1 - tempPmaxCoeff * hotDelta);
  const hotVmpFactor = Math.max(0.74, 1 - tempVocCoeff * hotDelta);
  const coldVocFactor = 1 + tempVocCoeff * coldDelta;

  const dustFactor = Math.max(0.75, 1 - clamp(inputs.dustMismatchLossPct, 0, 25) / 100);
  const ctrlFactor = Math.max(0.85, clamp(inputs.controllerEfficiencyPct, 85, 99) / 100);
  const bifacialBonus = 1 + (panel.bifacialGainPct || 0) / 100;

  // Actual DC wattage delivered per module onto farm DC bus under design day heat & soiling
  const effectiveWattAtSiteW = panel.pmaxW * pmaxTempFactor * dustFactor * ctrlFactor * bifacialBonus;
  const hotVmpPerPanelV = panel.vmpV * hotVmpFactor;
  const coldVocPerPanelV = panel.vocV * coldVocFactor;

  const ctrlMinV = clamp(inputs.controllerMinVmpV, 24, 600);
  const ctrlMaxVoc = clamp(inputs.controllerMaxVocV, 45, 1000);

  const minSeriesForStart = Math.max(1, Math.ceil(ctrlMinV / Math.max(10, hotVmpPerPanelV)));
  const maxSeriesBeforeOvervoltage = Math.floor(ctrlMaxVoc / Math.max(12, coldVocPerPanelV));

  const isFitPossible =
    maxSeriesBeforeOvervoltage >= minSeriesForStart && maxSeriesBeforeOvervoltage >= 1;

  // Choose ideal series inside [minSeriesForStart, maxSeriesBeforeOvervoltage]
  const targetMidV = (ctrlMinV + ctrlMaxVoc * 0.72) / 2;
  const recommendedSeries = isFitPossible
    ? Math.max(
        minSeriesForStart,
        Math.min(maxSeriesBeforeOvervoltage, Math.round(targetMidV / panel.vmpV)),
      )
    : Math.max(1, minSeriesForStart);

  // Required daily wattage from pump load (using panel's true thermal coeff rather than generic preset)
  const dailyEnergyKwh = Math.max(0.2, result.dailyEnergyKwh);
  const psh = Math.max(2.5, inputs.peakSunHours);
  const reqPeakPowerW = result.electricalInputPowerW;
  const reqDailyEnergyW = (dailyEnergyKwh * 1000) / psh;
  const targetDesignSiteWatts = Math.max(reqPeakPowerW, reqDailyEnergyW);

  // Minimum bright-noon wattage (~85% of electrical load at 1000 W/m2 STC with just hot-cell + 5% loss)
  const noonSitePanelW = panel.pmaxW * pmaxTempFactor * 0.94 * bifacialBonus;
  const rawMinNoonCount = Math.max(
    minSeriesForStart,
    Math.ceil(reqPeakPowerW / Math.max(50, noonSitePanelW)),
  );
  const minParallel = Math.max(1, Math.ceil(rawMinNoonCount / Math.max(1, minSeriesForStart)));
  const minimumPanels = minSeriesForStart * minParallel;

  // Recommended required count in full valid series x parallel topology
  const rawRecCount = Math.max(
    recommendedSeries,
    Math.ceil(targetDesignSiteWatts / Math.max(50, effectiveWattAtSiteW)),
  );
  const recommendedParallel = Math.max(1, Math.ceil(rawRecCount / Math.max(1, recommendedSeries)));
  const recommendedPanels = recommendedSeries * recommendedParallel;

  // Battery recharging overhead (when hybrid + battery backup hours active)
  let extraPanelsForBattery = 0;
  if (inputs.powerMode === "solar_hybrid" && result.batteryRequiredKwh > 0) {
    const batteryDailyKwh = (result.electricalInputPowerKw * inputs.batteryBackupHours) / 0.85;
    const extraSiteW = (batteryDailyKwh * 1000) / psh;
    extraPanelsForBattery = Math.max(
      0,
      Math.ceil(extraSiteW / Math.max(50, effectiveWattAtSiteW)),
    );
  }

  // +20% heavy cloud / highland monsoon buffer
  const rawResilienceCount = Math.ceil(recommendedPanels * 1.2);
  const resilienceParallel = Math.max(
    recommendedParallel,
    Math.ceil(rawResilienceCount / Math.max(1, recommendedSeries)),
  );
  const resiliencePanels = recommendedSeries * resilienceParallel;

  const stringHotVmpV = recommendedSeries * hotVmpPerPanelV;
  const stringColdVocV = recommendedSeries * coldVocPerPanelV;
  const areaPerPanel = parseDimAreaM2(panel.dimensionsMm);

  let fitWarning: string | null = null;
  if (!isFitPossible) {
    fitWarning = `Cannot fit safely in series: ${minSeriesForStart} panels needed for ${ctrlMinV}V start exceeds controller ${ctrlMaxVoc}V max Voc limit.`;
  } else if (panel.impA >= 16 && recommendedParallel === 1 && inputs.controllerMaxVocV <= 250) {
    fitWarning = "High-current (~17A+) large-format module; confirm MPPT DC input terminal amp rating.";
  }

  // Suitability ranking for user's exact farm power & ambient conditions
  let score = 50;
  if (!isFitPossible) score -= 45;
  if (inputs.ambientDayTempC >= 29 && (panel.technology === "topcon_n" || panel.technology === "bifacial")) {
    score += 20;
  }
  if (result.recommendedMotorKw >= 3.0 && panel.pmaxW >= 550) score += 18;
  if (result.recommendedMotorKw <= 1.1 && panel.pmaxW >= 410 && panel.pmaxW <= 550) score += 16;
  if (result.recommendedMotorKw <= 0.45 && panel.pmaxW <= 455) score += 14;
  if (panel.id === "pv-550w-mono") score += 15; // East Africa standard availability boost
  if (panel.id === "pv-340w-poly") score -= 18;
  if (panel.id === "pv-200w-mono" && result.recommendedMotorKw > 0.75) score -= 22;

  const recommendationTag =
    panel.id === "pv-550w-mono"
      ? "Best All-Round Value"
      : panel.technology === "topcon_n" || panel.id === "pv-605w-bifacial"
        ? inputs.ambientDayTempC >= 29
          ? "Best for Hot Climate"
          : "Cloud & High-Eff Choice"
        : panel.pmaxW >= 660
          ? "Commercial Array Saver"
          : panel.recommendedTier === "compact_dc"
            ? "Compact Small-Pump Fit"
            : "Legacy / Budget Only";

  return {
    panel,
    isFitPossible,
    fitWarning,
    effectiveWattAtSiteW: Number(effectiveWattAtSiteW.toFixed(0)),
    hotVmpPerPanelV: Number(hotVmpPerPanelV.toFixed(1)),
    coldVocPerPanelV: Number(coldVocPerPanelV.toFixed(1)),
    minSeriesForStart,
    maxSeriesBeforeOvervoltage,
    recommendedSeries,
    minimumPanels,
    minimumStringsLabel: `${minSeriesForStart}S × ${minParallel}P`,
    minimumInstalledWp: minimumPanels * panel.pmaxW,
    recommendedPanels,
    recommendedStringsLabel: `${recommendedSeries}S × ${recommendedParallel}P`,
    recommendedInstalledWp: recommendedPanels * panel.pmaxW,
    recommendedParallel,
    resiliencePanels,
    resilienceInstalledWp: resiliencePanels * panel.pmaxW,
    extraPanelsForBattery,
    stringHotVmpV: Number(stringHotVmpV.toFixed(0)),
    stringColdVocV: Number(stringColdVocV.toFixed(0)),
    estimatedRoofAreaM2: Number((recommendedPanels * areaPerPanel).toFixed(1)),
    score,
    recommendationTag,
  };
}

export function evaluateBatteryOption(
  battery: BatterySpec,
  inputs: PumpSolarInputs,
  result: PumpSolarResult,
): BatteryOptionSizingResult {
  const backupHoursAssumed =
    inputs.powerMode === "solar_hybrid" && inputs.batteryBackupHours > 0
      ? inputs.batteryBackupHours
      : 3;

  const targetBusVoltageV = result.recommendedMotorKw <= 0.75 ? 24 : 48;
  // Series count to form DC bus (allow 25.6V/51.2V native packs cleanly)
  const unitsPerSeriesString =
    battery.nominalVoltageV >= 48
      ? 1
      : battery.nominalVoltageV >= 24
        ? targetBusVoltageV === 24
          ? 1
          : 2
        : Math.max(1, Math.round(targetBusVoltageV / battery.nominalVoltageV));

  const stringUsableKwh = unitsPerSeriesString * battery.usableEnergyKwh;
  const stringNominalKwh = unitsPerSeriesString * battery.nominalEnergyKwh;

  // Accounting for inverter efficiency (~90%) + cable drop (~3%)
  const requiredUsableKwh = (result.electricalInputPowerKw * backupHoursAssumed) / 0.87;

  const minimumParallelStrings = Math.max(
    1,
    Math.ceil(requiredUsableKwh / Math.max(0.2, stringUsableKwh)),
  );
  const minimumUnitsCount = minimumParallelStrings * unitsPerSeriesString;

  // Check peak C-rate / surge draw capacity (hybrid inverter VFD draws ~1.35x; DOL ~2.5x)
  const peakSurgeKw = result.recommendedMotorKw * (inputs.usesVfdSoftStart ? 1.35 : 2.2);
  const minParallelForSurge = Math.max(
    1,
    Math.ceil(peakSurgeKw / Math.max(0.3, unitsPerSeriesString * battery.maxContinuousDischargeKw)),
  );

  const recommendedParallelStrings = Math.max(
    minimumParallelStrings,
    minParallelForSurge,
    Math.ceil((requiredUsableKwh * 1.15) / Math.max(0.2, stringUsableKwh)),
  );
  const recommendedUnitsCount = recommendedParallelStrings * unitsPerSeriesString;
  const installedNominalKwh = Number((recommendedParallelStrings * stringNominalKwh).toFixed(2));
  const installedUsableKwh = Number((recommendedParallelStrings * stringUsableKwh).toFixed(2));
  const continuousKwCapacity = Number(
    (recommendedParallelStrings * unitsPerSeriesString * battery.maxContinuousDischargeKw).toFixed(1),
  );

  const canHandlePumpSurge = continuousKwCapacity >= peakSurgeKw * 0.95;
  const surgeWarning = !canHandlePumpSurge
    ? `Pump peak surge (${peakSurgeKw.toFixed(1)} kW) approaches bank discharge ceiling (${continuousKwCapacity} kW). Upsize parallel strings or fit a soft-start VFD.`
    : null;

  let score = 50;
  if (battery.chemistry === "lifepo4") score += 28;
  if (battery.chemistry === "opzs") score += 14;
  if (battery.chemistry === "tubular_flooded") score += 8;
  if (battery.chemistry === "gel_agm" && result.recommendedMotorKw >= 1.5) score -= 22;
  if (targetBusVoltageV === 48 && battery.nominalVoltageV >= 48) score += 12;
  if (targetBusVoltageV === 24 && battery.nominalVoltageV >= 24 && battery.nominalVoltageV < 48) score += 12;
  if (recommendedUnitsCount > 16) score -= 12;

  const recommendationTag =
    battery.chemistry === "lifepo4"
      ? battery.id === "bat-lifepo4-51v-100ah" && targetBusVoltageV === 48
        ? "Best Overall (6,000 Cycles)"
        : "Long-Life Lithium Choice"
      : battery.chemistry === "tubular_flooded"
        ? "Rugged Rural Budget"
        : battery.chemistry === "opzs"
          ? "Industrial Borehole Bank"
          : "Valves / Light Backup Only";

  return {
    battery,
    targetBusVoltageV,
    backupHoursAssumed,
    requiredUsableKwh: Number(requiredUsableKwh.toFixed(2)),
    unitsPerSeriesString,
    minimumParallelStrings,
    minimumUnitsCount,
    recommendedParallelStrings,
    recommendedUnitsCount,
    installedNominalKwh,
    installedUsableKwh,
    continuousKwCapacity,
    canHandlePumpSurge,
    surgeWarning,
    score,
    recommendationTag,
  };
}

export function recommendHardwareForDesign(
  inputs: PumpSolarInputs,
  result: PumpSolarResult,
): CompleteHardwareAdvisorOutput {
  const panelRecommendations = SOLAR_PANEL_DATASET.map((panel) =>
    evaluateSolarPanelOption(panel, inputs, result),
  ).sort((a, b) => b.score - a.score);

  const topPanelRecommendation = panelRecommendations[0];

  const batteryRecommendations = BATTERY_BANK_DATASET.map((battery) =>
    evaluateBatteryOption(battery, inputs, result),
  ).sort((a, b) => b.score - a.score);

  const topBatteryRecommendation = batteryRecommendations[0];

  // Filter compatible Controllers / VFDs
  const kw = Math.max(0.25, result.recommendedMotorKw);
  const controllerRecommendations = CONTROLLER_DATASET.filter((ctrl) => {
    if (inputs.powerMode === "solar_hybrid" && inputs.batteryBackupHours > 0) {
      return ctrl.kind === "hybrid_battery_inverter" || (kw >= ctrl.ratedKwMin && kw <= ctrl.ratedKwMax * 1.15);
    }
    if (ctrl.kind === "hybrid_battery_inverter") return false;
    return kw >= ctrl.ratedKwMin * 0.7 && kw <= ctrl.ratedKwMax * 1.15;
  });

  // Match & Q-H Curve Audit Reference Pump Families
  const desiredCasing =
    inputs.boreholeCasingInch === "any" ? 6 : Number(inputs.boreholeCasingInch) || 4;

  const referencePumpMatches: ReferencePumpMatchResult[] = PUMP_REFERENCE_DATASET.map((pump) => {
    const casingOk =
      inputs.sourceType !== "borehole"
        ? pump.minCasingInch === 0
        : pump.minCasingInch > 0 && pump.minCasingInch <= desiredCasing;

    const supplyCompatible =
      inputs.powerMode === "ac_grid_generator"
        ? pump.powerSupply !== "solar_dc"
        : pump.powerSupply !== "engine";

    const curve = analyzePumpSystemCurves(result, {
      mode: "datasheet_3point",
      label: pump.name,
      maxFlowM3h: pump.maxFlowM3h,
      maxHeadM: pump.maxHeadM,
      bepFlowM3h: pump.bepFlowM3h,
      bepHeadM: pump.bepHeadM,
      runoutFlowM3h: pump.runoutFlowM3h,
      runoutHeadM: pump.runoutHeadM,
      vfdFreqHz: 42,
      ratedFreqHz: 50,
    });

    const isWithinPor = curve.porVerdict === "optimal_por";
    const flowCoverage = curve.operatingPoint.flowM3h / Math.max(0.2, result.designFlowM3h);
    const canMeetDuty = curve.operatingPoint.canOperate && flowCoverage >= 0.75;

    let score = 40;
    if (!casingOk) score -= 50;
    if (!supplyCompatible) score -= 35;
    if (!curve.operatingPoint.canOperate) score -= 60;
    if (isWithinPor) score += 30;
    if (flowCoverage >= 0.9 && flowCoverage <= 1.25) score += 25;
    else if (flowCoverage >= 0.75 && flowCoverage < 0.9) score += 10;
    else if (flowCoverage < 0.75) score -= 25;

    const matchBadge = !casingOk
      ? `Won't Fit ${desiredCasing}" Casing`
      : !curve.operatingPoint.canOperate
        ? "Shutoff Below TDH"
        : isWithinPor && flowCoverage >= 0.9
          ? `Best Curve Fit (${curve.operatingPctOfBep}% BEP)`
          : canMeetDuty
            ? `Workable (${curve.operatingPctOfBep}% BEP)`
            : "Flow Undersized";

    const summary = `Q-H Duty: ${curve.operatingPoint.flowM3h.toFixed(1)} m³/h @ ${curve.operatingPoint.headM.toFixed(
      0,
    )} m (${curve.operatingPctOfBep}% of ${pump.bepFlowM3h} m³/h BEP) • Outlet ${pump.outletSize}.`;

    return {
      pump,
      curve,
      canMeetDuty,
      isWithinPor,
      casingOk,
      score,
      matchBadge,
      summary,
    };
  })
    .filter((m) => m.casingOk && m.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const preferWaterStorage = result.recommendedMotorKw >= 1.1;
  const tankSizeLitres = Math.max(10000, Math.round(result.recommendedTankLiters));

  const batteryVsTankVerdict = preferWaterStorage
    ? {
        preferWaterStorage: true,
        headline: "Water Storage Tank / HDPE Pan Recommended Over Heavy Battery Bank",
        detail: `For a ${result.recommendedMotorKw.toFixed(1)} kW (${result.nearestStandardHp} HP) irrigation pump, storing water in a ${(
          tankSizeLitres / 1000
        ).toFixed(0)} m³ tank or lined water pan during sunlight hours costs 3x–5x less over 10 years than buying ${
          topBatteryRecommendation.recommendedUnitsCount
        }x ${topBatteryRecommendation.battery.chemistryLabel} batteries (${topBatteryRecommendation.installedNominalKwh} kWh). Only add batteries if continuous night-time pressurized misting is mandatory.`,
        tankSizeLitres,
      }
    : {
        preferWaterStorage: false,
        headline: "Compact LiFePO4 Battery Backup Viable for Small DC Loads",
        detail: `At ${result.recommendedMotorKw.toFixed(2)} kW, either a elevated ${Math.round(
          tankSizeLitres / 1000,
        )} m³ storage tank OR ${topBatteryRecommendation.recommendedUnitsCount}x ${
          topBatteryRecommendation.battery.name
        } gives practical dawn/evening irrigation flexibility.`,
        tankSizeLitres,
      };

  const summaryBullets = [
    `Minimum Panels (Clear Noon Start): ${topPanelRecommendation.minimumPanels} × ${topPanelRecommendation.panel.pmaxW}W (${topPanelRecommendation.minimumStringsLabel} = ${topPanelRecommendation.minimumInstalledWp.toLocaleString()} Wp) — meets ${inputs.controllerMinVmpV}V controller cut-in only in bright midday sun.`,
    `Required Design Panels (Recommended): ${topPanelRecommendation.recommendedPanels} × ${topPanelRecommendation.panel.pmaxW}W ${topPanelRecommendation.panel.technologyLabel} (${topPanelRecommendation.recommendedStringsLabel} = ${topPanelRecommendation.recommendedInstalledWp.toLocaleString()} Wp) — sustains daily m³ through ${inputs.peakSunHours} PSH weather + ${topPanelRecommendation.extraPanelsForBattery > 0 ? `+${topPanelRecommendation.extraPanelsForBattery} panels if charging battery` : "no battery draw"}.`,
    `Battery Option (When Night/Cloud Autonomy Needed): ${topBatteryRecommendation.recommendedUnitsCount} × ${topBatteryRecommendation.battery.name} (${topBatteryRecommendation.installedNominalKwh} kWh bank / ${topBatteryRecommendation.installedUsableKwh} kWh usable).`,
  ];

  return {
    panelRecommendations,
    topPanelRecommendation,
    batteryRecommendations,
    topBatteryRecommendation,
    controllerRecommendations,
    referencePumpMatches,
    batteryVsTankVerdict,
    summaryBullets,
  };
}
