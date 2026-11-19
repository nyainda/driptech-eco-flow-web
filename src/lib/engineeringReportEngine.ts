import type {
  BOQItem,
  BOQSection,
  CatalogueProduct,
} from "@/components/Admin/Quote/BOQSectionBuilder";
import {
  analyzePumpSystemCurves,
  calculatePumpSolarSystem,
  CatalogPumpProduct,
  DEFAULT_PUMP_SOLAR_INPUTS,
  matchCatalogPumps,
  MatchedPumpRecommendation,
  PumpCurveAnalysis,
  PumpCurveConfig,
  PumpSolarInputs,
  PumpSolarResult,
} from "@/lib/pumpSolarSizing";

export type FieldSystemType = "none" | "drip" | "sprinkler" | "raingun";
export type DamStorageMode = "none" | "hdpe_dam_liner" | "elevated_tank";
export type HydraulicCouplingMode = "direct_pressurized" | "fill_storage_tank";
export type ReportEdition = "full_engineering" | "client_proposal";
export type LateralTakeoffStyle = "takeoff_grommet" | "mini_valves";

export interface FieldIrrigationConfig {
  systemType: FieldSystemType;
  cropName: string;
  acres: number;
  zones: number;
  simultaneousZones: number;
  cropWaterMmDay: number;

  // Mainline & Submain Piping Runs (0 = auto-derive from plot geometry)
  mainlineLengthM: number;
  submainLengthM: number;

  // Drip layout & headworks accessories
  rowSpacingM: number;
  lateralsPerBed: number;
  emitterSpacingCm: number;
  emitterFlowLph: number;
  rollLengthM: number;
  lateralRunLengthM: number;
  wastePct: number;
  dripWorkingBar: number;
  includeVenturiFertigation: boolean;
  includePressureRegulator: boolean;
  includeAirReleaseValve: boolean;
  includeFlushManifold: boolean;
  lateralTakeoffStyle: LateralTakeoffStyle;
  filtrationType: "disc" | "screen" | "sand_media";

  // Sprinkler layout
  sprinklerSpacingM: number;
  sprinklerNozzleFlowM3h: number;
  sprinklerWorkingBar: number;
  riserHeightM: number;

  // Rain gun layout
  raingunWettingRadiusM: number;
  raingunFlowM3h: number;
  raingunWorkingBar: number;
  raingunHydrants: number;
  simultaneousGuns: number;
}

export interface DamStorageConfig {
  mode: DamStorageMode;
  topLengthM: number;
  topWidthM: number;
  depthM: number;
  sideSlopeRatio: number; // H:V (e.g. 1.0 = 1H:1V)
  linerThicknessMm: 0.5 | 0.75 | 1.0;
  anchorTrenchAllowanceM: number;
  targetReserveDays: number;
}

export interface ClientReportMetadata {
  reportCode: string;
  reportEdition: ReportEdition;
  preparedDate: string;
  engineerName: string;
  engineerPhone: string;
  clientName: string;
  companyFarmName: string;
  clientPhone: string;
  clientEmail: string;
  countyLocation: string;
  projectTitle: string;
  waterSourceSummary: string;
  siteNotes: string;
  validityDays: number;
  includeVat: boolean;
  vatRatePct: number;
  paymentTerms: string;
}

export interface EngineeringReportSeed {
  clientName?: string;
  companyFarmName?: string;
  clientPhone?: string;
  clientEmail?: string;
  countyLocation?: string;
  projectTitle?: string;
  acres?: number;
  cropName?: string;
  systemType?: FieldSystemType;
  siteNotes?: string;
  customerId?: string;
  reportEdition?: ReportEdition;
  sourceModule?: string;
}

export interface FieldHydraulicsSummary {
  systemType: FieldSystemType;
  areaSqm: number;
  dailyGrossWaterM3: number;
  activeBlockFlowM3h: number;
  requiredWorkingBar: number;
  filtrationLossM: number;
  runtimeHoursPerDay: number;
  recommendedMainlineOdMm: number;
  recommendedSubmainOdMm: number;
  derivedMainlineLengthM: number;
  derivedSubmainLengthM: number;
  filtrationCapacityM3h: number;
  filtrationRecommendation: string;
  bomQuantities: {
    driplineRolls: number;
    totalDriplineM: number;
    startConnectors: number;
    grommets: number;
    peRepairJoiners: number;
    endCaps: number;
    holePunchTools: number;
    sprinklerHeads: number;
    sprinklerRisers: number;
    raingunUnits: number;
    hydrantOutlets: number;
    zoneIsolationValves: number;
    airReleaseValves: number;
    pressureGauges: number;
    pressureRegulators: number;
    flushAssemblies: number;
    mainlineElbows: number;
    submainTees: number;
    reducingCouplers: number;
    straightCouplers: number;
    threadedAdaptersMtaFta: number;
    saddleClamps: number;
    teflonTapeRolls: number;
    venturiSets: number;
    precipitationRateMmHr: number | null;
  };
}

export interface DamStorageSummary {
  mode: DamStorageMode;
  volumeM3: number;
  volumeLiters: number;
  bottomLengthM: number;
  bottomWidthM: number;
  linerSheetLengthM: number;
  linerSheetWidthM: number;
  linerAreaSqm: number;
  daysOfReserve: number;
  verdict: string;
}

export interface CompleteEngineeringDesign {
  fieldSummary: FieldHydraulicsSummary;
  damSummary: DamStorageSummary;
  syncedPumpInputs: PumpSolarInputs;
  pumpResult: PumpSolarResult;
  curveAnalysis: PumpCurveAnalysis;
  matchedPumps: MatchedPumpRecommendation[];
}

export const DEFAULT_FIELD_CONFIG: FieldIrrigationConfig = {
  systemType: "drip",
  cropName: "Tomatoes / High-Value Horticulture",
  acres: 2,
  zones: 2,
  simultaneousZones: 1,
  cropWaterMmDay: 5.5,

  mainlineLengthM: 0, // 0 = Auto-derived from farm geometry
  submainLengthM: 0, // 0 = Auto-derived from zones & plot dimensions

  rowSpacingM: 1.0,
  lateralsPerBed: 1,
  emitterSpacingCm: 20,
  emitterFlowLph: 1.6,
  rollLengthM: 1000,
  lateralRunLengthM: 50,
  wastePct: 8,
  dripWorkingBar: 1.2,
  includeVenturiFertigation: true,
  includePressureRegulator: true,
  includeAirReleaseValve: true,
  includeFlushManifold: true,
  lateralTakeoffStyle: "takeoff_grommet",
  filtrationType: "disc",

  sprinklerSpacingM: 12,
  sprinklerNozzleFlowM3h: 1.3,
  sprinklerWorkingBar: 2.8,
  riserHeightM: 1.0,

  raingunWettingRadiusM: 32,
  raingunFlowM3h: 18,
  raingunWorkingBar: 4.2,
  raingunHydrants: 6,
  simultaneousGuns: 1,
};

export const DEFAULT_DAM_CONFIG: DamStorageConfig = {
  mode: "none",
  topLengthM: 15,
  topWidthM: 12,
  depthM: 3.0,
  sideSlopeRatio: 1.0,
  linerThicknessMm: 0.75,
  anchorTrenchAllowanceM: 1.5,
  targetReserveDays: 5,
};

