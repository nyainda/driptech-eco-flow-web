# Phase 3: Data Sync Instructions

## Overview
This phase syncs your existing data from Supabase to your new Cloudflare D1 database.

## Prerequisites
- Phase 1 & 2 completed
- `.env` file with Supabase credentials
- `.env.cloudflare` file with `D1_DATABASE_ID` (created in Phase 1)

## How to Run Sync

### 1. Dry Run (Recommended First)
Check what will be synced without making changes:
```bash
npm run sync:d1 -- --dry-run
```

### 2. Full Sync
Sync all tables:
```bash
npm run sync:d1
```

### 3. Sync Specific Table
Sync only one table (e.g., products):
```bash
npm run sync:d1 -- --table=products
```

## Troubleshooting

### Missing Environment Variables
If you see "Missing required environment variables":
1. Check `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Check `.env.cloudflare` has `D1_DATABASE_ID`

### Sync Failures
If specific records fail:
- Check the error logs
- Verify the D1 schema matches your Supabase data
- You can retry syncing just that table

## Next Steps
After syncing:
- Verify data in D1: `npx wrangler d1 execute dripstech-products --remote --command "SELECT COUNT(*) FROM products"`
- Proceed to Phase 4: Frontend Migration
