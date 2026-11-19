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
  | "rainhose"
  | "micro_sprinkler"
  | "overhead_sprinkler"
  | "rain_gun"
  | "tank_transfer";
export type AreaUnit = "acres" | "hectares" | "sqm";
export type FlowUnit = "m3h" | "lph" | "lpm";
export type PressureUnit = "bar" | "psi" | "m";

export type WaterSourceType = "borehole" | "surface_suction" | "tank_booster";
export type PipeMaterial = "hdpe" | "upvc" | "gi_new" | "gi_old" | "custom";
export type PowerSupplyMode = "solar_dc" | "solar_hybrid" | "ac_grid_generator";
export type BatteryChemistry = "lifepo4" | "tubular_lead_acid";
export type SolarSeasonMode = "worst_cloudy" | "annual_avg" | "dry_peak";
export type DustSoilingEnv = "clean_washed" | "standard_farm" | "arid_dusty";
export type SkyConditionPreset = "clear_sun" | "light_cloud" | "overcast_gathano";
export type BoreholeCasingInch = "3" | "4" | "6" | "8" | "open_well";

export interface PipeSegmentInput {
  label: string;
  enabled: boolean;
  material: PipeMaterial;
  customC?: number;
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
  boreholeCasingInch: BoreholeCasingInch;
  boreholeTotalDepthM: number;
  /** Tested safe driller yield in m3/h (null when unknown). */
  boreholeSafeYieldM3h: number | null;
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

  // 4. Solar PV, Weather Physics, Cable & Storage Inputs
  powerMode: PowerSupplyMode;
  solarRegionId: string;
  solarSeasonMode: SolarSeasonMode;
  peakSunHours: number;
  ambientDayTempC: number;
  windSpeedMs: number;
  minMorningTempC: number;
  panelNoctC: number;
  panelGammaPmaxPct: number;
  panelBetaVocPct: number;
  dustSoilingEnv: DustSoilingEnv;
  pvTempDeratePct: number;
  dustMismatchLossPct: number;
  controllerEfficiencyPct: number;
  skyCondition: SkyConditionPreset;
  skyIrradianceWm2: number;
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
  /** Annual average PSH (kWh/m2/day) from PVGIS / NASA POWER. */
  psh: number;
  /** Worst cloudy-season PSH (e.g. June-July overcast or coastal monsoon). */
  worstMonthPsh: number;
  /** Peak dry-season PSH (Jan-Mar clear sky). */
  drySeasonPsh: number;
  worstMonthName: string;
  ambientDayTempC: number;
  minMorningTempC: number;
  windSpeedMs: number;
  altitudeM: number;
  defaultDustEnv: DustSoilingEnv;
  note: string;
}

export const KENYA_SOLAR_REGIONS: KenyaSolarRegionPreset[] = [
  {
    id: "nairobi_central",
    label: "Nairobi & Upper Kiambu",
    psh: 5.3,
    worstMonthPsh: 4.2,
    drySeasonPsh: 5.9,
    worstMonthName: "Jun–Jul",
    ambientDayTempC: 26,
    minMorningTempC: 9,
    windSpeedMs: 1.8,
    altitudeM: 1650,
    defaultDustEnv: "standard_farm",
    note: "Jun–Jul highland overcast drops PSH to ~4.2 h/day; morning chill spikes cold Voc.",
  },
  {
    id: "juja_thika_muranga",
    label: "Juja, Thika, Ruiru & Murang'a",
    psh: 5.5,
    worstMonthPsh: 4.5,
    drySeasonPsh: 6.1,
    worstMonthName: "Jun–Jul",
    ambientDayTempC: 27,
    minMorningTempC: 10,
    windSpeedMs: 1.9,
    altitudeM: 1480,
    defaultDustEnv: "standard_farm",
    note: "Strong irradiance most months, dipping to ~4.5 PSH during cool misty July mornings.",
  },
  {
    id: "mt_kenya_nyeri_nanyuki",
    label: "Nanyuki, Nyeri, Embu & Meru",
    psh: 5.6,
    worstMonthPsh: 4.4,
    drySeasonPsh: 6.2,
    worstMonthName: "Jun–Jul",
    ambientDayTempC: 25,
    minMorningTempC: 5,
    windSpeedMs: 2.2,
    altitudeM: 1950,
    defaultDustEnv: "standard_farm",
    note: "Cold 5°C mornings cause +5.5–6.5% Voc rise; high altitude lowers surface suction lift.",
  },
  {
    id: "rift_nakuru_naivasha",
    label: "Nakuru, Naivasha, Gilgil & Narok",
    psh: 5.7,
    worstMonthPsh: 4.6,
    drySeasonPsh: 6.3,
    worstMonthName: "Jun–Jul",
    ambientDayTempC: 26,
    minMorningTempC: 7,
    windSpeedMs: 2.3,
    altitudeM: 1850,
    defaultDustEnv: "standard_farm",
    note: "Rift breezes cool cells well, while 1,850 m elevation trims surface suction to ~5.7 m.",
  },
  {
    id: "north_rift_eldoret_kitale",
    label: "Eldoret, Kitale & Kericho Highlands",
    psh: 5.6,
    worstMonthPsh: 4.7,
    drySeasonPsh: 6.5,
    worstMonthName: "Jul–Aug",
    ambientDayTempC: 25,
    minMorningTempC: 8,
    windSpeedMs: 2.1,
    altitudeM: 2100,
    defaultDustEnv: "standard_farm",
    note: "Peaks >6.5 PSH in Feb–Mar; Jul cloud/rain drops yield to ~4.7 PSH.",
  },
  {
    id: "kisumu_western_basin",
    label: "Kisumu, Bungoma, Kakamega & Migori",
    psh: 5.8,
    worstMonthPsh: 5.2,
    drySeasonPsh: 6.2,
    worstMonthName: "Jul",
    ambientDayTempC: 30,
    minMorningTempC: 14,
    windSpeedMs: 1.8,
    altitudeM: 1150,
    defaultDustEnv: "standard_farm",
    note: "Steady equatorial basin solar yield all year (~5.2 PSH even in cloudiest month).",
  },
  {
    id: "eastern_machakos_kitui",
    label: "Machakos, Makueni, Kitui & Kibwezi",
    psh: 5.9,
    worstMonthPsh: 4.9,
    drySeasonPsh: 6.4,
    worstMonthName: "Jun–Jul",
    ambientDayTempC: 32,
    minMorningTempC: 13,
    windSpeedMs: 2.0,
    altitudeM: 1050,
    defaultDustEnv: "arid_dusty",
    note: "Dry-season soil dust builds fast on shallow arrays; keep panels tilted 12–15°.",
  },
  {
    id: "isiolo_samburu_laikipia",
    label: "Isiolo, Marsabit & Samburu",
    psh: 6.1,
    worstMonthPsh: 5.3,
    drySeasonPsh: 6.6,
    worstMonthName: "Jul",
    ambientDayTempC: 34,
    minMorningTempC: 15,
    windSpeedMs: 2.5,
    altitudeM: 1100,
    defaultDustEnv: "arid_dusty",
    note: "Reliable year-round irradiance; size with 12–14% dust & thermal margin.",
  },
  {
    id: "northern_turkana_garissa",
    label: "Turkana, Garissa, Wajir & Mandera",
    psh: 6.4,
    worstMonthPsh: 5.6,
    drySeasonPsh: 6.9,
    worstMonthName: "Jun–Jul",
    ambientDayTempC: 38,
    minMorningTempC: 19,
    windSpeedMs: 2.4,
    altitudeM: 450,
    defaultDustEnv: "arid_dusty",
    note: "38°C ambient pushes PV cells past 65°C (14%+ heat loss) even under high sun.",
  },
  {
    id: "coast_mombasa_kilifi",
    label: "Mombasa, Kilifi, Malindi & Kwale",
    psh: 5.7,
    worstMonthPsh: 4.8,
    drySeasonPsh: 6.3,
    worstMonthName: "May–Jun",
    ambientDayTempC: 33,
    minMorningTempC: 21,
    windSpeedMs: 2.6,
    altitudeM: 30,
    defaultDustEnv: "clean_washed",
    note: "Sea-level air permits full ~7.5 m suction; worst solar window hits in May–Jun rains.",
  },
];

