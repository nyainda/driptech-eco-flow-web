# Adding New Tables to Hybrid Architecture

This guide explains how to add a new table to the Supabase + Cloudflare D1 hybrid architecture.

## Overview

When you create a new table in Supabase, it is **NOT** automatically created in Cloudflare D1. You must manually set it up to enable synchronization.

## Step-by-Step Guide

### 1. Create Table in Supabase
Create your table in the Supabase Dashboard as usual.
- **Example**: `mpesa_transactions`
- **Columns**: `id` (text/uuid), `amount` (number), `phone` (text), `status` (text)

### 2. Create Table in Cloudflare D1
You must manually create the corresponding table in D1 using `wrangler`.

**Command:**
```bash
cd cloudflare-worker
npx wrangler d1 execute dripstech-products --command="CREATE TABLE mpesa_transactions (id TEXT PRIMARY KEY, amount REAL, phone TEXT, status TEXT, created_at TEXT, updated_at TEXT)" --remote
```

> **Note**: SQLite types are slightly different from PostgreSQL:
> - `TEXT` instead of `VARCHAR`, `UUID`, `TIMESTAMP`
> - `REAL` or `INTEGER` instead of `NUMERIC`, `DECIMAL`
> - `INTEGER` (0/1) instead of `BOOLEAN`

### 3. Update Cloudflare Worker Schema
The Worker needs to know which columns to sync.

1. Open `cloudflare-worker/src/index.ts`
2. Find `D1_SCHEMA` constant
3. Add your new table:

```typescript
const D1_SCHEMA = {
    // ... existing tables
    mpesa_transactions: ['id', 'amount', 'phone', 'status', 'created_at', 'updated_at']
};
```

4. Deploy the worker:
```bash
npm run deploy
```

### 4. Configure Webhook (For Automatic Sync)
1. Go to **Supabase Dashboard** → **Database** → **Webhooks**
2. Click **Create Webhook**
3. **Name**: `sync-mpesa-transactions`
4. **Table**: `mpesa_transactions`
5. **Events**: Check `INSERT`, `UPDATE`, `DELETE`
6. **Type**: `HTTP Request`
7. **Method**: `POST`
8. **URL**: `https://dripstech-api.dripstech.workers.dev/api/webhooks/supabase`
9. **Headers**: Add `Content-Type: application/json`

### 5. Verify Sync
1. Go to **Admin Dashboard** → **Sync Status**
2. Use the **"Sync Custom Table"** card
3. Type `mpesa_transactions` and press Enter
4. If successful, you'll see "Synced X records"

## Best Practices

### Which Tables to Sync?
- ✅ **Public Content**: Products, Blogs, Projects, Team (Read-heavy, cached)
- ❌ **Private Data**: Users, Payments, Secrets (Sensitive, real-time)
- ❌ **Logs/Analytics**: High volume, write-heavy

### Handling Schema Changes
If you add a column to Supabase later:
1. Run `ALTER TABLE` command in D1 via `wrangler`
2. Update `D1_SCHEMA` in `index.ts`
3. Deploy worker

```bash
npx wrangler d1 execute dripstech-products --command="ALTER TABLE mpesa_transactions ADD COLUMN reference_code TEXT" --remote
```
