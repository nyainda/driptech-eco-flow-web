# Supabase Webhook Setup Guide

To enable automatic synchronization from Supabase to Cloudflare D1, you need to configure webhooks in your Supabase dashboard.

## Prerequisites
- Supabase Project
- Cloudflare Worker URL: `https://dripstech-api.dripstech.workers.dev`

## Steps

1. **Log in to Supabase Dashboard**.
2. Go to your project.
3. Navigate to **Database** > **Webhooks**.
4. Click **Create a new webhook**.

## Configuration

For each table you want to sync (`products`, `blog_posts`, `videos`, `projects`, `success_stories`, `news_articles`, `irrigation_kits`, `documents`, `team`), create a webhook (or one global one if you select "All Tables" in the "Table" dropdown if available, otherwise repeat for each table).

*   **Name**: `Sync [Table Name] to D1`
*   **Table**: Select the table (e.g., `products`).
*   **Events**: Check `INSERT`, `UPDATE`, `DELETE`.
*   **Type**: `HTTP Request`.
*   **Method**: `POST`.
*   **URL**: `https://dripstech-api.dripstech.workers.dev/api/webhooks/supabase`
*   **HTTP Headers**:
    *   `Content-Type`: `application/json`

## Testing

1. Create a new record in Supabase (e.g., add a new product).
2. Check the Cloudflare Worker logs (in Cloudflare Dashboard > Workers > Logs) to see the webhook received.
3. Check the D1 database (or the public website) to see the new record appear automatically.

## Tables to Sync
- `products`
- `blog_posts`
- `videos`
- `projects`
- `success_stories`
- `news_articles`
- `irrigation_kits`
- `documents`
- `team`
