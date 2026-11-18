/**
 * Complex Hydraulic Pump, Pipeline Friction & Solar PV Engineering Sizing Engine.
 *
 * Designed for Kenyan agricultural conditions (altitude-adjusted NPSH/suction limits,
 * regional Peak Sun Hours, Hazen-Williams multi-segment pipe losses with true PN10 inner
 * diameters, cold-morning PV Voc string safety checks, DC/AC cable voltage-drop sizing,
 * and live DripTech pump specification matching).
 */

export type DemandMode = "crop_area" | "emitter_block" | "direct_flow";
export type IrrigationMethod =
  | "drip"
  | "micro_sprinkler"
  | "overhead_sprinkler"
  | "rain_gun"
  | "tank_transfer";
export type AreaUnit = "acres" | "hectares" | "sqm";
export type FlowUnit = "m3h" | "lph" | "lpm";

export type WaterSourceType = "borehole" | "surface_suction" | "tank_booster";
export type PipeMaterial = "hdpe" | "upvc" | "gi_new" | "gi_old";
export type PowerSupplyMode = "solar_dc" | "solar_hybrid" | "ac_grid_generator";
export type BatteryChemistry = "lifepo4" | "tubular_lead_acid";

export interface PipeSegmentInput {
  label: string;
  enabled: boolean;
  material: PipeMaterial;
  nominalOdMm: number;
  /** True internal diameter in mm (PN10/PN12.5 wall subtracted by default, editable for custom pipes). */
  innerDiameterMm: number;
  lengthM: number;
}

export interface CustomPumpInput {
  enabled: boolean;
  name: string;
  powerType: "solar_dc" | "ac_1phase" | "ac_3phase" | "engine";
  maxFlowM3h: number;
  maxHeadM: number;
  ratedPowerW: number;
  ratedOperatingVoltageV: number;
  controllerMaxVocV: number;
}

export interface PumpSolarInputs {
  // 1. Water Demand Inputs
  demandMode: DemandMode;
  areaValue: number;
  areaUnit: AreaUnit;
  cropWaterDepthMm: number;
  irrigationMethod: IrrigationMethod;
  applicationEfficiencyPct: number;
  zonesCount: number;
  simultaneousZones: number;
  operatingHoursPerDay: number;

  // Emitter / Sprinkler block mode
  emitterCount: number;
  emitterFlowRate: number;
  emitterFlowUnit: "lph" | "m3h";

  // Direct flow mode
  directFlowValue: number;
  directFlowUnit: FlowUnit;

  // 2. Water Source & Hydraulic Head Inputs
  sourceType: WaterSourceType;
  siteAltitudeM: number;
  /** Borehole depth from ground to static water table (m), or river/dam suction lift (m). */
  staticWaterDepthM: number;
  /** Seasonal/pumping drawdown in borehole (m). */
  drawdownM: number;
  /** Positive = uphill from source to field high point; negative = downhill gravity assist. */
  groundElevationGainM: number;
  /** Elevated tank or sprinkler riser height above field ground (m). */
  dischargeHeightM: number;
  /** Required pressure at field / emitter / gun (bar). 1 bar = 10.197 m. */
  workingPressureBar: number;
  /** Head loss across disc/sand filters, check valves & venturi injectors (m). */
  filtrationValveLossM: number;
  /** Local minor fitting loss allowance (% of total pipe friction). */
  fittingsLossPct: number;

  // Multi-segment pipe runs
  suctionPipe: PipeSegmentInput;
  primaryPipe: PipeSegmentInput;
  secondaryPipe: PipeSegmentInput;

  // 3. Pump & Motor Efficiency Inputs
  pumpEfficiencyPct: number;
  motorEfficiencyPct: number;
  hydraulicSafetyFactor: number;

  // 4. Solar PV, Cable & Storage Inputs
  powerMode: PowerSupplyMode;
  solarRegionId: string;
  peakSunHours: number;
  minMorningTempC: number;
  pvTempDeratePct: number;
  dustMismatchLossPct: number;
  controllerEfficiencyPct: number;
  panelWatts: number;
  panelVmp: number;
  panelVoc: number;
  controllerMinVmpV: number;
  controllerMaxVocV: number;
  cableLengthM: number;
  maxVoltageDropPct: number;

  // Hybrid / Battery & Tariff inputs
  batteryBackupHours: number;
  batteryChemistry: BatteryChemistry;
  electricityTariffKesKwh: number;
  usesVfdSoftStart: boolean;

  // Storage Tank Sizing
  storageAutonomyDays: number;

  // Custom / Existing Pump Curve Analyzer
  customPump: CustomPumpInput;
}

export interface KenyaSolarRegionPreset {
  id: string;
  label: string;
  psh: number;
  minMorningTempC: number;
  altitudeM: number;
  note: string;
}

export const KENYA_SOLAR_REGIONS: KenyaSolarRegionPreset[] = [
  {
    id: "nairobi_central",
    label: "Nairobi, Kiambu, Thika & Murang'a",
    psh: 5.2,
    minMorningTempC: 9,
    altitudeM: 1650,
    note: "Moderate highland irradiation; morning chill increases open-circuit Voc.",
  },
  {
    id: "rift_nakuru_naivasha",
    label: "Nakuru, Naivasha & Narok",
    psh: 5.7,
    minMorningTempC: 8,
    altitudeM: 1850,
    note: "High altitude cuts surface suction limit to ~5.7 m practical lift.",
  },
  {
    id: "mt_kenya_nyeri_nanyuki",
    label: "Nanyuki, Nyeri & Meru Highlands",
    psh: 5.5,
    minMorningTempC: 5,
    altitudeM: 1950,
    note: "Cold 5°C mornings create +6% PV Voc spike; size controller headroom carefully.",
  },
  {
    id: "eastern_machakos_kitui",
    label: "Machakos, Makueni, Kitui & Kibwezi",
    psh: 5.9,
    minMorningTempC: 14,
    altitudeM: 1100,
    note: "Strong semi-arid solar yield ideal for direct-drive borehole pumping.",
  },
  {
    id: "northern_turkana_garissa",
    label: "Garissa, Isiolo, Turkana & Samburu",
    psh: 6.4,
    minMorningTempC: 18,
    altitudeM: 450,
    note: "High daytime heat (38°C+); include 13–15% PV thermal + dust derating.",
  },
  {
    id: "western_kisumu_eldoret",
    label: "Kisumu, Bungoma, Kakamega & Eldoret",
    psh: 5.4,
    minMorningTempC: 12,
    altitudeM: 1400,
    note: "Afternoon cloud buildup favors slight PV oversizing or tank buffer.",
  },
  {
    id: "coast_mombasa_kilifi",
    label: "Mombasa, Kilifi, Kwale & Tana River",
    psh: 5.6,
    minMorningTempC: 20,
    altitudeM: 30,
    note: "Sea-level air allows full atmospheric suction; prioritize salt-resistant stainless.",
  },
];

export interface CropPreset {
  id: string;
  label: string;
  waterDepthMm: number;
  defaultMethod: IrrigationMethod;
  note: string;
}

