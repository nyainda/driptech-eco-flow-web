-- Persistent Pump & Solar PV Sizing Reports table + privacy-safe share lookup RPC.
-- Enables saving customer/contractor hydraulic calculations, custom budget figures,
-- shareable ?report=DT-PS-... links, and DripTech engineer review in Admin.

create table if not exists public.pump_solar_reports (
  id uuid primary key default gen_random_uuid(),
  report_code text not null unique,
  project_name text not null default 'Farm Pump & Solar Sizing Design',
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_email text not null default '',
  county text not null default '',
  borehole_yield_m3h numeric,
  design_flow_m3h numeric not null check (design_flow_m3h >= 0),
  daily_volume_m3 numeric not null check (daily_volume_m3 >= 0),
  tdh_m numeric not null check (tdh_m >= 0),
  recommended_hp numeric not null check (recommended_hp >= 0),
  recommended_pv_wp integer not null default 0 check (recommended_pv_wp >= 0),
  cable_mm2 numeric not null default 2.5,
  tank_liters integer not null default 0,
  estimated_budget_kes numeric,
  recommended_pump_name text not null default '',
  inputs_json jsonb not null,
  result_json jsonb not null,
  custom_costs_json jsonb,
  notes text not null default '',
  status text not null default 'saved' check (status in ('saved', 'quote_requested', 'reviewed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pump_solar_reports_created_idx
  on public.pump_solar_reports (created_at desc);

alter table public.pump_solar_reports enable row level security;

-- Public visitors can save their own sizing reports; raw PII columns remain protected.
create policy "Public can save pump solar sizing reports"
  on public.pump_solar_reports
  for insert
  to anon, authenticated
  with check (char_length(report_code) >= 6);

-- Only authenticated admins can list/update/delete full report records containing customer PII.
create policy "Admins can view all pump solar sizing reports"
  on public.pump_solar_reports
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Admins can update pump solar sizing reports"
  on public.pump_solar_reports
  for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins can delete pump solar sizing reports"
  on public.pump_solar_reports
  for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- Privacy-safe share lookup by report code: omits phone/email PII so shared URLs work cleanly.
create or replace function public.get_pump_solar_report_by_code(p_report_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'report_code', r.report_code,
    'project_name', r.project_name,
    'county', r.county,
    'borehole_yield_m3h', r.borehole_yield_m3h,
    'design_flow_m3h', r.design_flow_m3h,
    'daily_volume_m3', r.daily_volume_m3,
    'tdh_m', r.tdh_m,
    'recommended_hp', r.recommended_hp,
    'recommended_pv_wp', r.recommended_pv_wp,
    'cable_mm2', r.cable_mm2,
    'tank_liters', r.tank_liters,
    'estimated_budget_kes', r.estimated_budget_kes,
    'recommended_pump_name', r.recommended_pump_name,
    'inputs_json', r.inputs_json,
    'custom_costs_json', r.custom_costs_json,
    'notes', r.notes,
    'created_at', r.created_at
  )
  from public.pump_solar_reports r
  where upper(r.report_code) = upper(trim(p_report_code))
  limit 1;
$$;

grant execute on function public.get_pump_solar_report_by_code(text) to anon, authenticated;
