import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const SITE_URL = "https://www.dripstech.co.ke";
const WORKER_URL = (process.env.VITE_WORKER_URL || "https://dripstech-api.dripstech.workers.dev").replace(/\/+$/, "");
const PRODUCTS_URL =
  process.env.GBP_PRODUCTS_API_URL ||
  `${WORKER_URL}/api/products?featured=true&in_stock=true&limit=100`;
const VIDEOS_URL = process.env.GBP_VIDEOS_API_URL || `${WORKER_URL}/api/videos?featured=true&limit=100`;
const EXCLUSIONS_PATH = process.env.GBP_MEDIA_EXCLUSIONS || "src/data/gbp-media-exclusions.json";
const STATE_PATH =
  process.env.GBP_PHOTO_STATE || ".cache/gbp-product-photo-sync.json";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_API_ROOT = "https://mybusiness.googleapis.com/v4";
const MIN_IMAGE_BYTES = 10 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_IMAGE_EDGE = 250;
const MAX_VIDEO_BYTES = 75 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 30;
const MIN_VIDEO_EDGE = 720;
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

async function loadVideos() {
  const payload = await fetchJson(VIDEOS_URL);
  const videos = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.videos)
      ? payload.videos
      : Array.isArray(payload.data)
        ? payload.data
        : null;
  if (!videos) throw new Error("The videos feed did not return a video array.");
  return videos;
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

function makeVideoCandidates(videos) {
  return videos
    .filter((video) => video && video.id != null && video.title && video.video_url)
    .map((video) => ({
      id: String(video.id),
      title: String(video.title),
      description: String(video.description || ""),
      category: String(video.category || ""),
      url: normalizePublicImageUrl(video.video_url),
      thumbnailUrl: normalizePublicImageUrl(video.thumbnail_url),
      declaredDuration: Number(video.duration) || null,
    }))
    .filter((video) => video.url)
    .sort((a, b) => a.title.localeCompare(b.title));
}

function readMediaExclusions() {
  const value = readJson(EXCLUSIONS_PATH, {});
  return {
    productIds: new Set((Array.isArray(value.excludedProductIds) ? value.excludedProductIds : []).map(String)),
    imageUrls: new Set((Array.isArray(value.excludedImageUrls) ? value.excludedImageUrls : []).map((url) => normalizePublicImageUrl(url)).filter(Boolean)),
    videoIds: new Set((Array.isArray(value.excludedVideoIds) ? value.excludedVideoIds : []).map(String)),
  };
}