export const KENYA_CROP_PRESETS: CropPreset[] = [
  {
    id: "tomato_onion_capsicum",
    label: "Tomatoes, Onions & Capsicum",
    waterDepthMm: 5.5,
    defaultMethod: "drip",
    note: "Peak flowering/bulbing ETc demand (~5.5 mm/day under open-field drip).",
  },
  {
    id: "greenhouse_intensive",
    label: "Greenhouse Tomato / Strawberry / Herbs",
    waterDepthMm: 6.0,
    defaultMethod: "drip",
    note: "High transpiration inside poly-tunnels; pulse fertigation daily.",
  },
  {
    id: "french_beans_horticulture",
    label: "French Beans, Cabbage & Kales",
    waterDepthMm: 5.0,
    defaultMethod: "drip",
    note: "Consistent root-zone moisture prevents flower abortion.",
  },
  {
    id: "avocado_citrus_mango",
    label: "Hass Avocado, Pixie & Mango Orchards",
    waterDepthMm: 4.5,
    defaultMethod: "drip",
    note: "Button drippers or micro-sprinklers around tree canopy drip-line.",
  },
  {
    id: "pasture_maize_overhead",
    label: "Napier, Maize & Fodder (Sprinkler / Rain Gun)",
    waterDepthMm: 6.5,
    defaultMethod: "overhead_sprinkler",
    note: "Broad-acre wetting accounts for wind & evaporation loss.",
  },
  {
    id: "tank_fill_transfer",
    label: "Bulk Tank / Reservoir Water Transfer",
    waterDepthMm: 4.0,
    defaultMethod: "tank_transfer",
    note: "Low discharge pressure (0.2 bar) feeding elevated storage tanks.",
  },
];

export interface PipePreset {
  nominalOdMm: number;
  label: string;
  defaultIdByMaterial: Record<PipeMaterial, number>;
}

/** Standard Kenyan OD sizes paired with realistic PN10/BS inner bores (mm). */
export const KENYA_PIPE_PRESETS: PipePreset[] = [
  { nominalOdMm: 25, label: "25 mm (3/4\")", defaultIdByMaterial: { hdpe: 21.0, upvc: 21.6, gi_new: 21.0, gi_old: 20.5 } },
  { nominalOdMm: 32, label: "32 mm (1\")", defaultIdByMaterial: { hdpe: 27.2, upvc: 28.0, gi_new: 27.2, gi_old: 26.5 } },
  { nominalOdMm: 40, label: "40 mm (1.25\")", defaultIdByMaterial: { hdpe: 34.0, upvc: 35.2, gi_new: 35.9, gi_old: 34.8 } },
  { nominalOdMm: 50, label: "50 mm (1.5\")", defaultIdByMaterial: { hdpe: 42.6, upvc: 44.2, gi_new: 41.8, gi_old: 40.5 } },
  { nominalOdMm: 63, label: "63 mm (2\")", defaultIdByMaterial: { hdpe: 53.6, upvc: 55.8, gi_new: 53.0, gi_old: 51.5 } },
  { nominalOdMm: 75, label: "75 mm (2.5\")", defaultIdByMaterial: { hdpe: 63.8, upvc: 66.4, gi_new: 68.8, gi_old: 67.0 } },
  { nominalOdMm: 90, label: "90 mm (3\")", defaultIdByMaterial: { hdpe: 76.6, upvc: 79.8, gi_new: 80.8, gi_old: 79.0 } },
  { nominalOdMm: 110, label: "110 mm (4\")", defaultIdByMaterial: { hdpe: 93.8, upvc: 97.6, gi_new: 105.0, gi_old: 102.0 } },
  { nominalOdMm: 160, label: "160 mm (6\")", defaultIdByMaterial: { hdpe: 136.2, upvc: 141.8, gi_new: 155.0, gi_old: 150.0 } },
];

export const PIPE_MATERIAL_META: Record<
  PipeMaterial,
  { label: string; hazenC: number; note: string }
> = {
  hdpe: { label: "HDPE (PN10 / PE100)", hazenC: 140, note: "Flexible coiled/butt-fused borehole & mainline pipe (C = 140)." },
  upvc: { label: "uPVC Pressure Pipe", hazenC: 145, note: "Smooth-bore rigid buried mainline pipe (C = 145)." },
  gi_new: { label: "New GI Galvanized Steel", hazenC: 120, note: "Rigid threaded borehole riser pipe (C = 120)." },
  gi_old: { label: "Aged / Scaled Steel Pipe", hazenC: 100, note: "Roughness penalty for older mineralized GI risers (C = 100)." },
};

export interface SolarModulePreset {
  id: string;
  label: string;
  watts: number;
  vmp: number;
  voc: number;
}

export const SOLAR_PANEL_PRESETS: SolarModulePreset[] = [
  { id: "330w", label: "330 W Mono/Poly (72-cell)", watts: 330, vmp: 37.2, voc: 45.2 },
  { id: "450w", label: "450 W Mono PERC", watts: 450, vmp: 41.2, voc: 49.5 },
  { id: "550w", label: "550 W Mono Half-Cut", watts: 550, vmp: 41.8, voc: 49.8 },
  { id: "600w", label: "600 W N-Type TOPCon", watts: 600, vmp: 44.5, voc: 53.0 },
];

export const METHOD_DEFAULTS: Record<
  IrrigationMethod,
  { label: string; efficiencyPct: number; defaultPressureBar: number }
> = {
  drip: { label: "Drip Lines / Button Drippers", efficiencyPct: 90, defaultPressureBar: 1.0 },
  micro_sprinkler: { label: "Micro-Sprinklers / Orchard Jets", efficiencyPct: 82, defaultPressureBar: 2.0 },
  overhead_sprinkler: { label: "Impact Sprinklers", efficiencyPct: 75, defaultPressureBar: 3.0 },
  rain_gun: { label: "Rain Gun Traveler / Stand", efficiencyPct: 70, defaultPressureBar: 4.5 },
  tank_transfer: { label: "Storage Tank Transfer (Open Pipe)", efficiencyPct: 95, defaultPressureBar: 0.2 },
};

