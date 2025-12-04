# Phase 5: Production Deployment

## Goal
Deploy the Cloudflare Worker and D1 database to production, and configure the frontend to use the production Worker URL.

## Prerequisites
- [x] Phase 1: Infrastructure Setup
- [x] Phase 2: Cloudflare Worker API
- [x] Phase 3: Data Sync
- [x] Phase 4: Frontend Migration

## Steps

### 1. Deploy Cloudflare Worker
Deploy the Worker to the Cloudflare global network.

```bash
cd cloudflare-worker
npx wrangler deploy
```

### 2. Verify Production D1 Database
Ensure the production D1 database is set up and synced.
*Note: We are using the same D1 database for both preview and production for now, as defined in `wrangler.toml`.*

### 3. Configure Frontend Environment
Update the production environment variables (e.g., in Vercel, Netlify, or `.env.production`).

```env
VITE_USE_D1=true
VITE_WORKER_URL=https://dripstech-api.YOUR-SUBDOMAIN.workers.dev
```

### 4. Final Verification
- Verify the production Worker URL returns data.
- Verify the frontend loads data from the production Worker.
- Check for any CORS issues.

## Rollback Plan
If issues arise, revert `VITE_USE_D1` to `false` to switch back to Supabase immediately.
