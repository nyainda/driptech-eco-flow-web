-- Grok-powered B2B Lead Discovery & Human-Approved Outreach Desk.
-- Stores researched Kenyan agribusiness/contractor prospects, tailored email & WhatsApp drafts,
-- delivery audit timestamps, and a strict suppression list so opted-out contacts are never re-emailed.
-- Secrets (XAI_API_KEY, RESEND_API_KEY, OUTREACH_FROM_EMAIL) live only in Supabase Edge Function Secrets.

create table if not exists public.b2b_outreach_campaigns (
  id uuid primary key default gen_random_uuid(),
  segment text not null,
  region text not null,
  product_focus text not null default '',
  model text not null default 'grok-4.7',
  summary text not null default '',
  source_links jsonb not null default '[]'::jsonb,
  lead_count integer not null default 0,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists b2b_outreach_campaigns_created_at_idx
  on public.b2b_outreach_campaigns (created_at desc);

create table if not exists public.b2b_outreach_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.b2b_outreach_campaigns(id) on delete set null,
  company_name text not null,
  organization_type text not null default '',
  county_region text not null default '',
  website_url text not null default '',
  source_url text not null default '',
  source_title text not null default '',
  public_email text not null default '',
  public_phone text not null default '',
  whatsapp_number text not null default '',
  likely_needs jsonb not null default '[]'::jsonb,
  recommended_url text not null default 'https://www.dripstech.co.ke/irrigation-kits',
  why_they_need_irrigation text not null default '',
  confidence_note text not null default '',
  email_subject text not null default '',
  email_body text not null default '',
  whatsapp_message text not null default '',
  status text not null default 'new'
    check (status in ('new', 'approved', 'email_sent', 'whatsapp_sent', 'replied', 'converted', 'unsubscribed', 'archived')),
  email_sent_at timestamptz,
  whatsapp_sent_at timestamptz,
  resend_message_id text,
  last_error text,
  notes text not null default '',
  dedupe_key text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists b2b_outreach_leads_dedupe_uidx
  on public.b2b_outreach_leads (dedupe_key);

create index if not exists b2b_outreach_leads_status_created_idx
  on public.b2b_outreach_leads (status, created_at desc);

create index if not exists b2b_outreach_leads_email_sent_at_idx
  on public.b2b_outreach_leads (email_sent_at desc)
  where email_sent_at is not null;

create table if not exists public.b2b_outreach_suppression (
  id uuid primary key default gen_random_uuid(),
  email text not null default '',
  phone text not null default '',
  reason text not null default 'unsubscribed',
  created_at timestamptz not null default now()
);

create unique index if not exists b2b_outreach_suppression_email_uidx
  on public.b2b_outreach_suppression (lower(email))
  where email <> '';

create unique index if not exists b2b_outreach_suppression_phone_uidx
  on public.b2b_outreach_suppression (phone)
  where phone <> '';

create or replace function public.update_b2b_outreach_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_b2b_outreach_leads_updated_at on public.b2b_outreach_leads;
create trigger trg_b2b_outreach_leads_updated_at
  before update on public.b2b_outreach_leads
  for each row execute function public.update_b2b_outreach_updated_at();

alter table public.b2b_outreach_campaigns enable row level security;
alter table public.b2b_outreach_leads enable row level security;
alter table public.b2b_outreach_suppression enable row level security;

-- Access is restricted exclusively to the admin-checked Edge Function via service_role.
revoke all on public.b2b_outreach_campaigns from anon, authenticated;
revoke all on public.b2b_outreach_leads from anon, authenticated;
revoke all on public.b2b_outreach_suppression from anon, authenticated;
grant all on public.b2b_outreach_campaigns to service_role;
grant all on public.b2b_outreach_leads to service_role;
grant all on public.b2b_outreach_suppression to service_role;
