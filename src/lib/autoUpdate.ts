/**
 * Automatic zero-cookie-clear deployment refresh.
 *
 * Ensures visitors and staff always load newly deployed bundles automatically:
 * 1. Purges legacy CacheStorage entries ('driptech-v1', etc.) without touching cookies or auth storage.
 * 2. Polls /version.json?t=... on startup, tab focus, reconnect, and every 3 minutes.
 * 3. Reloads once (loop-guarded via sessionStorage) when a new buildId, updated Service Worker,
 *    or stale-deploy chunk error is detected.
 */

const RELOAD_GUARD_KEY = "driptech_auto_reload_at";
const RELOAD_COOLDOWN_MS = 15_000;
const CHECK_INTERVAL_MS = 3 * 60 * 1000;
const FOCUS_THROTTLE_MS = 15_000;

let initialized = false;
let lastCheckedAt = 0;

function canReloadNow(): boolean {
  try {
    const raw = sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (!raw) return true;
    const prev = Number(raw);
    return !Number.isFinite(prev) || Date.now() - prev > RELOAD_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function triggerSafeReload(): void {
  if (!canReloadNow()) return;
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // Ignore storage quota / private mode restrictions
  }
  window.location.reload();
}

async function purgeStaleAssetCaches(includeWorkbox = false): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => {
          if (key.startsWith("driptech-v")) return true;
          if (key === "driptech-html-nav") return true;
          return includeWorkbox && key.startsWith("workbox-");
        })
        .map((key) => caches.delete(key)),
    );
  } catch {
    // CacheStorage may be unavailable in restricted contexts
  }
}

async function requestSwUpdate(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update();
  } catch {
    // Ignore transient SW check failures while offline
  }
}

async function checkForNewBuild(force = false): Promise<void> {
  if (typeof __APP_BUILD_ID__ !== "string") return;
  if (document.visibilityState === "hidden") return;

  const now = Date.now();
  if (!force && now - lastCheckedAt < FOCUS_THROTTLE_MS) return;
  lastCheckedAt = now;

  try {
    const res = await fetch(`/version.json?t=${now}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    if (!res.ok) return;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return;

    const data = (await res.json()) as { buildId?: string };
    if (data?.buildId && data.buildId !== __APP_BUILD_ID__) {
      await purgeStaleAssetCaches(true);
      await requestSwUpdate();
      triggerSafeReload();
    }
  } catch {
    // Network errors (offline / aborted navigation) should stay quiet
  }
}

function isChunkLoadFailure(reason: unknown): boolean {
  const message =
    typeof reason === "string"
      ? reason
      : reason instanceof Error
        ? reason.message
        : "";
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading (?:CSS )?chunk/i.test(
    message,
  );
}

export function initAutoUpdate(): void {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  // Immediately drop legacy precache buckets from prior versions without touching cookies.
  void purgeStaleAssetCaches(false);

  // When a newly installed Service Worker claims this tab, refresh cleanly for synced chunks.
  if ("serviceWorker" in navigator) {
    const hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadController) {
        triggerSafeReload();
      }
    });
  }

  // Recover seamlessly if a user taps a lazy route right after a deploy swapped chunk hashes.
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    void purgeStaleAssetCaches(true).finally(() => triggerSafeReload());
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadFailure(event.reason)) {
      event.preventDefault();
      void purgeStaleAssetCaches(true).finally(() => triggerSafeReload());
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void requestSwUpdate();
      void checkForNewBuild(false);
    }
  });

  window.addEventListener("online", () => {
    void requestSwUpdate();
    void checkForNewBuild(true);
  });

  // Initial post-paint check and gentle background polling every 3 minutes
  window.setTimeout(() => {
    void checkForNewBuild(true);
  }, 2000);

  window.setInterval(() => {
    void requestSwUpdate();
    void checkForNewBuild(false);
  }, CHECK_INTERVAL_MS);
}
