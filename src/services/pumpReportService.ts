import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/shared";
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
