import assert from "node:assert/strict";
import {
  analyzePumpSystemCurves,
  applyKenyaSolarRegionPreset,
  barFromPressureUnit,
  calculatePumpSolarSystem,
  computeCustomFinancialSummary,
  computePipeSegmentLoss,
  DEFAULT_CUSTOM_COST_FIGURES,
  DEFAULT_PUMP_SOLAR_INPUTS,
  getInnerDiameterForPreset,
  matchCatalogPumps,
  parseCatalogPumpSpecs,
  pressureFromBar,
} from "../src/lib/pumpSolarSizing.ts";

// 1. Default 2-acre borehole solar drip calculation check
const base = calculatePumpSolarSystem(DEFAULT_PUMP_SOLAR_INPUTS);
assert.ok(base.designFlowM3h > 8.5 && base.designFlowM3h < 9.5, `Expected ~9.0 m3/h, got ${base.designFlowM3h}`);
assert.ok(base.totalDynamicHeadM > 90 && base.totalDynamicHeadM < 130, `Expected TDH 90-130m, got ${base.totalDynamicHeadM}`);
assert.ok(base.recommendedArrayWp > base.electricalInputPowerW, "Solar PV array Wp must exceed motor electrical W after derating");
assert.ok(base.recommendedCableMm2 >= 2.5, "Cable gauge must be >= 2.5 mm2");
assert.equal(base.suctionCavitationAlert, null, "Submersible borehole must not trigger surface suction cavitation alert");

// 2. High-altitude river suction cavitation alert check
const riverCavitation = calculatePumpSolarSystem({
  ...DEFAULT_PUMP_SOLAR_INPUTS,
  sourceType: "surface_suction",
  siteAltitudeM: 1850,
  staticWaterDepthM: 6.5,
  drawdownM: 0,
  suctionPipe: {
    label: "Suction",
    enabled: true,
    material: "hdpe",
    nominalOdMm: 50,
    innerDiameterMm: getInnerDiameterForPreset(50, "hdpe"),
    lengthM: 20,
  },
});
assert.ok(riverCavitation.suctionCavitationAlert !== null, "Expected cavitation alert at 1850m altitude with 6.5m suction lift + friction");

// 3. Undersized pipe velocity & head loss upgrade suggestion check
const narrowPipe = calculatePumpSolarSystem({
  ...DEFAULT_PUMP_SOLAR_INPUTS,
  demandMode: "direct_flow",
  directFlowValue: 15,
  directFlowUnit: "m3h",
  secondaryPipe: {
    label: "Mainline",
    enabled: true,
    material: "hdpe",
    nominalOdMm: 32,
    innerDiameterMm: getInnerDiameterForPreset(32, "hdpe"),
    lengthM: 150,
  },
});
assert.equal(narrowPipe.secondaryPipeResult.status, "critical", "15 m3/h in 32mm HDPE must be flagged critical");
assert.ok(
  narrowPipe.secondaryPipeResult.recommendedUpgradedOdMm &&
    narrowPipe.secondaryPipeResult.recommendedUpgradedOdMm >= 63,
  "Must suggest upgrading to >= 63mm HDPE",
);

// 4. Cold-morning PV Voc overshoot check when controller limit is tight
const tightController = calculatePumpSolarSystem({
  ...DEFAULT_PUMP_SOLAR_INPUTS,
  minMorningTempC: 2,
  controllerMinVmpV: 110,
  controllerMaxVocV: 120,
});
assert.equal(tightController.vocSafetyStatus, "too_high", "Tight 110-120V window at 2C must flag cold Voc safety warning");

// 5. Custom pump curve audit check (undersized shutoff head)
const customAudit = calculatePumpSolarSystem({
  ...DEFAULT_PUMP_SOLAR_INPUTS,
  customPump: {
    enabled: true,
    name: "Test Small Pump",
    powerType: "solar_dc",
    maxFlowM3h: 5,
    maxHeadM: 60,
    ratedPowerW: 750,
    ratedOperatingVoltageV: 72,
    controllerMaxVocV: 150,
  },
});
assert.equal(customAudit.customPumpEval.verdict, "undersized", "60m max head pump cannot serve >90m TDH");