export const DEFAULT_PUMP_SOLAR_INPUTS: PumpSolarInputs = {
  demandMode: "crop_area",
  areaValue: 2,
  areaUnit: "acres",
  cropWaterDepthMm: 5.5,
  irrigationMethod: "drip",
  applicationEfficiencyPct: 90,
  zonesCount: 4,
  simultaneousZones: 1,
  operatingHoursPerDay: 5.5,

  emitterCount: 2500,
  emitterFlowRate: 2.0,
  emitterFlowUnit: "lph",

  directFlowValue: 5.0,
  directFlowUnit: "m3h",

  sourceType: "borehole",
  siteAltitudeM: 1650,
  staticWaterDepthM: 55,
  drawdownM: 10,
  groundElevationGainM: 8,
  dischargeHeightM: 2,
  workingPressureBar: 1.0,
  filtrationValveLossM: 3.5,
  fittingsLossPct: 10,

  suctionPipe: {
    label: "Suction Line (River / Dam to Pump)",
    enabled: false,
    material: "hdpe",
    nominalOdMm: 63,
    innerDiameterMm: 53.6,
    lengthM: 12,
  },
  primaryPipe: {
    label: "Borehole Riser / Pump Outlet Section",
    enabled: true,
    material: "hdpe",
    nominalOdMm: 50,
    innerDiameterMm: 42.6,
    lengthM: 75,
  },
  secondaryPipe: {
    label: "Mainline Delivery Pipe (Pump to Field / Tank)",
    enabled: true,
    material: "hdpe",
    nominalOdMm: 63,
    innerDiameterMm: 53.6,
    lengthM: 250,
  },

  pumpEfficiencyPct: 58,
  motorEfficiencyPct: 84,
  hydraulicSafetyFactor: 1.15,

  powerMode: "solar_dc",
  solarRegionId: "nairobi_central",
  peakSunHours: 5.2,
  minMorningTempC: 9,
  pvTempDeratePct: 10,
  dustMismatchLossPct: 8,
  controllerEfficiencyPct: 95,
  panelWatts: 550,
  panelVmp: 41.8,
  panelVoc: 49.8,
  controllerMinVmpV: 70,
  controllerMaxVocV: 200,
  cableLengthM: 90,
  maxVoltageDropPct: 3.0,

  batteryBackupHours: 3,
  batteryChemistry: "lifepo4",
  electricityTariffKesKwh: 28,
  usesVfdSoftStart: true,

  storageAutonomyDays: 1.0,

  customPump: {
    enabled: false,
    name: "Existing / Custom Pump",
    powerType: "solar_dc",
    maxFlowM3h: 6.5,
    maxHeadM: 140,
    ratedPowerW: 1500,
    ratedOperatingVoltageV: 110,
    controllerMaxVocV: 200,
  },
};

export interface PipeSegmentResult {
  label: string;
  enabled: boolean;
  material: PipeMaterial;
  hazenC: number;
  nominalOdMm: number;
  innerDiameterMm: number;
  lengthM: number;
  velocityMs: number;
  frictionLossM: number;
  headLossPer100m: number;
  status: "optimal" | "caution" | "critical";
  recommendedUpgradedOdMm: number | null;
  upgradedFrictionLossM: number | null;
  statusMessage: string;
}

export interface CustomPumpEvaluation {
  enabled: boolean;
  canMeetTDH: boolean;
  headroomPct: number;
  estimatedFlowAtTDHM3h: number;
  flowDeficitM3h: number;
  verdict: "optimal" | "workable" | "undersized";
  summary: string;
}

export interface PumpSolarResult {
  // Demand summary
  areaSqm: number;
  dailyNetVolumeM3: number;
  dailyGrossVolumeM3: number;
  activeAreaShareRatio: number;
  designFlowM3h: number;
  designFlowLpm: number;
  designFlowLph: number;
  designFlowLs: number;
  effectiveDailyPumpHours: number;
  hoursPerZoneCycle: number;

  // Hydraulic head breakdown
  staticWaterLiftM: number;
  drawdownM: number;
  elevationGainM: number;
  dischargeHeightM: number;
  workingPressureHeadM: number;
  filtrationValveLossM: number;
  suctionPipeResult: PipeSegmentResult;
  primaryPipeResult: PipeSegmentResult;
  secondaryPipeResult: PipeSegmentResult;
  totalPipeFrictionM: number;
  fittingsMinorLossM: number;
  totalDynamicHeadM: number;
  gravityAssistWarning: boolean;

  // Altitude & Cavitation / Suction Check
  maxPracticalSuctionLiftM: number;
  totalSuctionDutyM: number;
  suctionCavitationAlert: string | null;

  // Pump & Motor Power
  hydraulicPowerW: number;
  hydraulicPowerKw: number;
  shaftPowerKw: number;
  electricalInputPowerW: number;
  electricalInputPowerKw: number;
  wireToWaterEfficiencyPct: number;
  recommendedMotorKw: number;
  recommendedMotorHp: number;
  nearestStandardHp: number;
  dailyEnergyKwh: number;
  specificEnergyKwhPerM3: number;

  // Solar PV, String Layout & Electrical Cable Sizing
  overallSolarDeratingFactor: number;
  recommendedArrayWp: number;
  peakSolarDemandWp: number;
  energySolarDemandWp: number;
  solarPanelCount: number;
  panelsInSeries: number;
  parallelStrings: number;
  installedArrayWp: number;
  stringVmpV: number;
  stringColdVocV: number;
  stringHotVmpV: number;
  vocSafetyStatus: "ok" | "too_high" | "too_low";
  vocSafetyMessage: string;
  systemCurrentAmps: number;
  recommendedCableMm2: number;
  actualVoltageDropV: number;
  actualVoltageDropPct: number;

  // Hybrid / Battery / Grid / Generator
  batteryRequiredKwh: number;
  recommendedGeneratorKva: number;
  estimatedGridDailyCostKes: number;
  estimatedCostPerM3Kes: number;

  // Storage Tank Recommendation
  recommendedTankM3: number;
  recommendedTankLiters: number;

  // Custom pump curve check
  customPumpEval: CustomPumpEvaluation;

  // Engineering alerts & recommendations
  alerts: Array<{ severity: "info" | "warning" | "critical"; title: string; detail: string }>;
}

const STANDARD_KENYA_HP_RATINGS = [0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 5.5, 7.5, 10, 12.5, 15, 20, 25, 30];
const STANDARD_CABLE_MM2 = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];
const STANDARD_KENYA_TANKS_M3 = [2, 5, 10, 16, 20, 24, 30, 50, 75, 100, 150, 200, 300, 500];

const SQM_PER_ACRE = 4046.8564224;
const WATER_DENSITY_KG_M3 = 998;
const GRAVITY_MS2 = 9.80665;
const BAR_TO_METERS = 10.19716;
// Copper resistivity at ~45C field/submersible operating temperature (Ohm * mm2 / m)
const COPPER_RESISTIVITY_OHM_MM2_M = 0.019;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export const getInnerDiameterForPreset = (
  nominalOdMm: number,
  material: PipeMaterial,
): number => {
  const match = KENYA_PIPE_PRESETS.find((p) => p.nominalOdMm === nominalOdMm);
  if (match) return match.defaultIdByMaterial[material];
  return Math.max(10, Number((nominalOdMm * 0.85).toFixed(1)));
};

/**
 * Hazen-Williams pipe segment friction solver.
 * Used uniformly across suction, riser, and mainline segments.
 */