export const DEFAULT_CLIENT_REPORT_META: ClientReportMetadata = {
  reportCode: "",
  reportEdition: "full_engineering",
  preparedDate: new Date().toISOString().slice(0, 10),
  engineerName: "DripTech Hydraulic Engineering Team",
  engineerPhone: "0723 407 849",
  clientName: "",
  companyFarmName: "",
  clientPhone: "",
  clientEmail: "",
  countyLocation: "Nakuru / Rift Valley",
  projectTitle: "Integrated Solar Borehole, Pump & Irrigation Engineering Proposal",
  waterSourceSummary: "Borehole / Farm Water Supply",
  siteNotes: "",
  validityDays: 30,
  includeVat: false,
  vatRatePct: 16,
  paymentTerms:
    "50% mobilization deposit upon BOQ approval, 40% upon equipment delivery on site, 10% after hydrostatic pressure testing, Megger audit & operator handover.",
};

export function generateAdminEngReportCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `DT-ENG-${yy}${mm}${dd}-${suffix}`;
}

function selectRecommendedHdpeOdMm(flowM3h: number): number {
  if (flowM3h <= 3.2) return 32;
  if (flowM3h <= 5.5) return 40;
  if (flowM3h <= 9.5) return 50;
  if (flowM3h <= 16) return 63;
  if (flowM3h <= 25) return 75;
  if (flowM3h <= 38) return 90;
  return 110;
}

export function calculateFieldHydraulics(field: FieldIrrigationConfig): FieldHydraulicsSummary {
  const acres = Math.max(0.1, field.acres || 1);
  const areaSqm = acres * 4046.856;
  const zones = Math.max(1, Math.round(field.zones || 1));
  const simZones = Math.min(zones, Math.max(1, Math.round(field.simultaneousZones || 1)));

  const derivedMainlineLengthM =
    field.mainlineLengthM && field.mainlineLengthM > 0
      ? Math.round(field.mainlineLengthM)
      : Math.max(40, Math.round(Math.sqrt(areaSqm) * 1.15));

  const derivedSubmainLengthM =
    field.submainLengthM && field.submainLengthM > 0
      ? Math.round(field.submainLengthM)
      : Math.max(30, Math.round(Math.sqrt(areaSqm) * 0.9 * Math.min(zones, 4)));

  if (field.systemType === "none") {
    return {
      systemType: "none",
      areaSqm,
      dailyGrossWaterM3: 0,
      activeBlockFlowM3h: 0,
      requiredWorkingBar: 0.5,
      filtrationLossM: 1.5,
      runtimeHoursPerDay: 6,
      recommendedMainlineOdMm: 50,
      recommendedSubmainOdMm: 40,
      derivedMainlineLengthM,
      derivedSubmainLengthM: 0,
      filtrationCapacityM3h: 0,
      filtrationRecommendation: "Pump suction strainer only (water transfer / tank filling).",
      bomQuantities: {
        driplineRolls: 0,
        totalDriplineM: 0,
        startConnectors: 0,
        grommets: 0,
        peRepairJoiners: 0,
        endCaps: 0,
        holePunchTools: 0,
        sprinklerHeads: 0,
        sprinklerRisers: 0,
        raingunUnits: 0,
        hydrantOutlets: 0,
        zoneIsolationValves: 0,
        airReleaseValves: 0,
        pressureGauges: 0,
        pressureRegulators: 0,
        flushAssemblies: 0,
        mainlineElbows: 0,
        submainTees: 0,
        reducingCouplers: 0,
        straightCouplers: 0,
        threadedAdaptersMtaFta: 0,
        saddleClamps: 0,
        teflonTapeRolls: 0,
        venturiSets: 0,
        precipitationRateMmHr: null,
      },
    };
  }

  if (field.systemType === "drip") {
    const efficiency = 0.9;
    const netM3 = (areaSqm * Math.max(1, field.cropWaterMmDay)) / 1000;
    const dailyGrossWaterM3 = Number((netM3 / efficiency).toFixed(2));
    const bedSpacing = Math.max(0.3, field.rowSpacingM || 1.0);
    const rawMetres = (areaSqm / bedSpacing) * Math.max(1, field.lateralsPerBed || 1);
    const totalDriplineM = Math.ceil(rawMetres * (1 + Math.max(0, field.wastePct || 0) / 100));
    const rollLen = Math.max(100, field.rollLengthM || 1000);
    const driplineRolls = Math.max(1, Math.ceil(totalDriplineM / rollLen));
    const emittersTotal = Math.ceil((rawMetres * 100) / Math.max(10, field.emitterSpacingCm || 20));
    const emittersActive = (emittersTotal / zones) * simZones;
    const activeBlockFlowM3h = Number(((emittersActive * Math.max(0.5, field.emitterFlowLph || 1.6)) / 1000).toFixed(2));
    const approxLaterals = Math.max(zones, Math.ceil(rawMetres / Math.max(15, field.lateralRunLengthM || 50)));
    const runtimeHoursPerDay = Number((dailyGrossWaterM3 / Math.max(0.3, activeBlockFlowM3h)).toFixed(2));
    const filtCap = Math.ceil((activeBlockFlowM3h * 1.25) / 5) * 5 || 5;
    const mainlineOd = selectRecommendedHdpeOdMm(activeBlockFlowM3h);
    const submainOd = Math.max(32, mainlineOd >= 63 ? 50 : mainlineOd);

    return {
      systemType: "drip",
      areaSqm,
      dailyGrossWaterM3,
      activeBlockFlowM3h,
      requiredWorkingBar: Math.max(0.8, field.dripWorkingBar || 1.2),
      filtrationLossM: field.filtrationType === "sand_media" ? 6 : 4,
      runtimeHoursPerDay,
      recommendedMainlineOdMm: mainlineOd,
      recommendedSubmainOdMm: submainOd,
      derivedMainlineLengthM,
      derivedSubmainLengthM,
      filtrationCapacityM3h: filtCap,
      filtrationRecommendation:
        field.filtrationType === "sand_media"
          ? `${filtCap} m³/h Dual Sand Media + 120-Mesh Disc Backup Filter (river/open dam organic solids)`
          : `${filtCap} m³/h Heavy-Duty 120-Mesh (130-Micron) ${
              field.filtrationType === "disc" ? "Disc" : "Screen"
            } Filter`,
      bomQuantities: {
        driplineRolls,
        totalDriplineM,
        startConnectors: Math.ceil(approxLaterals * 1.05),
        grommets: Math.ceil(approxLaterals * 1.05),
        peRepairJoiners: Math.max(10, Math.ceil(approxLaterals * 0.12)),
        endCaps: Math.ceil(approxLaterals * 1.05),
        holePunchTools: Math.max(1, Math.min(3, Math.ceil(acres / 2))),
        sprinklerHeads: 0,
        sprinklerRisers: 0,
        raingunUnits: 0,
        hydrantOutlets: 0,
        zoneIsolationValves: zones,
        airReleaseValves: field.includeAirReleaseValve !== false ? Math.max(1, Math.ceil(zones / 2)) : 0,
        pressureGauges: 2,
        pressureRegulators: field.includePressureRegulator !== false ? Math.max(1, zones) : 0,
        flushAssemblies: field.includeFlushManifold !== false ? zones : 0,
        mainlineElbows: Math.max(4, Math.round(zones * 1.5) + 2),
        submainTees: zones,
        reducingCouplers: mainlineOd !== submainOd ? zones : 0,
        straightCouplers: Math.max(2, Math.floor((derivedMainlineLengthM + derivedSubmainLengthM) / 100) + 1),
        threadedAdaptersMtaFta: zones * 3 + 6,
        saddleClamps: 0,
        teflonTapeRolls: Math.max(5, zones * 3),
        venturiSets: field.includeVenturiFertigation ? 1 : 0,
        precipitationRateMmHr: null,
      },
    };
  }

  if (field.systemType === "sprinkler") {
    const efficiency = 0.78;
    const netM3 = (areaSqm * Math.max(1, field.cropWaterMmDay)) / 1000;
    const dailyGrossWaterM3 = Number((netM3 / efficiency).toFixed(2));
    const spacing = Math.max(4, field.sprinklerSpacingM || 12);
    const headFootprint = spacing * spacing;
    const totalHeads = Math.max(2, Math.ceil((areaSqm / headFootprint) * 1.05));
    const headsPerZone = Math.max(1, Math.ceil(totalHeads / zones));
    const activeHeads = Math.min(totalHeads, headsPerZone * simZones);
    const nozzleFlow = Math.max(0.3, field.sprinklerNozzleFlowM3h || 1.3);
    const activeBlockFlowM3h = Number((activeHeads * nozzleFlow).toFixed(2));
    const precipitationRateMmHr = Number(((nozzleFlow * 1000) / headFootprint).toFixed(1));
    const runtimeHoursPerDay = Number((dailyGrossWaterM3 / Math.max(0.5, activeBlockFlowM3h)).toFixed(2));
    const filtCap = Math.ceil((activeBlockFlowM3h * 1.2) / 5) * 5 || 10;
    const mainlineOd = selectRecommendedHdpeOdMm(activeBlockFlowM3h);
    const submainOd = Math.max(40, mainlineOd >= 75 ? 63 : mainlineOd);

    return {
      systemType: "sprinkler",
      areaSqm,
      dailyGrossWaterM3,
      activeBlockFlowM3h,
      requiredWorkingBar: Math.max(1.8, field.sprinklerWorkingBar || 2.8),
      filtrationLossM: 3.5,
      runtimeHoursPerDay,
      recommendedMainlineOdMm: mainlineOd,
      recommendedSubmainOdMm: submainOd,
      derivedMainlineLengthM,
      derivedSubmainLengthM,
      filtrationCapacityM3h: filtCap,
      filtrationRecommendation: `${filtCap} m³/h Inline 80–100 Mesh Screen Strainer for sprinkler nozzle protection`,
      bomQuantities: {
        driplineRolls: 0,
        totalDriplineM: 0,
        startConnectors: 0,
        grommets: 0,
        peRepairJoiners: 0,
        endCaps: 0,
        holePunchTools: 0,
        sprinklerHeads: totalHeads,
        sprinklerRisers: totalHeads,
        raingunUnits: 0,
        hydrantOutlets: 0,
        zoneIsolationValves: zones,
        airReleaseValves: field.includeAirReleaseValve !== false ? Math.max(1, Math.ceil(zones / 2)) : 0,
        pressureGauges: 2,
        pressureRegulators: 0,
        flushAssemblies: zones,
        mainlineElbows: Math.max(4, Math.round(zones * 1.5) + 2),
        submainTees: zones,
        reducingCouplers: mainlineOd !== submainOd ? zones : 0,
        straightCouplers: Math.max(2, Math.floor((derivedMainlineLengthM + derivedSubmainLengthM) / 100) + 2),
        threadedAdaptersMtaFta: zones * 2 + 4,
        saddleClamps: totalHeads,
        teflonTapeRolls: Math.max(6, Math.ceil(totalHeads / 4)),
        venturiSets: 0,
        precipitationRateMmHr,
      },
    };
  }

  // Rain Gun high-pressure overhead system
  const efficiency = 0.75;
  const netM3 = (areaSqm * Math.max(1, field.cropWaterMmDay)) / 1000;
  const dailyGrossWaterM3 = Number((netM3 / efficiency).toFixed(2));
  const simGuns = Math.max(1, Math.round(field.simultaneousGuns || 1));
  const activeBlockFlowM3h = Number((Math.max(5, field.raingunFlowM3h || 18) * simGuns).toFixed(2));
  const runtimeHoursPerDay = Number((dailyGrossWaterM3 / Math.max(1, activeBlockFlowM3h)).toFixed(2));
  const filtCap = Math.ceil((activeBlockFlowM3h * 1.15) / 10) * 10 || 20;
  const mainlineOd = selectRecommendedHdpeOdMm(activeBlockFlowM3h);
  const submainOd = Math.max(50, mainlineOd >= 90 ? 75 : mainlineOd);
  const hydrants = Math.max(simGuns, Math.round(field.raingunHydrants || 6));

  return {
    systemType: "raingun",
    areaSqm,
    dailyGrossWaterM3,
    activeBlockFlowM3h,
    requiredWorkingBar: Math.max(3.0, field.raingunWorkingBar || 4.2),
    filtrationLossM: 4,
    runtimeHoursPerDay,
    recommendedMainlineOdMm: mainlineOd,
    recommendedSubmainOdMm: submainOd,
    derivedMainlineLengthM,
    derivedSubmainLengthM,
    filtrationCapacityM3h: filtCap,
    filtrationRecommendation: `${filtCap} m³/h Heavy Screen Suction / Flanged Hydrocyclone Filter`,
    bomQuantities: {
      driplineRolls: 0,
      totalDriplineM: 0,
      startConnectors: 0,
      grommets: 0,
      peRepairJoiners: 0,
      endCaps: 0,
      holePunchTools: 0,
      sprinklerHeads: 0,
      sprinklerRisers: 0,
      raingunUnits: simGuns,
      hydrantOutlets: hydrants,
      zoneIsolationValves: hydrants,
      airReleaseValves: Math.max(1, Math.ceil(hydrants / 4)),
      pressureGauges: 2,
      pressureRegulators: 0,
      flushAssemblies: 2,
      mainlineElbows: Math.max(4, hydrants),
      submainTees: Math.max(2, Math.floor(hydrants / 2)),
      reducingCouplers: mainlineOd !== submainOd ? 2 : 0,
      straightCouplers: Math.max(2, Math.floor(derivedMainlineLengthM / 100) + 2),
      threadedAdaptersMtaFta: hydrants * 2 + 4,
      saddleClamps: hydrants,
      teflonTapeRolls: Math.max(6, hydrants * 2),
      venturiSets: 0,
      precipitationRateMmHr: Number(
        ((activeBlockFlowM3h * 1000) / (Math.PI * Math.pow(Math.max(15, field.raingunWettingRadiusM), 2))).toFixed(1),
      ),
    },
  };
}

