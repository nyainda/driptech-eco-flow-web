-- Support multi-project invoices without changing the existing invoice workflow.
alter table public.invoice_items
  add column if not exists project_name text,
  add column if not exists project_subtitle text,
  add column if not exists project_link text,
  add column if not exists sort_order integer;

alter table public.invoices
  add column if not exists terms_and_conditions text;

create index if not exists invoice_items_invoice_sort_idx
  on public.invoice_items (invoice_id, sort_order);

notify pgrst, 'reload schema';