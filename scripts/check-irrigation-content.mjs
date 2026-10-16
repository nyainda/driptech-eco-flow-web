import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

const publicClaimChecks = [
  {
    file: "src/components/Home/HeroSectionVibe.tsx",
    forbidden: [
      /500\+.*Installations/i,
      /60%.*Water savings/i,
      /40%.*Yield increase/i,
      /Free.*Farm assessment/i,
    ],
  },
  {
    file: "src/components/Home/ProductsShowcase.tsx",
    forbidden: [
      /500\+.*Happy customers/i,
      /50\+.*Completed projects/i,
      /99%.*(?:Satisfaction|Customer Satisfaction)/i,
      /24\/7.*Technical support/i,
      /10-Year Warranty/i,
    ],
  },
  {
    file: "src/components/Home/ServicesSection.tsx",
    forbidden: [
      /value:\s*"up to 60%"/i,
      /value:\s*"up to 40%"/i,
      /Free site visit and needs assessment/i,
    ],
  },
];

for (const check of publicClaimChecks) {
  const source = await readFile(new URL(`../${check.file}`, import.meta.url), "utf8");
  for (const forbidden of check.forbidden) {
    assert.equal(
      forbidden.test(source),
      false,
      `Unsupported public marketing claim remains in ${check.file}: ${forbidden}`,
    );
  }
}

console.log(
  `Passed ${cases.length} irrigation relevance checks and ${publicClaimChecks.length} public-claim source checks.`,
);
