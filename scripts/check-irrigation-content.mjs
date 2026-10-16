import assert from "node:assert/strict";
import { isIrrigationRelatedContent } from "../src/lib/irrigationContent.ts";

const cases = [
  {
    name: "greenhouse installations are relevant",
    values: ["Greenhouse Expansion for Coastal Farming", "Urban Landscaping"],
    expected: true,
  },
  {
    name: "crop irrigation projects are relevant",
    values: ["Precision Irrigation for Avocado Orchards", "Orchard"],
    expected: true,
  },
  {
    name: "drip irrigation projects are relevant",
    values: ["Drip Irrigation Setup — Kitui West", "Commercial Farm"],
    expected: true,
  },
  {
    name: "livestock monitoring is not an irrigation case study",
    values: ["Smart Livestock Monitoring with IoT Sensors", "Urban Landscaping"],
    expected: false,
  },
  {
    name: "poultry feed management is not an irrigation case study",
    values: ["Automating Poultry Feed Management for Higher Efficiency"],
    expected: false,
  },
  {
    name: "crop planning dashboards are not irrigation case studies by themselves",
    values: [
      "Enhancing Crop Planning Using Real-Time Dashboards",
      "A dashboard for weather, soil and harvest timing",
    ],
    expected: false,
  },
];

for (const testCase of cases) {
  assert.equal(
    isIrrigationRelatedContent(...testCase.values),
    testCase.expected,
    testCase.name,
  );
}

console.log(`Passed ${cases.length} irrigation-content relevance checks.`);
