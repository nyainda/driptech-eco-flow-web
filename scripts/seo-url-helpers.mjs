export function toAbsoluteSiteAssetUrl(value, siteUrl) {
  if (typeof value !== "string") return undefined;
  const url = value.trim();
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/") && !url.startsWith("//")) return `${siteUrl}${url}`;
  return undefined;
}

export const serializeJsonLd = (value) =>
  JSON.stringify(value).replace(/</g, "\\u003c");
