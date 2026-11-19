import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/shared";
import type { BOQItem, BOQSection } from "@/components/Admin/Quote/BOQSectionBuilder";
import type {
  ClientReportMetadata,
  CompleteEngineeringDesign,
  DamStorageConfig,
  FieldIrrigationConfig,
  HydraulicCouplingMode,
} from "@/lib/engineeringReportEngine";
import {
  computeCustomFinancialSummary,
  CustomCostFigures,
  CustomProjectMetadata,
  DEFAULT_CUSTOM_COST_FIGURES,
  DEFAULT_CUSTOM_PROJECT_META,
  DEFAULT_PUMP_SOLAR_INPUTS,
  MatchedPumpRecommendation,
  PumpSolarInputs,
  PumpSolarResult,
} from "@/lib/pumpSolarSizing";

const LOCAL_REPORTS_STORAGE_KEY = "driptech_saved_pump_reports_v1";
const MAX_LOCAL_REPORTS = 15;

export interface SavedPumpReportRecord {
  reportCode: string;
  createdAt: string;
  projectMeta: CustomProjectMetadata;
  inputs: PumpSolarInputs;
  customCosts: CustomCostFigures;
  resultSummary: {
    designFlowM3h: number;
    dailyGrossVolumeM3: number;
    totalDynamicHeadM: number;
    nearestStandardHp: number;
    installedArrayWp: number;
    recommendedCableMm2: number;
    recommendedTankLiters: number;
    recommendedPumpName: string;
    totalCustomCapexKes: number;
  };
  shareUrl: string;
}

export interface SaveReportOutcome {
  reportCode: string;
  shareUrl: string;
  storageTarget: "cloud_db" | "contact_inbox" | "local_and_link";
  message: string;
  record: SavedPumpReportRecord;
}

interface EncodedDesignPayload {
  v: 1;
  c?: string;
  m?: Partial<CustomProjectMetadata>;
  i: Partial<PumpSolarInputs>;
  b?: Partial<CustomCostFigures>;
}

export function generatePumpReportCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let idx = 0; idx < 4; idx += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `DT-PS-${yy}${mm}${dd}-${suffix}`;
}