export const getRegionPshForSeason = (
  region: KenyaSolarRegionPreset,
  season: SolarSeasonMode,
): number => {
  if (season === "worst_cloudy") return region.worstMonthPsh;
  if (season === "dry_peak") return region.drySeasonPsh;
  return region.psh;
};

export const applyKenyaSolarRegionPreset = (
  prev: PumpSolarInputs,
  regionId: string,
  season: SolarSeasonMode = prev.solarSeasonMode,
): PumpSolarInputs => {
  const region = KENYA_SOLAR_REGIONS.find((r) => r.id === regionId);
  if (!region) return prev;
  return {
    ...prev,
    solarRegionId: region.id,
    solarSeasonMode: season,
    peakSunHours: getRegionPshForSeason(region, season),
    ambientDayTempC: region.ambientDayTempC,
    minMorningTempC: region.minMorningTempC,
    windSpeedMs: region.windSpeedMs,
    siteAltitudeM: region.altitudeM,
    dustSoilingEnv: region.defaultDustEnv,
    dustMismatchLossPct: DUST_SOILING_META[region.defaultDustEnv].dustMismatchPct,
  };
};

export const DUST_SOILING_META: Record<
  DustSoilingEnv,
  { label: string; dustMismatchPct: number; note: string }
> = {
  clean_washed: {
    label: "Clean / Regularly Washed (6% total dust + wire)",
    dustMismatchPct: 6,
    note: "Panels cleaned bi-weekly or regular coastal rainfall runoff.",
  },
  standard_farm: {
    label: "Standard Kenyan Farm (9% dust + wire)",
    dustMismatchPct: 9,
    note: "Typical agricultural pollen/soil dust between rains.",
  },
  arid_dusty: {
    label: "Arid / Unpaved Roadside (14% heavy dust + wire)",
    dustMismatchPct: 14,
    note: "ASAL / livestock dust zone unless panels are rinsed weekly.",
  },
};

export const SKY_CONDITION_PRESETS: Record<
  SkyConditionPreset,
  { label: string; wm2: number; note: string }
> = {
  clear_sun: { label: "Clear Midday Sun (950 W/m²)", wm2: 950, note: "Peak solar pumping window." },
  light_cloud: { label: "Hazy / Scattered Cloud (650 W/m²)", wm2: 650, note: "Diffuse afternoon light." },
  overcast_gathano: { label: "Heavy Overcast Cloud (380 W/m²)", wm2: 380, note: "Jul–Jun overcast test." },
};

export const BOREHOLE_CASING_LABELS: Record<BoreholeCasingInch, string> = {
  "3": '3" Narrow Casing (~76 mm ID)',
  "4": '4" Standard Borehole (~102 mm ID)',
  "6": '6" Commercial Borehole (~152 mm ID)',
  "8": '8"+ High-Yield Borehole (~200 mm ID)',
  open_well: "Open Hand-Dug Well / Sump",
};

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
  { nominalOdMm: 25, label: "25 mm (3/4\")", defaultIdByMaterial: { hdpe: 21.0, upvc: 21.6, gi_new: 21.0, gi_old: 20.5, custom: 21.0 } },
  { nominalOdMm: 32, label: "32 mm (1\")", defaultIdByMaterial: { hdpe: 27.2, upvc: 28.0, gi_new: 27.2, gi_old: 26.5, custom: 27.2 } },
  { nominalOdMm: 40, label: "40 mm (1.25\")", defaultIdByMaterial: { hdpe: 34.0, upvc: 35.2, gi_new: 35.9, gi_old: 34.8, custom: 34.0 } },
  { nominalOdMm: 50, label: "50 mm (1.5\")", defaultIdByMaterial: { hdpe: 42.6, upvc: 44.2, gi_new: 41.8, gi_old: 40.5, custom: 42.6 } },
  { nominalOdMm: 63, label: "63 mm (2\")", defaultIdByMaterial: { hdpe: 53.6, upvc: 55.8, gi_new: 53.0, gi_old: 51.5, custom: 53.6 } },
  { nominalOdMm: 75, label: "75 mm (2.5\")", defaultIdByMaterial: { hdpe: 63.8, upvc: 66.4, gi_new: 68.8, gi_old: 67.0, custom: 63.8 } },
  { nominalOdMm: 90, label: "90 mm (3\")", defaultIdByMaterial: { hdpe: 76.6, upvc: 79.8, gi_new: 80.8, gi_old: 79.0, custom: 76.6 } },
  { nominalOdMm: 110, label: "110 mm (4\")", defaultIdByMaterial: { hdpe: 93.8, upvc: 97.6, gi_new: 105.0, gi_old: 102.0, custom: 93.8 } },
  { nominalOdMm: 160, label: "160 mm (6\")", defaultIdByMaterial: { hdpe: 136.2, upvc: 141.8, gi_new: 155.0, gi_old: 150.0, custom: 136.2 } },
];