export function computePipeSegmentLoss(
  segment: PipeSegmentInput,
  flowM3h: number,
  isSuction: boolean,
): PipeSegmentResult {
  const hazenC = PIPE_MATERIAL_META[segment.material].hazenC;
  const safeIdMm = Math.max(8, segment.innerDiameterMm);
  const safeLenM = Math.max(0, segment.lengthM);

  if (!segment.enabled || safeLenM === 0 || flowM3h <= 0) {
    return {
      label: segment.label,
      enabled: segment.enabled,
      material: segment.material,
      hazenC,
      nominalOdMm: segment.nominalOdMm,
      innerDiameterMm: safeIdMm,
      lengthM: safeLenM,
      velocityMs: 0,
      frictionLossM: 0,
      headLossPer100m: 0,
      status: "optimal",
      recommendedUpgradedOdMm: null,
      upgradedFrictionLossM: null,
      statusMessage: segment.enabled ? "Zero flow or zero pipe length." : "Segment disabled.",
    };
  }

  const qM3s = flowM3h / 3600;
  const dM = safeIdMm / 1000;
  const areaM2 = Math.PI * (dM / 2) * (dM / 2);
  const velocityMs = qM3s / areaM2;

  const hfPerM =
    10.67 * Math.pow(qM3s, 1.852) * Math.pow(hazenC, -1.852) * Math.pow(dM, -4.8704);
  const frictionLossM = hfPerM * safeLenM;
  const headLossPer100m = hfPerM * 100;

  const cautionV = isSuction ? 1.15 : 1.8;
  const criticalV = isSuction ? 1.5 : 2.5;

  let status: "optimal" | "caution" | "critical" = "optimal";
  let statusMessage = `Healthy flow velocity (${velocityMs.toFixed(2)} m/s) and low friction.`;
  let recommendedUpgradedOdMm: number | null = null;
  let upgradedFrictionLossM: number | null = null;

  if (velocityMs > criticalV || headLossPer100m > 8) {
    status = "critical";
    statusMessage = isSuction
      ? `Suction velocity ${velocityMs.toFixed(2)} m/s is too high (>1.5 m/s) — high cavitation risk.`
      : `High velocity ${velocityMs.toFixed(2)} m/s causes heavy friction (${headLossPer100m.toFixed(1)} m/100m) and surge risk.`;
  } else if (velocityMs > cautionV || headLossPer100m > 4) {
    status = "caution";
    statusMessage = `Elevated friction (${headLossPer100m.toFixed(1)} m/100m); one pipe size larger saves pump power.`;
  }

  if (status !== "optimal") {
    const largerPreset = KENYA_PIPE_PRESETS.find((preset) => {
      const candidateIdM = preset.defaultIdByMaterial[segment.material] / 1000;
      const candVel = qM3s / (Math.PI * (candidateIdM / 2) * (candidateIdM / 2));
      return preset.nominalOdMm > segment.nominalOdMm && candVel <= cautionV;
    });
    if (largerPreset) {
      const nextDm = largerPreset.defaultIdByMaterial[segment.material] / 1000;
      recommendedUpgradedOdMm = largerPreset.nominalOdMm;
      upgradedFrictionLossM =
        10.67 * Math.pow(qM3s, 1.852) * Math.pow(hazenC, -1.852) * Math.pow(nextDm, -4.8704) * safeLenM;
    }
  }

  return {
    label: segment.label,
    enabled: true,
    material: segment.material,
    hazenC,
    nominalOdMm: segment.nominalOdMm,
    innerDiameterMm: safeIdMm,
    lengthM: safeLenM,
    velocityMs,
    frictionLossM,
    headLossPer100m,
    status,
    recommendedUpgradedOdMm,
    upgradedFrictionLossM,
    statusMessage,
  };
}

/**
 * Computes atmospheric suction cavitation threshold using barometric pressure decay with altitude.
 * Kenya farms at 1,500–2,200 m lose ~1.5–2.2 m of atmospheric suction lift compared to sea level.
 */
export function computeMaxPracticalSuctionLift(altitudeM: number): number {
  const clampedAlt = clamp(altitudeM, 0, 4500);
  const atmosphericHeadM = 10.33 * Math.exp(-clampedAlt / 8400);
  const vaporPressureHead20CM = 0.24;
  const requiredNpshMarginM = 2.5;
  return Math.max(2.0, atmosphericHeadM - vaporPressureHead20CM - requiredNpshMarginM);
}

/**
 * Estimates pump delivery flow Q at operating TDH using a parabolic Q-H affinity approximation:
 *   H(Q) = H_max * (1 - (Q / Q_max)^1.85)
 */
export function estimateFlowFromMaxCurve(
  maxFlowM3h: number,
  maxHeadM: number,
  operatingTdhM: number,
): number {
  if (maxFlowM3h <= 0 || maxHeadM <= 0 || operatingTdhM >= maxHeadM) return 0;
  if (operatingTdhM <= 0) return maxFlowM3h;
  const ratio = clamp(operatingTdhM / maxHeadM, 0, 1);
  return maxFlowM3h * Math.pow(1 - ratio, 1 / 1.85);
}

function selectStandardCableMm2(
  distanceOneWayM: number,
  currentAmps: number,
  nominalVoltageV: number,
  maxDropPct: number,
  isThreePhase: boolean,
): { cableMm2: number; dropV: number; dropPct: number } {
  const safeDist = Math.max(1, distanceOneWayM);
  const safeV = Math.max(12, nominalVoltageV);
  const safeI = Math.max(0.1, currentAmps);
  const factor = isThreePhase ? Math.sqrt(3) : 2;
  const targetDropV = (safeV * clamp(maxDropPct, 1, 10)) / 100;

  for (const mm2 of STANDARD_CABLE_MM2) {
    // Simple thermal ampacity guard (roughly 7-9 A/mm2 at small gauges, lower density on large)
    const maxSafeAmps = mm2 <= 6 ? mm2 * 9.5 : mm2 <= 16 ? mm2 * 6.5 : mm2 * 4.5;
    const dropV = (factor * safeDist * safeI * COPPER_RESISTIVITY_OHM_MM2_M) / mm2;
    if (dropV <= targetDropV && safeI <= maxSafeAmps) {
      return {
        cableMm2: mm2,
        dropV,
        dropPct: (dropV / safeV) * 100,
      };
    }
  }

  const largest = STANDARD_CABLE_MM2[STANDARD_CABLE_MM2.length - 1];
  const dropV = (factor * safeDist * safeI * COPPER_RESISTIVITY_OHM_MM2_M) / largest;
  return {
    cableMm2: largest,
    dropV,
    dropPct: (dropV / safeV) * 100,
  };
}

/**
 * Main engineering calculation function. Pure and deterministic for unit testing and UI memoization.
 */
