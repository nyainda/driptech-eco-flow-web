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