// 6. Messy CF D1 pump specification parser & matcher check
const parsedTab = parseCatalogPumpSpecs({
  id: "1",
  name: "3 HP Solar Submersible Borehole Pump",
  category: "pumps_motors",
  specifications: {
    "Motor Power": "3\tHP",
    "Rated Power": "2,200\tW",
    "Maximum Head": "150\tm",
    "Maximum Flow Rate": "8,000\tL/h",
    "Solar Panel Capacity": "3,000\u20133,600\tW",
  },
});
assert.equal(parsedTab.ratedHp, 3);
assert.equal(parsedTab.maxHeadM, 150);
assert.equal(parsedTab.maxFlowM3h, 8);
assert.equal(parsedTab.recommendedSolarW, 3300);

const parsedLpm = parseCatalogPumpSpecs({
  id: "2",
  name: "2 HP Electric Booster Pump (Multi-Stage)",
  category: "pumps_motors",
  specifications: {
    "Motor Power": "1.5 kW",
    "Nominal Flow Rate": "133 L/min",
    "Published Head Rating": "28 m",
  },
});
assert.equal(parsedLpm.isSolar, false);
assert.equal(parsedLpm.isSubmersible, false);
assert.ok(parsedLpm.maxFlowM3h && Math.abs(parsedLpm.maxFlowM3h - 7.98) < 0.05);

const parsedIncomplete = parseCatalogPumpSpecs({
  id: "3",
  name: "8 HP High-Pressure Diesel Water Pump",
  category: "pumps_motors",
  specifications: {
    "Fuel Type": "Diesel —",
    "Maximum Total Head": "Confirm for exact model —",
  },
});
assert.equal(parsedIncomplete.maxHeadM, null);

const smallBoreholeScenario = calculatePumpSolarSystem({
  ...DEFAULT_PUMP_SOLAR_INPUTS,
  demandMode: "direct_flow",
  directFlowValue: 4.0,
  directFlowUnit: "m3h",
  staticWaterDepthM: 50,
  drawdownM: 10,
  groundElevationGainM: 5,
  dischargeHeightM: 2,
  workingPressureBar: 1.0,
});
const matches = matchCatalogPumps(
  [
    {
      id: "1",
      name: "3 HP Solar Submersible Borehole Pump",
      category: "pumps_motors",
      price: 85000,
      specifications: {
        "Motor Power": "3\tHP",
        "Maximum Head": "150\tm",
        "Maximum Flow Rate": "8,000\tL/h",
      },
    },
  ],
  {
    ...DEFAULT_PUMP_SOLAR_INPUTS,
    demandMode: "direct_flow",
    directFlowValue: 4.0,
    directFlowUnit: "m3h",
  },
  smallBoreholeScenario,
);
assert.equal(matches.length, 1, "Expected 3 HP solar submersible pump to match ~4 m3/h @ ~84m TDH");
assert.equal(matches[0].fitStatus, "optimal");

// 7. Weather Physics: Turkana heat vs Nyeri highlands NOCT cell temp & seasonal worst-month PV array
const turkanaWorst = calculatePumpSolarSystem(
  applyKenyaSolarRegionPreset(DEFAULT_PUMP_SOLAR_INPUTS, "northern_turkana_garissa", "worst_cloudy"),
);
const nyeriWorst = calculatePumpSolarSystem(
  applyKenyaSolarRegionPreset(DEFAULT_PUMP_SOLAR_INPUTS, "mt_kenya_nyeri_nanyuki", "worst_cloudy"),
);
const nyeriDry = calculatePumpSolarSystem(
  applyKenyaSolarRegionPreset(DEFAULT_PUMP_SOLAR_INPUTS, "mt_kenya_nyeri_nanyuki", "dry_peak"),
);
assert.ok(turkanaWorst.estimatedDayCellTempC > 55, `Expected Turkana cell temp > 55C, got ${turkanaWorst.estimatedDayCellTempC}`);
assert.ok(
  turkanaWorst.computedThermalLossPct > nyeriWorst.computedThermalLossPct,
  "Arid Turkana ambient heat must produce higher thermal PV loss than cool Nyeri",
);
assert.ok(
  nyeriWorst.recommendedArrayWp >= nyeriDry.recommendedArrayWp,
  "Worst cloudy season (Jun-Jul) must size >= dry peak season array",
);

