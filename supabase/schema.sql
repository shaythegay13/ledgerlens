-- Run in the Supabase SQL editor before enabling the optional persistent-memory integration.
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
create policy "Demo anonymous memory access" on public.business_memory for all using (true) with check (true);
