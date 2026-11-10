-- Private storage for Search Console OAuth credentials and one-time OAuth state.
create table if not exists public.gsc_oauth_tokens (
  id integer primary key default 1 check (id = 1),
  refresh_token text not null,
  connected_email text,
  property_url text not null default 'sc-domain:dripstech.co.ke',
  updated_at timestamptz not null default now()
);
alter table public.gsc_oauth_tokens enable row level security;
revoke all on public.gsc_oauth_tokens from anon, authenticated;

create table if not exists public.gsc_oauth_states (
  state_hash text primary key,
  admin_user_id uuid not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.gsc_oauth_states enable row level security;
revoke all on public.gsc_oauth_states from anon, authenticated;
create index if not exists gsc_oauth_states_expiry_idx on public.gsc_oauth_states(expires_at);