// 8. Overcast cloud cover simulation cuts Hz & flow below clear-sky baseline
const clearSky = calculatePumpSolarSystem({
  ...DEFAULT_PUMP_SOLAR_INPUTS,
  skyCondition: "clear_sun",
  skyIrradianceWm2: 950,
});
const heavyOvercast = calculatePumpSolarSystem({
  ...DEFAULT_PUMP_SOLAR_INPUTS,
  skyCondition: "overcast_gathano",
  skyIrradianceWm2: 380,
});
assert.ok(
  heavyOvercast.cloudSimulation.estimatedHz < clearSky.cloudSimulation.estimatedHz,
  "Overcast 380 W/m2 must reduce pump VFD frequency below clear-sun baseline",
);

// 9. Shallow borehole submergence silt alert + 3-inch casing filter
const shallowHole = calculatePumpSolarSystem({
  ...DEFAULT_PUMP_SOLAR_INPUTS,
  boreholeTotalDepthM: 68, // static 55 + drawdown 10 + 6m = 71m > 68-3=65m
});
assert.ok(shallowHole.boreholeDepthAlert !== null, "Expected borehole bottom silt/submergence alert");

const slim3Matches = matchCatalogPumps(
  [
    {
      id: "slim3",
      name: "0.5 HP Solar Submersible Borehole Pump",
      category: "pumps_motors",
      specifications: {
        Model: "3SDS4-400W",
        "Maximum Head": "55 m",
        "Maximum Flow Rate": "4 m3/h",
      },
    },
    {
      id: "std4",
      name: "2 HP Electric Submersible Borehole Pump",
      category: "pumps_motors",
      specifications: {
        Model: "4SDM3/22",
        "Pump Diameter": "4 inch",
        "Maximum Head": "158 m",
        "Maximum Flow Rate": "4.8 m3/h",
      },
    },
  ],
  {
    ...DEFAULT_PUMP_SOLAR_INPUTS,
    powerMode: "solar_hybrid",
    boreholeCasingInch: "3",
  },
  calculatePumpSolarSystem({
    ...DEFAULT_PUMP_SOLAR_INPUTS,
    demandMode: "direct_flow",
    directFlowValue: 2.0,
    directFlowUnit: "m3h",
    staticWaterDepthM: 25,
    drawdownM: 5,
    groundElevationGainM: 0,
    dischargeHeightM: 0,
    workingPressureBar: 0.5,
    filtrationValveLossM: 1,
    boreholeCasingInch: "3",
  }),
);
assert.equal(slim3Matches.length, 1, "3-inch casing must exclude 4-inch pump and retain 3SDS4");
assert.equal(slim3Matches[0].product.id, "slim3");

// 10. Borehole driller yield ceiling alert
const yieldExceeded = calculatePumpSolarSystem({
  ...DEFAULT_PUMP_SOLAR_INPUTS,
  boreholeSafeYieldM3h: 4.0,
});
assert.ok(
  yieldExceeded.boreholeYieldUtilisationPct && yieldExceeded.boreholeYieldUtilisationPct > 100,
  "Flow > driller yield must report >100% utilisation",
);
assert.ok(
  yieldExceeded.alerts.some((a) => /Safe Yield/i.test(a.title)),
  "Expected borehole safe yield exceeded critical alert",
);