export function calculatePumpSolarSystem(inputs: PumpSolarInputs): PumpSolarResult {
  const alerts: PumpSolarResult["alerts"] = [];

  // 1. Area & Daily Water Demand
  const rawArea = clamp(inputs.areaValue, 0.01, 100000);
  const areaSqm =
    inputs.areaUnit === "acres"
      ? rawArea * SQM_PER_ACRE
      : inputs.areaUnit === "hectares"
        ? rawArea * 10000
        : rawArea;

  const operatingHours = clamp(inputs.operatingHoursPerDay, 0.5, 24);
  const zonesCount = Math.max(1, Math.round(inputs.zonesCount));
  const simultaneousZones = clamp(Math.round(inputs.simultaneousZones), 1, zonesCount);
  const zoneCycleFactor = simultaneousZones / zonesCount;

  let dailyNetVolumeM3 = 0;
  let dailyGrossVolumeM3 = 0;
  let designFlowM3h = 0;

  if (inputs.demandMode === "crop_area") {
    const etcMm = clamp(inputs.cropWaterDepthMm, 0.5, 25);
    const appEff = clamp(inputs.applicationEfficiencyPct, 40, 100) / 100;
    dailyNetVolumeM3 = (areaSqm * etcMm) / 1000;
    dailyGrossVolumeM3 = dailyNetVolumeM3 / appEff;
    designFlowM3h = dailyGrossVolumeM3 / operatingHours;
  } else if (inputs.demandMode === "emitter_block") {
    const count = clamp(inputs.emitterCount, 1, 2000000);
    const flowEachM3h =
      inputs.emitterFlowUnit === "lph"
        ? clamp(inputs.emitterFlowRate, 0.1, 50000) / 1000
        : clamp(inputs.emitterFlowRate, 0.01, 500);
    designFlowM3h = count * flowEachM3h;
    dailyGrossVolumeM3 = designFlowM3h * operatingHours;
    dailyNetVolumeM3 =
      dailyGrossVolumeM3 * (clamp(inputs.applicationEfficiencyPct, 40, 100) / 100);
  } else {
    const val = clamp(inputs.directFlowValue, 0.05, 500000);
    designFlowM3h =
      inputs.directFlowUnit === "m3h"
        ? val
        : inputs.directFlowUnit === "lph"
          ? val / 1000
          : (val * 60) / 1000;
    dailyGrossVolumeM3 = designFlowM3h * operatingHours;
    dailyNetVolumeM3 =
      dailyGrossVolumeM3 * (clamp(inputs.applicationEfficiencyPct, 40, 100) / 100);
  }

  const activeAreaShareRatio = zoneCycleFactor;
  const numberOfZoneShifts = Math.ceil(zonesCount / simultaneousZones);
  const hoursPerZoneCycle = operatingHours / Math.max(1, numberOfZoneShifts);

  const designFlowLph = designFlowM3h * 1000;
  const designFlowLpm = designFlowLph / 60;
  const designFlowLs = designFlowM3h / 3.6;

  // 2. Hydraulics & Pipe Friction
  const staticWaterLiftM = clamp(inputs.staticWaterDepthM, 0, 500);
  const drawdownM = inputs.sourceType === "borehole" ? clamp(inputs.drawdownM, 0, 150) : 0;
  const elevationGainM = clamp(inputs.groundElevationGainM, -150, 400);
  const dischargeHeightM = clamp(inputs.dischargeHeightM, 0, 100);
  const workingPressureHeadM = clamp(inputs.workingPressureBar, 0, 15) * BAR_TO_METERS;
  const filtrationValveLossM = clamp(inputs.filtrationValveLossM, 0, 30);

  const suctionPipeResult = computePipeSegmentLoss(
    {
      ...inputs.suctionPipe,
      enabled: inputs.sourceType === "surface_suction" && inputs.suctionPipe.enabled,
    },
    designFlowM3h,
    true,
  );
  const primaryPipeResult = computePipeSegmentLoss(inputs.primaryPipe, designFlowM3h, false);
  const secondaryPipeResult = computePipeSegmentLoss(inputs.secondaryPipe, designFlowM3h, false);

  const totalPipeFrictionM =
    suctionPipeResult.frictionLossM +
    primaryPipeResult.frictionLossM +
    secondaryPipeResult.frictionLossM;
  const fittingsMinorLossM =
    totalPipeFrictionM * (clamp(inputs.fittingsLossPct, 0, 50) / 100);

  const effectiveStaticM =
    inputs.sourceType === "tank_booster"
      ? 0
      : staticWaterLiftM + drawdownM;

  const rawTdhM =
    effectiveStaticM +
    elevationGainM +
    dischargeHeightM +
    workingPressureHeadM +
    filtrationValveLossM +
    totalPipeFrictionM +
    fittingsMinorLossM;

  const gravityAssistWarning = rawTdhM <= 0;
  const totalDynamicHeadM = Math.max(1, rawTdhM);

  // Suction Cavitation Audit
  const maxPracticalSuctionLiftM = computeMaxPracticalSuctionLift(inputs.siteAltitudeM);
  const totalSuctionDutyM =
    inputs.sourceType === "surface_suction"
      ? staticWaterLiftM + suctionPipeResult.frictionLossM
      : 0;
  let suctionCavitationAlert: string | null = null;
  if (inputs.sourceType === "surface_suction" && totalSuctionDutyM > maxPracticalSuctionLiftM) {
    suctionCavitationAlert = `Total suction duty (${totalSuctionDutyM.toFixed(
      1,
    )} m including friction) exceeds the ~${maxPracticalSuctionLiftM.toFixed(
      1,
    )} m cavitation limit at ${Math.round(inputs.siteAltitudeM)} m altitude. Place the pump closer to water level or switch to a submersible pump.`;
    alerts.push({
      severity: "critical",
      title: "Surface Suction Cavitation Risk",
      detail: suctionCavitationAlert,
    });
  }

  for (const pipeRes of [suctionPipeResult, primaryPipeResult, secondaryPipeResult]) {
    if (pipeRes.enabled && pipeRes.status !== "optimal") {
      const savingsNote =
        pipeRes.recommendedUpgradedOdMm && pipeRes.upgradedFrictionLossM !== null
          ? ` Upgrading to ${pipeRes.recommendedUpgradedOdMm} mm cuts friction from ${pipeRes.frictionLossM.toFixed(
              1,
            )} m to ${pipeRes.upgradedFrictionLossM.toFixed(1)} m.`
          : "";
      alerts.push({
        severity: pipeRes.status === "critical" ? "critical" : "warning",
        title: `${pipeRes.label} (${pipeRes.nominalOdMm} mm)`,
        detail: `${pipeRes.statusMessage}${savingsNote}`,
      });
    }
  }

  if (gravityAssistWarning) {
    alerts.push({
      severity: "info",
      title: "Downhill Gravity Head May Eliminate Pumping",
      detail:
        "Natural downhill elevation drop exceeds total pressure and friction requirements. Verify static surge protection (PRV) before selecting a pump.",
    });
  }

  // 3. Pump & Motor Power Calculations
  const pumpEff = clamp(inputs.pumpEfficiencyPct, 20, 88) / 100;
  const motorEff = clamp(inputs.motorEfficiencyPct, 40, 96) / 100;
  const ctrlEff = clamp(inputs.controllerEfficiencyPct, 75, 99) / 100;
  const wireToWaterEfficiencyPct = pumpEff * motorEff * 100;

  const qM3s = designFlowM3h / 3600;
  const hydraulicPowerW = WATER_DENSITY_KG_M3 * GRAVITY_MS2 * qM3s * totalDynamicHeadM;
  const hydraulicPowerKw = hydraulicPowerW / 1000;
  const shaftPowerKw = hydraulicPowerKw / pumpEff;
  const electricalInputPowerKw = hydraulicPowerKw / (pumpEff * motorEff);
  const electricalInputPowerW = electricalInputPowerKw * 1000;

  const safetyFactor = clamp(inputs.hydraulicSafetyFactor, 1.0, 1.5);
  const recommendedMotorKw = electricalInputPowerKw * safetyFactor;
  const recommendedMotorHp = recommendedMotorKw / 0.7457;
  const nearestStandardHp =
    STANDARD_KENYA_HP_RATINGS.find((hp) => hp >= recommendedMotorHp) ??
    Math.ceil(recommendedMotorHp);

  const dailyEnergyKwh = electricalInputPowerKw * operatingHours;
  const specificEnergyKwhPerM3 =
    dailyGrossVolumeM3 > 0 ? dailyEnergyKwh / dailyGrossVolumeM3 : 0;

  // 4. Solar PV, String Configuration & Cable Sizing
  const psh = clamp(inputs.peakSunHours, 2.5, 8.5);
  const tempDerate = 1 - clamp(inputs.pvTempDeratePct, 0, 30) / 100;
  const dustMismatch = 1 - clamp(inputs.dustMismatchLossPct, 0, 25) / 100;
  const overallSolarDeratingFactor = tempDerate * dustMismatch * ctrlEff;

  // Instantaneous noon power needed to run motor cleanly at design point
  const peakSolarDemandWp = (electricalInputPowerW * safetyFactor) / overallSolarDeratingFactor;

  // Daily Wh energy needed (for direct DC oversizing during shoulder hours or hybrid storage)
  const hybridBatteryPenalty = inputs.powerMode === "solar_hybrid" ? 0.88 : 1.0;
  const energySolarDemandWp =
    (dailyEnergyKwh * 1000 * safetyFactor) / (psh * overallSolarDeratingFactor * hybridBatteryPenalty);

  const recommendedArrayWp =
    inputs.powerMode === "ac_grid_generator"
      ? 0
      : Math.max(peakSolarDemandWp, energySolarDemandWp);

  if (inputs.powerMode === "solar_dc" && operatingHours > psh * 1.25) {
    alerts.push({
      severity: "warning",
      title: "Operating Window Exceeds Direct Solar Peak Hours",
      detail: `Running ${operatingHours.toFixed(
        1,
      )} hrs/day directly from PV in a ${psh.toFixed(
        1,
      )} PSH zone requires oversize array/flow or pumping faster into an elevated buffer tank (5–6 hrs solar window) to protect the MPPT current ceiling.`,
    });
  }

  // PV String Optimizer
  const panelW = clamp(inputs.panelWatts, 100, 800);
  const panelVmp = clamp(inputs.panelVmp, 15, 70);
  const panelVoc = clamp(inputs.panelVoc, 18, 90);
  const coldDeltaC = Math.max(0, 25 - clamp(inputs.minMorningTempC, -5, 30));
  const coldVocFactor = 1 + 0.003 * coldDeltaC;
  const hotVmpFactor = 0.88; // ~60C module cell temperature on Kenyan farms

  const ctrlMinV = clamp(inputs.controllerMinVmpV, 24, 600);
  const ctrlMaxVoc = clamp(inputs.controllerMaxVocV, 45, 1000);

  const minPanelsSeries = Math.max(1, Math.ceil(ctrlMinV / (panelVmp * hotVmpFactor)));
  const maxPanelsSeries = Math.max(1, Math.floor(ctrlMaxVoc / (panelVoc * coldVocFactor)));
  const idealMidSeries = Math.max(
    minPanelsSeries,
    Math.min(maxPanelsSeries, Math.round(((ctrlMinV + ctrlMaxVoc * 0.72) / 2) / panelVmp)),
  );

  const minPanelCount =
    inputs.powerMode === "ac_grid_generator"
      ? 0
      : Math.max(idealMidSeries, Math.ceil(recommendedArrayWp / panelW));

  const parallelStrings =
    inputs.powerMode === "ac_grid_generator"
      ? 0
      : Math.max(1, Math.ceil(minPanelCount / idealMidSeries));
  const panelsInSeries = inputs.powerMode === "ac_grid_generator" ? 0 : idealMidSeries;
  const solarPanelCount = panelsInSeries * parallelStrings;
  const installedArrayWp = solarPanelCount * panelW;

  const stringVmpV = panelsInSeries * panelVmp;
  const stringHotVmpV = stringVmpV * hotVmpFactor;
  const stringColdVocV = panelsInSeries * panelVoc * coldVocFactor;

  let vocSafetyStatus: "ok" | "too_high" | "too_low" = "ok";
  let vocSafetyMessage = `String window (${stringHotVmpV.toFixed(0)} V hot Vmp to ${stringColdVocV.toFixed(
    0,
  )} V cold Voc) sits cleanly inside ${ctrlMinV}–${ctrlMaxVoc} V controller limits.`;

  if (inputs.powerMode !== "ac_grid_generator") {
    if (stringColdVocV > ctrlMaxVoc) {
      vocSafetyStatus = "too_high";
      vocSafetyMessage = `Cold morning Voc (${stringColdVocV.toFixed(
        0,
      )} V at ${inputs.minMorningTempC}°C) exceeds controller ${ctrlMaxVoc} V limit. Reduce series panels or raise controller max Voc.`;
      alerts.push({
        severity: "critical",
        title: "PV Cold-Morning Voc Exceeds Controller Rating",
        detail: vocSafetyMessage,
      });
    } else if (stringHotVmpV < ctrlMinV) {
      vocSafetyStatus = "too_low";
      vocSafetyMessage = `Hot midday Vmp (${stringHotVmpV.toFixed(
        0,
      )} V) drops below controller ${ctrlMinV} V start threshold. Add panels in series or check 2× strings.`;
      alerts.push({
        severity: "warning",
        title: "Hot-Day String Vmp Below Controller Minimum",
        detail: vocSafetyMessage,
      });
    }
  }

  // Cable Sizing
  const isThreePhaseAc =
    inputs.powerMode === "ac_grid_generator" && recommendedMotorKw >= 3.0;
  const nominalCableV =
    inputs.powerMode === "ac_grid_generator"
      ? isThreePhaseAc
        ? 400
        : 230
      : Math.max(24, stringVmpV);
  const systemCurrentAmps =
    electricalInputPowerW /
    (isThreePhaseAc ? Math.sqrt(3) * nominalCableV * 0.85 : nominalCableV * 0.92);

  const cableSpec = selectStandardCableMm2(
    inputs.cableLengthM,
    systemCurrentAmps,
    nominalCableV,
    inputs.maxVoltageDropPct,
    isThreePhaseAc,
  );

  // Hybrid Battery, Generator Surge & Tariff
  const batteryDod = inputs.batteryChemistry === "lifepo4" ? 0.8 : 0.5;
  const batteryRequiredKwh =
    inputs.powerMode === "solar_hybrid"
      ? (electricalInputPowerKw * clamp(inputs.batteryBackupHours, 0, 18)) / (batteryDod * 0.9)
      : 0;

  const surgeFactor = inputs.usesVfdSoftStart ? 1.35 : 2.5;
  const recommendedGeneratorKva = (recommendedMotorKw * surgeFactor) / 0.8;

  const estimatedGridDailyCostKes =
    dailyEnergyKwh * clamp(inputs.electricityTariffKesKwh, 0, 150);
  const estimatedCostPerM3Kes =
    dailyGrossVolumeM3 > 0 ? estimatedGridDailyCostKes / dailyGrossVolumeM3 : 0;

  // Storage Tank Recommendation
  const rawTankM3 = dailyGrossVolumeM3 * clamp(inputs.storageAutonomyDays, 0, 7);
  const recommendedTankM3 =
    rawTankM3 <= 0
      ? 0
      : STANDARD_KENYA_TANKS_M3.find((cap) => cap >= rawTankM3) ??
        Math.ceil(rawTankM3 / 50) * 50;
  const recommendedTankLiters = recommendedTankM3 * 1000;

  // 5. Custom Pump Curve Evaluator
  let customPumpEval: CustomPumpEvaluation = {
    enabled: false,
    canMeetTDH: false,
    headroomPct: 0,
    estimatedFlowAtTDHM3h: 0,
    flowDeficitM3h: 0,
    verdict: "optimal",
    summary: "",
  };

  if (inputs.customPump.enabled) {
    const cMaxHead = Math.max(1, inputs.customPump.maxHeadM);
    const cMaxFlow = Math.max(0.1, inputs.customPump.maxFlowM3h);
    const headroomPct = (totalDynamicHeadM / cMaxHead) * 100;
    const estFlow = estimateFlowFromMaxCurve(cMaxFlow, cMaxHead, totalDynamicHeadM);
    const flowDeficitM3h = Math.max(0, designFlowM3h - estFlow);
    const canMeetTDH = totalDynamicHeadM < cMaxHead * 0.92 && estFlow >= designFlowM3h * 0.85;

    let verdict: CustomPumpEvaluation["verdict"] = "optimal";
    let summary = `Estimated ~${estFlow.toFixed(1)} m³/h at ${totalDynamicHeadM.toFixed(
      1,
    )} m TDH (${headroomPct.toFixed(0)}% of Max Head).`;

    if (totalDynamicHeadM >= cMaxHead * 0.95 || estFlow <= 0.1) {
      verdict = "undersized";
      summary = `System TDH (${totalDynamicHeadM.toFixed(
        1,
      )} m) is too close to or exceeds this pump's ${cMaxHead} m shutoff head — almost zero discharge.`;
    } else if (!canMeetTDH || headroomPct > 80) {
      verdict = "workable";
      summary = `Delivers ~${estFlow.toFixed(1)} m³/h vs ${designFlowM3h.toFixed(
        1,
      )} m³/h target (${headroomPct.toFixed(0)}% of Max Head). Increase pumping hours or step up model.`;
    }

    customPumpEval = {
      enabled: true,
      canMeetTDH,
      headroomPct,
      estimatedFlowAtTDHM3h: estFlow,
      flowDeficitM3h,
      verdict,
      summary,
    };
  }

  return {
    areaSqm,
    dailyNetVolumeM3,
    dailyGrossVolumeM3,
    activeAreaShareRatio,
    designFlowM3h,
    designFlowLpm,
    designFlowLph,
    designFlowLs,
    effectiveDailyPumpHours: operatingHours,
    hoursPerZoneCycle,
    staticWaterLiftM,
    drawdownM,
    elevationGainM,
    dischargeHeightM,
    workingPressureHeadM,
    filtrationValveLossM,
    suctionPipeResult,
    primaryPipeResult,
    secondaryPipeResult,
    totalPipeFrictionM,
    fittingsMinorLossM,
    totalDynamicHeadM,
    gravityAssistWarning,
    maxPracticalSuctionLiftM,
    totalSuctionDutyM,
    suctionCavitationAlert,
    hydraulicPowerW,
    hydraulicPowerKw,
    shaftPowerKw,
    electricalInputPowerW,
    electricalInputPowerKw,
    wireToWaterEfficiencyPct,
    recommendedMotorKw,
    recommendedMotorHp,
    nearestStandardHp,
    dailyEnergyKwh,
    specificEnergyKwhPerM3,
    overallSolarDeratingFactor,
    recommendedArrayWp,
    peakSolarDemandWp,
    energySolarDemandWp,
    solarPanelCount,
    panelsInSeries,
    parallelStrings,
    installedArrayWp,
    stringVmpV,
    stringColdVocV,
    stringHotVmpV,
    vocSafetyStatus,
    vocSafetyMessage,
    systemCurrentAmps,
    recommendedCableMm2: cableSpec.cableMm2,
    actualVoltageDropV: cableSpec.dropV,
    actualVoltageDropPct: cableSpec.dropPct,
    batteryRequiredKwh,
    recommendedGeneratorKva,
    estimatedGridDailyCostKes,
    estimatedCostPerM3Kes,
    recommendedTankM3,
    recommendedTankLiters,
    customPumpEval,
    alerts,
  };
}

