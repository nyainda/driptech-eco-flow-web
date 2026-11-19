import assert from "node:assert/strict";
import {
  calculateDamOrTankStorage,
  calculateFieldHydraulics,
  computeCompleteEngineeringDesign,
  DEFAULT_CLIENT_REPORT_META,
  DEFAULT_DAM_CONFIG,
  DEFAULT_FIELD_CONFIG,
  generateAutoEngineeringBoq,
} from "../src/lib/engineeringReportEngine.ts";
import { buildFullClientEngineeringReportHtml } from "../src/lib/fullEngineeringReportPdf.ts";
import { DEFAULT_PUMP_SOLAR_INPUTS } from "../src/lib/pumpSolarSizing.ts";

// 1. Drip Irrigation 2-acre calculation & BOM counts
const dripSummary = calculateFieldHydraulics({
  ...DEFAULT_FIELD_CONFIG,
  systemType: "drip",
  acres: 2,
  zones: 2,
  simultaneousZones: 1,
  rowSpacingM: 1.0,
  lateralsPerBed: 1,
  emitterSpacingCm: 20,
  emitterFlowLph: 1.6,
  rollLengthM: 1000,
  wastePct: 8,
});
assert.ok(dripSummary.areaSqm > 8090 && dripSummary.areaSqm < 8100);
assert.equal(dripSummary.bomQuantities.driplineRolls, 9, `Expected 9 x 1000m rolls, got ${dripSummary.bomQuantities.driplineRolls}`);
assert.ok(dripSummary.activeBlockFlowM3h > 30 && dripSummary.activeBlockFlowM3h < 35, `Expected ~32.4 m3/h on 1 acre active 20cm/1.6Lph, got ${dripSummary.activeBlockFlowM3h}`);
assert.equal(dripSummary.bomQuantities.venturiSets, 1);

// 2. Sprinkler 5-acre calculation & precipitation rate check
const sprinklerSummary = calculateFieldHydraulics({
  ...DEFAULT_FIELD_CONFIG,
  systemType: "sprinkler",
  acres: 5,
  zones: 4,
  simultaneousZones: 1,
  sprinklerSpacingM: 12,
  sprinklerNozzleFlowM3h: 1.3,
  sprinklerWorkingBar: 2.8,
});
assert.ok(sprinklerSummary.bomQuantities.sprinklerHeads > 140);
assert.ok(sprinklerSummary.bomQuantities.precipitationRateMmHr && sprinklerSummary.bomQuantities.precipitationRateMmHr > 8.5 && sprinklerSummary.bomQuantities.precipitationRateMmHr < 9.5);
assert.equal(sprinklerSummary.requiredWorkingBar, 2.8);

// 3. Rain Gun 10-acre high-pressure overhead check
const raingunSummary = calculateFieldHydraulics({
  ...DEFAULT_FIELD_CONFIG,
  systemType: "raingun",
  acres: 10,
  raingunFlowM3h: 18,
  raingunWorkingBar: 4.2,
  raingunHydrants: 8,
  simultaneousGuns: 1,
});
assert.equal(raingunSummary.activeBlockFlowM3h, 18);
assert.equal(raingunSummary.bomQuantities.hydrantOutlets, 8);

// 4. Trapezoidal HDPE Dam Liner geometry check (18m x 14m x 3m, slope 1:1 -> bottom 12x8)
const damSummary = calculateDamOrTankStorage(
  {
    ...DEFAULT_DAM_CONFIG,
    mode: "hdpe_dam_liner",
    topLengthM: 18,
    topWidthM: 14,
    depthM: 3,
    sideSlopeRatio: 1.0,
    linerThicknessMm: 0.75,
    anchorTrenchAllowanceM: 1.5,
  },
  45,
  15,
);
assert.equal(damSummary.bottomLengthM, 12);
assert.equal(damSummary.bottomWidthM, 8);
assert.ok(damSummary.volumeM3 > 500 && damSummary.volumeM3 < 550, `Expected ~516 m3 pan volume, got ${damSummary.volumeM3}`);
assert.ok(damSummary.linerAreaSqm > 420, `Expected >420 m2 HDPE liner area, got ${damSummary.linerAreaSqm}`);