function buildMediaQueues(products, videos, exclusions, uploadedHashes) {
  const images = products.flatMap((product) =>
    (exclusions.productIds.has(product.id) ? [] : product.imageUrls)
      .map((url, index) => ({
        mediaType: "photo",
        id: product.id,
        title: product.name,
        category: product.category,
        index: index + 1,
        url,
        sha256: sha256(url),
      }))
      .filter((item) => !exclusions.imageUrls.has(item.url) && !uploadedHashes.has(item.sha256)),
  );

  const clips = videos
    .filter((video) => !exclusions.videoIds.has(video.id))
    .map((video) => ({
      mediaType: "video",
      id: video.id,
      title: video.title,
      category: video.category,
      description: video.description,
      declaredDuration: video.declaredDuration,
      thumbnailUrl: video.thumbnailUrl,
      url: video.url,
      sha256: sha256(video.url),
    }))
    .filter((item) => !uploadedHashes.has(item.sha256));

  return { images, clips };
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function writeCandidateReport(products, videos) {
  const reportPath = process.env.GBP_MEDIA_CANDIDATE_REPORT || ".cache/gbp-media-candidates.html";
  const jsonPath = reportPath.replace(/\.html?$/i, ".json");
  const imageRows = products.flatMap((product) =>
    product.imageUrls.map((url, index) => ({
      mediaType: "photo", id: product.id, title: product.name,
      category: product.category, index: index + 1, url,
    })),
  );
  const videoRows = videos.map((video) => ({
    mediaType: "video", id: video.id, title: video.title,
    description: video.description, category: video.category,
    declaredDuration: video.declaredDuration, thumbnailUrl: video.thumbnailUrl, url: video.url,
  }));

  const photoCards = imageRows.map((item) =>
    '<article class="card"><a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer">' +
    '<img loading="lazy" src="' + escapeHtml(item.url) + '" alt="' + escapeHtml(item.title) + '">' +
    '</a><div class="details"><strong>' + escapeHtml(item.title) + '</strong>' +
    '<span>Product · ' + escapeHtml(item.category || "Uncategorised") + ' · Image ' + item.index + '</span>' +
    '<code>ID: ' + escapeHtml(item.id) + '</code></div></article>',
  ).join("\n");

  const videoCards = videoRows.map((item) =>
    '<article class="card">' +
    (item.thumbnailUrl
      ? '<a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="' + escapeHtml(item.thumbnailUrl) + '" alt="' + escapeHtml(item.title) + '"></a>'
      : '<div class="placeholder">VIDEO</div>') +
    '<div class="details"><strong>' + escapeHtml(item.title) + '</strong>' +
    '<span>Video · ' + escapeHtml(item.category || "Uncategorised") + ' · API duration: ' + escapeHtml(item.declaredDuration ?? "unknown") + 's</span>' +
    '<code>ID: ' + escapeHtml(item.id) + '</code>' +
    '<a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer">Open source video</a></div></article>',
  ).join("\n");

  const html = [
    "<!doctype html>", '<html lang="en"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>DripTech GBP media candidates</title>", "<style>",
    "body{font:15px/1.5 system-ui,sans-serif;margin:0;background:#f5f7f8;color:#17202a}",
    "header{padding:24px;background:#123b32;color:#fff}header p{color:#d9e8e2}",
    ".notice{margin:18px;padding:14px;background:#eaf4ed;border:1px solid #b8d4c0;border-radius:10px}",
    ".section-title{padding:4px 18px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;padding:18px}",
    ".card{background:#fff;border:1px solid #dce3e0;border-radius:12px;overflow:hidden}",
    ".card img,.placeholder{display:grid;width:100%;height:210px;object-fit:contain;background:#eef1ef}",
    ".placeholder{place-items:center;color:#315b4b;font-weight:700}.details{display:grid;gap:5px;padding:12px}",
    ".details span{color:#66736e;font-size:13px}code{font-size:11px;overflow-wrap:anywhere;background:#f1f4f2;padding:6px;border-radius:6px}",
    "a{font-size:13px;color:#087b60}", "</style></head><body>",
    "<header><h1>DripTech Eco Flow · Automatic media candidates</h1><p>" +
      imageRows.length + " product images · " + videoRows.length + " published, featured videos</p></header>",
    '<div class="notice"><strong>Automatic selection:</strong> Product images are selected from featured, in-stock products. Video records are selected from published, featured videos; only direct MP4 media passing file, duration and resolution checks can upload. This report is informational, not an upload confirmation.</div>',
    '<h2 class="section-title">Product images (' + imageRows.length + ')</h2><main class="grid">' + photoCards + '</main>',
    '<h2 class="section-title">Featured videos (' + videoRows.length + ')</h2><main class="grid">' + videoCards + '</main>',
    "</body></html>",
  ].join("\n");

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, html);
  writeJson(jsonPath, [...imageRows, ...videoRows]);
  console.log("Media candidate gallery: " + reportPath);
  console.log("Machine-readable media candidates: " + jsonPath);
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
  const approvedKeys = readAllowlist();
  const approved = selectApprovedImages(candidates, approvedKeys);
  const state = readState();
  const uploadedHashes = new Set(state.uploaded.map((item) => item.sha256));

  const availableImageCount = candidates.reduce((total, product) => total + product.imageUrls.length, 0);
  console.log("Loaded " + products.length + " products; " + candidates.length + " have usable image URLs across " + availableImageCount + " individual images.");
  if (approvedKeys.size === 0) {
    console.log("No individual images have been approved yet. Generating the visual review gallery.");
    writeCandidateReport(candidates);
    saveState(state);
    return;
  }
  if (approved.length === 0) {
    throw new Error("The allowlist contains image entries, but none matched the exact product ID and image URL in the featured/in-stock product feed. Re-run the preview and update the allowlist.");
  }

  console.log("Individually approved images: " + approved.length + ".");
  const pending = approved.filter((item) => !uploadedHashes.has(item.sha256));

  console.log(`Allowlisted image URLs: ${approved.length}; not-yet-uploaded images: ${pending.length}.`);
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

  const testCandidates = [{
    id: "product-1",
    name: "Test Dripline",
    category: "drip_irrigation",
    imageUrls: ["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"],
  }];
  const oneImageApproval = new Set([
    approvedImageKey("product-1", "https://cdn.example.com/b.jpg"),
  ]);
  const selected = selectApprovedImages(testCandidates, oneImageApproval);
  if (selected.length !== 1 || selected[0].url !== "https://cdn.example.com/b.jpg" || selected[0].imageIndex !== 2) {
    throw new Error("Image-level allowlist self-test failed: approving one image must not approve sibling images.");
  }

  const noWrongProductApproval = new Set([
    approvedImageKey("different-product", "https://cdn.example.com/b.jpg"),
  ]);
  if (selectApprovedImages(testCandidates, noWrongProductApproval).length !== 0) {
    throw new Error("Image-level allowlist self-test failed: image approvals must match the product ID too.");
  }

  console.log("GBP photo sync self-tests passed, including image-level approval.");
}

if (process.argv.includes("--self-test")) {
  selfTest();
} else {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