// ============================================================================
// Live DripTech CF D1 Pump Catalogue Parser & Matcher
// ============================================================================

export type CatalogPumpKind =
  | "solar_submersible"
  | "electric_submersible"
  | "solar_booster"
  | "electric_booster"
  | "engine_high_pressure";

export interface CatalogPumpProduct {
  id: string;
  name: string;
  price?: number | null;
  category: string;
  model_number?: string | null;
  in_stock?: boolean;
  images?: string[] | null;
  specifications?: Record<string, string> | null;
}

export interface ParsedPumpSpecs {
  kind: CatalogPumpKind;
  isSolar: boolean;
  isSubmersible: boolean;
  maxHeadM: number | null;
  maxFlowM3h: number | null;
  ratedPowerW: number | null;
  ratedHp: number | null;
  recommendedSolarW: number | null;
  operatingVoltageText: string | null;
  outletText: string | null;
}

export interface MatchedPumpRecommendation {
  product: CatalogPumpProduct;
  specs: ParsedPumpSpecs;
  estimatedFlowAtTDHM3h: number;
  headroomPct: number;
  fitStatus: "optimal" | "workable" | "specs_incomplete";
  fitScore: number;
  fitReason: string;
}

function cleanSpecText(raw?: string | null): string {
  if (!raw) return "";
  return String(raw)
    .replace(/â€”|—/g, " ")
    .replace(/Ã—/g, "x")
    .replace(/\t+/g, " ")
    .replace(/,/g, "")
    .trim();
}