export function calculateDamOrTankStorage(
  dam: DamStorageConfig,
  dailyGrossWaterM3: number,
  recommendedTankM3FromPump: number,
): DamStorageSummary {
  const safeDaily = Math.max(1, dailyGrossWaterM3 || 10);

  if (dam.mode === "none") {
    return {
      mode: "none",
      volumeM3: 0,
      volumeLiters: 0,
      bottomLengthM: 0,
      bottomWidthM: 0,
      linerSheetLengthM: 0,
      linerSheetWidthM: 0,
      linerAreaSqm: 0,
      daysOfReserve: 0,
      verdict: "Direct-to-field or client-supplied water storage.",
    };
  }

  if (dam.mode === "elevated_tank") {
    const targetM3 = Math.max(
      recommendedTankM3FromPump || 10,
      Math.ceil((safeDaily * Math.max(1, dam.targetReserveDays || 2)) / 5) * 5,
    );
    return {
      mode: "elevated_tank",
      volumeM3: targetM3,
      volumeLiters: targetM3 * 1000,
      bottomLengthM: 0,
      bottomWidthM: 0,
      linerSheetLengthM: 0,
      linerSheetWidthM: 0,
      linerAreaSqm: 0,
      daysOfReserve: Number((targetM3 / safeDaily).toFixed(1)),
      verdict: `${(targetM3 * 1000).toLocaleString()} L food-grade tank(s) on galvanized tower providing ${(targetM3 / safeDaily).toFixed(1)} days buffer reserve.`,
    };
  }

  // Trapezoidal HDPE Dam Liner / Water Pan geometry
  const topL = Math.max(4, dam.topLengthM || 15);
  const topW = Math.max(4, dam.topWidthM || 12);
  const depth = Math.max(1.2, dam.depthM || 3);
  const slope = Math.max(0.5, dam.sideSlopeRatio || 1.0);
  const horizontalSetback = slope * depth;

  const botL = Math.max(1.5, Number((topL - 2 * horizontalSetback).toFixed(2)));
  const botW = Math.max(1.5, Number((topW - 2 * horizontalSetback).toFixed(2)));
  const midL = (topL + botL) / 2;
  const midW = (topW + botW) / 2;

  // Prismoidal / trapezoidal formula: V = (D / 6) * (A_top + A_bot + 4 * A_mid)
  const aTop = topL * topW;
  const aBot = botL * botW;
  const aMid = midL * midW;
  const volumeM3 = Number(((depth / 6) * (aTop + aBot + 4 * aMid)).toFixed(1));
  const slantHeight = Math.sqrt(depth * depth + horizontalSetback * horizontalSetback);
  const anchorAllowance = Math.max(0.8, dam.anchorTrenchAllowanceM || 1.5);

  const rawSheetLen = botL + 2 * slantHeight + 2 * anchorAllowance;
  const rawSheetWid = botW + 2 * slantHeight + 2 * anchorAllowance;
  const linerAreaSqm = Math.ceil(rawSheetLen * rawSheetWid * 1.05); // +5% weld overlap
  const daysOfReserve = Number((volumeM3 / safeDaily).toFixed(1));

  return {
    mode: "hdpe_dam_liner",
    volumeM3,
    volumeLiters: Math.round(volumeM3 * 1000),
    bottomLengthM: botL,
    bottomWidthM: botW,
    linerSheetLengthM: Number(rawSheetLen.toFixed(1)),
    linerSheetWidthM: Number(rawSheetWid.toFixed(1)),
    linerAreaSqm,
    daysOfReserve,
    verdict: `${volumeM3.toLocaleString()} m³ (${Math.round(volumeM3 * 1000).toLocaleString()} L) pan requiring ~${linerAreaSqm.toLocaleString()} m² of ${dam.linerThicknessMm} mm UV-stabilized HDPE liner (${daysOfReserve} days crop reserve).`,
  };
}

