import assert from "node:assert/strict";
import {
  buildWhatsAppChatUrl,
  inferIrrigationSystemType,
  normalizeKenyaWhatsAppDigits,
  parseAcreageFromText,
} from "../src/lib/adminContactHelpers.ts";

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

console.log("All admin contact & engineering handoff helper checks passed.");