export const PIPE_MATERIAL_META: Record<
  PipeMaterial,
  { label: string; hazenC: number; note: string }
> = {
  hdpe: { label: "HDPE (PN10 / PE100)", hazenC: 140, note: "Flexible coiled/butt-fused borehole & mainline pipe (C = 140)." },
  upvc: { label: "uPVC Pressure Pipe", hazenC: 145, note: "Smooth-bore rigid buried mainline pipe (C = 145)." },
  gi_new: { label: "New GI Galvanized Steel", hazenC: 120, note: "Rigid threaded borehole riser pipe (C = 120)." },
  gi_old: { label: "Aged / Scaled Steel Pipe", hazenC: 100, note: "Roughness penalty for older mineralized GI risers (C = 100)." },
  custom: { label: "Custom Pipe Roughness (C)", hazenC: 135, note: "Enter your exact Hazen-Williams C factor (80–155)." },
};

export interface SolarModulePreset {
  id: string;
  label: string;
  watts: number;
  vmp: number;
  voc: number;
  noctC: number;
  gammaPmaxPct: number;
  betaVocPct: number;
}

export const SOLAR_PANEL_PRESETS: SolarModulePreset[] = [
  { id: "330w", label: "330 W Poly/Mono (72-cell)", watts: 330, vmp: 37.2, voc: 45.2, noctC: 46, gammaPmaxPct: -0.40, betaVocPct: -0.30 },
  { id: "450w", label: "450 W Mono PERC", watts: 450, vmp: 41.2, voc: 49.5, noctC: 45, gammaPmaxPct: -0.36, betaVocPct: -0.28 },
  { id: "550w", label: "550 W Mono Half-Cut", watts: 550, vmp: 41.8, voc: 49.8, noctC: 45, gammaPmaxPct: -0.35, betaVocPct: -0.27 },
  { id: "600w", label: "600 W N-Type TOPCon", watts: 600, vmp: 44.5, voc: 53.0, noctC: 44, gammaPmaxPct: -0.30, betaVocPct: -0.25 },
];

export const METHOD_DEFAULTS: Record<
  IrrigationMethod,
  { label: string; efficiencyPct: number; defaultPressureBar: number }
> = {
  drip: { label: "Drip Lines / Button Drippers", efficiencyPct: 90, defaultPressureBar: 1.0 },
  rainhose: { label: "Rain Hose (32mm / 40mm Spray Pipe)", efficiencyPct: 78, defaultPressureBar: 1.5 },
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
  boreholeCasingInch: "4",
  boreholeTotalDepthM: 100,
  boreholeSafeYieldM3h: null,
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
  solarSeasonMode: "worst_cloudy",
  peakSunHours: 4.2,
  ambientDayTempC: 26,
  windSpeedMs: 1.8,
  minMorningTempC: 9,
  panelNoctC: 45,
  panelGammaPmaxPct: -0.35,
  panelBetaVocPct: -0.27,
  dustSoilingEnv: "standard_farm",
  pvTempDeratePct: 9,
  dustMismatchLossPct: 9,
  controllerEfficiencyPct: 95,
  skyCondition: "clear_sun",
  skyIrradianceWm2: 950,
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

  // Altitude, Cavitation & Borehole Depth/Casing Checks
  maxPracticalSuctionLiftM: number;
  totalSuctionDutyM: number;
  suctionCavitationAlert: string | null;
  boreholeRecommendedDepthM: number;
  boreholeDepthAlert: string | null;

  // Pump, Motor & Solar VFD Power
  hydraulicPowerW: number;
  hydraulicPowerKw: number;
  shaftPowerKw: number;
  electricalInputPowerW: number;
  electricalInputPowerKw: number;
  wireToWaterEfficiencyPct: number;
  recommendedMotorKw: number;
  recommendedMotorHp: number;
  nearestStandardHp: number;
  recommendedVfdKw: number;
  dailyEnergyKwh: number;
  specificEnergyKwhPerM3: number;

  // Solar PV, Weather Physics, String Layout & Electrical Cable Sizing
  estimatedDayCellTempC: number;
  computedThermalLossPct: number;
  recommendedPanelTiltDeg: number;
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

  // Real-time Weather / Cloud-Cover Pump Simulator
  cloudSimulation: {
    skyWm2: number;
    cloudCellTempC: number;
    arrayOutputW: number;
    estimatedHz: number;
    minCutoffHz: number;
    canLiftWater: boolean;
    estimatedCloudFlowM3h: number;
    summary: string;
  };

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
  boreholeYieldUtilisationPct: number | null;

  // Engineering alerts & recommendations
  alerts: Array<{ severity: "info" | "warning" | "critical"; title: string; detail: string }>;
}

export interface CustomProjectMetadata {
  projectName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  countyTown: string;
  notes: string;
}

export interface CustomCostFigures {
  includeInReport: boolean;
  pumpUnitKes: number | null;
  solarArrayCtrlKes: number | null;
  pipesFittingsKes: number | null;
  cableProtectionKes: number | null;
  tankCivilKes: number | null;
  installationTestKes: number | null;
  compareBaselineFuel: "petrol_diesel" | "kplc_grid";
  dailyBaselineFuelCostKes: number | null;
  irrigationDaysPerYear: number;
}