// 11. Custom Hazen-Williams roughness C & pressure conversion helpers
const roughPipe = computePipeSegmentLoss(
  {
    label: "Custom Rough",
    enabled: true,
    material: "custom",
    customC: 90,
    nominalOdMm: 63,
    innerDiameterMm: 53.6,
    lengthM: 100,
  },
  6,
  false,
);
const smoothPipe = computePipeSegmentLoss(
  {
    label: "Custom Smooth",
    enabled: true,
    material: "custom",
    customC: 150,
    nominalOdMm: 63,
    innerDiameterMm: 53.6,
    lengthM: 100,
  },
  6,
  false,
);
assert.ok(roughPipe.frictionLossM > smoothPipe.frictionLossM * 2, "Lower C factor must raise friction sharply");
assert.ok(Math.abs(pressureFromBar(1, "psi") - 14.5) <= 0.1);
assert.ok(Math.abs(barFromPressureUnit(14.50377, "psi") - 1.0) <= 0.01);

// 12. Custom user equipment cost & payback calculations
const financial = computeCustomFinancialSummary(
  {
    ...DEFAULT_CUSTOM_COST_FIGURES,
    includeInReport: true,
    pumpUnitKes: 85000,
    solarArrayCtrlKes: 120000,
    pipesFittingsKes: 65000,
    cableProtectionKes: 30000,
    tankCivilKes: 80000,
    installationTestKes: 40000,
    dailyBaselineFuelCostKes: 1500,
    irrigationDaysPerYear: 200,
  },
  base,
  28,
);
assert.equal(financial.totalCustomCapexKes, 420000);
assert.equal(financial.annualSavingsKes, 300000);
assert.equal(financial.paybackYears, 1.4);

// 13. Pump Q-H Curve, System Resistance Intersection, 3-Point Calibration & BEP POR
const curvePorOptimal = analyzePumpSystemCurves(
  {
    ...base,
    designFlowM3h: 5.5,
    totalPipeFrictionM: 8,
    fittingsMinorLossM: 2,
    totalDynamicHeadM: 72,
  },
  {
    mode: "datasheet_3point",
    label: "4ST 1.5kW Calibrated",
    maxFlowM3h: 8.6,
    maxHeadM: 112,
    bepFlowM3h: 5.5,
    bepHeadM: 72,
    runoutFlowM3h: 8.2,
    runoutHeadM: 18,
    vfdFreqHz: 40,
    ratedFreqHz: 50,
  },
);
assert.equal(curvePorOptimal.modeUsed, "datasheet_3point");
assert.equal(curvePorOptimal.porVerdict, "optimal_por");
assert.ok(
  Math.abs(curvePorOptimal.operatingPoint.flowM3h - 5.5) <= 0.15,
  `Exact 3-pt BEP match should land near 5.5 m3/h, got ${curvePorOptimal.operatingPoint.flowM3h}`,
);
assert.ok(
  curvePorOptimal.reducedSpeedOperatingPoint &&
    curvePorOptimal.reducedSpeedOperatingPoint.flowM3h < curvePorOptimal.operatingPoint.flowM3h,
  "40 Hz solar speed drop must shift duty point lower than 50 Hz rated curve",
);

const curveDeadHead = analyzePumpSystemCurves(base, {
  mode: "parabolic_endpoints",
  label: "Undersized Pump",
  maxFlowM3h: 6.0,
  maxHeadM: 50,
});
assert.equal(curveDeadHead.porVerdict, "dead_head_blocked", "Shutoff < static+pressure must block flow");

const curveRecirculation = analyzePumpSystemCurves(
  {
    ...base,
    designFlowM3h: 3.0,
    totalPipeFrictionM: 4,
    fittingsMinorLossM: 1,
    totalDynamicHeadM: 88,
  },
  {
    mode: "datasheet_3point",
    label: "Oversized Flow Pump",
    maxFlowM3h: 14,
    maxHeadM: 105,
    bepFlowM3h: 9.0,
    bepHeadM: 68,
    runoutFlowM3h: 13.5,
    runoutHeadM: 16,
  },
);
assert.equal(
  curveRecirculation.porVerdict,
  "recirculation_left",
  "Flow < 70% BEP must flag left-of-BEP recirculation risk",
);

console.log("check-pump-solar-sizing passed all assertions.");
