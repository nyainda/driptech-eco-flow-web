import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const SITE_URL = "https://www.dripstech.co.ke";
const WORKER_URL = (process.env.VITE_WORKER_URL || "https://dripstech-api.dripstech.workers.dev").replace(/\/+$/, "");
const PRODUCTS_URL =
  process.env.GBP_PRODUCTS_API_URL ||
  `${WORKER_URL}/api/products?featured=true&in_stock=true&limit=100`;
const ALLOWLIST_PATH =
  process.env.GBP_PHOTO_ALLOWLIST || "src/data/gbp-photo-allowlist.json";
const STATE_PATH =
  process.env.GBP_PHOTO_STATE || ".cache/gbp-product-photo-sync.json";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_API_ROOT = "https://mybusiness.googleapis.com/v4";
const MIN_IMAGE_BYTES = 10 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_IMAGE_EDGE = 250;
const MIN_DAYS_BETWEEN_UPLOADS = 7;
const MAX_PROFILE_MEDIA = 100;
const PROFILE_MEDIA_HEADROOM = 10;

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n");
}

function parseImageField(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return [value];
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [value.trim()];
  }
}

function imageValue(item) {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return null;
  for (const key of ["url", "image_url", "imageUrl", "public_url", "publicUrl", "src", "original_url"]) {
    if (typeof item[key] === "string" && item[key].trim()) return item[key].trim();
  }
  return null;
}

function normalizePublicImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim(), SITE_URL);
    if (parsed.protocol !== "https:") return null;
    if (
      parsed.hostname === "localhost" ||
      parsed.hostname.endsWith(".local") ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "0.0.0.0" ||
      parsed.hostname === "::1"
    ) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function extractProductImages(product) {
  return [...new Set(
    parseImageField(product.images)
      .map(imageValue)
      .map(normalizePublicImageUrl)
      .filter(Boolean),
  )];
}

function parseImageDimensions(bytes) {
  const b = Buffer.from(bytes);
  // PNG: signature followed by IHDR width/height.
  if (
    b.length >= 24 &&
    b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    b.toString("ascii", 12, 16) === "IHDR"
  ) {
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), mime: "image/png" };
  }

  // JPEG: scan Start Of Frame segments for the encoded dimensions.
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let offset = 2;
    const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    while (offset + 9 < b.length) {
      if (b[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      while (offset < b.length && b[offset] === 0xff) offset += 1;
      const marker = b[offset++];
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > b.length) break;
      const segmentLength = b.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > b.length) break;
      if (sofMarkers.has(marker) && segmentLength >= 7) {
        return {
          height: b.readUInt16BE(offset + 3),
          width: b.readUInt16BE(offset + 5),
          mime: "image/jpeg",
        };
      }
      offset += segmentLength;
    }
  }
  return null;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(25_000),
    headers: { Accept: "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}: ${text.slice(0, 500)}`);
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Expected JSON from ${url}, but received an invalid response.`);
  }
}

async function loadProducts() {
  const payload = await fetchJson(PRODUCTS_URL);
  const products = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.products)
      ? payload.products
      : Array.isArray(payload.data)
        ? payload.data
        : null;
  if (!products) throw new Error("The product feed did not return a product array.");
  return products;
}

function readAllowlist() {
  const value = readJson(ALLOWLIST_PATH, {});
  const ids = Array.isArray(value.approvedProductIds) ? value.approvedProductIds : [];
  return new Set(ids.map((id) => String(id).trim()).filter(Boolean));
}

function makeCandidates(products) {
  return products
    .filter((product) => product && product.id != null && product.name)
    .map((product) => ({
      id: String(product.id),
      name: String(product.name),
      category: String(product.category || ""),
      imageUrls: extractProductImages(product),
    }))
    .filter((product) => product.imageUrls.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function readState() {
  const state = readJson(STATE_PATH, {});
  return {
    uploaded: Array.isArray(state.uploaded) ? state.uploaded : [],
    lastUploadAt: state.lastUploadAt || null,
  };
}

function saveState(state) {
  // Keep the latest 500 records; the hash list is only a duplicate guard.
  state.uploaded = state.uploaded.slice(-500);
  writeJson(STATE_PATH, state);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function getGoogleAccessToken() {
  const clientId = process.env.GBP_CLIENT_ID;
  const clientSecret = process.env.GBP_CLIENT_SECRET;
  const refreshToken = process.env.GBP_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing GBP_CLIENT_ID, GBP_CLIENT_SECRET or GBP_REFRESH_TOKEN GitHub Actions secrets. See docs/GBP-PRODUCT-PHOTO-SYNC.md.",
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const result = await fetchJson(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!result.access_token) throw new Error("Google OAuth did not return an access token.");
  return result.access_token;
}

function googleLocationPath() {
  const accountId = process.env.GBP_ACCOUNT_ID || "107802453294630169300";
  const locationId = process.env.GBP_LOCATION_ID || "11100731052159024871";
  return `accounts/${encodeURIComponent(accountId)}/locations/${encodeURIComponent(locationId)}`;
}

async function googleApi(url, accessToken, options = {}) {
  return fetchJson(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
}

async function getExistingMediaCount(accessToken) {
  const endpoint = `${GOOGLE_API_ROOT}/${googleLocationPath()}/media?pageSize=100`;
  const response = await googleApi(endpoint, accessToken);
  return Number(response.totalMediaItemCount ?? response.mediaItems?.length ?? 0);
}

async function validateImage(url) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(25_000),
    headers: { "User-Agent": "DripTech-GBP-Photo-Sync/1.0" },
  });
  if (!response.ok) throw new Error(`Image returned HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < MIN_IMAGE_BYTES) throw new Error("Image is smaller than Google's 10 KB minimum.");
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("Image exceeds Google's 5 MB maximum.");
  const dimensions = parseImageDimensions(bytes);
  if (!dimensions || !["image/jpeg", "image/png"].includes(dimensions.mime)) {
    throw new Error("Only genuine JPEG and PNG images are supported.");
  }
  if (dimensions.width < MIN_IMAGE_EDGE || dimensions.height < MIN_IMAGE_EDGE) {
    throw new Error(`Image is too small (${dimensions.width}×${dimensions.height}; minimum 250×250).`);
  }
  return {
    width: dimensions.width,
    height: dimensions.height,
    bytes: bytes.length,
    mime: dimensions.mime,
  };
}