export interface CustomFinancialSummary {
  totalCustomCapexKes: number;
  hasAnyCost: boolean;
  annualBaselineOperatingKes: number;
  annualSavingsKes: number;
  paybackYears: number | null;
  tenYearNetSavingsKes: number;
}

export const DEFAULT_CUSTOM_PROJECT_META: CustomProjectMetadata = {
  projectName: "Farm Pump & Solar Sizing Design",
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  countyTown: "Kiambu / Nairobi Corridor",
  notes: "",
};

export const DEFAULT_CUSTOM_COST_FIGURES: CustomCostFigures = {
  includeInReport: false,
  pumpUnitKes: null,
  solarArrayCtrlKes: null,
  pipesFittingsKes: null,
  cableProtectionKes: null,
  tankCivilKes: null,
  installationTestKes: null,
  compareBaselineFuel: "petrol_diesel",
  dailyBaselineFuelCostKes: null,
  irrigationDaysPerYear: 240,
};

export function pressureFromBar(bar: number, unit: PressureUnit): number {
  if (unit === "psi") return Number((bar * 14.50377).toFixed(1));
  if (unit === "m") return Number((bar * 10.19716).toFixed(1));
  return Number(bar.toFixed(2));
}

export function barFromPressureUnit(value: number, unit: PressureUnit): number {
  if (unit === "psi") return Math.max(0, value / 14.50377);
  if (unit === "m") return Math.max(0, value / 10.19716);
  return Math.max(0, value);
}