// 5. Integrated Borehole Solar + Dam Liner + Drip design + Auto-BOQ + Full HTML Report
const completeDesign = computeCompleteEngineeringDesign({
  field: { ...DEFAULT_FIELD_CONFIG, systemType: "drip", acres: 2, zones: 4 },
  dam: {
    ...DEFAULT_DAM_CONFIG,
    mode: "hdpe_dam_liner",
    topLengthM: 18,
    topWidthM: 14,
    depthM: 3,
    linerThicknessMm: 0.75,
  },
  pumpInputs: {
    ...DEFAULT_PUMP_SOLAR_INPUTS,
    sourceType: "borehole",
    staticWaterDepthM: 55,
    drawdownM: 10,
  },
  couplingMode: "fill_storage_tank",
  catalogPumps: [
    {
      id: "p-demo",
      name: "3 HP Solar Submersible Borehole Pump",
      category: "pumps_motors",
      price: 125000,
      specifications: {
        "Maximum Head": "150 m",
        "Maximum Flow Rate": "8 m3/h",
        "Pump Diameter": "4 inch",
      },
    },
  ],
});

const boq = generateAutoEngineeringBoq({
  design: completeDesign,
  field: { ...DEFAULT_FIELD_CONFIG, systemType: "drip", acres: 2, zones: 4 },
  dam: {
    ...DEFAULT_DAM_CONFIG,
    mode: "hdpe_dam_liner",
    topLengthM: 18,
    topWidthM: 14,
    depthM: 3,
    linerThicknessMm: 0.75,
  },
  pumpInputs: completeDesign.syncedPumpInputs,
  catalogProducts: [
    { id: "p-demo", name: "3 HP Solar Submersible Borehole Pump", category: "pumps_motors", price: 125000 },
    { id: "pv-1", name: "550W Mono Solar Panel", category: "solar", price: 16500 },
    { id: "dl-1", name: "16mm Dripline 1000m Roll", category: "drip_irrigation", price: 7800 },
    { id: "liner-1", name: "0.75mm HDPE Dam Liner per sqm", category: "water_storage", price: 360 },
  ],
});

assert.equal(boq.sections.length, 5, "Expected 5 structured BOQ sections (Pump, Solar, Field, Dam, Install)");
assert.ok(boq.items.length >= 10, `Expected >=10 auto BOQ items, got ${boq.items.length}`);
assert.ok(boq.items.some((i) => i.product_id === "p-demo"), "Matched pump must map directly from catalogue");

const html = buildFullClientEngineeringReportHtml({
  meta: {
    ...DEFAULT_CLIENT_REPORT_META,
    reportCode: "DT-ENG-261119-TEST",
    clientName: "Rift Valley Agribusiness Ltd",
    countyLocation: "Nakuru",
    includeVat: true,
    vatRatePct: 16,
  },
  field: { ...DEFAULT_FIELD_CONFIG, systemType: "drip", acres: 2, zones: 4 },
  dam: {
    ...DEFAULT_DAM_CONFIG,
    mode: "hdpe_dam_liner",
    topLengthM: 18,
    topWidthM: 14,
    depthM: 3,
    linerThicknessMm: 0.75,
  },
  pumpInputs: completeDesign.syncedPumpInputs,
  couplingMode: "fill_storage_tank",
  design: completeDesign,
  boqSections: boq.sections,
  boqItems: boq.items,
});

assert.ok(html.includes("DT-ENG-261119-TEST"), "Report must stamp unique code");
assert.ok(html.includes("<svg viewBox=\"0 0 680 310\""), "Full report must embed vector Q-H SVG curve plot");
assert.ok(html.includes("500V DC Megger Insulation Resistance"), "Full report must include commissioning checklist");
assert.ok(html.includes("Rift Valley Agribusiness Ltd"), "Report must stamp client name");
assert.ok(!html.includes("NaN") && !html.includes("undefined"), "Generated HTML report must not contain NaN or undefined");

console.log("check-engineering-reports passed all assertions.");