export function buildSyncedPumpSolarInputs(
  basePumpInputs: PumpSolarInputs,
  field: FieldIrrigationConfig,
  fieldSummary: FieldHydraulicsSummary,
  couplingMode: HydraulicCouplingMode,
): PumpSolarInputs {
  if (field.systemType === "none" || fieldSummary.activeBlockFlowM3h <= 0) {
    return basePumpInputs;
  }

  if (couplingMode === "direct_pressurized") {
    return {
      ...basePumpInputs,
      demandMode: "direct_flow",
      areaValue: field.acres,
      areaUnit: "acres",
      irrigationMethod:
        field.systemType === "raingun"
          ? "raingun"
          : field.systemType === "sprinkler"
            ? "sprinkler"
            : "drip",
      directFlowValue: fieldSummary.activeBlockFlowM3h,
      directFlowUnit: "m3h",
      workingPressureBar: fieldSummary.requiredWorkingBar,
      filtrationValveLossM: fieldSummary.filtrationLossM,
      zonesCount: field.zones,
      simultaneousZones: field.simultaneousZones,
      operatingHoursPerDay: Math.max(
        2,
        Math.min(12, Math.round(fieldSummary.runtimeHoursPerDay * 10) / 10),
      ),
    };
  }

  // Storage Tank / Dam Pan fill mode: distribute daily gross demand over sunny hours at minimal outlet pressure
  const fillHours = Math.max(4, Math.min(8, basePumpInputs.operatingHoursPerDay || 6));
  const fillRateM3h = Number((fieldSummary.dailyGrossWaterM3 / fillHours).toFixed(2));
  return {
    ...basePumpInputs,
    demandMode: "direct_flow",
    areaValue: field.acres,
    areaUnit: "acres",
    irrigationMethod:
      field.systemType === "raingun"
        ? "raingun"
        : field.systemType === "sprinkler"
          ? "sprinkler"
          : "drip",
    directFlowValue: Math.max(0.5, fillRateM3h),
    directFlowUnit: "m3h",
    workingPressureBar: 0.3,
    filtrationValveLossM: 2.0,
    zonesCount: 1,
    simultaneousZones: 1,
    operatingHoursPerDay: fillHours,
  };
}

export function computeCompleteEngineeringDesign(params: {
  field: FieldIrrigationConfig;
  dam: DamStorageConfig;
  pumpInputs: PumpSolarInputs;
  couplingMode: HydraulicCouplingMode;
  catalogPumps: CatalogPumpProduct[];
  curveConfigOverride?: Partial<PumpCurveConfig>;
}): CompleteEngineeringDesign {
  const { field, dam, pumpInputs, couplingMode, catalogPumps, curveConfigOverride } = params;
  const fieldSummary = calculateFieldHydraulics(field);
  const syncedPumpInputs = buildSyncedPumpSolarInputs(
    pumpInputs,
    field,
    fieldSummary,
    couplingMode,
  );
  const pumpResult = calculatePumpSolarSystem(syncedPumpInputs);
  const damSummary = calculateDamOrTankStorage(
    dam,
    fieldSummary.dailyGrossWaterM3 || pumpResult.dailyGrossVolumeM3,
    pumpResult.recommendedTankM3,
  );
  const matchedPumps = matchCatalogPumps(catalogPumps, syncedPumpInputs, pumpResult);

  const primaryMatch = matchedPumps[0];
  const fallbackQmax = Number((pumpResult.designFlowM3h / 0.62).toFixed(1));
  const fallbackHmax = Math.ceil((pumpResult.totalDynamicHeadM / 0.58) / 5) * 5;

  const curveCfg: PumpCurveConfig = {
    mode: curveConfigOverride?.mode ?? "parabolic_endpoints",
    label:
      curveConfigOverride?.label ??
      (syncedPumpInputs.customPump.enabled
        ? syncedPumpInputs.customPump.name
        : primaryMatch?.product.name || `Matched ${pumpResult.nearestStandardHp} HP Pump`),
    maxFlowM3h:
      curveConfigOverride?.maxFlowM3h ??
      (syncedPumpInputs.customPump.enabled
        ? syncedPumpInputs.customPump.maxFlowM3h
        : primaryMatch?.specs.maxFlowM3h || Math.max(2, fallbackQmax)),
    maxHeadM:
      curveConfigOverride?.maxHeadM ??
      (syncedPumpInputs.customPump.enabled
        ? syncedPumpInputs.customPump.maxHeadM
        : primaryMatch?.specs.maxHeadM || Math.max(20, fallbackHmax)),
    bepFlowM3h: curveConfigOverride?.bepFlowM3h,
    bepHeadM: curveConfigOverride?.bepHeadM,
    runoutFlowM3h: curveConfigOverride?.runoutFlowM3h,
    runoutHeadM: curveConfigOverride?.runoutHeadM,
    vfdFreqHz: curveConfigOverride?.vfdFreqHz ?? 42,
    ratedFreqHz: 50,
  };

  const curveAnalysis = analyzePumpSystemCurves(pumpResult, curveCfg);

  return {
    fieldSummary,
    damSummary,
    syncedPumpInputs,
    pumpResult,
    curveAnalysis,
    matchedPumps,
  };
}

