import { COMPANY, getLogoUrl, numberToWordsKES } from "@/components/Admin/shared/companyBrand";
import { formatPrice } from "@/lib/productUrl";
import {
  BOREHOLE_CASING_LABELS,
  computeCustomFinancialSummary,
  CustomCostFigures,
  CustomProjectMetadata,
  KENYA_SOLAR_REGIONS,
  MatchedPumpRecommendation,
  METHOD_DEFAULTS,
  PIPE_MATERIAL_META,
  PumpSolarInputs,
  PumpSolarResult,
} from "@/lib/pumpSolarSizing";

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

export interface BuildPumpReportParams {
  reportCode: string;
  inputs: PumpSolarInputs;
  result: PumpSolarResult;
  projectMeta: CustomProjectMetadata;
  customCosts: CustomCostFigures;
  matchedPumps: MatchedPumpRecommendation[];
  shareUrl?: string;
}

export function buildPumpSolarReportHtml({
  reportCode,
  inputs,
  result,
  projectMeta,
  customCosts,
  matchedPumps,
  shareUrl,
}: BuildPumpReportParams): string {
  const issueDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const region = KENYA_SOLAR_REGIONS.find((r) => r.id === inputs.solarRegionId);
  const financial = computeCustomFinancialSummary(
    customCosts,
    result,
    inputs.electricityTariffKesKwh,
  );
  const logoUrl = getLogoUrl({ forPrint: true });

  const staticTotalM = Math.max(0, result.staticWaterLiftM + result.drawdownM);
  const elevTotalM = Math.max(0, result.elevationGainM + result.dischargeHeightM);
  const lossesTotalM =
    result.filtrationValveLossM + result.totalPipeFrictionM + result.fittingsMinorLossM;

  const activePipes = [
    result.suctionPipeResult,
    result.primaryPipeResult,
    result.secondaryPipeResult,
  ].filter((p) => p.enabled && p.lengthM > 0);

  const costRows: Array<{ label: string; amount: number }> = [
    { label: "Pump, Motor & Accessories", amount: customCosts.pumpUnitKes || 0 },
    { label: "Solar PV Modules, Racking & Controller/VFD", amount: customCosts.solarArrayCtrlKes || 0 },
    { label: "HDPE / uPVC / GI Riser & Mainline Pipes + Fittings", amount: customCosts.pipesFittingsKes || 0 },
    { label: "Submersible / DC Cable, Earthing, Lightning & SPD", amount: customCosts.cableProtectionKes || 0 },
    { label: "Water Storage Tank & Elevated Tower / Masonry Pad", amount: customCosts.tankCivilKes || 0 },
    { label: "Borehole Test, Installation, Welding & Commissioning", amount: customCosts.installationTestKes || 0 },
  ].filter((row) => row.amount > 0);

  const sourceLabel =
    inputs.sourceType === "borehole"
      ? `Borehole Submersible (${BOREHOLE_CASING_LABELS[inputs.boreholeCasingInch]}, depth ${inputs.boreholeTotalDepthM} m)`
      : inputs.sourceType === "surface_suction"
        ? "River / Dam Surface Suction"
        : "Tank / Line Pressure Booster";

  const seasonLabel =
    inputs.solarSeasonMode === "worst_cloudy"
      ? `Worst Cloudy Season (${region?.worstMonthName || "Jun–Jul"})`
      : inputs.solarSeasonMode === "dry_peak"
        ? "Dry Season Clear Sky (Jan–Mar)"
        : "Annual Average PSH";

  const whatsappBrief = encodeURIComponent(
    `Hi DripTech EcoFlow, attached/referenced is Engineering Pump Sizing Report ${reportCode} (${projectMeta.projectName}): ${result.designFlowM3h.toFixed(1)} m3/h @ ${result.totalDynamicHeadM.toFixed(1)} m TDH, ${result.nearestStandardHp} HP, ${result.installedArrayWp} Wp PV.`,
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(reportCode)} — DripTech Pump & Solar Engineering Report</title>
  <style>
    :root {
      --primary: #12372a;
      --primary-mid: #1b4332;
      --primary-soft: #eef5f0;
      --gold: #c59b27;
      --gold-soft: #fbf7eb;
      --ink: #0f172a;
      --muted: #475569;
      --line: #cbd5e1;
      --line-soft: #e2e8f0;
      --danger: #b91c1c;
      --danger-soft: #fef2f2;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.48;
      color: var(--ink);
      background: #e2e8f0;
      padding: 16px 12px 32px;
    }
    .toolbar {
      max-width: 210mm;
      margin: 0 auto 14px;
      background: #0f172a;
      color: #fff;
      padding: 12px 18px;
      border-radius: 12px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .toolbar-title { font-size: 13px; font-weight: 700; }
    .toolbar-sub { font-size: 11px; color: #94a3b8; }
    .toolbar-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: none;
    }
    .btn-pdf { background: var(--gold); color: #0f172a; }
    .btn-wa { background: #16a34a; color: #fff; }
    .page {
      max-width: 210mm;
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 10px 35px rgba(15, 23, 42, 0.14);
      border-radius: 4px;
      overflow: hidden;
    }
    .masthead {
      background: linear-gradient(135deg, #0d281e 0%, #1b4332 65%, #2d6a4f 100%);
      color: #fff;
      padding: 20px 28px 18px;
      border-bottom: 4px solid var(--gold);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }
    .brand { display: flex; gap: 12px; align-items: flex-start; }
    .logo-box {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: #fff;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .logo-box img { width: 100%; height: 100%; object-fit: contain; }
    .brand-title { font-size: 18px; font-weight: 800; color: #fff; }
    .brand-sub { font-size: 10.5px; color: #a7f3d0; font-weight: 600; margin-top: 2px; }
    .brand-meta { font-size: 9.5px; color: #cbd5e1; margin-top: 4px; line-height: 1.45; }
    .doc-box { text-align: right; flex-shrink: 0; }
    .doc-eyebrow {
      display: inline-block;
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #fde68a;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(253, 230, 138, 0.35);
      padding: 2px 8px;
      border-radius: 999px;
    }
    .doc-type { font-size: 17px; font-weight: 900; color: #fff; margin-top: 5px; }
    .doc-ref {
      margin-top: 6px;
      background: rgba(15, 23, 42, 0.35);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 9.5px;
      text-align: left;
      min-width: 210px;
    }
    .doc-ref-row { display: flex; justify-content: space-between; gap: 10px; padding: 1px 0; }
    .doc-ref-row span:first-child { color: #cbd5e1; }
    .doc-ref-row strong { color: #fff; }
    .body-wrap { padding: 20px 28px 24px; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi {
      border: 1px solid var(--line);
      border-top: 3px solid var(--primary);
      border-radius: 6px;
      padding: 9px 10px;
      background: #f8fafc;
    }
    .kpi-label { font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
    .kpi-val { font-size: 16px; font-weight: 900; color: var(--primary); margin-top: 2px; }
    .kpi-sub { font-size: 9.5px; color: var(--muted); margin-top: 1px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
    .panel { border: 1px solid var(--line); border-radius: 7px; padding: 10px 12px; background: #fff; }
    .panel-head {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--primary-mid);
      border-bottom: 1px solid var(--line-soft);
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .kv { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; font-size: 10px; }
    .kv span { color: var(--muted); }
    .kv strong { color: var(--ink); text-align: right; }
    table.dt-tbl { width: 100%; border-collapse: collapse; border: 1px solid var(--line); margin-top: 12px; font-size: 10px; }
    .dt-tbl th {
      background: var(--primary);
      color: #fff;
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 7px 9px;
      text-align: left;
    }
    .dt-tbl td { padding: 7px 9px; border-bottom: 1px solid var(--line-soft); border-right: 1px solid var(--line-soft); }
    .dt-tbl tr:last-child td { border-bottom: none; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .alert-box {
      margin-top: 10px;
      border-radius: 6px;
      padding: 8px 11px;
      font-size: 10px;
      border: 1px solid var(--line);
      background: var(--gold-soft);
    }
    .alert-critical { border-color: #fca5a5; background: var(--danger-soft); color: var(--danger); }
    .footer-note {
      margin-top: 16px;
      border-top: 1px solid var(--line);
      padding-top: 10px;
      font-size: 9.5px;
      color: var(--muted);
      line-height: 1.5;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .toolbar { display: none !important; }
      .page { box-shadow: none; border-radius: 0; max-width: 100%; }
      @page { size: A4; margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div>
      <div class="toolbar-title">Pump &amp; Solar PV Engineering Report — ${esc(reportCode)}</div>
      <div class="toolbar-sub">Ready to save as A4 PDF or share with your borehole contractor &amp; farm team.</div>
    </div>
    <div class="toolbar-actions">
      <button type="button" class="btn btn-pdf" onclick="window.print()">Save as PDF / Print</button>
      <a class="btn btn-wa" href="https://wa.me/254723407849?text=${whatsappBrief}" target="_blank" rel="noreferrer">Send on WhatsApp</a>
    </div>
  </div>

  <div class="page">
    <div class="masthead">
      <div class="brand">
        <div class="logo-box"><img src="${logoUrl}" alt="DripTech EcoFlow Logo" /></div>
        <div>
          <div class="brand-title">${esc(COMPANY.name)}</div>
          <div class="brand-sub">${esc(COMPANY.tagline)}</div>
          <div class="brand-meta">${esc(COMPANY.address)}<br/>${esc(COMPANY.phone)} • ${esc(COMPANY.email)}</div>
        </div>
      </div>
      <div class="doc-box">
        <span class="doc-eyebrow">Engineering Design Sheet</span>
        <div class="doc-type">PUMP &amp; SOLAR REPORT</div>
        <div class="doc-ref">
          <div class="doc-ref-row"><span>Ref Code:</span><strong>${esc(reportCode)}</strong></div>
          <div class="doc-ref-row"><span>Date:</span><strong>${esc(issueDate)}</strong></div>
          <div class="doc-ref-row"><span>Location:</span><strong>${esc(projectMeta.countyTown || region?.label || "Kenya")}</strong></div>
        </div>
      </div>
    </div>

    <div class="body-wrap">
      <!-- KPI Strip -->
      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-label">Design Flow Rate</div>
          <div class="kpi-val">${result.designFlowM3h.toFixed(1)} m³/h</div>
          <div class="kpi-sub">${result.designFlowLpm.toFixed(0)} L/min • ${result.dailyGrossVolumeM3.toFixed(1)} m³/day</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Total Dynamic Head</div>
          <div class="kpi-val">${result.totalDynamicHeadM.toFixed(1)} m</div>
          <div class="kpi-sub">${(result.totalDynamicHeadM / 10.197).toFixed(2)} bar equivalent</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Recommended Motor</div>
          <div class="kpi-val">${result.nearestStandardHp} HP</div>
          <div class="kpi-sub">${result.recommendedMotorKw.toFixed(2)} kW min • VFD ≥ ${result.recommendedVfdKw.toFixed(1)} kW</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">${inputs.powerMode === "ac_grid_generator" ? "Generator / Grid" : "Solar PV Array"}</div>
          <div class="kpi-val">${
            inputs.powerMode === "ac_grid_generator"
              ? `${result.recommendedGeneratorKva.toFixed(1)} kVA`
              : `${result.installedArrayWp.toLocaleString("en-KE")} Wp`
          }</div>
          <div class="kpi-sub">${
            inputs.powerMode === "ac_grid_generator"
              ? `${result.dailyEnergyKwh.toFixed(1)} kWh/day`
              : `${result.parallelStrings}P × ${result.panelsInSeries}S (${inputs.panelWatts}W)`
          }</div>
        </div>
      </div>

      <!-- Client & Site Parameters -->
      <div class="grid-2">
        <div class="panel">
          <div class="panel-head">Project &amp; Farm Basis</div>
          <div class="kv"><span>Project Title</span><strong>${esc(projectMeta.projectName)}</strong></div>
          <div class="kv"><span>Client / Farm</span><strong>${esc(projectMeta.clientName || "—")}</strong></div>
          <div class="kv"><span>Phone / Contact</span><strong>${esc(projectMeta.clientPhone || "—")}</strong></div>
          <div class="kv"><span>Irrigation Method</span><strong>${esc(METHOD_DEFAULTS[inputs.irrigationMethod].label)}</strong></div>
          <div class="kv"><span>Daily Pumping Window</span><strong>${result.effectiveDailyPumpHours} hrs/day (${inputs.zonesCount} zones)</strong></div>
          <div class="kv"><span>Water Source</span><strong>${esc(sourceLabel)}</strong></div>
          ${
            inputs.sourceType === "borehole"
              ? `<div class="kv"><span>Submergence Depth</span><strong>${result.boreholeRecommendedDepthM.toFixed(0)} m (6 m below PWL)</strong></div>`
              : ""
          }
          ${
            inputs.boreholeSafeYieldM3h
              ? `<div class="kv"><span>Tested Borehole Yield</span><strong>${inputs.boreholeSafeYieldM3h.toFixed(1)} m³/h (${result.boreholeYieldUtilisationPct ?? 0}% used)</strong></div>`
              : ""
          }
        </div>

        <div class="panel">
          <div class="panel-head">Solar Weather, NOCT &amp; Electrical Spec</div>
          <div class="kv"><span>Climate Corridor</span><strong>${esc(region?.label || "Custom Kenya Site")}</strong></div>
          <div class="kv"><span>Season Design Mode</span><strong>${esc(seasonLabel)} (${inputs.peakSunHours} PSH)</strong></div>
          <div class="kv"><span>Ambient / Wind / Dawn</span><strong>${inputs.ambientDayTempC}°C / ${inputs.windSpeedMs} m/s / ${inputs.minMorningTempC}°C</strong></div>
          <div class="kv"><span>NOCT Cell Temp &amp; Loss</span><strong>${result.estimatedDayCellTempC.toFixed(1)}°C (${result.computedThermalLossPct.toFixed(1)}% heat loss)</strong></div>
          <div class="kv"><span>String Voltage Check</span><strong>${result.stringVmpV.toFixed(0)}V Vmp / ${result.stringColdVocV.toFixed(0)}V cold Voc</strong></div>
          <div class="kv"><span>Cable (${inputs.cableLengthM} m one-way)</span><strong>${result.recommendedCableMm2} mm² (${result.actualVoltageDropPct.toFixed(2)}% drop)</strong></div>
          <div class="kv"><span>Storage Buffer &amp; Tilt</span><strong>${result.recommendedTankLiters.toLocaleString("en-KE")} L • ${result.recommendedPanelTiltDeg}°–15°</strong></div>
          <div class="kv"><span>Cloud Sim (${result.cloudSimulation.skyWm2} W/m²)</span><strong>${result.cloudSimulation.estimatedHz} Hz (${result.cloudSimulation.estimatedCloudFlowM3h.toFixed(1)} m³/h)</strong></div>
        </div>
      </div>

      <!-- Hydraulic Head & Pipeline Friction Table -->
      <table class="dt-tbl">
        <thead>
          <tr>
            <th>Hydraulic Component / Pipe Segment</th>
            <th>Specification / Basis</th>
            <th class="num">Velocity</th>
            <th class="num">Head / Loss (m)</th>
            <th class="num">% of TDH</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Static Lift &amp; Drawdown</td>
            <td>Static ${result.staticWaterLiftM.toFixed(1)} m + Drawdown ${result.drawdownM.toFixed(1)} m</td>
            <td class="num">—</td>
            <td class="num">${staticTotalM.toFixed(1)}</td>
            <td class="num">${((staticTotalM / result.totalDynamicHeadM) * 100).toFixed(0)}%</td>
          </tr>
          <tr>
            <td>Ground Elevation &amp; Discharge Height</td>
            <td>Slope ${result.elevationGainM.toFixed(1)} m + Riser/Tank ${result.dischargeHeightM.toFixed(1)} m</td>
            <td class="num">—</td>
            <td class="num">${elevTotalM.toFixed(1)}</td>
            <td class="num">${((elevTotalM / result.totalDynamicHeadM) * 100).toFixed(0)}%</td>
          </tr>
          <tr>
            <td>Working Irrigation Pressure Head</td>
            <td>${inputs.workingPressureBar.toFixed(2)} bar × 10.2 m/bar + ${result.filtrationValveLossM.toFixed(1)} m filters/valves</td>
            <td class="num">—</td>
            <td class="num">${(result.workingPressureHeadM + result.filtrationValveLossM).toFixed(1)}</td>
            <td class="num">${(((result.workingPressureHeadM + result.filtrationValveLossM) / result.totalDynamicHeadM) * 100).toFixed(0)}%</td>
          </tr>
          ${activePipes
            .map(
              (seg) => `
          <tr>
            <td>${esc(seg.label)}</td>
            <td>${esc(PIPE_MATERIAL_META[seg.material].label)} (C=${seg.hazenC}) • ${seg.nominalOdMm} mm OD (${seg.innerDiameterMm} mm ID) × ${seg.lengthM} m</td>
            <td class="num">${seg.velocityMs.toFixed(2)} m/s</td>
            <td class="num">${seg.frictionLossM.toFixed(1)}</td>
            <td class="num">${((seg.frictionLossM / result.totalDynamicHeadM) * 100).toFixed(1)}%</td>
          </tr>`,
            )
            .join("")}
          <tr>
            <td>Fittings, Tees &amp; Minor Losses</td>
            <td>${inputs.fittingsLossPct}% of total pipe friction</td>
            <td class="num">—</td>
            <td class="num">${result.fittingsMinorLossM.toFixed(1)}</td>
            <td class="num">${((result.fittingsMinorLossM / result.totalDynamicHeadM) * 100).toFixed(1)}%</td>
          </tr>
          <tr style="background:#eef5f0;font-weight:800;">
            <td>Total Dynamic Head (TDH) Required</td>
            <td>Pump Wire-to-Water Eff: ${result.wireToWaterEfficiencyPct.toFixed(0)}% • Site Altitude: ${inputs.siteAltitudeM} m</td>
            <td class="num">Loss: ${lossesTotalM.toFixed(1)} m</td>
            <td class="num">${result.totalDynamicHeadM.toFixed(1)} m</td>
            <td class="num">100%</td>
          </tr>
        </tbody>
      </table>

      ${
        matchedPumps.length > 0
          ? `<table class="dt-tbl">
        <thead>
          <tr>
            <th>Matched DripTech Equipment</th>
            <th>Datasheet Limits</th>
            <th class="num">Est. @ TDH</th>
            <th class="num">Fit Status</th>
            <th class="num">Catalogue Price</th>
          </tr>
        </thead>
        <tbody>
          ${matchedPumps
            .slice(0, 4)
            .map(
              (m) => `
          <tr>
            <td><strong>${esc(m.product.name)}</strong><br/><span style="color:#475569;font-size:9px;">SKU: ${esc(m.product.model_number || "—")}</span></td>
            <td>Max ${m.specs.maxFlowM3h ?? "?"} m³/h • Max ${m.specs.maxHeadM ?? "?"} m${m.specs.recommendedSolarW ? ` • ${m.specs.recommendedSolarW}W PV` : ""}</td>
            <td class="num">${m.estimatedFlowAtTDHM3h > 0 ? `${m.estimatedFlowAtTDHM3h.toFixed(1)} m³/h` : "Verify"}</td>
            <td class="num">${esc(m.fitStatus === "optimal" ? "Optimal Fit" : m.fitStatus === "workable" ? "Verify Curve" : "Check Specs")}</td>
            <td class="num">${esc(formatPrice(m.product.price))}</td>
          </tr>`,
            )
            .join("")}
        </tbody>
      </table>`
          : ""
      }

      ${
        financial.hasAnyCost
          ? `<table class="dt-tbl">
        <thead>
          <tr>
            <th>User Custom Project Budget Item</th>
            <th class="num">Estimated Cost (KES)</th>
          </tr>
        </thead>
        <tbody>
          ${costRows
            .map(
              (r) => `
          <tr>
            <td>${esc(r.label)}</td>
            <td class="num">${kes(r.amount)}</td>
          </tr>`,
            )
            .join("")}
          <tr style="background:#fbf7eb;font-weight:800;">
            <td>Total Estimated Capital Cost (${esc(numberToWordsKES(Math.round(financial.totalCustomCapexKes)))})</td>
            <td class="num">${kes(financial.totalCustomCapexKes)}</td>
          </tr>
          <tr>
            <td>Baseline ${customCosts.compareBaselineFuel === "kplc_grid" ? "KPLC Grid" : "Petrol / Diesel"} Energy Savings (${customCosts.irrigationDaysPerYear} days/yr)</td>
            <td class="num">${kes(financial.annualSavingsKes)}/yr ${financial.paybackYears ? `(~${financial.paybackYears} yrs payback)` : ""}</td>
          </tr>
        </tbody>
      </table>`
          : ""
      }

      ${result.alerts
        .map(
          (a) =>
            `<div class="alert-box ${a.severity === "critical" ? "alert-critical" : ""}"><strong>${esc(
              a.title,
            )}:</strong> ${esc(a.detail)}</div>`,
        )
        .join("")}

      ${
        projectMeta.notes
          ? `<div class="alert-box" style="background:#f8fafc;"><strong>Site / Engineer Notes:</strong> ${esc(
              projectMeta.notes,
            )}</div>`
          : ""
      }

      <div class="footer-note">
        ${
          shareUrl
            ? `<strong>Shareable Design Link:</strong> ${esc(shareUrl)}<br/>`
            : ""
        }
        <strong>Engineering Verification Note:</strong> Prepared via DripTech EcoFlow Hydraulic &amp; Solar Sizing Workbench using Hazen-Williams pipe friction and Sandia/NOCT cell temperature derating. Confirm driller borehole yield test, pumping dynamic water level (PWL), casing diameter, and manufacturer Q–H duty curve before final procurement. Contact ${esc(
          COMPANY.phone,
        )} or ${esc(COMPANY.email)}.
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function openPumpSolarReportPdf(params: BuildPumpReportParams): void {
  const html = buildPumpSolarReportHtml(params);
  const fullHtml = html.replace(
    "</body>",
    `<script>window.addEventListener("load", function(){ setTimeout(function(){ window.print(); }, 250); });</script></body>`,
  );

  if (typeof window === "undefined") return;
  const popup = window.open("", "_blank");
  if (popup) {
    popup.document.open();
    popup.document.write(fullHtml);
    popup.document.close();
    return;
  }

  // Fallback hidden iframe when popup blockers block new tabs (e.g., mobile Safari/Android)
  const existing = document.getElementById("dt-pump-report-print-iframe");
  if (existing) existing.remove();
  const iframe = document.createElement("iframe");
  iframe.id = "dt-pump-report-print-iframe";
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.srcdoc = fullHtml;
  document.body.appendChild(iframe);
}

export function downloadPumpSolarReportFile(params: BuildPumpReportParams): void {
  if (typeof document === "undefined") return;
  const html = buildPumpSolarReportHtml(params);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `DripTech-Pump-Solar-Report-${params.reportCode}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
