# DripTech EcoFlow

Smart irrigation solutions web application for a Kenyan irrigation company. Built with React + Vite frontend, Supabase backend, and Cloudflare Workers edge API.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite, styled with Tailwind CSS and Radix UI (Shadcn pattern)
- **Routing**: React Router DOM v6
- **State/Data**: TanStack Query v5
- **Backend**: Supabase (Auth, PostgreSQL database, Edge Functions, Storage)
- **Edge API**: Cloudflare Workers + D1 (distributed cache for public product/blog data)
- **Forms**: React Hook Form + Zod

## Running the App

```bash
npm install
npm run dev
```

Dev server runs on port 5000 with `host: "0.0.0.0"` and `allowedHosts: true` — configured for Replit's proxy environment.

## Required Secrets

Set these in Replit Secrets:

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (https://xxxx.supabase.co) |
| `VITE_SUPABASE_ANON_KEY` | Supabase project anon/public key |

## Environment Variables (non-sensitive)

Set in Replit's shared environment:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_USE_D1` | `true` | Use Cloudflare D1 edge data for public pages |
| `VITE_WORKER_URL` | `https://dripstech-api.dripstech.workers.dev` | Cloudflare Worker API endpoint |

## Data Flow

- **Public pages** (Products, Blog, Home): Fetch from Cloudflare Worker (`VITE_WORKER_URL`) for fast edge delivery
- **Admin panel** (`/admin`): Uses Supabase directly for auth, CRUD operations, analytics
- **Auth**: Supabase Auth with PKCE flow

## Key Directories

- `src/pages/` — Page-level components (Home, Products, Blog, Admin, etc.)
- `src/components/` — Reusable UI components (admin dashboard, layout, common)
- `src/integrations/supabase/` — Supabase client and TypeScript types
- `src/hooks/` — Custom React hooks (visitor tracking, WhatsApp products, etc.)
- `src/services/` — API and data services (email, data fetching)
- `supabase/migrations/` — All database schema migrations
- `supabase/functions/` — Supabase Edge Functions (blog generation, newsletter, notifications)
- `cloudflare-worker/` — Cloudflare Worker source (edge API + D1 sync)
- `public/` — Static assets

## Admin Access

Navigate to `/admin` — login with your Supabase admin credentials. Admin users are managed via the `admin_users` and `user_roles` tables in Supabase.