function findBestCatalogProduct(
  products: CatalogueProduct[],
  keywords: string[],
  categoryHint?: string,
): CatalogueProduct | null {
  let best: CatalogueProduct | null = null;
  let bestScore = 0;

  for (const prod of products) {
    if (/\(copy\)/i.test(prod.name)) continue;
    if (categoryHint && prod.category && prod.category !== categoryHint && !prod.name.toLowerCase().includes(keywords[0].toLowerCase())) {
      continue;
    }
    const text = `${prod.name} ${prod.model_number || ""} ${prod.description || ""}`.toLowerCase();
    let score = 0;
    for (let idx = 0; idx < keywords.length; idx++) {
      const kw = keywords[idx].toLowerCase();
      if (text.includes(kw)) {
        score += idx === 0 ? 15 : 10;
      }
    }
    if (score > bestScore && typeof prod.price === "number" && prod.price > 0) {
      bestScore = score;
      best = prod;
    } else if (score > bestScore && bestScore === 0) {
      best = prod;
      bestScore = score;
    }
  }

  return best;
}

function detectPipeRollMeters(productName?: string | null): number | null {
  if (!productName) return null;
  const match = productName.match(/\((\d+)\s*m(?:\s*roll)?\)/i);
  if (match) {
    const val = Number(match[1]);
    if (val >= 25 && val <= 200) return val;
  }
  return null;
}

const mkId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `row-${Math.random().toString(36).slice(2, 10)}`;

