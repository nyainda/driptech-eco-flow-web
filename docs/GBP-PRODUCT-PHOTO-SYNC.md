# Google Business Profile product photo sync

This workflow reads the public Cloudflare D1 product feed and can publish one approved product image to the DripTech Google Business Profile per week.

## Safety and selection

- It only considers products returned by the public product feed as **featured and in stock**.
- Product IDs must be explicitly added to `src/data/gbp-photo-allowlist.json`.
- It publishes into Google's `PRODUCT` photo category; it never labels catalogue images as team-at-work, exterior, interior or cover photos.
- It checks that each source is public HTTPS, JPEG or PNG, between 10 KB and 5 MB, and at least 250 × 250 pixels.
- It uploads at most one photo per run and enforces a seven-day cooldown.
- It stops if the Google profile reaches 90 media items, leaving 10 slots before the 100-item API limit.
- It keeps source-URL hashes in the Actions cache to avoid repeat uploads. The workflow runs three times weekly to keep that cache active.
- The scheduled workflow is disabled until the repository variable `GBP_PHOTO_SYNC_ENABLED` is explicitly set to `true`.

Catalogue images may be supplier images or renders. Review them first and only approve genuine, representative products that DripTech actually sells. Do not use AI-generated images or promotional banners as if they were real product photographs.

## 1. Preview available product images

Run the workflow manually from **Actions → Google Business Profile Product Photos → Run workflow**, leaving **dry_run = true**.

The workflow prints candidate product IDs, names and image URLs from:

`https://dripstech-api.dripstech.workers.dev/api/products?featured=true&in_stock=true&limit=100`

No Google OAuth credentials are needed for this preview.

Inspect the candidate images on the website. Add only the IDs whose images are accurate, current and suitable for Google to `src/data/gbp-photo-allowlist.json`, for example:

```json
{
  "approvedProductIds": ["product-id-1", "product-id-2"]
}
```

Commit the allowlist change through a pull request.

## 2. Google API credentials

The existing Windsor.ai Google Business Profile connection is separate from GitHub Actions. The workflow needs its own Google OAuth client and refresh token with the `https://www.googleapis.com/auth/business.manage` scope, and the Google Business Profile API must be enabled and accessible for the Google Cloud project.

Add these under **GitHub repository → Settings → Secrets and variables → Actions → Secrets**:

- `GBP_CLIENT_ID`
- `GBP_CLIENT_SECRET`
- `GBP_REFRESH_TOKEN`

Never commit these credentials or paste them into source code.

The workflow is tied to the currently connected listing:
- Account ID: `107802453294630169300`
- Location ID: `11100731052159024871`

## 3. Enable scheduled uploads

After the allowlist and secrets are ready:

1. Run the workflow manually with `dry_run = true` and confirm the candidates.
2. Set the repository Actions variable `GBP_PHOTO_SYNC_ENABLED = true`.
3. Run it manually with `dry_run = false` to test one upload.
4. Scheduled runs then check every Monday, Wednesday and Friday at 08:00 East Africa Time. The seven-day cooldown means no more than one approved photo is uploaded per week.

If the Google API rejects the credentials or the image URL, the workflow fails visibly and does not mark that image as uploaded.

## Local checks

```bash
npm run test:gbp-photos
npm run sync:gbp-photos
```

The local sync command is a dry run unless the publishing environment variables are deliberately configured.
