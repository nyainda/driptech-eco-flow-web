import type { BOQItem, BOQSection } from "@/components/Admin/Quote/BOQSectionBuilder";
import { COMPANY, getLogoUrl, numberToWordsKES } from "@/components/Admin/shared/companyBrand";
import {
  ClientReportMetadata,
  CompleteEngineeringDesign,
  DamStorageConfig,
  FieldIrrigationConfig,
  HydraulicCouplingMode,
} from "@/lib/engineeringReportEngine";
import { KENYA_SOLAR_REGIONS, PumpCurveAnalysis, PumpSolarInputs } from "@/lib/pumpSolarSizing";

const esc = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char] ?? char;
  });

const kes = (amount: number): string =>
  `KES ${Math.round(amount).toLocaleString("en-KE")}`;

function renderEmbeddedSvgPumpCurve(curve: PumpCurveAnalysis): string {
  const SVG_W = 680;
  const SVG_H = 310;
  const PAD = { top: 22, right: 24, bottom: 42, left: 52 };
  const PLOT_W = SVG_W - PAD.left - PAD.right;
  const PLOT_H = SVG_H - PAD.top - PAD.bottom;

  const xScale = (q: number) =>
    PAD.left + Math.min(1, Math.max(0, q / Math.max(0.5, curve.chartMaxFlowM3h))) * PLOT_W;
  const yScale = (h: number) =>
    PAD.top + PLOT_H - Math.min(1, Math.max(0, h / Math.max(10, curve.chartMaxHeadM))) * PLOT_H;

  const pumpPts = curve.points.filter((p) => p.pumpHeadM !== null);
  const pumpPath = pumpPts
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${xScale(p.flowM3h).toFixed(1)} ${yScale(p.pumpHeadM!).toFixed(1)}`)
    .join(" ");

  const sysPath = curve.points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${xScale(p.flowM3h).toFixed(1)} ${yScale(p.systemHeadM).toFixed(1)}`)
    .join(" ");

  const reducedPts = curve.points.filter((p) => p.reducedSpeedHeadM !== null);
  const reducedPath =
    reducedPts.length >= 2
      ? reducedPts
          .map((p, idx) => `${idx === 0 ? "M" : "L"} ${xScale(p.flowM3h).toFixed(1)} ${yScale(p.reducedSpeedHeadM!).toFixed(1)}`)
          .join(" ")
      : "";

  const xTicks = [0, 0.25, 0.5, 0.75, 1]
    .map((t) => {
      const q = Number((curve.chartMaxFlowM3h * t).toFixed(1));
      const x = xScale(q).toFixed(1);
      return `<line x1="${x}" y1="${PAD.top}" x2="${x}" y2="${SVG_H - PAD.bottom}" stroke="#e2e8f0" stroke-dasharray="3 3"/>
        <text x="${x}" y="${SVG_H - PAD.bottom + 15}" text-anchor="middle" font-size="10" fill="#64748b">${q}</text>`;
    })
    .join("");

  const yTicks = [0, 0.25, 0.5, 0.75, 1]
    .map((t) => {
      const h = Math.round(curve.chartMaxHeadM * t);
      const y = yScale(h).toFixed(1);
      return `<line x1="${PAD.left}" y1="${y}" x2="${SVG_W - PAD.right}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3 3"/>
        <text x="${PAD.left - 8}" y="${Number(y) + 3}" text-anchor="end" font-size="10" fill="#64748b">${h} m</text>`;
    })
    .join("");

  const porX1 = xScale(curve.porMinFlowM3h);
  const porX2 = xScale(curve.porMaxFlowM3h);
  const rightEnd = xScale(curve.chartMaxFlowM3h);

  const dutyMarker = curve.operatingPoint.canOperate
    ? `<circle cx="${xScale(curve.operatingPoint.flowM3h).toFixed(1)}" cy="${yScale(curve.operatingPoint.headM).toFixed(1)}" r="8" fill="#16a34a" fill-opacity="0.2"/>
       <circle cx="${xScale(curve.operatingPoint.flowM3h).toFixed(1)}" cy="${yScale(curve.operatingPoint.headM).toFixed(1)}" r="5" fill="#0f172a" stroke="#16a34a" stroke-width="2.5"/>
       <text x="${Math.min(SVG_W - PAD.right - 68, xScale(curve.operatingPoint.flowM3h) + 8).toFixed(1)}" y="${(yScale(curve.operatingPoint.headM) + 14).toFixed(1)}" font-size="10.5" font-weight="700" fill="#0f172a">Duty: ${curve.operatingPoint.flowM3h.toFixed(1)} m³/h @ ${curve.operatingPoint.headM.toFixed(0)} m</text>`
    : "";

  return `<svg viewBox="0 0 ${SVG_W} ${SVG_H}" width="100%" style="max-width:680px;height:auto;background:#ffffff;border:1px solid #cbd5e1;border-radius:8px;display:block;">
    <rect x="${xScale(0).toFixed(1)}" y="${PAD.top}" width="${Math.max(0, porX1 - xScale(0)).toFixed(1)}" height="${PLOT_H}" fill="#ef4444" fill-opacity="0.06"/>
    <rect x="${porX1.toFixed(1)}" y="${PAD.top}" width="${Math.max(0, porX2 - porX1).toFixed(1)}" height="${PLOT_H}" fill="#16a34a" fill-opacity="0.11"/>
    <rect x="${porX2.toFixed(1)}" y="${PAD.top}" width="${Math.max(0, rightEnd - porX2).toFixed(1)}" height="${PLOT_H}" fill="#f59e0b" fill-opacity="0.07"/>
    <text x="${((xScale(0) + porX1) / 2).toFixed(1)}" y="${PAD.top + 13}" text-anchor="middle" font-size="9" font-weight="700" fill="#dc2626">&lt;70% BEP</text>
    <text x="${((porX1 + porX2) / 2).toFixed(1)}" y="${PAD.top + 13}" text-anchor="middle" font-size="9" font-weight="800" fill="#15803d">POR (70%–120% BEP)</text>
    ${rightEnd - porX2 > 45 ? `<text x="${((porX2 + rightEnd) / 2).toFixed(1)}" y="${PAD.top + 13}" text-anchor="middle" font-size="9" font-weight="700" fill="#d97706">Runout</text>` : ""}
    ${yTicks}
    ${xTicks}
    <text x="${(PAD.left + PLOT_W / 2).toFixed(1)}" y="${SVG_H - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a">Flow Rate Q (m³/h)</text>
    <text x="15" y="${(PAD.top + PLOT_H / 2).toFixed(1)}" text-anchor="middle" transform="rotate(-90 15 ${(PAD.top + PLOT_H / 2).toFixed(1)})" font-size="11" font-weight="700" fill="#0f172a">Total Head H (m)</text>
    <line x1="${xScale(curve.bepPoint.flowM3h).toFixed(1)}" y1="${PAD.top + 18}" x2="${xScale(curve.bepPoint.flowM3h).toFixed(1)}" y2="${SVG_H - PAD.bottom}" stroke="#16a34a" stroke-opacity="0.45" stroke-dasharray="4 4"/>
    ${reducedPath ? `<path d="${reducedPath}" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="5 3"/>` : ""}
    <path d="${sysPath}" fill="none" stroke="#d97706" stroke-width="2.5"/>
    <path d="${pumpPath}" fill="none" stroke="#16a34a" stroke-width="3"/>
    <circle cx="${xScale(curve.bepPoint.flowM3h).toFixed(1)}" cy="${yScale(curve.bepPoint.headM).toFixed(1)}" r="4.5" fill="#16a34a" stroke="#ffffff" stroke-width="1.5"/>
    <circle cx="${xScale(0).toFixed(1)}" cy="${yScale(curve.shutoffHeadM).toFixed(1)}" r="4" fill="#dc2626"/>
    ${dutyMarker}
  </svg>`;
}

