-- Social Media Autopilot (LinkedIn) & Curated Image Database for Grok.
-- All tables are locked down to service_role and accessed exclusively via admin-authenticated
-- or cron-secret-authenticated Edge Functions.

create table if not exists public.social_media_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null unique,
  storage_path text not null default '',
  category text not null default 'general',
  tags text[] not null default '{}',
  caption_hint text not null default '',
  location text not null default '',
  source_type text not null default 'uploaded' check (source_type in ('uploaded', 'product', 'project', 'kit', 'story')),
  source_id text not null default '',
  active boolean not null default true,
  used_count integer not null default 0,
  last_used_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_media_assets_active_lru_idx
  on public.social_media_assets (active, used_count asc, last_used_at asc nulls first);

create table if not exists public.social_linkedin_oauth_states (
  state_hash text primary key,
  admin_user_id uuid not null,
  post_target text not null default 'member' check (post_target in ('member', 'organization')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.social_linkedin_connections (
  id integer primary key default 1 check (id = 1),
  connected boolean not null default false,
  access_token text not null default '',
  refresh_token text not null default '',
  access_token_expires_at timestamptz,
  author_urn text not null default '',
  account_name text not null default '',
  account_avatar_url text not null default '',
  post_target text not null default 'member' check (post_target in ('member', 'organization')),
  organization_id text not null default '',
  scope text not null default '',
  updated_by uuid,
  updated_at timestamptz not null default now()
);

insert into public.social_linkedin_connections (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.social_linkedin_settings (
  id integer primary key default 1 check (id = 1),
  autopilot_enabled boolean not null default false,
  auto_replenish_queue boolean not null default true,
  min_queue_buffer integer not null default 3 check (min_queue_buffer between 1 and 14),
  posts_per_week integer not null default 3 check (posts_per_week between 1 and 14),
  preferred_post_hour_eat integer not null default 9 check (preferred_post_hour_eat between 5 and 22),
  posting_days text[] not null default array['mon', 'wed', 'fri'],
  use_live_web_trends boolean not null default true,
  default_cta_url text not null default 'https://www.dripstech.co.ke',
  brand_voice text not null default 'Practical Kenyan irrigation engineering partner sharing real farm setups, crop yield ROI, water savings, and commercial irrigation guides.',
  linkedin_api_version text not null default '202610',
  last_generated_at timestamptz,
  last_published_at timestamptz,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

insert into public.social_linkedin_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.social_linkedin_posts (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'queued' check (status in ('draft', 'queued', 'publishing', 'published', 'failed', 'skipped')),
  source_mode text not null default 'grok_batch' check (source_mode in ('grok_batch', 'manual')),
  topic text not null,
  content_pillar text not null default 'Field Insights',
  commentary text not null,
  cta_url text not null default 'https://www.dripstech.co.ke',
  asset_id uuid references public.social_media_assets(id) on delete set null,
  image_url text not null default '',
  scheduled_for timestamptz,
  published_at timestamptz,
  linkedin_post_urn text not null default '',
  linkedin_post_url text not null default '',
  linkedin_image_urn text not null default '',
  research_citations jsonb not null default '[]'::jsonb,
  error_message text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_linkedin_posts_queue_idx
  on public.social_linkedin_posts (status, scheduled_for asc);

alter table public.social_media_assets enable row level security;
alter table public.social_linkedin_oauth_states enable row level security;
alter table public.social_linkedin_connections enable row level security;
alter table public.social_linkedin_settings enable row level security;
alter table public.social_linkedin_posts enable row level security;

revoke all on public.social_media_assets from anon, authenticated;
revoke all on public.social_linkedin_oauth_states from anon, authenticated;
revoke all on public.social_linkedin_connections from anon, authenticated;
revoke all on public.social_linkedin_settings from anon, authenticated;
revoke all on public.social_linkedin_posts from anon, authenticated;

grant all on public.social_media_assets to service_role;
grant all on public.social_linkedin_oauth_states to service_role;
grant all on public.social_linkedin_connections to service_role;
grant all on public.social_linkedin_settings to service_role;
grant all on public.social_linkedin_posts to service_role;
