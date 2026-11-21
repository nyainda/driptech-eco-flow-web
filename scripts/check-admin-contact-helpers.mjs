import assert from "node:assert/strict";
import {
  buildCsvContent,
  buildWhatsAppChatUrl,
  inferIrrigationSystemType,
  inferTeamDepartment,
  normalizeKenyaWhatsAppDigits,
  parseAcreageFromText,
  parseImpactHighlights,
} from "../src/lib/adminContactHelpers.ts";
import {
  computeProjectPortfolioStats,
  formatAreaCoveredValue,
  formatWaterSavedValue,
} from "../src/lib/projectMetrics.ts";

// Kenya phone normalization
assert.equal(normalizeKenyaWhatsAppDigits("0712 345 678"), "254712345678");
assert.equal(normalizeKenyaWhatsAppDigits("+254 723-407-849"), "254723407849");
assert.equal(normalizeKenyaWhatsAppDigits("0110 222 333"), "254110222333");
assert.equal(normalizeKenyaWhatsAppDigits("712345678"), "254712345678");
assert.equal(normalizeKenyaWhatsAppDigits(""), null);
assert.equal(normalizeKenyaWhatsAppDigits("abc"), null);

// WhatsApp URL builder
const url = buildWhatsAppChatUrl("0712345678", "Hello Farm");
assert.equal(url, "https://wa.me/254712345678?text=Hello%20Farm");
assert.equal(buildWhatsAppChatUrl(null, "Hi"), null);

// Acreage extraction
assert.equal(parseAcreageFromText("2.5 acres"), 2.5);
assert.equal(parseAcreageFromText("5 ha avocado orchard"), 12.36);
assert.equal(parseAcreageFromText("Need drip for 0.25 acre greenhouse"), 0.25);
assert.equal(parseAcreageFromText("3"), 3);
assert.equal(parseAcreageFromText("No area specified"), undefined);

// System type inference
assert.equal(inferIrrigationSystemType("Sprinkler System", "2 acres"), "sprinkler");
assert.equal(inferIrrigationSystemType("Rain gun field irrigation"), "raingun");
assert.equal(inferIrrigationSystemType("Greenhouse kit", "capsicum"), "drip");
assert.equal(inferIrrigationSystemType("Solar borehole pump sizing"), "drip");
assert.equal(inferIrrigationSystemType("", null), undefined);

// Team department classifier
assert.equal(inferTeamDepartment("Chief Executive Officer"), "leadership");
assert.equal(inferTeamDepartment("Senior Hydraulic Engineer"), "engineering");
assert.equal(inferTeamDepartment("Sales & Systems Advisor"), "sales");
assert.equal(inferTeamDepartment("Logistics Coordinator"), "operations");

// Impact highlights & CSV escaping
assert.deepEqual(
  parseImpactHighlights("• 45% Water Savings\n• 30% Yield Boost; Fast ROI"),
  ["45% Water Savings", "30% Yield Boost", "Fast ROI"],
);
const csv = buildCsvContent(["Name", "Notes"], [['Farm "A"', "Ready"]]);
assert.equal(csv, '"Name","Notes"\n"Farm ""A""","Ready"');

// Project metric formatting & portfolio summary (outlier-safe)
assert.equal(formatWaterSavedValue(60), "60%");
assert.equal(formatWaterSavedValue(4000), "4,000 L");
assert.equal(formatWaterSavedValue(0), null);
assert.equal(formatAreaCoveredValue(30000), "30,000 ac");
const portfolio = computeProjectPortfolioStats([
  { status: "completed", area_covered: 120, water_saved: 20, location: "Kitui", project_type: "Commercial Farm" },
  { status: "on_hold", area_covered: 30000, water_saved: 4000, location: "Murang'a", project_type: "Orchard" },
  { status: "in_progress", area_covered: 3000, water_saved: 60, location: "Kilifi", project_type: "Urban Landscaping" },
]);
assert.equal(portfolio.total, 3);
assert.equal(portfolio.completed, 1);
assert.equal(portfolio.avgWaterSavedPct, 40);

console.log("All admin contact, team, story & project helper checks passed.");
