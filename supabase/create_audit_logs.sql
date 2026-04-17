-- ─── Audit Logs Table ──────────────────────────────────────────────────
create table public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id),
    action text not null,      -- e.g., 'UPDATE_MATCH_SCORE', 'MARK_FORFEIT', 'UPDATE_TEAM'
    entity_id text not null,   -- e.g., the UUID of the match or team
    details jsonb              -- stores the specific data change or payload
);

-- Note: user_id references auth.users(id), so this logs the admin's UUID making the change.

-- Enable Row Level Security (RLS)
alter table public.audit_logs enable row level security;

-- Policies
-- 1. Admins should be able to insert logs (Authenticated)
create policy "Allow authenticated insert"
on public.audit_logs
for insert
to authenticated
with check (true);

-- 2. Authenticated users (or just super-admins in the future) can view logs
create policy "Allow authenticated read"
on public.audit_logs
for select
to authenticated
using (true);
