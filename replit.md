# DripTech EcoFlow — Replit Project

## Overview
DripTech is a smart irrigation solutions web application for Kenyan farmers. It provides a public-facing marketing site, a blog, product catalogue, service bookings, and a full admin dashboard.

## Tech Stack
- **Frontend**: React 18 + TypeScript, Vite 5
- **Styling**: Tailwind CSS, shadcn/ui (Radix UI), lucide-react icons
- **Routing**: react-router-dom v6
- **Data Fetching**: @tanstack/react-query
- **Backend/Database**: Supabase (Auth, PostgreSQL, Edge Functions, Storage)
- **Forms**: react-hook-form + zod
- **Charts**: recharts, chart.js

## Running the Project
The project runs as a pure frontend Vite dev server:
```
npm run dev
```
Served on port **5000**.

## Required Secrets
These must be set in Replit Secrets (Settings → Secrets):
| Secret | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL (https://xxxx.supabase.co) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase public anon key |

## Project Structure
```
src/
  components/       # UI components (Admin/, Home/, Layout/, ui/)
  pages/            # Route-level page components
  integrations/
    supabase/       # Supabase client, types, table definitions
  hooks/            # Custom React hooks
  services/         # Business logic (AI, email, analytics)
  lib/              # Utilities (PDF, SEO config)
supabase/
  functions/        # Edge Functions (blog generation, newsletter, notifications)
  migrations/       # SQL migration files for the Supabase database
public/             # Static assets, PWA manifest
```

## Key Features
- Public website: Home, Products, Blog, Services, Contact, Success Stories
- Admin dashboard: Products, Blog, Customers, Quotes, Analytics, WhatsApp, Email campaigns
- SEO-optimised blog with AI-powered auto-generation (Gemini API via Supabase Edge Function)
- M-Pesa payment tracking
- Visitor analytics tracking
- Newsletter subscription (Resend email API)
- Technician service booking system
- PDF quote/invoice generation

## Supabase Edge Functions
Located in `supabase/functions/`:
- `generate-blog-posts` — AI blog post generation via Gemini API
- `newsletter-subscribe` — Newsletter signup with welcome email via Resend
- `service-booking-notifications` — Email/SMS/WhatsApp notifications for bookings

These run on Supabase's servers and are invoked from the frontend.

## Database
All schema migrations are in `supabase/migrations/`. The Supabase PostgreSQL database holds all application data including products, blog posts, customers, quotes, analytics, and more.

## Design System (DripsTech Unification Guide)
The app uses a unified design token system defined in `src/index.css`:

### Color Tokens
- `--dt-green-*` — Forest green primary palette (500 = `hsl(148 54% 40%)`)
- `--dt-gold-*` — Harvest gold accent palette (500 = `hsl(43 96% 56%)`)
- `--dt-stone-*` — Warm neutral palette
- `--dt-whatsapp` — WhatsApp green isolated to WhatsApp CTAs only (`hsl(142 70% 45%)`)

### Utility Classes
- `dt-card` — Standard card style (rounded-lg, border, bg-card, shadow)
- `dt-btn-primary`, `dt-btn-secondary`, `dt-btn-whatsapp` — CTA buttons
- `dt-section-label` — Small label above headings (gold accent)
- `dt-badge-*` — Product badges (primary, gold, stone)
- `dt-price` — JetBrains Mono price display

### Typography
- **Headings**: Syne (loaded via Google Fonts)
- **Body**: Plus Jakarta Sans
- **Prices/Mono**: JetBrains Mono

### Rules
- No `emerald-*`, `teal-*`, `blue-*`, `gray-*`, `slate-*` Tailwind classes in non-Admin components
- No hardcoded hex colors (`#10b981`, `#059669`, etc.) outside `src/index.css`
- `--dt-whatsapp` only for actual WhatsApp button backgrounds
- Admin components (`src/components/Admin/`) are excluded from unification
