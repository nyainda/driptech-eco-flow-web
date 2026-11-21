export interface ProjectMetricsRecord {
  status?: string | null;
  location?: string | null;
  area_covered?: number | null;
  water_saved?: number | null;
  yield_improvement?: number | null;
  project_type?: string | null;
}

/** Formats water savings cleanly: percentages (<= 100) stay %, larger legacy volume entries show liters. */
export function formatWaterSavedValue(waterSaved?: number | null): string | null {
  if (waterSaved === undefined || waterSaved === null || waterSaved <= 0) {
    return null;
  }
  if (waterSaved <= 100) {
    return `${waterSaved}%`;
  }
  return `${Math.round(waterSaved).toLocaleString("en-KE")} L`;
}

/** Formats covered acreage cleanly with locale thousand separators. */
export function formatAreaCoveredValue(area?: number | null, suffix = "ac"): string | null {
  if (area === undefined || area === null || area <= 0) {
    return null;
  }
  return `${area.toLocaleString("en-KE")} ${suffix}`;
}

/** Computes aggregate portfolio telemetry safely, ignoring >100 outliers from percentage averages. */
export function computeProjectPortfolioStats(projects: ProjectMetricsRecord[]) {
  let completed = 0;
  let totalAcres = 0;
  let percentSamples = 0;
  let percentSum = 0;
  const locations = new Set<string>();
  const types = new Set<string>();

  for (const p of projects) {
    if (p.status?.toLowerCase() === "completed") completed += 1;
    if (p.area_covered && p.area_covered > 0) totalAcres += Number(p.area_covered);
    if (p.water_saved && p.water_saved > 0 && p.water_saved <= 100) {
      percentSamples += 1;
      percentSum += Number(p.water_saved);
    }
    if (p.location?.trim()) locations.add(p.location.trim());
    if (p.project_type?.trim()) types.add(p.project_type.trim());
  }

  return {
    total: projects.length,
    completed,
    totalAcres: Math.round(totalAcres * 10) / 10,
    avgWaterSavedPct: percentSamples > 0 ? Math.round(percentSum / percentSamples) : null,
    locationsCount: locations.size,
    typesCount: types.size,
  };
}