async function uploadPhoto(url, accessToken) {
  const endpoint = `${GOOGLE_API_ROOT}/${googleLocationPath()}/media`;
  return googleApi(endpoint, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mediaFormat: "PHOTO",
      locationAssociation: { category: "PRODUCT" },
      sourceUrl: url,
    }),
  });
}

async function main() {
  const products = await loadProducts();
  const candidates = makeCandidates(products);
  const approvedIds = readAllowlist();
  const approved = candidates.filter((product) => approvedIds.has(product.id));
  const state = readState();
  const uploadedHashes = new Set(state.uploaded.map((item) => item.sha256));

  console.log(`Loaded ${products.length} products; ${candidates.length} have usable image URLs.`);
  if (approvedIds.size === 0) {
    console.log("No product IDs have been approved yet. Review candidate images before adding IDs to the allowlist:");
    for (const product of candidates.slice(0, 40)) {
      console.log(`- ${product.id} | ${product.name} | ${product.category} | ${product.imageUrls.length} image(s) | ${product.imageUrls[0]}`);
    }
    saveState(state);
    return;
  }
  if (approved.length === 0) {
    throw new Error("The allowlist has product IDs, but none matched the featured/in-stock product feed.");
  }

  const pending = approved.flatMap((product) =>
    product.imageUrls.map((url) => ({
      productId: product.id,
      productName: product.name,
      url,
      sha256: sha256(url),
    })),
  ).filter((item) => !uploadedHashes.has(item.sha256));

  console.log(`Allowlisted products: ${approved.length}; unused image candidates: ${pending.length}.`);
  if (pending.length === 0) {
    console.log("All allowlisted image URLs have already been processed.");
    saveState(state);
    return;
  }

  const explicitDryRun = process.env.GBP_DRY_RUN === "true";
  const scheduledEnabled = process.env.GBP_PHOTO_SYNC_ENABLED === "true";
  const manualLiveRun =
    process.env.GITHUB_EVENT_NAME === "workflow_dispatch" && process.env.GBP_DRY_RUN === "false";
  const enabled = scheduledEnabled || manualLiveRun;

  if (!enabled || explicitDryRun) {
    console.log("DRY RUN — no Google Business Profile changes will be made.");
    for (const item of pending.slice(0, 10)) {
      console.log(`Candidate: ${item.productName} [${item.productId}] — ${item.url}`);
    }
    saveState(state);
    return;
  }

  const lastUpload = state.lastUploadAt ? Date.parse(state.lastUploadAt) : 0;
  const ageDays = (Date.now() - lastUpload) / 86_400_000;
  if (lastUpload && ageDays < MIN_DAYS_BETWEEN_UPLOADS) {
    console.log(`Rate guard: last upload was ${ageDays.toFixed(1)} days ago; next upload is due after 7 days.`);
    saveState(state);
    return;
  }

  const accessToken = await getGoogleAccessToken();
  const existingCount = await getExistingMediaCount(accessToken);
  if (existingCount >= MAX_PROFILE_MEDIA - PROFILE_MEDIA_HEADROOM) {
    console.log(`Profile already has ${existingCount} media items; keeping ${PROFILE_MEDIA_HEADROOM} slots in reserve and stopping.`);
    saveState(state);
    return;
  }

  for (const item of pending) {
    try {
      const quality = await validateImage(item.url);
      const response = await uploadPhoto(item.url, accessToken);
      state.uploaded.push({
        sha256: item.sha256,
        productId: item.productId,
        productName: item.productName,
        mediaName: response.name || response.mediaItem?.name || null,
        uploadedAt: new Date().toISOString(),
      });
      state.lastUploadAt = new Date().toISOString();
      saveState(state);
      console.log(
        `Uploaded PRODUCT photo for ${item.productName} (${quality.width}×${quality.height}, ${Math.round(quality.bytes / 1024)} KB).`,
      );
      return; // One approved image per run; no profile flooding.
    } catch (error) {
      console.warn(`Skipped ${item.productName}: ${error.message}`);
    }
  }

  saveState(state);
  console.log("No allowlisted image passed validation; no photo was published.");
}

function selfTest() {
  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png, 0);
  png.write("IHDR", 12, "ascii");
  png.writeUInt32BE(720, 16);
  png.writeUInt32BE(640, 20);
  const dimensions = parseImageDimensions(png);
  if (dimensions?.width !== 720 || dimensions?.height !== 640 || dimensions?.mime !== "image/png") {
    throw new Error("PNG dimension parser self-test failed.");
  }
  const urls = extractProductImages({
    images: JSON.stringify(["/products/drip.jpg", { url: "https://cdn.example.com/filter.png" }, "javascript:alert(1)"]),
  });
  if (
    urls.length !== 2 ||
    urls[0] !== "https://www.dripstech.co.ke/products/drip.jpg" ||
    urls[1] !== "https://cdn.example.com/filter.png"
  ) {
    throw new Error("Product image URL extraction self-test failed.");
  }
  console.log("GBP photo sync self-tests passed.");
}

if (process.argv.includes("--self-test")) {
  selfTest();
} else {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