function toBase64UrlUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64UrlUtf8(encoded: string): string {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (encoded.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeDesignShareUrl(
  inputs: PumpSolarInputs,
  projectMeta: CustomProjectMetadata,
  customCosts: CustomCostFigures,
  reportCode?: string,
  preferCodeOnly = false,
): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://www.dripstech.co.ke";
  const basePath = `${origin}/pump-solar-calculator-kenya`;
  if (preferCodeOnly && reportCode) {
    return `${basePath}?report=${encodeURIComponent(reportCode)}`;
  }

  const payload: EncodedDesignPayload = {
    v: 1,
    ...(reportCode ? { c: reportCode } : {}),
    m: {
      projectName: projectMeta.projectName,
      countyTown: projectMeta.countyTown,
      notes: projectMeta.notes,
    },
    i: inputs,
    ...(customCosts.includeInReport ? { b: customCosts } : {}),
  };

  const token = toBase64UrlUtf8(JSON.stringify(payload));
  return `${basePath}?design=${token}`;
}

export function decodeDesignFromParam(token: string): {
  reportCode?: string;
  inputs: PumpSolarInputs;
  projectMeta: CustomProjectMetadata;
  customCosts: CustomCostFigures;
} | null {
  try {
    const raw = fromBase64UrlUtf8(token);
    const parsed = JSON.parse(raw) as EncodedDesignPayload;
    if (!parsed || typeof parsed !== "object" || !parsed.i) return null;

    return {
      reportCode: parsed.c,
      inputs: {
        ...DEFAULT_PUMP_SOLAR_INPUTS,
        ...parsed.i,
        suctionPipe: {
          ...DEFAULT_PUMP_SOLAR_INPUTS.suctionPipe,
          ...(parsed.i.suctionPipe || {}),
        },
        primaryPipe: {
          ...DEFAULT_PUMP_SOLAR_INPUTS.primaryPipe,
          ...(parsed.i.primaryPipe || {}),
        },
        secondaryPipe: {
          ...DEFAULT_PUMP_SOLAR_INPUTS.secondaryPipe,
          ...(parsed.i.secondaryPipe || {}),
        },
        customPump: {
          ...DEFAULT_PUMP_SOLAR_INPUTS.customPump,
          ...(parsed.i.customPump || {}),
        },
      },
      projectMeta: {
        ...DEFAULT_CUSTOM_PROJECT_META,
        ...(parsed.m || {}),
      },
      customCosts: {
        ...DEFAULT_CUSTOM_COST_FIGURES,
        ...(parsed.b || {}),
      },
    };
  } catch {
    return null;
  }
}

export function listLocalSavedReports(): SavedPumpReportRecord[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_REPORTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedPumpReportRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocalReportRecord(record: SavedPumpReportRecord): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const existing = listLocalSavedReports().filter(
      (item) => item.reportCode !== record.reportCode,
    );
    const updated = [record, ...existing].slice(0, MAX_LOCAL_REPORTS);
    window.localStorage.setItem(LOCAL_REPORTS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors in restricted WebViews
  }
}

export function deleteLocalSavedReport(reportCode: string): SavedPumpReportRecord[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const updated = listLocalSavedReports().filter((item) => item.reportCode !== reportCode);
    window.localStorage.setItem(LOCAL_REPORTS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function fetchSharedReportByCode(reportCode: string): Promise<{
  reportCode: string;
  inputs: PumpSolarInputs;
  projectMeta: CustomProjectMetadata;
  customCosts: CustomCostFigures;
} | null> {
  try {
    const { data, error } = await supabase.rpc("get_pump_solar_report_by_code", {
      p_report_code: reportCode.trim(),
    });
    if (error || !data || typeof data !== "object") return null;

    const obj = data as Record<string, unknown>;
    const rawInputs = (obj.inputs_json || {}) as Partial<PumpSolarInputs>;
    const rawCosts = (obj.custom_costs_json || {}) as Partial<CustomCostFigures>;

    return {
      reportCode: String(obj.report_code || reportCode),
      inputs: {
        ...DEFAULT_PUMP_SOLAR_INPUTS,
        ...rawInputs,
        suctionPipe: {
          ...DEFAULT_PUMP_SOLAR_INPUTS.suctionPipe,
          ...(rawInputs.suctionPipe || {}),
        },
        primaryPipe: {
          ...DEFAULT_PUMP_SOLAR_INPUTS.primaryPipe,
          ...(rawInputs.primaryPipe || {}),
        },
        secondaryPipe: {
          ...DEFAULT_PUMP_SOLAR_INPUTS.secondaryPipe,
          ...(rawInputs.secondaryPipe || {}),
        },
        customPump: {
          ...DEFAULT_PUMP_SOLAR_INPUTS.customPump,
          ...(rawInputs.customPump || {}),
        },
      },
      projectMeta: {
        ...DEFAULT_CUSTOM_PROJECT_META,
        projectName: String(obj.project_name || DEFAULT_CUSTOM_PROJECT_META.projectName),
        countyTown: String(obj.county || DEFAULT_CUSTOM_PROJECT_META.countyTown),
        notes: String(obj.notes || ""),
      },
      customCosts: {
        ...DEFAULT_CUSTOM_COST_FIGURES,
        ...rawCosts,
      },
    };
  } catch {
    return null;
  }
}

export async function savePumpSolarReport(params: {
  inputs: PumpSolarInputs;
  result: PumpSolarResult;
  projectMeta: CustomProjectMetadata;
  customCosts: CustomCostFigures;
  matchedPumps: MatchedPumpRecommendation[];
  requestEngineerReview?: boolean;
}): Promise<SaveReportOutcome> {
  const {
    inputs,
    result,
    projectMeta,
    customCosts,
    matchedPumps,
    requestEngineerReview = false,
  } = params;

  const reportCode = generatePumpReportCode();
  const financial = computeCustomFinancialSummary(
    customCosts,
    result,
    inputs.electricityTariffKesKwh,
  );
  const topPumpName = matchedPumps[0]?.product.name || "Custom / Heavy-Duty Sizing";
  const createdAt = new Date().toISOString();

  let storageTarget: SaveReportOutcome["storageTarget"] = "local_and_link";
  let message = "Saved locally and created your shareable design permalink.";

  try {
    const { error } = await supabase.from("pump_solar_reports").insert([
      {
        report_code: reportCode,
        project_name: projectMeta.projectName || "Farm Pump & Solar Sizing Design",
        customer_name: projectMeta.clientName || "",
        customer_phone: projectMeta.clientPhone || "",
        customer_email: projectMeta.clientEmail || "",
        county: projectMeta.countyTown || "",
        borehole_yield_m3h: inputs.boreholeSafeYieldM3h,
        design_flow_m3h: Number(result.designFlowM3h.toFixed(2)),
        daily_volume_m3: Number(result.dailyGrossVolumeM3.toFixed(2)),
        tdh_m: Number(result.totalDynamicHeadM.toFixed(1)),
        recommended_hp: result.nearestStandardHp,
        recommended_pv_wp: Math.round(result.installedArrayWp),
        cable_mm2: result.recommendedCableMm2,
        tank_liters: Math.round(result.recommendedTankLiters),
        estimated_budget_kes: financial.hasAnyCost ? financial.totalCustomCapexKes : null,
        recommended_pump_name: topPumpName,
        inputs_json: inputs as unknown as Json,
        result_json: {
          designFlowM3h: result.designFlowM3h,
          dailyGrossVolumeM3: result.dailyGrossVolumeM3,
          totalDynamicHeadM: result.totalDynamicHeadM,
          nearestStandardHp: result.nearestStandardHp,
          recommendedMotorKw: result.recommendedMotorKw,
          installedArrayWp: result.installedArrayWp,
          panelsInSeries: result.panelsInSeries,
          parallelStrings: result.parallelStrings,
          recommendedCableMm2: result.recommendedCableMm2,
          recommendedTankLiters: result.recommendedTankLiters,
          estimatedDayCellTempC: result.estimatedDayCellTempC,
          computedThermalLossPct: result.computedThermalLossPct,
        } as unknown as Json,
        custom_costs_json: customCosts as unknown as Json,
        notes: projectMeta.notes || "",
        status: requestEngineerReview ? "quote_requested" : "saved",
      },
    ]);

    if (!error) {
      storageTarget = "cloud_db";
      message = requestEngineerReview
        ? `Design ${reportCode} saved to DripTech database for engineer review.`
        : `Design ${reportCode} saved to cloud database.`;
    } else if (
      requestEngineerReview ||
      Boolean(projectMeta.clientPhone.trim() || projectMeta.clientEmail.trim())
    ) {
      // Fallback cleanly to existing contact_submissions table when migration is not applied yet
      const summaryLines = [
        `Pump & Solar Sizing Report: ${reportCode}`,
        `Project: ${projectMeta.projectName} (${projectMeta.countyTown || "Kenya"})`,
        `Flow: ${result.designFlowM3h.toFixed(1)} m3/h (${result.dailyGrossVolumeM3.toFixed(1)} m3/day) | TDH: ${result.totalDynamicHeadM.toFixed(1)} m`,
        `Motor: ${result.nearestStandardHp} HP (${result.recommendedMotorKw.toFixed(2)} kW) | PV Array: ${result.installedArrayWp} Wp (${result.parallelStrings}P x ${result.panelsInSeries}S)`,
        `Cable: ${result.recommendedCableMm2} mm2 | Tank: ${result.recommendedTankLiters.toLocaleString()} L`,
        `Recommended Pump Match: ${topPumpName}`,
        financial.hasAnyCost ? `Client Custom Budget Estimate: KES ${financial.totalCustomCapexKes.toLocaleString("en-KE")}` : "",
        projectMeta.notes ? `Notes: ${projectMeta.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const { error: fallbackError } = await supabase.from("contact_submissions").insert([
        {
          name: projectMeta.clientName.trim() || projectMeta.projectName || "Pump Calculator Client",
          email: projectMeta.clientEmail.trim() || "pump-calculator@dripstech.co.ke",
          phone: projectMeta.clientPhone.trim() || null,
          company: projectMeta.countyTown || null,
          project_type: "pump_solar_sizing_report",
          budget_range: financial.hasAnyCost
            ? `KES ${financial.totalCustomCapexKes.toLocaleString("en-KE")}`
            : `${result.nearestStandardHp} HP / ${result.installedArrayWp} Wp`,
          message: summaryLines,
          status: "new",
        },
      ]);

      if (!fallbackError) {
        storageTarget = "contact_inbox";
        message = `Report ${reportCode} sent cleanly to DripTech engineers and saved locally.`;
      }
    }
  } catch {
    // Offline / restricted environment still saves locally & produces shareable permalink
  }

  const shareUrl = encodeDesignShareUrl(
    inputs,
    projectMeta,
    customCosts,
    reportCode,
    storageTarget === "cloud_db",
  );

  const record: SavedPumpReportRecord = {
    reportCode,
    createdAt,
    projectMeta,
    inputs,
    customCosts,
    resultSummary: {
      designFlowM3h: Number(result.designFlowM3h.toFixed(2)),
      dailyGrossVolumeM3: Number(result.dailyGrossVolumeM3.toFixed(1)),
      totalDynamicHeadM: Number(result.totalDynamicHeadM.toFixed(1)),
      nearestStandardHp: result.nearestStandardHp,
      installedArrayWp: Math.round(result.installedArrayWp),
      recommendedCableMm2: result.recommendedCableMm2,
      recommendedTankLiters: Math.round(result.recommendedTankLiters),
      recommendedPumpName: topPumpName,
      totalCustomCapexKes: financial.totalCustomCapexKes,
    },
    shareUrl,
  };

  saveLocalReportRecord(record);

  return {
    reportCode,
    shareUrl,
    storageTarget,
    message,
    record,
  };
}

// ============================================================================
// Admin 1-Click Engineering Report Management & Official Quote Conversion
// ============================================================================

export type AdminReportStatus = "saved" | "quote_requested" | "reviewed" | "archived";

export interface StoredAdminEngineeringBundle {
  field: FieldIrrigationConfig;
  dam: DamStorageConfig;
  meta: ClientReportMetadata;
  couplingMode: HydraulicCouplingMode;
  boqSections: BOQSection[];
  boqItems: BOQItem[];
}

export interface AdminPumpReportRow {
  id: string;
  report_code: string;
  project_name: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  county: string;
  borehole_yield_m3h: number | null;
  design_flow_m3h: number;
  daily_volume_m3: number;
  tdh_m: number;
  recommended_hp: number;
  recommended_pv_wp: number;
  cable_mm2: number;
  tank_liters: number;
  estimated_budget_kes: number | null;
  recommended_pump_name: string;
  inputs_json: Partial<PumpSolarInputs> | null;
  result_json: Record<string, unknown> | null;
  custom_costs_json: Record<string, unknown> | null;
  notes: string;
  status: AdminReportStatus;
  created_at: string;
  sourceOrigin: "pump_solar_reports" | "contact_submission" | "local_browser";
}

export async function fetchAdminEngineeringReports(): Promise<AdminPumpReportRow[]> {
  const rows: AdminPumpReportRow[] = [];
  const seenCodes = new Set<string>();

  try {
    const { data, error } = await supabase
      .from("pump_solar_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && Array.isArray(data)) {
      for (const item of data) {
        seenCodes.add(item.report_code);
        rows.push({
          id: item.id,
          report_code: item.report_code,
          project_name: item.project_name || "Pump & Irrigation Design",
          customer_name: item.customer_name || "",
          customer_phone: item.customer_phone || "",
          customer_email: item.customer_email || "",
          county: item.county || "",
          borehole_yield_m3h: item.borehole_yield_m3h,
          design_flow_m3h: Number(item.design_flow_m3h || 0),
          daily_volume_m3: Number(item.daily_volume_m3 || 0),
          tdh_m: Number(item.tdh_m || 0),
          recommended_hp: Number(item.recommended_hp || 0),
          recommended_pv_wp: Number(item.recommended_pv_wp || 0),
          cable_mm2: Number(item.cable_mm2 || 2.5),
          tank_liters: Number(item.tank_liters || 0),
          estimated_budget_kes:
            item.estimated_budget_kes !== null ? Number(item.estimated_budget_kes) : null,
          recommended_pump_name: item.recommended_pump_name || "",
          inputs_json: (item.inputs_json || null) as Partial<PumpSolarInputs> | null,
          result_json: (item.result_json || null) as Record<string, unknown> | null,
          custom_costs_json: (item.custom_costs_json || null) as Record<string, unknown> | null,
          notes: item.notes || "",
          status: (item.status as AdminReportStatus) || "saved",
          created_at: item.created_at,
          sourceOrigin: "pump_solar_reports",
        });
      }
    }
  } catch {
    // Graceful fallback if table is unreachable
  }

  try {
    const { data: contactRows, error: contactError } = await supabase
      .from("contact_submissions")
      .select("*")
      .eq("project_type", "pump_solar_sizing_report")
      .order("created_at", { ascending: false })
      .limit(30);

    if (!contactError && Array.isArray(contactRows)) {
      for (const c of contactRows) {
        const msg = String(c.message || "");
        const codeMatch = msg.match(/Report:\s*(DT-[A-Z0-9-]+)/i);
        const code = codeMatch?.[1] || `INBOX-${c.id.slice(0, 6).toUpperCase()}`;
        if (seenCodes.has(code)) continue;
        seenCodes.add(code);

        const flowMatch = msg.match(/Flow:\s*([\d.]+)\s*m3\/h/i);
        const tdhMatch = msg.match(/TDH:\s*([\d.]+)\s*m/i);
        const hpMatch = msg.match(/Motor:\s*([\d.]+)\s*HP/i);
        const pvMatch = msg.match(/PV Array:\s*([\d]+)\s*Wp/i);

        rows.push({
          id: `contact-${c.id}`,
          report_code: code,
          project_name: `${c.name} Inquiry`,
          customer_name: c.name || "",
          customer_phone: c.phone || "",
          customer_email: c.email || "",
          county: c.company || "",
          borehole_yield_m3h: null,
          design_flow_m3h: Number(flowMatch?.[1] || 0),
          daily_volume_m3: 0,
          tdh_m: Number(tdhMatch?.[1] || 0),
          recommended_hp: Number(hpMatch?.[1] || 0),
          recommended_pv_wp: Number(pvMatch?.[1] || 0),
          cable_mm2: 2.5,
          tank_liters: 0,
          estimated_budget_kes: null,
          recommended_pump_name: "Check inquiry details",
          inputs_json: null,
          result_json: null,
          custom_costs_json: null,
          notes: msg,
          status: "quote_requested",
          created_at: c.created_at || new Date().toISOString(),
          sourceOrigin: "contact_submission",
        });
      }
    }
  } catch {
    // Ignore contact inbox fallback errors
  }

  // Merge any browser-local saved reports not yet synced
  for (const localRec of listLocalSavedReports()) {
    if (seenCodes.has(localRec.reportCode)) continue;
    seenCodes.add(localRec.reportCode);
    rows.push({
      id: `local-${localRec.reportCode}`,
      report_code: localRec.reportCode,
      project_name: localRec.projectMeta.projectName || "Local Calculator Draft",
      customer_name: localRec.projectMeta.clientName || "",
      customer_phone: localRec.projectMeta.clientPhone || "",
      customer_email: localRec.projectMeta.clientEmail || "",
      county: localRec.projectMeta.countyTown || "",
      borehole_yield_m3h: localRec.inputs.boreholeSafeYieldM3h ?? null,
      design_flow_m3h: localRec.resultSummary.designFlowM3h,
      daily_volume_m3: localRec.resultSummary.dailyGrossVolumeM3,
      tdh_m: localRec.resultSummary.totalDynamicHeadM,
      recommended_hp: localRec.resultSummary.nearestStandardHp,
      recommended_pv_wp: localRec.resultSummary.installedArrayWp,
      cable_mm2: localRec.resultSummary.recommendedCableMm2,
      tank_liters: localRec.resultSummary.recommendedTankLiters,
      estimated_budget_kes: localRec.resultSummary.totalCustomCapexKes || null,
      recommended_pump_name: localRec.resultSummary.recommendedPumpName,
      inputs_json: localRec.inputs,
      result_json: null,
      custom_costs_json: localRec.customCosts as unknown as Record<string, unknown>,
      notes: localRec.projectMeta.notes || "",
      status: "saved",
      created_at: localRec.createdAt,
      sourceOrigin: "local_browser",
    });
  }

  return rows.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function updateAdminReportStatus(
  id: string,
  status: AdminReportStatus,
  notes?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (id.startsWith("local-") || id.startsWith("contact-")) {
    return { ok: false, error: "Save this record into pump_solar_reports first." };
  }
  const patch: Record<string, unknown> = { status };
  if (notes !== undefined) patch.notes = notes;
  const { error } = await supabase.from("pump_solar_reports").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveAdminEngineeringDossier(params: {
  meta: ClientReportMetadata;
  field: FieldIrrigationConfig;
  dam: DamStorageConfig;
  pumpInputs: PumpSolarInputs;
  couplingMode: HydraulicCouplingMode;
  design: CompleteEngineeringDesign;
  boqSections: BOQSection[];
  boqItems: BOQItem[];
}): Promise<{ ok: boolean; reportCode: string; message: string }> {
  const { meta, field, dam, pumpInputs, couplingMode, design, boqSections, boqItems } = params;
  const { pumpResult, matchedPumps } = design;
  const subtotal = boqItems.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const grandTotal = meta.includeVat
    ? subtotal * (1 + (meta.vatRatePct || 16) / 100)
    : subtotal;

  const bundle: StoredAdminEngineeringBundle = {
    field,
    dam,
    meta,
    couplingMode,
    boqSections,
    boqItems,
  };

  const payload = {
    report_code: meta.reportCode,
    project_name: meta.projectTitle || "Integrated Farm Engineering Proposal",
    customer_name: meta.clientName || "",
    customer_phone: meta.clientPhone || "",
    customer_email: meta.clientEmail || "",
    county: meta.countyLocation || "",
    borehole_yield_m3h: pumpInputs.boreholeSafeYieldM3h,
    design_flow_m3h: Number(pumpResult.designFlowM3h.toFixed(2)),
    daily_volume_m3: Number(pumpResult.dailyGrossVolumeM3.toFixed(2)),
    tdh_m: Number(pumpResult.totalDynamicHeadM.toFixed(1)),
    recommended_hp: pumpResult.nearestStandardHp,
    recommended_pv_wp: Math.round(pumpResult.installedArrayWp),
    cable_mm2: pumpResult.recommendedCableMm2,
    tank_liters: Math.round(
      design.damSummary.volumeLiters > 0
        ? design.damSummary.volumeLiters
        : pumpResult.recommendedTankLiters,
    ),
    estimated_budget_kes: Math.round(grandTotal),
    recommended_pump_name:
      matchedPumps[0]?.product.name || `${pumpResult.nearestStandardHp} HP System`,
    inputs_json: design.syncedPumpInputs as unknown as Json,
    result_json: {
      designFlowM3h: pumpResult.designFlowM3h,
      dailyGrossVolumeM3: pumpResult.dailyGrossVolumeM3,
      totalDynamicHeadM: pumpResult.totalDynamicHeadM,
      nearestStandardHp: pumpResult.nearestStandardHp,
      installedArrayWp: pumpResult.installedArrayWp,
      adminEngineeringBundle: bundle,
    } as unknown as Json,
    custom_costs_json: DEFAULT_CUSTOM_COST_FIGURES as unknown as Json,
    notes: meta.siteNotes || "",
    status: "reviewed" as const,
  };

  try {
    const { data: existing } = await supabase
      .from("pump_solar_reports")
      .select("id")
      .eq("report_code", meta.reportCode)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from("pump_solar_reports")
        .update(payload)
        .eq("id", existing.id);
      if (error) return { ok: false, reportCode: meta.reportCode, message: error.message };
      return {
        ok: true,
        reportCode: meta.reportCode,
        message: `Updated Engineering Report ${meta.reportCode} in database.`,
      };
    }

    const { error } = await supabase.from("pump_solar_reports").insert([payload]);
    if (error) return { ok: false, reportCode: meta.reportCode, message: error.message };
    return {
      ok: true,
      reportCode: meta.reportCode,
      message: `Saved Engineering Report ${meta.reportCode} cleanly to database.`,
    };
  } catch (err) {
    return {
      ok: false,
      reportCode: meta.reportCode,
      message: err instanceof Error ? err.message : "Database save failed",
    };
  }
}

export async function pushEngineeringBoqToOfficialQuote(params: {
  customerId?: string | null;
  meta: ClientReportMetadata;
  field: FieldIrrigationConfig;
  pumpInputs: PumpSolarInputs;
  design: CompleteEngineeringDesign;
  boqSections: BOQSection[];
  boqItems: BOQItem[];
}): Promise<{ ok: boolean; quoteNumber?: string; error?: string }> {
  const { customerId, meta, field, pumpInputs, design, boqSections, boqItems } = params;
  const subtotal = boqItems.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const grandTotal = meta.includeVat
    ? subtotal * (1 + (meta.vatRatePct || 16) / 100)
    : subtotal;

  const ym = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const quoteNumber = `DT-BOQ-${ym}-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const validUntil = new Date(Date.now() + Math.max(7, meta.validityDays || 30) * 86400000)
    .toISOString()
    .slice(0, 10);

  try {
    const { data: quoteRow, error: qErr } = await supabase
      .from("quotes")
      .insert({
        quote_number: quoteNumber,
        customer_id: customerId || null,
        project_type:
          field.systemType === "none"
            ? "Solar & Borehole Pumping"
            : `${field.systemType.toUpperCase()} Irrigation + Pump/Solar`,
        crop_type: field.cropName || "Mixed Horticulture",
        area_size: field.acres,
        water_source: meta.waterSourceSummary || pumpInputs.sourceType,
        terrain_info: `${meta.countyLocation} (${pumpInputs.siteAltitudeM}m ASL, ${design.pumpResult.totalDynamicHeadM.toFixed(0)}m TDH)`,
        notes: `Generated from Engineering Report ${meta.reportCode}. ${meta.siteNotes || ""}`.trim(),
        status: "draft",
        valid_until: validUntil,
        total_amount: Number(grandTotal.toFixed(2)),
        include_vat: meta.includeVat,
        vat_rate: meta.vatRatePct || 16,
      })
      .select()
      .single();

    if (qErr || !quoteRow) {
      return { ok: false, error: qErr?.message || "Failed to create quote record" };
    }

    const sectionRows = boqSections.map((s, idx) => ({
      id: crypto.randomUUID(),
      quote_id: quoteRow.id,
      name: s.name,
      description: s.description || null,
      sort_order: idx,
    }));

    const sectionIdMap = new Map<string, string>();
    boqSections.forEach((s, idx) => sectionIdMap.set(s.id, sectionRows[idx].id));

    if (sectionRows.length > 0) {
      const { error: secErr } = await supabase.from("quote_sections").insert(sectionRows);
      if (secErr) return { ok: false, error: secErr.message };
    }

    if (boqItems.length > 0) {
      const itemRows = boqItems.map((item, idx) => ({
        quote_id: quoteRow.id,
        section_id: (item.section_id && sectionIdMap.get(item.section_id)) || sectionRows[0]?.id || null,
        product_id: item.product_id || null,
        sort_order: idx,
        name: item.name,
        description: item.description || "",
        quantity: item.quantity,
        unit: item.unit || "unit",
        unitprice: item.unit_price,
        total: item.total,
      }));
      const { error: itemErr } = await supabase.from("quote_items").insert(itemRows);
      if (itemErr) return { ok: false, error: itemErr.message };
    }

    return { ok: true, quoteNumber };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to push to official quote",
    };
  }
}
