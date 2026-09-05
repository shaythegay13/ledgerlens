-- Run this once in the Supabase SQL Editor before enabling Business Memory.
create table if not exists public.business_memory (
  memory_id uuid primary key default gen_random_uuid(),
  business_id text not null default 'demo',
  type text not null,
  subject text not null,
  fact text not null,
  source text not null check (source in ('user_confirmed', 'inferred')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_memory enable row level security;
drop policy if exists "Demo anonymous memory access" on public.business_memory;
create policy "Demo anonymous memory access" on public.business_memory for all using (business_id = 'ledgerlens-demo') with check (business_id = 'ledgerlens-demo');
create unique index if not exists business_memory_subject_type_unique on public.business_memory (business_id, type, lower(subject));
