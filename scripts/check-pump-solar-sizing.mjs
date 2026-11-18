import assert from "node:assert/strict";
import {
  calculatePumpSolarSystem,
  DEFAULT_PUMP_SOLAR_INPUTS,
  getInnerDiameterForPreset,
  matchCatalogPumps,
  parseCatalogPumpSpecs,
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

console.log("check-pump-solar-sizing passed all assertions.");