function extractNumericRangeAvg(raw?: string | null): number | null {
  const cleaned = cleanSpecText(raw);
  if (!cleaned || /confirm for exact model/i.test(cleaned)) return null;
  // Match e.g. "90–100 m" or "1000-1200 W" or "4.8"
  const rangeMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    return (Number(rangeMatch[1]) + Number(rangeMatch[2])) / 2;
  }
  const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
  return singleMatch ? Number(singleMatch[1]) : null;
}

function parseFlowToM3h(specs: Record<string, string>): number | null {
  const raw =
    specs["Maximum Flow Rate"] ||
    specs["Nominal Flow Rate"] ||
    specs["Rated Flow Rate"] ||
    "";
  const num = extractNumericRangeAvg(raw);
  if (num === null) return null;
  const cleaned = cleanSpecText(raw).toLowerCase();
  if (cleaned.includes("l/min") || cleaned.includes("lpm")) {
    return Number(((num * 60) / 1000).toFixed(2));
  }
  if (cleaned.includes("l/h") || cleaned.includes("lph")) {
    return Number((num / 1000).toFixed(2));
  }
  return num; // already m³/h
}

function parsePowerWattsAndHp(specs: Record<string, string>, name: string): {
  watts: number | null;
  hp: number | null;
} {
  let watts: number | null = null;
  let hp: number | null = null;

  const candidates = [
    specs["Motor Power"],
    specs["Engine Power"],
    specs["Rated Power"],
  ].filter(Boolean);

  for (const candidate of candidates) {
    const cleaned = cleanSpecText(candidate).toLowerCase();
    const num = extractNumericRangeAvg(cleaned);
    if (num === null) continue;

    if (cleaned.includes("kw")) {
      watts = watts ?? Math.round(num * 1000);
    } else if (cleaned.includes("hp")) {
      hp = hp ?? num;
    } else if (cleaned.includes("w")) {
      watts = watts ?? Math.round(num);
    }
  }

  if (hp === null) {
    const titleHp = name.match(/(\d+(?:\.\d+)?)\s*HP/i);
    if (titleHp) hp = Number(titleHp[1]);
  }
  if (hp === null && watts !== null) {
    hp = Number((watts / 745.7).toFixed(2));
  }
  if (watts === null && hp !== null) {
    watts = Math.round(hp * 745.7);
  }
  return { watts, hp };
}

