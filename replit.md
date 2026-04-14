# DripTech EcoFlow

Smart irrigation solutions web application for a Kenyan irrigation company. Built with React + Vite frontend and Supabase backend.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite, styled with Tailwind CSS and Radix UI (Shadcn pattern)
- **Routing**: React Router DOM v6
- **State/Data**: TanStack Query v5
- **Backend**: Supabase (Auth, PostgreSQL database, Edge Functions, Storage)
- **Forms**: React Hook Form + Zod

## Running the App

```bash
npm install
npm run dev
```

Dev server runs on port 5000 with `host: "0.0.0.0"` and `allowedHosts: true` — configured for Replit's proxy environment.

## Required Secrets

Set these in Replit Secrets (already configured):

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (https://cnvtnxesywbzwsxwpejw.supabase.co) |
| `VITE_SUPABASE_ANON_KEY` | Supabase project anon/public key |

## Data Flow

- **Public pages** (Products, Blog, Home): Fetch directly from Supabase
- **Admin panel** (`/admin`): Supabase Auth + full CRUD operations, analytics dashboard
- **Auth**: Supabase Auth with PKCE flow

## Key Directories

- `src/pages/` — Page-level components (Home, Products, Blog, Admin, etc.)
- `src/components/` — Reusable UI components (admin dashboard, layout, common)
- `src/integrations/supabase/` — Supabase client and TypeScript types
- `src/hooks/` — Custom React hooks (visitor tracking, etc.)
- `src/services/` — API and data services
- `supabase/migrations/` — All database schema migrations
- `supabase/functions/` — Supabase Edge Functions (blog generation, newsletter, notifications)
- `public/` — Static assets

## Admin Access

Navigate to `/admin` — login with your Supabase admin credentials. Admin uses Supabase Auth (`signInWithPassword`). The `is_admin()` function in Supabase checks either app_metadata role or email domain (`@driptech.com`).

## Analytics Dashboard

The Business Intelligence Dashboard (`Dashboard.tsx`) fetches real data from these tables:
- **Primary KPIs**: customers, products, blog_posts, documents, quotes, videos, projects, contact_submissions
- **Extended KPIs**: service_bookings, newsletter_subscribers, news_articles, mpesa_transactions, email_campaigns, whatsapp_conversations, technicians, service_reviews, success_stories
- **Revenue**: Quotes pipeline (KES) + M-Pesa completed transactions
- **Visitor Analytics**: visitor_sessions, page_views, product_interactions (via AnalyticsDashboard.tsx tab)

**NOTE**: If the dashboard shows zeros, run `supabase/migrations/20260413000000_fix_analytics_read_rls.sql` in the Supabase SQL editor to fix RLS policies for authenticated admin reads.
