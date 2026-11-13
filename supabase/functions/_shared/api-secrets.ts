type SupabaseAdminLike = {
  from: (table: string) => any;
};

export const OUTREACH_SECRET_KEYS = [
  "xai_api_key",
  "resend_api_key",
  "outreach_from_email",
  "xai_grok_model",
] as const;

const ALLOWED_SECRET_KEY_SET = new Set<string>(OUTREACH_SECRET_KEYS);

export function normalizeSettingString(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidate = obj.value ?? obj.key ?? obj.api_key ?? obj.secret;
    if (typeof candidate === "string") return candidate.trim();
  }
  return "";
}

export function maskSecretValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 10) return `${trimmed.slice(0, 2)}...${trimmed.slice(-2)}`;
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

/**
 * Loads settings cleanly with priority:
 * 1. Locked-down `admin_api_secrets` (saved from Admin -> System Settings -> API Keys)
 * 2. Legacy `system_settings` (fallback if manually entered in SQL/legacy table)
 * 3. Supabase Edge Function secrets (`Deno.env.get(...)`)
 */
export async function loadRuntimeSettingsMap(
  admin: SupabaseAdminLike,
  keys: readonly string[],
  envMap: Record<string, string> = {},
): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {};

  for (const key of keys) {
    const envName = envMap[key];
    const envVal = envName ? (Deno.env.get(envName) || "").trim() : "";
    if (envVal) resolved[key] = envVal;
  }

  try {
    const { data: legacyRows, error: legacyError } = await admin
      .from("system_settings")
      .select("setting_key,setting_value")
      .in("setting_key", [...keys]);

    if (!legacyError && Array.isArray(legacyRows)) {
      for (const row of legacyRows as Array<Record<string, unknown>>) {
        const key = String(row.setting_key || "");
        const val = normalizeSettingString(row.setting_value);
        if (key && val) resolved[key] = val;
      }
    }
  } catch {
    // Non-fatal if system_settings query fails.
  }

  try {
    const { data: secretRows, error: secretError } = await admin
      .from("admin_api_secrets")
      .select("secret_key,secret_value")
      .in("secret_key", [...keys]);

    if (!secretError && Array.isArray(secretRows)) {
      for (const row of secretRows as Array<Record<string, unknown>>) {
        const key = String(row.secret_key || "");
        const val = normalizeSettingString(row.secret_value);
        if (key && val) resolved[key] = val;
      }
    }
  } catch {
    // Table may not be migrated yet; fall back cleanly to env/system_settings.
  }

  return resolved;
}

export async function saveRuntimeSecrets(
  admin: SupabaseAdminLike,
  userId: string,
  updates: Record<string, string | null | undefined>,
): Promise<void> {
  const now = new Date().toISOString();

  for (const [key, rawValue] of Object.entries(updates)) {
    if (!ALLOWED_SECRET_KEY_SET.has(key) || rawValue === undefined) continue;

    if (rawValue === null || !rawValue.trim()) {
      const { error } = await admin
        .from("admin_api_secrets")
        .delete()
        .eq("secret_key", key);
      if (error) throw new Error(`Could not clear ${key}: ${error.message}`);
      continue;
    }

    const { error } = await admin.from("admin_api_secrets").upsert(
      {
        secret_key: key,
        secret_value: rawValue.trim(),
        updated_by: userId,
        updated_at: now,
      },
      { onConflict: "secret_key" },
    );
    if (error) throw new Error(`Could not save ${key}: ${error.message}`);
  }
}
