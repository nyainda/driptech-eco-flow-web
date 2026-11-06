# Google Business Profile product photo sync

This workflow reads the public Cloudflare D1 product feed and can publish one individually approved product image to the DripTech Google Business Profile per week.

## Safety and selection

- It only considers products returned by the public product feed as **featured and in stock**.
- Approval is image-specific: an entry must match both the product ID and the exact HTTPS image URL in `src/data/gbp-photo-allowlist.json`.
- Approving one image never approves the other images attached to that product.
- It publishes into Google's `PRODUCT` photo category; it never labels catalogue images as team-at-work, exterior, interior or cover photos.
- It checks that each source is public HTTPS, JPEG or PNG, between 10 KB and 5 MB, and at least 250 × 250 pixels.
- It uploads at most one photo per run and enforces a seven-day cooldown.
- It stops if the Google profile reaches 90 media items, leaving 10 slots before the 100-item API limit.
- It keeps source-URL hashes in the Actions cache to avoid repeat uploads. The workflow runs three times weekly to keep that cache active.
- The scheduled workflow is disabled until the repository variable `GBP_PHOTO_SYNC_ENABLED` is explicitly set to `true`.

Catalogue images may be supplier images or renders. Review them first and only approve genuine, representative products that DripTech actually sells. Do not use AI-generated images or promotional banners as if they were real product photographs.

## 1. Preview and review every image

Run the workflow manually from **Actions → Google Business Profile Product Photos → Run workflow**, leaving `dry_run = true`.

The workflow reads the product feed from:

`https://dripstech-api.dripstech.workers.dev/api/products?featured=true&in_stock=true&limit=100`

When no images have been approved yet, the script generates:
- `.cache/gbp-product-photo-candidates.html`: a visual gallery with every image, its product name, category, product ID and image number.
- `.cache/gbp-product-photo-candidates.json`: the same candidates in machine-readable form.

The workflow uploads these files as the **GBP product photo review gallery** artifact. Open the completed workflow run, download that artifact, extract it, and open the HTML file in a browser. No Google OAuth credentials are used for this preview because no images are approved yet.

## 2. Approve individual image URLs

Only add the exact product ID and image URL for each image that has been visually reviewed and approved. Example:

```json
{
  "approvedImages": [
    {
      "productId": "product-id-1",
      "imageUrl": "https://cdn.example.com/path/to/approved-product-photo.jpg"
    }
  ]
}
```

The product ID and URL must both match an item in the current featured/in-stock feed. If a product has six images and only one is approved, only that one image can be uploaded.

Commit allowlist changes through a pull request. Do not approve an entire product by ID.

## 3. Google API credentials

The existing Windsor.ai Google Business Profile connection is separate from GitHub Actions. The workflow needs its own Google OAuth client and refresh token with the `https://www.googleapis.com/auth/business.manage` scope, and the Google Business Profile API must be enabled and accessible for the Google Cloud project.

Add these under **GitHub repository → Settings → Secrets and variables → Actions → Secrets**:

- `GBP_CLIENT_ID`
- `GBP_CLIENT_SECRET`
- `GBP_REFRESH_TOKEN`

Never commit these credentials or paste them into source code. Do not use credentials or tokens exposed in chat. External OAuth apps in Testing mode issue refresh tokens that expire after seven days for this scope; resolve the app publishing/verification status and generate a fresh token before relying on unattended scheduled uploads.

The workflow is tied to the currently connected listing:
- Account ID: `107802453294630169300`
- Location ID: `11100731052159024871`

## 4. Enable scheduled uploads

After individual image approvals and valid, durable OAuth credentials are ready:

1. Run the workflow manually with `dry_run = true` and inspect the candidate gallery.
2. Add only approved image URL/product ID pairs to the allowlist through a pull request.
3. Set the repository Actions variable `GBP_PHOTO_SYNC_ENABLED = true` only after OAuth credentials have been verified.
4. Run it manually with `dry_run = false` to test one upload.
5. Scheduled runs then check every Monday, Wednesday and Friday at 08:00 East Africa Time. The seven-day cooldown means no more than one approved photo is uploaded per week.

If Google rejects the credentials or the image URL, the workflow fails visibly and does not mark that image as uploaded.

## Local checks

```bash
node --check scripts/sync-gbp-product-photos.mjs
npm run test:gbp-photos
npm run sync:gbp-photos
```

The local sync command is a dry run unless the publishing environment variables are deliberately configured.