export function parseCatalogPumpSpecs(product: CatalogPumpProduct): ParsedPumpSpecs {
  const specs = product.specifications || {};
  const titleLower = product.name.toLowerCase();
  const typeLower = cleanSpecText(specs["Pump Type"]).toLowerCase();
  const sourceLower = cleanSpecText(
    specs["Power Source"] || specs["Power Supply"] || "",
  ).toLowerCase();

  const isSolar =
    titleLower.includes("solar") ||
    sourceLower.includes("solar") ||
    typeLower.includes("solar");
  const isSubmersible =
    titleLower.includes("submersible") ||
    titleLower.includes("borehole") ||
    typeLower.includes("submersible");
  const isEngine =
    titleLower.includes("petrol") ||
    titleLower.includes("diesel") ||
    Boolean(specs["Fuel Type"]);

  const kind: CatalogPumpKind = isEngine
    ? "engine_high_pressure"
    : isSolar && isSubmersible
      ? "solar_submersible"
      : isSolar
        ? "solar_booster"
        : isSubmersible
          ? "electric_submersible"
          : "electric_booster";

  const maxHeadRaw =
    specs["Maximum Total Head"] ||
    specs["Maximum Head"] ||
    specs["Published Head Rating"] ||
    "";
  const maxHeadM = extractNumericRangeAvg(maxHeadRaw);
  const maxFlowM3h = parseFlowToM3h(specs);
  const { watts: ratedPowerW, hp: ratedHp } = parsePowerWattsAndHp(specs, product.name);
  const recommendedSolarW = extractNumericRangeAvg(
    specs["Total Recommended Solar Array"] ||
      specs["Recommended Solar Array Capacity"] ||
      specs["Solar Panel Capacity"] ||
      "",
  );

  return {
    kind,
    isSolar,
    isSubmersible,
    maxHeadM,
    maxFlowM3h,
    ratedPowerW,
    ratedHp,
    recommendedSolarW,
    operatingVoltageText: cleanSpecText(
      specs["Operating Voltage"] || specs["Rated Voltage"] || specs["Voltage"],
    ) || null,
    outletText: cleanSpecText(
      specs["Outlet Diameter"] || specs["Discharge Connection"] || specs["Main Outlet Diameter"],
    ) || null,
  };
}

/**
 * Matches live DripTech `pumps_motors` products against calculated farm TDH, target flow,
 * water source type, and power supply mode.
 */
export function matchCatalogPumps(
  products: CatalogPumpProduct[],
  inputs: PumpSolarInputs,
  result: PumpSolarResult,
): MatchedPumpRecommendation[] {
  const candidates: MatchedPumpRecommendation[] = [];

  for (const product of products) {
    const specs = parseCatalogPumpSpecs(product);

    // Enforce source & power compatibility cleanly
    if (inputs.sourceType === "borehole" && !specs.isSubmersible) {
      continue;
    }
    if (inputs.sourceType !== "borehole" && specs.isSubmersible) {
      continue;
    }

    if (inputs.powerMode === "solar_dc" && !specs.isSolar) {
      continue;
    }
    if (inputs.powerMode === "ac_grid_generator" && specs.isSolar) {
      continue;
    }

    if (specs.maxHeadM === null || specs.maxFlowM3h === null) {
      candidates.push({
        product,
        specs,
        estimatedFlowAtTDHM3h: 0,
        headroomPct: 0,
        fitStatus: "specs_incomplete",
        fitScore: 10,
        fitReason: "Contact DripTech engineers to verify curve sheet for this model.",
      });
      continue;
    }

    const headroomPct = (result.totalDynamicHeadM / specs.maxHeadM) * 100;
    if (headroomPct > 92) {
      continue;
    }

    const estimatedFlowAtTDHM3h = estimateFlowFromMaxCurve(
      specs.maxFlowM3h,
      specs.maxHeadM,
      result.totalDynamicHeadM,
    );

    if (estimatedFlowAtTDHM3h < result.designFlowM3h * 0.45) {
      continue;
    }

    const flowRatio = estimatedFlowAtTDHM3h / Math.max(0.1, result.designFlowM3h);
    const optimalHead = headroomPct <= 75;
    const meetsFlow = flowRatio >= 0.85;
    const fitStatus: MatchedPumpRecommendation["fitStatus"] =
      optimalHead && meetsFlow ? "optimal" : "workable";

    // Higher score = closer to 1.1x target flow + comfortable headroom + in stock
    const flowDeltaPenalty = Math.abs(flowRatio - 1.1) * 45;
    const headPenalty = headroomPct > 75 ? (headroomPct - 75) * 1.4 : 0;
    const stockBonus = product.in_stock === false ? -15 : 8;
    const fitScore = Math.max(1, Math.round(100 - flowDeltaPenalty - headPenalty + stockBonus));

    const fitReason =
      fitStatus === "optimal"
        ? `Estimated ~${estimatedFlowAtTDHM3h.toFixed(1)} m³/h at ${result.totalDynamicHeadM.toFixed(
            0,
          )} m TDH (${headroomPct.toFixed(0)}% of ${specs.maxHeadM} m max head).`
        : `Delivering ~${estimatedFlowAtTDHM3h.toFixed(1)} m³/h vs ${result.designFlowM3h.toFixed(
            1,
          )} m³/h target; verify duty curve or adjust pumping hours.`;

    candidates.push({
      product,
      specs,
      estimatedFlowAtTDHM3h,
      headroomPct,
      fitStatus,
      fitScore,
      fitReason,
    });
  }

  return candidates.sort((a, b) => b.fitScore - a.fitScore).slice(0, 6);
}
