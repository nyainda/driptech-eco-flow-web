# Google Business Profile automatic media sync

This workflow automatically selects eligible product photos and videos from the public Cloudflare D1 feeds and can publish one new media item to the DripTech Google Business Profile per seven days.

## Automatic selection rules

### Product photos

- The product feed is queried with `featured=true` and `in_stock=true`.
- Every HTTPS image URL attached to those featured, in-stock products enters the automatic queue unless it is in the exclusions file.
- Before upload, the source is downloaded and checked for JPG/PNG format, a size between 10 KB and 5 MB, and minimum 250 × 250 dimensions.
- Photos are uploaded as `PHOTO` in the Google `PRODUCT` category.

### Videos

- The Worker endpoint `/api/videos?featured=true&limit=100` returns published videos and filters for featured records.
- A video must be a publicly accessible direct MP4 URL. YouTube/TikTok watch-page URLs and other HTML/embed pages are skipped because they are not source video files.
- The video is inspected with ffprobe and must be no longer than 30 seconds, no larger than 75 MB, and at least 720p on its shorter edge.
- Videos are uploaded as `VIDEO` in Google's `ADDITIONAL` category.

The Google Business Profile API supports creating media from a publicly accessible source URL for both photos and videos. Google's published video requirements are up to 30 seconds, up to 75 MB, and 720p or higher. See [Google's media upload guide](https://developers.google.com/my-business/content/upload-photos) and [Business Profile photo/video guidance](https://support.google.com/business/answer/6103862).

## Automatic publishing safeguards

- The API's featured and published flags act as the content-selection controls. No per-image or per-video manual allowlist is required.
- Optional exclusions are in `src/data/gbp-media-exclusions.json`:
  - `excludedProductIds`: omit every photo for a product.
  - `excludedImageUrls`: omit one exact image URL.
  - `excludedVideoIds`: omit a video record.
- The workflow uploads at most one media item per seven days and alternates between photo and video queues when both have eligible items.
- It stops when the Business Profile has 90 media items, leaving 10 slots below the API's 100-item limit.
- Source-URL hashes are stored in the GitHub Actions cache to avoid repeat uploads.
- The schedule checks Monday, Wednesday and Friday at 08:00 East Africa Time. The seven-day rate guard means no more than one item is uploaded per week.
- Scheduled publishing stays disabled until the repository variable `GBP_PHOTO_SYNC_ENABLED` is explicitly set to `true`.
- The workflow is dry-run by default when manually dispatched.

**Important content-quality note:** Automatic selection trusts the catalogue's featured/in-stock flags and the video library's published/featured flags, then checks technical requirements. It does not use a human to judge whether a supplier photo is a real-life field photograph or whether every video is the best marketing choice. Make sure only appropriate, representative content is marked featured/published in the admin system. Google may separately review submitted media and can mark it pending, live or not approved.

## Preview and media report

Run **Actions → Google Business Profile Product Photos → Run workflow** and leave `dry_run = true`.

The run queries:
- `https://dripstech-api.dripstech.workers.dev/api/products?featured=true&in_stock=true&limit=100`
- `https://dripstech-api.dripstech.workers.dev/api/videos?featured=true&limit=100`

It attaches a short-lived **gbp-media-candidate-gallery** artifact containing:
- `.cache/gbp-media-candidates.html`: visual gallery of product images and videos.
- `.cache/gbp-media-candidates.json`: machine-readable candidate list.

The preview does not call Google's OAuth or upload endpoints.

## Google API credentials

GitHub Actions uses its own Google OAuth client and refresh token with the `https://www.googleapis.com/auth/business.manage` scope. The existing Windsor.ai Google Business Profile connection is separate.

Add these repository secrets under **Settings → Secrets and variables → Actions**:

- `GBP_CLIENT_ID`
- `GBP_CLIENT_SECRET`
- `GBP_REFRESH_TOKEN`

Never commit credentials or paste tokens into source code. Do not use credentials or tokens exposed in chat. External OAuth apps in Testing mode issue refresh tokens that expire after seven days for this scope; complete the required publishing/verification steps and generate a fresh token before relying on unattended scheduled uploads.

The workflow is tied to the connected listing:
- Account ID: `107802453294630169300`
- Location ID: `11100731052159024871`

## Enable scheduled publishing

Only after API access and durable OAuth credentials have been verified:

1. Run a manual preview with `dry_run = true`.
2. Ensure the featured/in-stock product records and published/featured video records contain appropriate media.
3. Set the repository Actions variable `GBP_PHOTO_SYNC_ENABLED = true`.
4. Run a manual test with `dry_run = false` to publish one item.
5. Scheduled runs then continue automatically, subject to the seven-day rate guard.

If Google rejects the credentials or media source, the workflow fails visibly and does not mark the item as uploaded.

## Local checks

```bash
node --check scripts/sync-gbp-product-photos.mjs
npm run test:gbp-photos
npm run sync:gbp-photos
```
