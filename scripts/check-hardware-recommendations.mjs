import assert from "node:assert/strict";
import {
  BATTERY_BANK_DATASET,
  PUMP_REFERENCE_DATASET,
  SOLAR_PANEL_DATASET,
} from "../src/data/solarPumpBatteryDataset.ts";
import {
  evaluateBatteryOption,
  evaluateSolarPanelOption,
  recommendHardwareForDesign,
} from "../src/lib/hardwareRecommendationEngine.ts";
import {
  calculatePumpSolarSystem,
  DEFAULT_PUMP_SOLAR_INPUTS,
} from "../src/lib/pumpSolarSizing.ts";

assert.ok(SOLAR_PANEL_DATASET.length >= 9, "Expected >=9 standard PV panel specs");
assert.ok(BATTERY_BANK_DATASET.length >= 7, "Expected >=7 battery bank options");
assert.ok(PUMP_REFERENCE_DATASET.length >= 14, "Expected >=14 pump dataset entries");

const baseInputs = {
  ...DEFAULT_PUMP_SOLAR_INPUTS,
  powerMode: "solar_hybrid",
  batteryBackupHours: 3,
};
const baseResult = calculatePumpSolarSystem(baseInputs);

// 1. Minimum vs Recommended vs Resilience PV Array invariants
const advisor = recommendHardwareForDesign(baseInputs, baseResult);
for (const pv of advisor.panelRecommendations) {
  assert.ok(pv.minimumPanels >= pv.minSeriesForStart, `${pv.panel.name} min < series start`);
  assert.ok(
    pv.recommendedPanels >= pv.minimumPanels,
    `${pv.panel.name} recommended (${pv.recommendedPanels}) < min (${pv.minimumPanels})`,
  );
  assert.ok(
    pv.resiliencePanels >= pv.recommendedPanels,
    `${pv.panel.name} resilience (${pv.resiliencePanels}) < recommended (${pv.recommendedPanels})`,
  );
  if (pv.isFitPossible) {
    assert.ok(
      pv.stringColdVocV <= baseInputs.controllerMaxVocV,
      `${pv.panel.name} cold Voc (${pv.stringColdVocV}V) exceeded controller max (${baseInputs.controllerMaxVocV}V)`,
    );
  }
}

// 2. TOPCon -0.29%/C retains higher normalized site wattage per rated Wp in hot Turkana than Poly -0.40%/C
const hotInputs = { ...baseInputs, ambientDayTempC: 37, windSpeedMs: 1.5 };
const hotResult = calculatePumpSolarSystem(hotInputs);
const poly550Ref = evaluateSolarPanelOption(
  SOLAR_PANEL_DATASET.find((p) => p.id === "pv-340w-poly"),
  hotInputs,
  hotResult,
);
const topconRef = evaluateSolarPanelOption(
  SOLAR_PANEL_DATASET.find((p) => p.id === "pv-585w-topcon"),
  hotInputs,
  hotResult,
);
assert.ok(
  topconRef.effectiveWattAtSiteW / topconRef.panel.pmaxW >
    poly550Ref.effectiveWattAtSiteW / poly550Ref.panel.pmaxW,
  "N-Type TOPCon must retain higher normalized Wattage under hot desert cell temp than Poly",
);

// 3. Battery LiFePO4 DoD (85%) beats Lead-Acid/Gel (50%) usable kWh ratio + Tank verdict checks
const lfp100 = evaluateBatteryOption(
  BATTERY_BANK_DATASET.find((b) => b.id === "bat-lifepo4-51v-100ah"),
  baseInputs,
  baseResult,
);
const gel200 = evaluateBatteryOption(
  BATTERY_BANK_DATASET.find((b) => b.id === "bat-gel-12v-200ah"),
  baseInputs,
  baseResult,
);
assert.ok(
  lfp100.installedNominalKwh <= gel200.installedNominalKwh,
  "LiFePO4 85% DoD must require <= nominal battery kWh vs 50% DoD Gel",
);
assert.equal(advisor.batteryVsTankVerdict.preferWaterStorage, true);

// 4. Small 0.5HP 3-inch borehole slim test
const slimInputs = {
  ...DEFAULT_PUMP_SOLAR_INPUTS,
  demandMode: "direct_flow",
  directFlowValue: 1.5,
  directFlowUnit: "m3h",
  staticWaterDepthM: 28,
  drawdownM: 4,
  groundElevationGainM: 0,
  workingPressureBar: 0.8,
  boreholeCasingInch: "3",
};
const slimRes = calculatePumpSolarSystem(slimInputs);
const slimAdvisor = recommendHardwareForDesign(slimInputs, slimRes);
assert.ok(
  slimAdvisor.referencePumpMatches.every((m) => m.pump.minCasingInch <= 3),
  "3-inch casing filter must never recommend 4-inch or 6-inch borehole pumps",
);

console.log("check-hardware-recommendations passed all assertions.");