export interface BuildFullEngineeringReportParams {
  meta: ClientReportMetadata;
  field: FieldIrrigationConfig;
  dam: DamStorageConfig;
  pumpInputs: PumpSolarInputs;
  couplingMode: HydraulicCouplingMode;
  design: CompleteEngineeringDesign;
  boqSections: BOQSection[];
  boqItems: BOQItem[];
  hideUnitPricesInPrint?: boolean;
  includeCommissioningChecklist?: boolean;
}

export function buildFullClientEngineeringReportHtml(
  params: BuildFullEngineeringReportParams,
): string {
  const {
    meta,
    field,
    dam,
    pumpInputs,
    couplingMode,
    design,
    boqSections,
    boqItems,
    hideUnitPricesInPrint = false,
    includeCommissioningChecklist = true,
  } = params;

  const { fieldSummary, damSummary, pumpResult, curveAnalysis, matchedPumps } = design;
  const logoUrl = getLogoUrl({ forPrint: true });
  const region = KENYA_SOLAR_REGIONS.find((r) => r.id === pumpInputs.solarRegionId);

  const subtotalKes = boqItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const vatAmountKes = meta.includeVat ? (subtotalKes * (meta.vatRatePct || 16)) / 100 : 0;
  const grandTotalKes = subtotalKes + vatAmountKes;

  const activePipes = [
    pumpResult.suctionPipeResult,
    pumpResult.primaryPipeResult,
    pumpResult.secondaryPipeResult,
  ].filter((p) => p.enabled && p.lengthM > 0);

  const validUntilDate = new Date(
    Date.now() + Math.max(7, meta.validityDays || 30) * 86400000,
  ).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const orderedSections = [...boqSections].sort((a, b) => a.sort_order - b.sort_order);

  const fieldLabel =
    field.systemType === "drip"
      ? `Drip Irrigation (${field.acres} acre(s), ${field.zones} zone(s))`
      : field.systemType === "sprinkler"
        ? `Sprinkler System (${field.acres} acre(s), ${field.sprinklerSpacingM}m × ${field.sprinklerSpacingM}m)`
        : field.systemType === "raingun"
          ? `Rain Gun System (${field.acres} acre(s), ${field.raingunWettingRadiusM}m throw)`
          : "Water Pumping & Solar Supply Only";

  const boqSectionsHtml = orderedSections
    .map((section) => {
      const secItems = boqItems.filter((item) => item.section_id === section.id);
      if (!secItems.length) return "";
      const secTotal = secItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
      return `
        <tr class="sec-head-row">
          <td colspan="${hideUnitPricesInPrint ? 4 : 6}">
            <strong>${esc(section.name)}</strong>
            ${section.description ? `<div class="sec-sub">${esc(section.description)}</div>` : ""}
          </td>
        </tr>
        ${secItems
          .map(
            (item, idx) => `
          <tr>
            <td style="text-align:center;color:#64748b;">${idx + 1}</td>
            <td><strong>${esc(item.name)}</strong>${item.description ? `<br/><span style="font-size:10px;color:#64748b;">${esc(item.description)}</span>` : ""}</td>
            <td class="num">${item.quantity.toLocaleString("en-KE")}</td>
            <td>${esc(item.unit)}</td>
            ${
              hideUnitPricesInPrint
                ? ""
                : `<td class="num">${kes(item.unit_price)}</td><td class="num"><strong>${kes(item.total)}</strong></td>`
            }
          </tr>`,
          )
          .join("")}
        ${
          hideUnitPricesInPrint
            ? ""
            : `<tr class="sec-subtot"><td colspan="5" style="text-align:right;">Subtotal — ${esc(section.name)}</td><td class="num"><strong>${kes(secTotal)}</strong></td></tr>`
        }
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Engineering Proposal &amp; Sizing Report ${esc(meta.reportCode)} — DripTech EcoFlow</title>
  <style>
    @page { size: A4; margin: 12mm 13mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a; background: #f8fafc; font-size: 11.5px; line-height: 1.48;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .sheet { max-width: 860px; margin: 0 auto; background: #fff; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; }
    .toolbar { max-width: 860px; margin: 0 auto 12px; display: flex; justify-content: flex-end; gap: 8px; }
    .btn { padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; border: 1px solid #cbd5e1; cursor: pointer; background: #fff; color: #0f172a; }
    .btn-primary { background: #16a34a; color: #fff; border-color: #15803d; }
    .header { background: linear-gradient(135deg,#0f172a 0%,#14532d 100%); color: #fff; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand img { width: 48px; height: 48px; border-radius: 8px; background: #fff; padding: 4px; object-fit: contain; }
    .brand h1 { margin: 0; font-size: 18px; }
    .brand p { margin: 2px 0 0; font-size: 10.5px; color: #bbf7d0; }
    .meta { text-align: right; font-size: 11px; }
    .code { display: inline-block; background: rgba(255,255,255,0.16); padding: 3px 9px; border-radius: 999px; font-family: monospace; font-weight: 700; font-size: 11.5px; margin-bottom: 4px; }
    .content { padding: 20px 24px; }
    h2.sec-title { margin: 20px 0 8px; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #15803d; border-bottom: 2px solid #dcfce7; padding-bottom: 4px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
    .kpi { border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 10px; background: #f8fafc; }
    .kpi-l { font-size: 9.5px; text-transform: uppercase; font-weight: 700; color: #64748b; }
    .kpi-v { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .kpi-s { font-size: 10px; color: #475569; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; font-weight: 700; color: #334155; }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .sec-head-row td { background: #ecfdf5; color: #14532d; padding: 7px 8px; }
    .sec-sub { font-size: 10px; font-weight: 400; color: #475569; margin-top: 2px; }
    .sec-subtot td { background: #f8fafc; font-size: 10.5px; }
    .total-row td { background: #0f172a; color: #fff; font-size: 12.5px; font-weight: 800; }
    .callout { border-left: 4px solid #16a34a; background: #f0fdf4; padding: 9px 12px; border-radius: 6px; margin-top: 10px; font-size: 11px; }
    .callout-warn { border-left-color: #d97706; background: #fffbeb; }
    .sign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 22px; padding-top: 14px; border-top: 1px dashed #cbd5e1; }
    .sign-line { border-bottom: 1px solid #64748b; height: 28px; margin-bottom: 4px; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { border: none; border-radius: 0; }
      .no-print { display: none !important; }
      .avoid-break { page-break-inside: avoid; break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button class="btn btn-primary" onclick="window.print()">Print / Save PDF</button>
    <button class="btn" onclick="window.close()">Close</button>
  </div>

  <div class="sheet">
    <div class="header">
      <div class="brand">
        <img src="${esc(logoUrl)}" alt="${esc(COMPANY.shortName)}" />
        <div>
          <h1>${esc(COMPANY.name)}</h1>
          <p>Integrated Pump, Solar PV &amp; Precision Irrigation Engineering Report</p>
        </div>
      </div>
      <div class="meta">
        <div class="code">${esc(meta.reportCode)}</div>
        <div><strong>Issued:</strong> ${esc(meta.preparedDate)}</div>
        <div><strong>Valid Until:</strong> ${esc(validUntilDate)}</div>
        <div><strong>Engineer:</strong> ${esc(meta.engineerName)}</div>
      </div>
    </div>

    <div class="content">
      <div class="two-col">
        <div>
          <h2 class="sec-title" style="margin-top:0;">Client &amp; Farm Site Profile</h2>
          <table>
            <tr><th style="width:38%">Project Title</th><td><strong>${esc(meta.projectTitle)}</strong></td></tr>
            <tr><th>Prepared For</th><td>${esc(meta.clientName || "Valued Farm Client")}${meta.companyFarmName ? ` — ${esc(meta.companyFarmName)}` : ""}</td></tr>
            <tr><th>Phone / Email</th><td>${esc(meta.clientPhone || "—")}${meta.clientEmail ? ` • ${esc(meta.clientEmail)}` : ""}</td></tr>
            <tr><th>County / Altitude</th><td>${esc(meta.countyLocation)} • ${pumpInputs.siteAltitudeM} m ASL</td></tr>
          </table>
        </div>
        <div>
          <h2 class="sec-title" style="margin-top:0;">System Architecture Scope</h2>
          <table>
            <tr><th style="width:38%">Water Source</th><td>${esc(meta.waterSourceSummary)}${pumpInputs.boreholeSafeYieldM3h ? ` (Yield ${pumpInputs.boreholeSafeYieldM3h} m³/h)` : ""}</td></tr>
            <tr><th>Field System</th><td>${esc(fieldLabel)}</td></tr>
            <tr><th>Hydraulic Link</th><td>${couplingMode === "fill_storage_tank" ? "Fill Dam / Tank Storage First" : "Direct Pressurized Field Feed"}</td></tr>
            <tr><th>Power Supply</th><td>${esc(region?.label || "Kenya Solar Profile")} (${pumpResult.installedArrayWp > 0 ? `${pumpResult.installedArrayWp} Wp PV` : pumpInputs.powerMode.toUpperCase()})</td></tr>
          </table>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-l">Design Flow &amp; Volume</div>
          <div class="kpi-v">${pumpResult.designFlowM3h.toFixed(1)} m³/h</div>
          <div class="kpi-s">${pumpResult.dailyGrossVolumeM3.toFixed(1)} m³/day gross demand</div>
        </div>
        <div class="kpi">
          <div class="kpi-l">Total Dynamic Head</div>
          <div class="kpi-v">${pumpResult.totalDynamicHeadM.toFixed(1)} m</div>
          <div class="kpi-s">${pumpResult.nearestStandardHp} HP (${pumpResult.recommendedMotorKw.toFixed(2)} kW)</div>
        </div>
        <div class="kpi">
          <div class="kpi-l">Q–H Curve BEP Verdict</div>
          <div class="kpi-v">${curveAnalysis.operatingPoint.canOperate ? `${curveAnalysis.operatingPctOfBep}% BEP` : "Review"}</div>
          <div class="kpi-s">Duty ${curveAnalysis.operatingPoint.flowM3h.toFixed(1)} m³/h @ ${curveAnalysis.operatingPoint.headM.toFixed(0)} m</div>
        </div>
        <div class="kpi">
          <div class="kpi-l">Project Investment</div>
          <div class="kpi-v">${kes(grandTotalKes)}</div>
          <div class="kpi-s">${meta.includeVat ? `Incl. ${meta.vatRatePct}% VAT` : "VAT Exempt / Excl. VAT"}</div>
        </div>
      </div>

      ${
        field.systemType !== "none"
          ? `
      <div class="avoid-break">
        <h2 class="sec-title">1. Field Irrigation Architecture (${esc(field.systemType.toUpperCase())} Layout)</h2>
        <table>
          <thead>
            <tr><th>Design Parameter</th><th>Computed Engineering Spec</th><th>Field Execution Detail</th></tr>
          </thead>
          <tbody>
            <tr><td>Area &amp; Crop Block Schedule</td><td>${field.acres} Acre(s) (${Math.round(fieldSummary.areaSqm).toLocaleString()} m²)</td><td>${field.cropName} rotated across ${field.zones} zone(s) (${fieldSummary.runtimeHoursPerDay} hrs/day)</td></tr>
            <tr><td>Block Flow &amp; Working Pressure</td><td>${fieldSummary.activeBlockFlowM3h.toFixed(2)} m³/h @ ${fieldSummary.requiredWorkingBar.toFixed(1)} bar</td><td>Filtration sizing: ${esc(fieldSummary.filtrationRecommendation)}</td></tr>
            <tr><td>Pipework Sizing</td><td>${fieldSummary.recommendedMainlineOdMm} mm Main / ${fieldSummary.recommendedSubmainOdMm} mm Submain</td><td>${
              field.systemType === "drip"
                ? `${fieldSummary.bomQuantities.driplineRolls} × ${field.rollLengthM}m rolls 16mm dripline (${fieldSummary.bomQuantities.totalDriplineM.toLocaleString()} m), ${fieldSummary.bomQuantities.startConnectors} connectors/grommets`
                : field.systemType === "sprinkler"
                  ? `${fieldSummary.bomQuantities.sprinklerHeads} impact sprinklers @ ${field.sprinklerSpacingM}m × ${field.sprinklerSpacingM}m grid (${fieldSummary.bomQuantities.precipitationRateMmHr} mm/hr rate)`
                  : `${fieldSummary.bomQuantities.raingunUnits} rain gun unit(s) across ${fieldSummary.bomQuantities.hydrantOutlets} field hydrants (${field.raingunWettingRadiusM}m throw radius)`
            }</td></tr>
          </tbody>
        </table>
      </div>`
          : ""
      }

      ${
        dam.mode !== "none"
          ? `
      <div class="avoid-break">
        <h2 class="sec-title">2. Water Storage / HDPE Dam Liner Geometry</h2>
        <table>
          <tr><th style="width:28%">Storage Configuration</th><td>${esc(damSummary.verdict)}</td></tr>
          ${
            dam.mode === "hdpe_dam_liner"
              ? `<tr><th>Excavation &amp; Geomembrane</th><td>Top ${dam.topLengthM}m × ${dam.topWidthM}m | Bottom ${damSummary.bottomLengthM}m × ${damSummary.bottomWidthM}m | Depth ${dam.depthM}m (${dam.sideSlopeRatio}:1 side slope) • Ordered Sheet: ${damSummary.linerSheetLengthM}m × ${damSummary.linerSheetWidthM}m = <strong>${damSummary.linerAreaSqm.toLocaleString()} m²</strong> (${dam.linerThicknessMm} mm HDPE)</td></tr>`
              : `<tr><th>Autonomous Reserve</th><td>${damSummary.daysOfReserve} days field crop buffer</td></tr>`
          }
        </table>
      </div>`
          : ""
      }

      <div class="avoid-break">
        <h2 class="sec-title">3. Hydraulic TDH Breakdown &amp; Interactive Q–H Pump Curve Audit</h2>
        <div class="two-col">
          <table>
            <thead><tr><th>Head &amp; Pipe Component</th><th class="num">Value</th></tr></thead>
            <tbody>
              <tr><td>Static Water Depth + Drawdown</td><td class="num">${(pumpResult.staticWaterLiftM + pumpResult.drawdownM).toFixed(1)} m</td></tr>
              <tr><td>Terrain Elevation + Discharge Height</td><td class="num">${(pumpResult.elevationGainM + pumpResult.dischargeHeightM).toFixed(1)} m</td></tr>
              <tr><td>Required Field / Emitter Pressure</td><td class="num">${pumpResult.workingPressureHeadM.toFixed(1)} m (${(pumpResult.workingPressureHeadM / 10.197).toFixed(1)} bar)</td></tr>
              <tr><td>Filtration + Hazen-Williams Pipe + Fittings</td><td class="num">${(pumpResult.filtrationValveLossM + pumpResult.totalPipeFrictionM + pumpResult.fittingsMinorLossM).toFixed(1)} m</td></tr>
              <tr><td><strong>Total Dynamic Head (TDH)</strong></td><td class="num"><strong>${pumpResult.totalDynamicHeadM.toFixed(1)} m</strong></td></tr>
              <tr><td>Wire-to-Water Efficiency / Daily Energy</td><td class="num">${pumpResult.wireToWaterEfficiencyPct.toFixed(1)}% • ${pumpResult.dailyEnergyKwh.toFixed(1)} kWh/d</td></tr>
              ${activePipes.map((p) => `<tr><td>${esc(p.label)} (${p.lengthM}m, ${p.innerDiameterMm}mm ID)</td><td class="num">${p.velocityMs.toFixed(2)} m/s • ${p.frictionLossM.toFixed(1)} m</td></tr>`).join("")}
            </tbody>
          </table>
          <div>
            ${renderEmbeddedSvgPumpCurve(curveAnalysis)}
            <div style="font-size:10px;color:#475569;margin-top:4px;">
              <strong>Pump Audited:</strong> ${esc(curveAnalysis.pumpLabel)} • <strong>Shutoff:</strong> ${curveAnalysis.shutoffHeadM.toFixed(0)} m • <strong>BEP POR Window:</strong> ${curveAnalysis.porMinFlowM3h.toFixed(1)}–${curveAnalysis.porMaxFlowM3h.toFixed(1)} m³/h
            </div>
          </div>
        </div>
        <div class="callout ${curveAnalysis.porVerdict === "optimal_por" ? "" : "callout-warn"}">
          <strong>${esc(curveAnalysis.porVerdictLabel)}:</strong> ${esc(curveAnalysis.staffExplanation)}
        </div>
      </div>

      <div class="avoid-break">
        <h2 class="sec-title">4. Solar PV Climate Array, Electrical Cable &amp; Protection Specification</h2>
        <table>
          <thead><tr><th>Solar / Electrical Item</th><th>Engineering Design Value</th><th>Protection &amp; Compliance Note</th></tr></thead>
          <tbody>
            <tr><td>Kenya Regional Climate</td><td>${esc(region?.label || pumpInputs.solarRegionId)} (${pumpInputs.peakSunHours} PSH, ${pumpResult.estimatedDayCellTempC.toFixed(0)}°C cell)</td><td>Accounts for ${pumpResult.computedThermalLossPct.toFixed(1)}% thermal derating + ${pumpInputs.dustMismatchLossPct}% dust</td></tr>
            <tr><td>PV Array String Topology</td><td><strong>${pumpResult.solarPanelCount} × ${pumpInputs.panelWatts}Wp = ${pumpResult.installedArrayWp} Wp</strong> (${pumpResult.panelsInSeries}S × ${pumpResult.parallelStrings}P)</td><td>Vmp ${pumpResult.stringVmpV.toFixed(0)} V | Cold Dawn Voc ${pumpResult.stringColdVocV.toFixed(0)} V (${esc(pumpResult.vocSafetyMessage)})</td></tr>
            <tr><td>Cable Gauge &amp; Surge Grounding</td><td><strong>${pumpResult.recommendedCableMm2} mm² Copper</strong> (${pumpResult.actualVoltageDropPct.toFixed(1)}% drop over ${pumpInputs.cableLengthM} m)</td><td>Type-2 DC SPD MOV + Bonded copper earth rod &lt;25 Ω (&lt;5–10 Ω lightning zones)</td></tr>
            ${matchedPumps[0] ? `<tr><td>Matched Catalogue Pump Option</td><td colspan="2"><strong>${esc(matchedPumps[0].product.name)}</strong> — ${esc(matchedPumps[0].fitReason)}</td></tr>` : ""}
          </tbody>
        </table>
      </div>

      <div>
        <h2 class="sec-title">5. Complete Engineering Bill of Quantities (BOQ) &amp; Investment Summary</h2>
        <table>
          <thead>
            <tr>
              <th style="width:32px;text-align:center;">#</th>
              <th>Equipment Description &amp; Technical Specification</th>
              <th class="num" style="width:65px;">Qty</th>
              <th style="width:72px;">Unit</th>
              ${hideUnitPricesInPrint ? "" : `<th class="num" style="width:105px;">Unit Price</th><th class="num" style="width:115px;">Amount</th>`}
            </tr>
          </thead>
          <tbody>
            ${boqSectionsHtml}
            ${
              hideUnitPricesInPrint
                ? ""
                : `<tr><td colspan="5" style="text-align:right;font-weight:700;">Total Equipment &amp; Engineering Subtotal</td><td class="num"><strong>${kes(subtotalKes)}</strong></td></tr>
                   ${meta.includeVat ? `<tr><td colspan="5" style="text-align:right;font-weight:700;">VAT (${meta.vatRatePct}%)</td><td class="num">${kes(vatAmountKes)}</td></tr>` : ""}`
            }
            <tr class="total-row">
              <td colspan="${hideUnitPricesInPrint ? 3 : 5}" style="text-align:right;">TOTAL PROJECT INVESTMENT</td>
              <td class="num">${kes(grandTotalKes)}</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size:10.5px;margin-top:6px;"><strong>Amount in Words:</strong> ${esc(numberToWordsKES(grandTotalKes))}</p>
        <p style="font-size:10.5px;margin-top:3px;color:#475569;"><strong>Payment Terms:</strong> ${esc(meta.paymentTerms)}</p>
        ${meta.siteNotes ? `<div class="callout"><strong>Engineer Site Remarks:</strong> ${esc(meta.siteNotes)}</div>` : ""}
      </div>

      ${
        includeCommissioningChecklist
          ? `
      <div class="avoid-break">
        <h2 class="sec-title">6. Commissioning Benchmarks &amp; Preventative Maintenance Handover</h2>
        <table>
          <thead><tr><th>Verification Check (OEM Standard)</th><th>Required Acceptance Benchmark</th><th>Commissioned</th></tr></thead>
          <tbody>
            <tr><td>Inline Non-Return Check Valves</td><td>First check valve within 7.6 m (25 ft) of discharge; every 60 m (200 ft) on deep risers</td><td>[ ] Verified</td></tr>
            <tr><td>Motor Cooling Velocity / Shroud</td><td>Flow sleeve fitted if oversized casing, top-feeding well, or open water tank</td><td>[ ] Verified</td></tr>
            <tr><td>500V DC Megger Insulation Resistance</td><td>Uninstalled motor &gt;=200 MΩ | Submerged motor + cable &gt;=2.0 MΩ (&lt;0.5 MΩ ABORT)</td><td>[ ] _____ MΩ</td></tr>
            <tr><td>3-Phase Balance &amp; Earth Rod</td><td>Supply voltage unbalance &lt;=1.0% (NEMA MG-1) | Single-point bonded earth &lt;10–25 Ω</td><td>[ ] _____ Ω</td></tr>
            <tr><td>Operator Routine Care</td><td>Weekly filter differential check &amp; suction air check; monthly solar glass clean</td><td>[ ] Trained</td></tr>
          </tbody>
        </table>
      </div>`
          : ""
      }

      <div class="sign-grid avoid-break">
        <div>
          <div class="sign-line"></div>
          <strong>Prepared &amp; Checked By:</strong> ${esc(meta.engineerName)}<br/>
          <span style="font-size:10px;color:#64748b;">${esc(COMPANY.name)} • ${esc(meta.engineerPhone)}</span>
        </div>
        <div>
          <div class="sign-line"></div>
          <strong>Client / Farm Approval:</strong> ${esc(meta.clientName || "Authorized Signatory")}<br/>
          <span style="font-size:10px;color:#64748b;">Signature, Stamp &amp; Date</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function openFullClientEngineeringReportPdf(
  params: BuildFullEngineeringReportParams,
): void {
  const html = buildFullClientEngineeringReportHtml(params).replace(
    "</body>",
    `<script>window.addEventListener("load", function(){ setTimeout(function(){ window.print(); }, 250); });</script></body>`,
  );

  if (typeof window === "undefined") return;
  const popup = window.open("", "_blank");
  if (popup) {
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    return;
  }

  const existing = document.getElementById("dt-admin-eng-report-iframe");
  if (existing) existing.remove();
  const iframe = document.createElement("iframe");
  iframe.id = "dt-admin-eng-report-iframe";
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}

export function downloadFullClientEngineeringReportHtml(
  params: BuildFullEngineeringReportParams,
): void {
  if (typeof document === "undefined") return;
  const html = buildFullClientEngineeringReportHtml(params);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `DripTech-Full-Engineering-Report-${params.meta.reportCode || "DRAFT"}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