export function generateAutoEngineeringBoq(params: {
  design: CompleteEngineeringDesign;
  field: FieldIrrigationConfig;
  dam: DamStorageConfig;
  pumpInputs: PumpSolarInputs;
  catalogProducts: CatalogueProduct[];
}): { sections: BOQSection[]; items: BOQItem[] } {
  const { design, field, dam, pumpInputs, catalogProducts } = params;
  const { pumpResult, fieldSummary, damSummary, matchedPumps } = design;

  const secPumpId = mkId();
  const secSolarId = mkId();
  const secHeadworksId = mkId();
  const secMainSubId = mkId();
  const secFieldLatId = mkId();
  const secStorageId = mkId();
  const secInstallId = mkId();

  const sections: BOQSection[] = [
    {
      id: secPumpId,
      name: "Section A: Pumping Unit, Borehole/Suction Riser & Cable",
      description: `Sized for ${pumpResult.designFlowM3h.toFixed(1)} m³/h @ ${pumpResult.totalDynamicHeadM.toFixed(
        0,
      )} m TDH (${pumpResult.nearestStandardHp} HP / ${pumpResult.recommendedMotorKw.toFixed(2)} kW)`,
      sort_order: 0,
    },
  ];

  if (pumpInputs.powerMode !== "ac_grid_generator") {
    sections.push({
      id: secSolarId,
      name: "Section B: Solar PV Array, MPPT/VFD Drive & Lightning Protection",
      description: `${pumpResult.solarPanelCount} × ${pumpInputs.panelWatts}Wp panels (${pumpResult.panelsInSeries}S × ${pumpResult.parallelStrings}P = ${pumpResult.installedArrayWp} Wp)`,
      sort_order: 1,
    });
  }

  if (field.systemType !== "none") {
    sections.push(
      {
        id: secHeadworksId,
        name: "Section C: Filtration Headworks, Fertigation, Gauges & Safety Valves",
        description: `${fieldSummary.filtrationRecommendation} + pressure & air-release control`,
        sort_order: 2,
      },
      {
        id: secMainSubId,
        name: `Section D: Mainline (${fieldSummary.recommendedMainlineOdMm}mm), Sub-Main (${fieldSummary.recommendedSubmainOdMm}mm) & Compression Fittings`,
        description: "HDPE PN10/PN8 pipes, elbows, equal/reducing tees, couplers, threaded adapters (MTA/FTA), zone valves & end flush",
        sort_order: 3,
      },
      {
        id: secFieldLatId,
        name: `Section E: ${
          field.systemType === "drip"
            ? "Drip Laterals, Start Connectors, Grommets & End Caps"
            : field.systemType === "sprinkler"
              ? "Sprinkler Heads, Risers & Saddle Take-Offs"
              : "Rain Gun Units, Tripod & Field Hydrants"
        }`,
        description: `${field.acres} acre(s) across ${field.zones} zone(s) for ${field.cropName}`,
        sort_order: 4,
      },
    );
  }

  if (dam.mode !== "none") {
    sections.push({
      id: secStorageId,
      name:
        dam.mode === "hdpe_dam_liner"
          ? "Section F: Water Pan HDPE Geomembrane Dam Liner"
          : "Section F: Elevated Water Storage Tank & Tower",
      description: damSummary.verdict,
      sort_order: 5,
    });
  }

  sections.push({
    id: secInstallId,
    name: "Section G: Trenching, Mechanical Installation, 500V DC Megger Audit & Commissioning",
    description: "Pump lowering, mainline/submain jointing, hydrostatic pressure flushing & operator training",
    sort_order: 6,
  });

  const items: BOQItem[] = [];
  const pushItem = (
    sectionId: string,
    sectionName: string,
    name: string,
    description: string,
    quantity: number,
    unit: string,
    unitPrice: number,
    productId: string | null = null,
  ) => {
    const qty = Math.max(1, Number(quantity.toFixed(2)));
    const price = Math.max(0, Math.round(unitPrice));
    items.push({
      id: mkId(),
      section_id: sectionId,
      section_name: sectionName,
      name,
      description,
      quantity: qty,
      unit,
      unit_price: price,
      total: Number((qty * price).toFixed(2)),
      product_id: productId,
      sort_order: items.length,
    });
  };

  // --- Section A: Pump & Hydraulics ---
  const topMatch = matchedPumps[0];
  const secAName = sections[0].name;
  pushItem(
    secPumpId,
    secAName,
    topMatch
      ? topMatch.product.name
      : `${pumpResult.nearestStandardHp} HP ${pumpInputs.sourceType === "borehole" ? "Submersible Borehole" : "Centrifugal"} Pump Set`,
    `Duty ${pumpResult.designFlowM3h.toFixed(1)} m³/h @ ${pumpResult.totalDynamicHeadM.toFixed(0)} m TDH (${pumpResult.recommendedMotorKw.toFixed(1)} kW motor)`,
    1,
    "Set",
    topMatch?.product.price || Math.round(42000 + pumpResult.nearestStandardHp * 22000),
    topMatch?.product.id || null,
  );

  const checkValveProd = findBestCatalogProduct(
    catalogProducts,
    ["brass check valve", fieldSummary.recommendedMainlineOdMm >= 63 ? "2 inch" : "1.5 inch"],
    "valves_regulators",
  );
  const checkValveQty =
    pumpInputs.sourceType === "borehole"
      ? Math.max(1, 1 + Math.floor(Math.max(0, pumpInputs.staticWaterDepthM - 10) / 60))
      : 1;
  pushItem(
    secPumpId,
    secAName,
    checkValveProd?.name || "Heavy-Duty Brass Spring Non-Return Check Valve",
    "Installed <=7.6 m (25 ft) above pump discharge (+ every 60 m on deep column) to stop backspin upthrust",
    checkValveQty,
    "Pcs",
    checkValveProd?.price || 2800,
    checkValveProd?.id || null,
  );

  const boreRiserM =
    pumpInputs.sourceType === "borehole"
      ? Math.max(15, Math.ceil((pumpInputs.staticWaterDepthM + 10) / 10) * 10)
      : Math.max(10, Math.ceil((pumpInputs.suctionPipe.lengthM || 15) / 5) * 5);
  const riserPipeProd = findBestCatalogProduct(
    catalogProducts,
    ["hdpe pipe pn10", `${fieldSummary.recommendedMainlineOdMm}mm`],
    "pipes_fittings",
  );
  const riserRollLen = detectPipeRollMeters(riserPipeProd?.name);
  pushItem(
    secPumpId,
    secAName,
    riserPipeProd?.name || `HDPE PN12.5/PN10 Borehole/Suction Riser Pipe (${fieldSummary.recommendedMainlineOdMm} mm OD)`,
    `${boreRiserM} m vertical column / suction run (${pumpInputs.sourceType === "borehole" ? "high-head PN10+" : "heavy duty suction"})`,
    riserRollLen ? Math.max(1, Math.ceil(boreRiserM / riserRollLen)) : boreRiserM,
    riserRollLen ? `Rolls (${riserRollLen}m)` : "Meters",
    riserRollLen
      ? riserPipeProd?.price || fieldSummary.recommendedMainlineOdMm * 280
      : riserPipeProd?.price && riserPipeProd.price < 1500
        ? riserPipeProd.price
        : fieldSummary.recommendedMainlineOdMm * 5,
    riserPipeProd?.id || null,
  );

  pushItem(
    secPumpId,
    secAName,
    `Submersible / Heavy Copper Drop Cable (${pumpResult.recommendedCableMm2} mm²)`,
    `${pumpInputs.cableLengthM} m run capped at <=${pumpResult.actualVoltageDropPct.toFixed(1)}% voltage drop + resin waterproof splice kit`,
    Math.max(15, Math.round(pumpInputs.cableLengthM + (pumpInputs.sourceType === "borehole" ? pumpInputs.staticWaterDepthM + 10 : 0))),
    "Meters",
    pumpResult.recommendedCableMm2 <= 4 ? 380 : pumpResult.recommendedCableMm2 <= 10 ? 680 : 1200,
  );

  // --- Section B: Solar PV & Controller ---
  if (pumpInputs.powerMode !== "ac_grid_generator") {
    const secBName = sections.find((s) => s.id === secSolarId)?.name || "Section B: Solar PV Array";
    pushItem(
      secSolarId,
      secBName,
      `Mono PERC / TOPCon Tier-1 Solar PV Module (${pumpInputs.panelWatts} Wp)`,
      `${pumpResult.panelsInSeries} in series × ${pumpResult.parallelStrings} parallel string(s) • Cold Voc ${pumpResult.stringColdVocV.toFixed(0)} V`,
      pumpResult.solarPanelCount,
      "Panels",
      Math.round(pumpInputs.panelWatts * 32),
    );

    pushItem(
      secSolarId,
      secBName,
      `MPPT Solar Pump Drive / Controller (${pumpResult.recommendedVfdKw.toFixed(1)} kW)`,
      `Dry-run level probe input, soft start, MPPT tracking, ${pumpInputs.controllerMinVmpV}–${pumpInputs.controllerMaxVocV} V window`,
      1,
      "Unit",
      Math.round(28000 + pumpResult.recommendedVfdKw * 11500),
    );

    const spdProd = findBestCatalogProduct(catalogProducts, ["lightning", "surge"], "control_systems");
    pushItem(
      secSolarId,
      secBName,
      spdProd?.name || "Galvanized Solar Mounting Rack + DC SPD & Copper Earthing Kit",
      "Fixed tilt mounting structure + DC Isolator, Type-2 MOV Lightning Arrester & <10 Ohm copper earth rod",
      1,
      "Lot",
      Math.round(18000 + pumpResult.solarPanelCount * 3500),
      spdProd?.id || null,
    );
  }

  // --- Section C, D, E: Headworks, Main/Submain & Field Components ---
  if (field.systemType !== "none") {
    const secHName = sections.find((s) => s.id === secHeadworksId)?.name || "Section C: Headworks";
    const secMName = sections.find((s) => s.id === secMainSubId)?.name || "Section D: Mainline & Fittings";
    const secFName = sections.find((s) => s.id === secFieldLatId)?.name || "Section E: Field Network";
    const q = fieldSummary.bomQuantities;
    const mainOd = fieldSummary.recommendedMainlineOdMm;
    const subOd = fieldSummary.recommendedSubmainOdMm;

    // -- Section C: Headworks --
    const filterProd = findBestCatalogProduct(
      catalogProducts,
      [
        field.filtrationType === "sand_media"
          ? "sand"
          : fieldSummary.filtrationCapacityM3h >= 20
            ? "screen filter 3"
            : "disc filter",
        "120 mesh",
      ],
      "filtration_systems",
    );
    pushItem(
      secHeadworksId,
      secHName,
      filterProd?.name || fieldSummary.filtrationRecommendation,
      `Sized for ${fieldSummary.filtrationCapacityM3h} m³/h continuous flow with pressure differential ports`,
      1,
      "Unit",
      filterProd?.price || (field.filtrationType === "sand_media" ? 42000 : fieldSummary.filtrationCapacityM3h >= 20 ? 15000 : 2640),
      filterProd?.id || null,
    );

    const gaugeProd = findBestCatalogProduct(
      catalogProducts,
      ["pressure gauge", "glycerine"],
      "accessories",
    );
    pushItem(
      secHeadworksId,
      secHName,
      gaugeProd?.name || "Glycerine Filled Pressure Gauge (Upstream & Downstream Filter Check)",
      "Monitors filter clogging pressure drop and field emitter operating pressure",
      q.pressureGauges,
      "Pcs",
      gaugeProd?.price || 850,
      gaugeProd?.id || null,
    );

    if (q.airReleaseValves > 0) {
      const airProd = findBestCatalogProduct(
        catalogProducts,
        ["air release valve", mainOd >= 63 ? "double" : "1"],
        "valves_regulators",
      );
      pushItem(
        secHeadworksId,
        secHName,
        airProd?.name || "Air Release & Vacuum Breaker Valve (1\")",
        "Prevents trapped air pockets and pipe collapse on pump shutoff & sloped hills",
        q.airReleaseValves,
        "Pcs",
        airProd?.price || 2270,
        airProd?.id || null,
      );
    }

    if (q.pressureRegulators > 0) {
      const regProd = findBestCatalogProduct(
        catalogProducts,
        ["pressure regulator", "drip"],
        "valves_regulators",
      );
      pushItem(
        secHeadworksId,
        secHName,
        regProd?.name || "Drip Pressure Regulator Valve (1\" / 15 PSI)",
        "Caps lateral pressure cleanly at ~1.0–1.5 bar to protect dripline emitters from bursting",
        q.pressureRegulators,
        "Pcs",
        regProd?.price || 1745,
        regProd?.id || null,
      );
    }

    if (q.venturiSets > 0) {
      const venturiProd = findBestCatalogProduct(catalogProducts, ["venturi"], "fertigation_systems");
      pushItem(
        secHeadworksId,
        secHName,
        venturiProd?.name || "Venturi Fertilizer Injector + Bypass Manifold Kit",
        "Complete suction hose, foot strainer & chemical bypass regulating valves",
        q.venturiSets,
        "Kit",
        venturiProd?.price || 1250,
        venturiProd?.id || null,
      );
    }

    const teflonProd = findBestCatalogProduct(catalogProducts, ["teflon"], "accessories");
    pushItem(
      secHeadworksId,
      secHName,
      teflonProd?.name || "PTFE Thread Sealing Teflon Tape",
      "For watertight sealing of threaded valves, gauges, MTA/FTA adapters & air vents",
      q.teflonTapeRolls,
      "Rolls",
      teflonProd?.price && teflonProd.price < 200 ? teflonProd.price : 70,
      teflonProd?.id || null,
    );

    // -- Section D: Mainline, Submain & HDPE Compression Fittings --
    const mainPipeProd = findBestCatalogProduct(
      catalogProducts,
      ["hdpe pipe pn10", `${mainOd}mm`],
      "pipes_fittings",
    );
    const mainRollLen = detectPipeRollMeters(mainPipeProd?.name);
    pushItem(
      secMainSubId,
      secMName,
      mainPipeProd?.name || `HDPE Mainline Pipe PN10 (${mainOd} mm OD)`,
      `${fieldSummary.derivedMainlineLengthM} m main distribution trench conveying ${fieldSummary.activeBlockFlowM3h.toFixed(1)} m³/h`,
      mainRollLen ? Math.max(1, Math.ceil(fieldSummary.derivedMainlineLengthM / mainRollLen)) : fieldSummary.derivedMainlineLengthM,
      mainRollLen ? `Rolls (${mainRollLen}m)` : "Meters",
      mainRollLen ? mainPipeProd?.price || mainOd * 290 : 250,
      mainPipeProd?.id || null,
    );

    if (fieldSummary.derivedSubmainLengthM > 0) {
      const subPipeProd = findBestCatalogProduct(
        catalogProducts,
        ["hdpe pipe", `${subOd}mm`],
        "pipes_fittings",
      );
      const subRollLen = detectPipeRollMeters(subPipeProd?.name);
      pushItem(
        secMainSubId,
        secMName,
        subPipeProd?.name || `HDPE Sub-Main Manifold Pipe (${subOd} mm OD)`,
        `${fieldSummary.derivedSubmainLengthM} m zone feeder header supplying ${field.zones} crop block(s)`,
        subRollLen ? Math.max(1, Math.ceil(fieldSummary.derivedSubmainLengthM / subRollLen)) : fieldSummary.derivedSubmainLengthM,
        subRollLen ? `Rolls (${subRollLen}m)` : "Meters",
        subRollLen ? subPipeProd?.price || subOd * 230 : 180,
        subPipeProd?.id || null,
      );
    }

    const elbowProd = findBestCatalogProduct(
      catalogProducts,
      ["hdpe compression elbow", `${mainOd}mm`],
      "pipes_fittings",
    );
    pushItem(
      secMainSubId,
      secMName,
      elbowProd?.name || `HDPE Compression 90° Elbow (${mainOd} mm)`,
      "For 90-degree mainline trench bends & riser connections",
      q.mainlineElbows,
      "Pcs",
      elbowProd?.price || mainOd * 15,
      elbowProd?.id || null,
    );

    if (q.submainTees > 0) {
      const teeProd = findBestCatalogProduct(
        catalogProducts,
        mainOd !== subOd
          ? ["hdpe compression reducing tee", `${mainOd}mm x ${subOd}mm`]
          : ["hdpe compression equal tee", `${subOd}mm`],
        "pipes_fittings",
      );
      pushItem(
        secMainSubId,
        secMName,
        teeProd?.name || `HDPE Compression ${mainOd !== subOd ? `Reducing Tee (${mainOd}mm × ${subOd}mm)` : `Equal Tee (${subOd}mm)`}`,
        `Mainline-to-submain branch tees for all ${field.zones} zone manifold(s)`,
        q.submainTees,
        "Pcs",
        teeProd?.price || mainOd * 30,
        teeProd?.id || null,
      );
    }

    if (q.reducingCouplers > 0) {
      const redCoupProd = findBestCatalogProduct(
        catalogProducts,
        ["hdpe compression reducing coupler", `${mainOd}mm x ${subOd}mm`],
        "pipes_fittings",
      );
      pushItem(
        secMainSubId,
        secMName,
        redCoupProd?.name || `HDPE Compression Reducing Coupler (${mainOd}mm × ${subOd}mm)`,
        "Stepping mainline OD cleanly down to zone sub-main header size",
        q.reducingCouplers,
        "Pcs",
        redCoupProd?.price || mainOd * 24,
        redCoupProd?.id || null,
      );
    }

    const straightCoupProd = findBestCatalogProduct(
      catalogProducts,
      ["hdpe compression coupler", `${mainOd}mm`],
      "pipes_fittings",
    );
    pushItem(
      secMainSubId,
      secMName,
      straightCoupProd?.name || `HDPE Compression Straight Coupler (${mainOd}mm / ${subOd}mm)`,
      "Roll-to-roll straight HDPE pipe joiners",
      q.straightCouplers,
      "Pcs",
      straightCoupProd?.price || mainOd * 18,
      straightCoupProd?.id || null,
    );

    const mtaProd = findBestCatalogProduct(
      catalogProducts,
      ["male threaded adapter (mta)", `${subOd}mm`],
      "pipes_fittings",
    );
    pushItem(
      secMainSubId,
      secMName,
      mtaProd?.name || `HDPE Male / Female Threaded Adapters (MTA & FTA ${subOd}mm/${mainOd}mm)`,
      "Connects HDPE manifolds cleanly to threaded ball valves, filters & headworks fittings",
      q.threadedAdaptersMtaFta,
      "Pcs",
      mtaProd?.price || subOd * 12,
      mtaProd?.id || null,
    );

    const zoneValveProd = findBestCatalogProduct(
      catalogProducts,
      ["pvc ball valve with union", subOd >= 50 ? "1 1/2 inch" : "1 inch"],
      "valves_regulators",
    );
    pushItem(
      secMainSubId,
      secMName,
      zoneValveProd?.name || `Zone Isolation Ball Valve with Union (${subOd >= 50 ? "1.5\"" : "1\""})`,
      `Independent open/close zone control for each of the ${field.zones} field blocks`,
      q.zoneIsolationValves,
      "Pcs",
      zoneValveProd?.price || 1570,
      zoneValveProd?.id || null,
    );

    if (q.flushAssemblies > 0) {
      const endCapProd = findBestCatalogProduct(
        catalogProducts,
        ["hdpe compression end cap", `${subOd}mm`],
        "pipes_fittings",
      );
      pushItem(
        secMainSubId,
        secMName,
        endCapProd ? `${endCapProd.name} + Sub-Main Flush Ball Valve` : `Sub-Main Tail Flush Ball Valve + HDPE End Cap (${subOd}mm)`,
        "Manual tail-end flushing assemblies to purge silt from submains monthly",
        q.flushAssemblies,
        "Sets",
        (endCapProd?.price || 490) + 400,
        endCapProd?.id || null,
      );
    }

    // -- Section E: Field Drip / Sprinkler / Rain Gun Laterals --
    if (field.systemType === "drip") {
      const dripProd = findBestCatalogProduct(catalogProducts, ["driplines", "dl-16"], "drip_irrigation");
      pushItem(
        secFieldLatId,
        secFName,
        dripProd?.name || `16mm UV-Stabilized Dripline (${field.emitterSpacingCm} cm spacing, ${field.emitterFlowLph} L/h)`,
        `${q.totalDriplineM.toLocaleString()} m total (${field.lateralsPerBed} line/bed @ ${field.rowSpacingM} m beds + ${field.wastePct}% layout allowance)`,
        q.driplineRolls,
        `Rolls (${field.rollLengthM}m)`,
        dripProd?.price || (field.rollLengthM >= 1000 ? 8000 : 4200),
        dripProd?.id || null,
      );

      if (field.lateralTakeoffStyle === "mini_valves") {
        const miniValveProd = findBestCatalogProduct(catalogProducts, ["mini valve", "16mm"], "drip_irrigation");
        pushItem(
          secFieldLatId,
          secFName,
          miniValveProd?.name || "16mm Individual Lateral Mini Control Valve",
          "Enables individual crop row shut-off along submain manifold",
          q.startConnectors,
          "Pcs",
          miniValveProd?.price || 65,
          miniValveProd?.id || null,
        );
      } else {
        const takeoffProd = findBestCatalogProduct(catalogProducts, ["take-off connector"], "drip_irrigation");
        pushItem(
          secFieldLatId,
          secFName,
          takeoffProd?.name || "Drip Tech 16mm Start / Take-Off Connector",
          "Barbed submain-to-lateral start fitting per crop row (+5% spare)",
          q.startConnectors,
          "Pcs",
          takeoffProd?.price || 12,
          takeoffProd?.id || null,
        );
      }

      const grommetProd = findBestCatalogProduct(catalogProducts, ["grommet rubber"], "drip_irrigation");
      pushItem(
        secFieldLatId,
        secFName,
        grommetProd?.name || "Drip Tech 16mm Rubber Grommet Seal",
        "Leak-proof elastomer ring punched cleanly into HDPE sub-main wall",
        q.grommets,
        "Pcs",
        grommetProd?.price || 12,
        grommetProd?.id || null,
      );

      const joinerProd = findBestCatalogProduct(catalogProducts, ["p.e to drip connector", "joiner"], "drip_irrigation");
      pushItem(
        secFieldLatId,
        secFName,
        joinerProd?.name || "Drip Tech 16mm P.E-to-Drip Straight Joiner / Coupler",
        "For joining lateral tail ends & field line repair splicing (~12% lateral allowance)",
        q.peRepairJoiners,
        "Pcs",
        joinerProd?.price || 15,
        joinerProd?.id || null,
      );

      const cap16Prod = findBestCatalogProduct(catalogProducts, ["end cap 16mm", "drip tape end cap"], "drip_irrigation");
      pushItem(
        secFieldLatId,
        secFName,
        cap16Prod?.name || "Drip Tech 16mm Figure-8 / Folding End Cap",
        "Removable lateral end closure for fast row-by-row sediment flushing",
        q.endCaps,
        "Pcs",
        cap16Prod?.price || 12,
        cap16Prod?.id || null,
      );

      const punchProd = findBestCatalogProduct(catalogProducts, ["puncher", "hole punch"], "drip_irrigation");
      pushItem(
        secFieldLatId,
        secFName,
        punchProd?.name || "Drip Tech DN 16mm Sub-Main Hole Punch Tool",
        "Calibrated drill/punch bit for clean zero-leak grommet seating in HDPE submains",
        q.holePunchTools,
        "Pcs",
        punchProd?.price || 600,
        punchProd?.id || null,
      );
    } else if (field.systemType === "sprinkler") {
      const spProd = findBestCatalogProduct(catalogProducts, ["brass impact sprinkler", "impact sprinkler"], "sprinkler_systems");
      pushItem(
        secFieldLatId,
        secFName,
        spProd?.name || `Heavy-Duty Impact Sprinkler (${field.sprinklerSpacingM}m × ${field.sprinklerSpacingM}m Grid)`,
        `${field.sprinklerNozzleFlowM3h} m³/h @ ${field.sprinklerWorkingBar} bar • ${q.precipitationRateMmHr} mm/hr rate`,
        q.sprinklerHeads,
        "Pcs",
        spProd?.price || 2800,
        spProd?.id || null,
      );

      const saddleProd = findBestCatalogProduct(
        catalogProducts,
        ["tapping saddle clamp", `${subOd}mm`],
        "pipes_fittings",
      );
      pushItem(
        secFieldLatId,
        secFName,
        saddleProd?.name || `HDPE Tapping Saddle Clamp (${subOd}mm × 3/4" Female)`,
        "Structural saddle takeoff anchoring vertical riser pipes onto lateral HDPE lines",
        q.saddleClamps,
        "Pcs",
        saddleProd?.price || 480,
        saddleProd?.id || null,
      );

      pushItem(
        secFieldLatId,
        secFName,
        `Galvanized/PE Sprinkler Riser Pipes (${field.riserHeightM} m) + Support Stakes`,
        "Threaded vertical standpipes elevating sprinklers cleanly above crop canopy",
        q.sprinklerRisers,
        "Sets",
        950,
      );
    } else if (field.systemType === "raingun") {
      const rgProd = findBestCatalogProduct(catalogProducts, ["rain gun", "gear drive rain gun"], "sprinkler_systems");
      const tripodProd = findBestCatalogProduct(catalogProducts, ["tripod stand for rain guns"], "sprinkler_systems");
      pushItem(
        secFieldLatId,
        secFName,
        rgProd?.name || `Gear-Drive Big Rain Gun (${field.raingunWettingRadiusM} m radius)`,
        `${field.raingunFlowM3h} m³/h @ ${field.raingunWorkingBar} bar continuous throw`,
        q.raingunUnits,
        "Units",
        rgProd?.price || 38000,
        rgProd?.id || null,
      );
      pushItem(
        secFieldLatId,
        secFName,
        tripodProd?.name || "Heavy-Duty Adjustable Tripod Stand for Rain Gun",
        "Anchored steel sled tripod for stable high-pressure throw",
        q.raingunUnits,
        "Pcs",
        tripodProd?.price || 7000,
        tripodProd?.id || null,
      );
      pushItem(
        secFieldLatId,
        secFName,
        "Quick-Release Field Hydrant Risers & Flanged Takeoff Saddles",
        `${field.raingunHydrants} field station hydrants with isolation control valves`,
        q.hydrantOutlets,
        "Sets",
        4800,
      );
    }
  }

  // --- Section F: Storage / Dam Liner ---
  if (dam.mode === "hdpe_dam_liner") {
    const secDName = sections.find((s) => s.id === secStorageId)?.name || "Section F: Dam Liner";
    const linerProd = findBestCatalogProduct(catalogProducts, ["damliners", "dam liner"]);
    const ratePerSqm = dam.linerThicknessMm === 1.0 ? 480 : dam.linerThicknessMm === 0.75 ? 360 : 250;
    pushItem(
      secStorageId,
      secDName,
      linerProd?.name || `${dam.linerThicknessMm} mm UV-Stabilized Virgin HDPE Geomembrane Dam Liner`,
      `Pan ${dam.topLengthM}m × ${dam.topWidthM}m × ${dam.depthM}m deep (${damSummary.volumeM3.toLocaleString()} m³) inc. 1.5m anchor & 5% seam overlap`,
      damSummary.linerAreaSqm,
      "m²",
      linerProd?.price && linerProd.price < 1200 ? linerProd.price : ratePerSqm,
      linerProd?.id || null,
    );
    pushItem(
      secStorageId,
      secDName,
      "Hot-Wedge Extrusion Liner Seaming & Anchor Trench Works",
      "On-site pressure-tested double weld seaming and perimeter trench anchoring",
      1,
      "Lot",
      Math.max(15000, Math.round(damSummary.linerAreaSqm * 45)),
    );
  } else if (dam.mode === "elevated_tank") {
    const secDName = sections.find((s) => s.id === secStorageId)?.name || "Section F: Water Storage Tank";
    pushItem(
      secStorageId,
      secDName,
      `Heavy-Duty UV Vertical Storage Tank(s) — ${(damSummary.volumeLiters).toLocaleString()} L Total`,
      `${damSummary.daysOfReserve} days farm autonomous reserve + float level cut-off valve`,
      Math.max(1, Math.ceil(damSummary.volumeLiters / 10000)),
      "Tanks",
      115000,
    );
    pushItem(
      secStorageId,
      secDName,
      "Structural Steel Tank Tower / Concrete Masonry Plinth & Manifold",
      "Engineered elevation support for uniform gravity head pressure",
      1,
      "Lot",
      65000,
    );
  }

  // --- Section G: Installation & Commissioning ---
  const secEName = sections.find((s) => s.id === secInstallId)?.name || "Section G: Installation";
  pushItem(
    secInstallId,
    secEName,
    "Trenching, Pipe Laying, Mechanical Installation & 500V DC Megger Audit",
    "Pump lowering, mainline/submain compression jointing, check-valve checks, earthing verification, BEP flow test & operator training",
    1,
    "Lot",
    Math.round(25000 + field.acres * 12000 + (pumpInputs.sourceType === "borehole" ? 18000 : 0)),
  );

  return { sections, items };
}