/** Computes user-entered project budget totals and baseline fuel/grid payback comparison. */
export function computeCustomFinancialSummary(
  costs: CustomCostFigures,
  result: PumpSolarResult,
  tariffKesKwh: number,
): CustomFinancialSummary {
  const parts = [
    costs.pumpUnitKes,
    costs.solarArrayCtrlKes,
    costs.pipesFittingsKes,
    costs.cableProtectionKes,
    costs.tankCivilKes,
    costs.installationTestKes,
  ].filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);

  const hasAnyCost = parts.length > 0;
  const totalCustomCapexKes = parts.reduce((sum, v) => sum + v, 0);
  const daysYr = clamp(costs.irrigationDaysPerYear || 240, 30, 365);

  const estimatedDailyFuelKes =
    typeof costs.dailyBaselineFuelCostKes === "number" && costs.dailyBaselineFuelCostKes > 0
      ? costs.dailyBaselineFuelCostKes
      : costs.compareBaselineFuel === "kplc_grid"
        ? result.dailyEnergyKwh * Math.max(10, tariffKesKwh || 28)
        : result.dailyEnergyKwh * 72; // approx KES/kWh mechanical diesel/petrol pump equivalent when fuel figure not entered

  const annualBaselineOperatingKes = Math.round(estimatedDailyFuelKes * daysYr);
  const annualSavingsKes = annualBaselineOperatingKes;
  const paybackYears =
    totalCustomCapexKes > 0 && annualSavingsKes > 0
      ? Number((totalCustomCapexKes / annualSavingsKes).toFixed(2))
      : null;
  const tenYearNetSavingsKes = annualSavingsKes * 10 - totalCustomCapexKes;

  return {
    totalCustomCapexKes,
    hasAnyCost,
    annualBaselineOperatingKes,
    annualSavingsKes,
    paybackYears,
    tenYearNetSavingsKes,
  };
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
  const hazenC =
    segment.material === "custom"
      ? clamp(segment.customC ?? 135, 70, 160)
      : PIPE_MATERIAL_META[segment.material].hazenC;
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

  // Borehole Submergence & Casing Shroud Checks
  const boreholeRecommendedDepthM =
    inputs.sourceType === "borehole"
      ? staticWaterLiftM + drawdownM + 6
      : 0;
  let boreholeDepthAlert: string | null = null;

  if (inputs.sourceType === "borehole") {
    const totalDepth = clamp(inputs.boreholeTotalDepthM, 10, 600);
    if (boreholeRecommendedDepthM > totalDepth - 3) {
      boreholeDepthAlert = `Dynamic pumping level + 6m submergence (${boreholeRecommendedDepthM.toFixed(
        0,
      )}m) leaves less than 3m above the ${totalDepth}m borehole bottom — risk of silt ingestion or dry-run.`;
      alerts.push({
        severity: "critical",
        title: "Insufficient Borehole Submergence Clearance",
        detail: boreholeDepthAlert,
      });
    }
    if (
      typeof inputs.boreholeSafeYieldM3h === "number" &&
      inputs.boreholeSafeYieldM3h > 0 &&
      designFlowM3h > inputs.boreholeSafeYieldM3h
    ) {
      const safeHrs = (dailyGrossVolumeM3 / inputs.boreholeSafeYieldM3h).toFixed(1);
      alerts.push({
        severity: "critical",
        title: "Required Flow Exceeds Driller Borehole Safe Yield",
        detail: `Peak design flow (${designFlowM3h.toFixed(
          1,
        )} m³/h) exceeds tested borehole yield (${inputs.boreholeSafeYieldM3h.toFixed(
          1,
        )} m³/h). Reduce pump flow into a storage buffer tank (~${safeHrs}h slower draw) or split field into smaller rotational zones.`,
      });
    }
    if (inputs.boreholeCasingInch === "6" || inputs.boreholeCasingInch === "8" || inputs.boreholeCasingInch === "open_well") {
      alerts.push({
        severity: "info",
        title: "Motor Cooling Sleeve Required in Wide Well",
        detail: `Inside a ${BOREHOLE_CASING_LABELS[inputs.boreholeCasingInch]}, install a PVC/stainless flow-inducer sleeve around a submersible motor so rising water cools the stator properly.`,
      });
    } else if (inputs.boreholeCasingInch === "3") {
      alerts.push({
        severity: "warning",
        title: '3" Narrow Casing Restriction',
        detail: 'A 3-inch (~76mm ID) casing fits slim 3-inch pumps only; standard 4-inch (98mm OD) submersible pumps will jam. Verify outside diameter before lowering.',
      });
    }
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

  // VFD sizing rule: 1.25x headroom plus +1% altitude derate per 100m above 1000m
  const altitudeVfdDerate =
    inputs.siteAltitudeM > 1000 ? 1 + ((inputs.siteAltitudeM - 1000) / 100) * 0.01 : 1;
  const recommendedVfdKw = Math.max(recommendedMotorKw, electricalInputPowerKw * 1.25) * altitudeVfdDerate;

  const dailyEnergyKwh = electricalInputPowerKw * operatingHours;
  const specificEnergyKwhPerM3 =
    dailyGrossVolumeM3 > 0 ? dailyEnergyKwh / dailyGrossVolumeM3 : 0;

  // 4. Sandia / NOCT Weather Physics + Solar PV + String Optimizer
  const psh = clamp(inputs.peakSunHours, 2.5, 8.5);
  const ambientC = clamp(inputs.ambientDayTempC, 5, 50);
  const windMs = clamp(inputs.windSpeedMs, 0.2, 12);
  const noctC = clamp(inputs.panelNoctC, 38, 52);
  const gammaPct = clamp(inputs.panelGammaPmaxPct, -0.6, -0.15);
  const betaVocPct = clamp(inputs.panelBetaVocPct, -0.45, -0.15);

  const computeCellTemp = (irradianceWm2: number) =>
    ambientC + (irradianceWm2 / 800) * (noctC - 20) * (9.5 / (5.7 + 3.8 * windMs));

  const estimatedDayCellTempC = computeCellTemp(950);
  const computedThermalLossPct = Math.max(
    0,
    Math.min(30, -gammaPct * Math.max(0, estimatedDayCellTempC - 25)),
  );
  const recommendedPanelTiltDeg = 12; // Self-cleaning rain runoff near Kenyan equator

  const tempDerate = 1 - computedThermalLossPct / 100;
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
      )} PSH window requires array oversizing or faster pumping into a storage buffer tank to avoid current clipping.`,
    });
  }

  // PV String Optimizer (with datasheet beta_Voc cold check & Sandia hot Vmp check)
  const panelW = clamp(inputs.panelWatts, 100, 800);
  const panelVmp = clamp(inputs.panelVmp, 15, 70);
  const panelVoc = clamp(inputs.panelVoc, 18, 90);
  const coldDeltaC = Math.max(0, 25 - clamp(inputs.minMorningTempC, -5, 30));
  const coldVocFactor = 1 + (Math.abs(betaVocPct) / 100) * coldDeltaC;
  const hotDeltaC = Math.max(0, estimatedDayCellTempC - 25);
  const hotVmpFactor = Math.max(0.75, 1 - (Math.abs(betaVocPct) / 100) * hotDeltaC);

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

  // Weather / Cloud-Cover Output Simulation (Centrifugal affinity P ~ n^3, H ~ n^2)
  const simWm2 = clamp(inputs.skyIrradianceWm2, 100, 1200);
  const cloudCellTempC = computeCellTemp(simWm2);
  const cloudThermalFactor = Math.max(0.68, 1 + (gammaPct / 100) * Math.max(0, cloudCellTempC - 25));
  const arrayOutputW =
    inputs.powerMode === "ac_grid_generator"
      ? electricalInputPowerW
      : installedArrayWp * (simWm2 / 1000) * cloudThermalFactor * dustMismatch * ctrlEff;
  const powerRatio = Math.max(0, arrayOutputW / Math.max(1, electricalInputPowerW));
  const speedRatio = Math.min(1.04, Math.pow(powerRatio, 1 / 3));
  const estimatedHz = Math.round(speedRatio * 50);
  // Centrifugal shutoff frequency needed to crack check valve past static + elevation head
  const staticOnlyHeadM = effectiveStaticM + Math.max(0, elevationGainM + dischargeHeightM);
  const nominalShutoffRefM = Math.max(totalDynamicHeadM * 1.45, staticOnlyHeadM * 1.15, 10);
  const minCutoffHz = Math.min(
    46,
    Math.max(25, Math.round(50 * Math.sqrt(Math.max(0.15, staticOnlyHeadM / nominalShutoffRefM)))),
  );
  const canLiftWater =
    inputs.powerMode === "ac_grid_generator" ||
    inputs.powerMode === "solar_hybrid" ||
    estimatedHz >= minCutoffHz;
  const estimatedCloudFlowM3h = canLiftWater
    ? Number(
        Math.min(
          designFlowM3h * 1.05,
          designFlowM3h * Math.max(0, (estimatedHz - minCutoffHz * 0.4) / (50 - minCutoffHz * 0.4)),
        ).toFixed(2),
      )
    : 0;
  const cloudSummary =
    inputs.powerMode === "ac_grid_generator"
      ? `Continuous grid/generator power delivers full ${designFlowM3h.toFixed(1)} m³/h at 50 Hz.`
      : inputs.powerMode === "solar_hybrid"
        ? `At ${simWm2} W/m², PV delivers ~${Math.round(arrayOutputW)} W; battery/inverter sustains 50 Hz delivery.`
        : canLiftWater
          ? `At ${simWm2} W/m² (${cloudCellTempC.toFixed(0)}°C cell), PV outputs ~${Math.round(
              arrayOutputW,
            )} W -> ~${estimatedHz} Hz (~${estimatedCloudFlowM3h.toFixed(1)} m³/h).`
          : `Under ${simWm2} W/m², array (~${Math.round(
              arrayOutputW,
            )} W) slows to ~${estimatedHz} Hz, below ~${minCutoffHz} Hz check-valve cutoff — rely on buffer tank.`;

  const cloudSimulation = {
    skyWm2: simWm2,
    cloudCellTempC,
    arrayOutputW,
    estimatedHz,
    minCutoffHz,
    canLiftWater,
    estimatedCloudFlowM3h,
    summary: cloudSummary,
  };

  const boreholeYieldUtilisationPct =
    inputs.sourceType === "borehole" &&
    typeof inputs.boreholeSafeYieldM3h === "number" &&
    inputs.boreholeSafeYieldM3h > 0
      ? Number(((designFlowM3h / inputs.boreholeSafeYieldM3h) * 100).toFixed(0))
      : null;

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
    boreholeRecommendedDepthM,
    boreholeDepthAlert,
    hydraulicPowerW,
    hydraulicPowerKw,
    shaftPowerKw,
    electricalInputPowerW,
    electricalInputPowerKw,
    wireToWaterEfficiencyPct,
    recommendedMotorKw,
    recommendedMotorHp,
    nearestStandardHp,
    recommendedVfdKw,
    dailyEnergyKwh,
    specificEnergyKwhPerM3,
    estimatedDayCellTempC,
    computedThermalLossPct,
    recommendedPanelTiltDeg,
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
    cloudSimulation,
    batteryRequiredKwh,
    recommendedGeneratorKva,
    estimatedGridDailyCostKes,
    estimatedCostPerM3Kes,
    recommendedTankM3,
    recommendedTankLiters,
    customPumpEval,
    boreholeYieldUtilisationPct,
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

    // Physical 3" borehole casing clearance guard for 4" nominal pumps
    const diameterSignals = cleanSpecText(
      [
        product.specifications?.["Pump Diameter"],
        product.specifications?.Model,
        product.model_number,
        product.name,
      ]
        .filter(Boolean)
        .join(" "),
    );
    const isThreeInchPump = /\b3\s*(inch|")/i.test(diameterSignals) || /\b3sds/i.test(diameterSignals);
    const isFourInchPump =
      !isThreeInchPump &&
      (/\b4\s*(inch|")/i.test(diameterSignals) || /submersible/i.test(product.name));
    if (
      inputs.sourceType === "borehole" &&
      inputs.boreholeCasingInch === "3" &&
      isFourInchPump
    ) {
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

// ---------------------------------------------------------------------------
// 7. Interactive Pump Q-H Curve, System Resistance Curve & BEP (70-120% POR)
// ---------------------------------------------------------------------------

export type PumpCurveModelMode = "parabolic_endpoints" | "datasheet_3point";

export type PumpOperatingZoneVerdict =
  | "optimal_por"
  | "recirculation_left"
  | "runout_right"
  | "dead_head_blocked";

export interface PumpCurveConfig {
  mode: PumpCurveModelMode;
  label: string;
  maxFlowM3h: number;
  maxHeadM: number;
  /** Optional 3-point datasheet BEP flow (m3/h) & head (m) */
  bepFlowM3h?: number | null;
  bepHeadM?: number | null;
  /** Optional 3-point datasheet far-right point (m3/h & m) */
  runoutFlowM3h?: number | null;
  runoutHeadM?: number | null;
  /** Optional solar VFD speed preview (e.g. 38 Hz morning vs 50 Hz rated) */
  vfdFreqHz?: number | null;
  ratedFreqHz?: number;
}

export interface PumpCurvePlotPoint {
  flowM3h: number;
  pumpHeadM: number | null;
  systemHeadM: number;
  reducedSpeedHeadM: number | null;
}

export interface PumpCurveAnalysis {
  modeUsed: PumpCurveModelMode;
  pumpLabel: string;
  points: PumpCurvePlotPoint[];
  chartMaxFlowM3h: number;
  chartMaxHeadM: number;
  fixedStaticHeadM: number;
  dynamicLossAtDesignM: number;
  shutoffHeadM: number;
  zeroHeadFlowM3h: number;
  bepPoint: { flowM3h: number; headM: number };
  porMinFlowM3h: number;
  porMaxFlowM3h: number;
  operatingPoint: {
    flowM3h: number;
    headM: number;
    canOperate: boolean;
  };
  reducedSpeedOperatingPoint: {
    freqHz: number;
    flowM3h: number;
    headM: number;
    canOperate: boolean;
  } | null;
  designDemandPoint: {
    flowM3h: number;
    headM: number;
  };
  operatingPctOfBep: number;
  headMarginAtDesignM: number;
  porVerdict: PumpOperatingZoneVerdict;
  porVerdictLabel: string;
  staffExplanation: string;
  modelNote: string;
}

/**
 * Builds an interpolator H_pump(Q) for either:
 * 1) Parabolic Qmax/Hmax fit: H(Q) = Hmax * (1 - (Q / Qmax)^1.85), BEP ~ 0.62 * Qmax
 * 2) Exact 3-point datasheet calibration passing strictly through:
 *    (0, H_shutoff), (Q_bep, H_bep), and (Q_runout, H_runout).
 */
function createPumpHeadEvaluator(config: PumpCurveConfig): {
  modeUsed: PumpCurveModelMode;
  shutoffHeadM: number;
  zeroHeadFlowM3h: number;
  bepFlowM3h: number;
  bepHeadM: number;
  evalHeadAtFlow: (flowM3h: number) => number;
  modelNote: string;
} {
  const h0 = Math.max(5, config.maxHeadM);
  const qMaxFallback = Math.max(0.5, config.maxFlowM3h);

  const hasValid3Point =
    config.mode === "datasheet_3point" &&
    typeof config.bepFlowM3h === "number" &&
    config.bepFlowM3h > 0 &&
    typeof config.bepHeadM === "number" &&
    config.bepHeadM > 0 &&
    config.bepHeadM < h0 &&
    typeof config.runoutFlowM3h === "number" &&
    config.runoutFlowM3h > config.bepFlowM3h;

  if (!hasValid3Point) {
    const qMax = qMaxFallback;
    const evalHead = (q: number): number => {
      if (q <= 0) return h0;
      if (q >= qMax) return 0;
      return Math.max(0, h0 * (1 - Math.pow(q / qMax, 1.85)));
    };
    const estBepQ = Number((qMax * 0.62).toFixed(2));
    return {
      modeUsed: "parabolic_endpoints",
      shutoffHeadM: h0,
      zeroHeadFlowM3h: qMax,
      bepFlowM3h: estBepQ,
      bepHeadM: evalHead(estBepQ),
      evalHeadAtFlow: evalHead,
      modelNote:
        "Parabolic affinity fit from datasheet Qmax & Hmax endpoints (BEP approximated at ~62% Qmax). Switch to 3-Point Datasheet Calibration when reading exact OEM pump curve coordinates.",
    };
  }

  const q1 = config.bepFlowM3h as number;
  const h1 = config.bepHeadM as number;
  const q2 = config.runoutFlowM3h as number;
  const h2Raw =
    typeof config.runoutHeadM === "number" && config.runoutHeadM >= 0
      ? Math.min(config.runoutHeadM, h1 - 0.5)
      : 0;
  const h2 = Math.max(0, h2Raw);

  const dH1 = h0 - h1;
  const dH2 = h0 - h2;

  // Attempt physically monotone power law H(Q) = H0 - dH1 * (Q / Q1)^p
  let exponent = 0;
  if (dH1 > 0 && dH2 > dH1 && q2 > q1) {
    exponent = Math.log(dH2 / dH1) / Math.log(q2 / q1);
  }

  if (Number.isFinite(exponent) && exponent >= 1.1 && exponent <= 4.2) {
    const qZero = q1 * Math.pow(h0 / dH1, 1 / exponent);
    const evalHead = (q: number): number => {
      if (q <= 0) return h0;
      if (q >= qZero) return 0;
      return Math.max(0, h0 - dH1 * Math.pow(q / q1, exponent));
    };
    return {
      modeUsed: "datasheet_3point",
      shutoffHeadM: h0,
      zeroHeadFlowM3h: qZero,
      bepFlowM3h: q1,
      bepHeadM: h1,
      evalHeadAtFlow: evalHead,
      modelNote: `Calibrated 3-point OEM datasheet curve passing exactly through Shutoff (${h0.toFixed(
        0,
      )} m), BEP (${q1.toFixed(1)} m³/h @ ${h1.toFixed(0)} m), and Runout (${q2.toFixed(
        1,
      )} m³/h @ ${h2.toFixed(0)} m) with exponent p=${exponent.toFixed(2)}.`,
    };
  }

  // Safe piecewise monotone linear-quadratic blend passing strictly through all 3 points
  const qZero =
    h2 <= 0
      ? q2
      : q2 + (h2 * (q2 - q1)) / Math.max(0.5, h1 - h2);
  const evalHead = (q: number): number => {
    if (q <= 0) return h0;
    if (q <= q1) {
      const t = q / q1;
      return h0 - (h0 - h1) * Math.pow(t, 1.35);
    }
    if (q <= q2) {
      const t = (q - q1) / (q2 - q1);
      return h1 - (h1 - h2) * Math.pow(t, 1.15);
    }
    if (q >= qZero) return 0;
    const t = (q - q2) / Math.max(0.1, qZero - q2);
    return Math.max(0, h2 * (1 - t));
  };

  return {
    modeUsed: "datasheet_3point",
    shutoffHeadM: h0,
    zeroHeadFlowM3h: qZero,
    bepFlowM3h: q1,
    bepHeadM: h1,
    evalHeadAtFlow: evalHead,
    modelNote: `Calibrated 3-point piecewise datasheet fit through Shutoff (${h0.toFixed(
      0,
    )} m), BEP (${q1.toFixed(1)} m³/h @ ${h1.toFixed(0)} m), and Runout (${q2.toFixed(
      1,
    )} m³/h @ ${h2.toFixed(0)} m).`,
  };
}

function solveCurveIntersection(
  pumpHeadFn: (q: number) => number,
  sysHeadFn: (q: number) => number,
  maxFlowM3h: number,
): { flowM3h: number; headM: number; canOperate: boolean } {
  if (pumpHeadFn(0) <= sysHeadFn(0) + 0.05) {
    return { flowM3h: 0, headM: pumpHeadFn(0), canOperate: false };
  }
  let lo = 0;
  let hi = Math.max(0.5, maxFlowM3h);
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (pumpHeadFn(mid) > sysHeadFn(mid)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const q = Number(((lo + hi) / 2).toFixed(2));
  const h = Number(sysHeadFn(q).toFixed(1));
  return { flowM3h: q, headM: h, canOperate: q > 0.05 };
}

/**
 * Generates synchronized Pump Q-H curve, Farm System Resistance curve (Hazen-Williams Q^1.852),
 * 70%-120% BEP Preferred Operating Range (POR) diagnostics, and optional VFD reduced-Hz curve.
 */
export function analyzePumpSystemCurves(
  result: PumpSolarResult,
  config: PumpCurveConfig,
): PumpCurveAnalysis {
  const evaluator = createPumpHeadEvaluator(config);
  const designFlowM3h = Math.max(0.2, result.designFlowM3h);
  const dynamicLossAtDesignM = Math.max(
    0,
    result.totalPipeFrictionM + result.fittingsMinorLossM,
  );
  const fixedStaticHeadM = Math.max(
    0,
    result.totalDynamicHeadM - dynamicLossAtDesignM,
  );

  const evalSystemHead = (q: number): number => {
    if (q <= 0) return fixedStaticHeadM;
    return fixedStaticHeadM + dynamicLossAtDesignM * Math.pow(q / designFlowM3h, 1.852);
  };

  const operatingPoint = solveCurveIntersection(
    evaluator.evalHeadAtFlow,
    evalSystemHead,
    evaluator.zeroHeadFlowM3h,
  );

  const ratedHz = config.ratedFreqHz && config.ratedFreqHz > 0 ? config.ratedFreqHz : 50;
  const activeVfdHz =
    typeof config.vfdFreqHz === "number" && config.vfdFreqHz > 10 && config.vfdFreqHz < ratedHz
      ? config.vfdFreqHz
      : null;

  const evalReducedSpeedHead = (q: number): number => {
    if (!activeVfdHz) return 0;
    const ratio = activeVfdHz / ratedHz;
    if (ratio <= 0) return 0;
    return ratio * ratio * evaluator.evalHeadAtFlow(q / ratio);
  };

  const reducedSpeedOperatingPoint = activeVfdHz
    ? {
        freqHz: activeVfdHz,
        ...solveCurveIntersection(
          evalReducedSpeedHead,
          evalSystemHead,
          evaluator.zeroHeadFlowM3h * (activeVfdHz / ratedHz),
        ),
      }
    : null;

  const porMinFlowM3h = Number((evaluator.bepFlowM3h * 0.7).toFixed(2));
  const porMaxFlowM3h = Number((evaluator.bepFlowM3h * 1.2).toFixed(2));

  const chartMaxFlowM3h = Number(
    Math.max(
      evaluator.zeroHeadFlowM3h * 1.06,
      designFlowM3h * 1.2,
      porMaxFlowM3h * 1.08,
    ).toFixed(2),
  );

  const sysHeadAtDesign = evalSystemHead(designFlowM3h);
  const pumpHeadAtDesign = evaluator.evalHeadAtFlow(designFlowM3h);
  const headMarginAtDesignM = Number((pumpHeadAtDesign - sysHeadAtDesign).toFixed(1));

  const chartMaxHeadM = Math.max(
    evaluator.shutoffHeadM * 1.08,
    result.totalDynamicHeadM * 1.15,
    evalSystemHead(Math.min(chartMaxFlowM3h, evaluator.zeroHeadFlowM3h)) * 1.05,
    20,
  );

  const steps = 40;
  const points: PumpCurvePlotPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const q = Number(((chartMaxFlowM3h * i) / steps).toFixed(2));
    const pHead = q <= evaluator.zeroHeadFlowM3h + 0.01 ? evaluator.evalHeadAtFlow(q) : null;
    const sHead = evalSystemHead(q);
    const rHead =
      activeVfdHz && q <= evaluator.zeroHeadFlowM3h * (activeVfdHz / ratedHz) + 0.01
        ? evalReducedSpeedHead(q)
        : null;
    points.push({
      flowM3h: q,
      pumpHeadM: pHead !== null ? Number(pHead.toFixed(1)) : null,
      systemHeadM: Number(sHead.toFixed(1)),
      reducedSpeedHeadM: rHead !== null ? Number(rHead.toFixed(1)) : null,
    });
  }

  const operatingPctOfBep =
    evaluator.bepFlowM3h > 0
      ? Math.round((operatingPoint.flowM3h / evaluator.bepFlowM3h) * 100)
      : 0;

  let porVerdict: PumpOperatingZoneVerdict;
  let porVerdictLabel: string;
  let staffExplanation: string;

  if (!operatingPoint.canOperate) {
    porVerdict = "dead_head_blocked";
    porVerdictLabel = "Dead-Head / Zero Flow Risk";
    staffExplanation = `Shutoff head (${evaluator.shutoffHeadM.toFixed(
      0,
    )} m) cannot exceed your fixed static lift + required working pressure (${fixedStaticHeadM.toFixed(
      0,
    )} m). Water will spin inside the casing, overheat, and burn seals — select a higher-head multistage pump.`;
  } else if (operatingPctOfBep < 70) {
    porVerdict = "recirculation_left";
    porVerdictLabel = "Left of BEP — Recirculation Zone (<70% BEP)";
    staffExplanation = `Duty intersection (${operatingPoint.flowM3h.toFixed(
      1,
    )} m³/h @ ${operatingPoint.headM.toFixed(
      0,
    )} m) sits left of the 70% BEP floor (${porMinFlowM3h.toFixed(
      1,
    )} m³/h). Running below 70% BEP causes internal fluid recirculation, shaft vibration, and excess motor heating. Pick a lower-flow pump or open another irrigation block.`;
  } else if (operatingPctOfBep > 120) {
    porVerdict = "runout_right";
    porVerdictLabel = "Right of BEP — Runout / Cavitation Risk (>120% BEP)";
    staffExplanation = `Duty intersection (${operatingPoint.flowM3h.toFixed(
      1,
    )} m³/h @ ${operatingPoint.headM.toFixed(
      0,
    )} m) pushes past 120% BEP (${porMaxFlowM3h.toFixed(
      1,
    )} m³/h) into runout. Expect higher motor amps, down-thrust bearing wear, and suction cavitation risk. Slightly throttle discharge or pick a higher-capacity pump.`;
  } else {
    porVerdict = "optimal_por";
    porVerdictLabel = `Optimal POR (${operatingPctOfBep}% of BEP)`;
    staffExplanation = `Duty point (${operatingPoint.flowM3h.toFixed(
      1,
    )} m³/h @ ${operatingPoint.headM.toFixed(
      0,
    )} m) lands squarely inside the 70%–120% Preferred Operating Range (${porMinFlowM3h.toFixed(
      1,
    )}–${porMaxFlowM3h.toFixed(
      1,
    )} m³/h). Minimum radial thrust, peak hydraulic efficiency, and longest bearing life.`;
  }

  return {
    modeUsed: evaluator.modeUsed,
    pumpLabel: config.label,
    points,
    chartMaxFlowM3h,
    chartMaxHeadM: Math.ceil(chartMaxHeadM / 10) * 10,
    fixedStaticHeadM: Number(fixedStaticHeadM.toFixed(1)),
    dynamicLossAtDesignM: Number(dynamicLossAtDesignM.toFixed(1)),
    shutoffHeadM: Number(evaluator.shutoffHeadM.toFixed(1)),
    zeroHeadFlowM3h: Number(evaluator.zeroHeadFlowM3h.toFixed(2)),
    bepPoint: {
      flowM3h: Number(evaluator.bepFlowM3h.toFixed(2)),
      headM: Number(evaluator.bepHeadM.toFixed(1)),
    },
    porMinFlowM3h,
    porMaxFlowM3h,
    operatingPoint,
    reducedSpeedOperatingPoint,
    designDemandPoint: {
      flowM3h: Number(designFlowM3h.toFixed(2)),
      headM: Number(sysHeadAtDesign.toFixed(1)),
    },
    operatingPctOfBep,
    headMarginAtDesignM,
    porVerdict,
    porVerdictLabel,
    staffExplanation,
    modelNote: evaluator.modelNote,
  };
}
