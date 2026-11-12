import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const siteHost = "www.dripstech.co.ke";
const siteUrl = `https://${siteHost}`;
const indexNowKey = "df81277dd40143d88612acf2d00214a1";
const keyLocation = `${siteUrl}/${indexNowKey}.txt`;

const distSitemapPath = path.join(root, "dist/sitemap.xml");
const publicSitemapPath = path.join(root, "public/sitemap.xml");
const sitemapSource = fs.existsSync(distSitemapPath) ? distSitemapPath : publicSitemapPath;

if (!fs.existsSync(sitemapSource)) {
  console.error("No sitemap.xml found in dist/ or public/. Run `npm run build` first.");
  process.exit(1);
}

const xml = fs.readFileSync(sitemapSource, "utf8");
const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);

console.log(`Loaded ${urls.length} canonical URLs from ${path.relative(root, sitemapSource)}`);

const payload = {
  host: siteHost,
  key: indexNowKey,
  keyLocation,
  urlList: urls,
};

const indexNowEndpoints = [
  { name: "IndexNow Global Hub (Bing / DuckDuckGo / ChatGPT Search / Seznam / Naver)", url: "https://api.indexnow.org/indexnow" },
  { name: "Microsoft Bing IndexNow Direct", url: "https://www.bing.com/indexnow" },
  { name: "Yandex IndexNow Direct", url: "https://yandex.com/indexnow" },
];

for (const endpoint of indexNowEndpoints) {
  try {
    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    console.log(`[${res.status} ${res.statusText}] ${endpoint.name} (${urls.length} URLs submitted)`);
  } catch (err) {
    console.warn(`[WARN] ${endpoint.name} submission error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log("\nSearch Engine Discovery Endpoints Ready:");
console.log(` - XML Sitemap (Google / Bing): ${siteUrl}/sitemap.xml (${urls.length} URLs)`);
console.log(` - IndexNow Key Verification:   ${keyLocation}`);
console.log(` - AI / LLM Search Index:       ${siteUrl}/llms.txt`);
console.log(` - AI Detailed Business Info:   ${siteUrl}/ai-info.txt`);
