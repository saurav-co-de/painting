begin;

-- The application stores its own users in public.users. These helpers support
-- Supabase Auth JWTs and, for server-side Postgres usage, an optional
-- transaction-local app.current_user_id setting.
create or replace function public.current_app_user_id()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    auth.uid()::text,
    nullif(current_setting('app.current_user_id', true), ''),
    nullif(current_setting('request.jwt.claim.sub', true), '')
  )
$$;

create or replace function public.current_app_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.users app_user
    where app_user.id = public.current_app_user_id()
      and app_user.data->>'role' in ('admin', 'owner', 'super_admin')
  )
$$;

revoke all on function public.current_app_user_id() from public;
revoke all on function public.current_app_user_is_admin() from public;
grant execute on function public.current_app_user_id() to authenticated, service_role;
grant execute on function public.current_app_user_is_admin() to authenticated, service_role;

-- Remove any previous permissive policies on the application tables so this
-- migration is authoritative and repeatable.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('users', 'customers', 'invoices', 'quotations', 'exactbills')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

-- Anon should have no table-level privileges on protected application data.
revoke all on table
  public.users,
  public.customers,
  public.invoices,
  public.quotations,
  public.exactbills
from anon;

-- Authenticated users get ordinary DML privileges, but RLS decides which rows
-- are visible or writable.
revoke truncate, references, trigger on table
  public.users,
  public.customers,
  public.invoices,
  public.quotations,
  public.exactbills
from authenticated;

grant select, insert, update, delete on table
  public.users,
  public.customers,
  public.invoices,
  public.quotations,
  public.exactbills
to authenticated;

alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.quotations enable row level security;
alter table public.exactbills enable row level security;

create policy "users_select_own_or_admin"
on public.users
for select
to authenticated
using (id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "users_insert_own_or_admin"
on public.users
for insert
to authenticated
with check (id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "users_update_own_or_admin"
on public.users
for update
to authenticated
using (id = public.current_app_user_id() or public.current_app_user_is_admin())
with check (id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "users_delete_own_or_admin"
on public.users
for delete
to authenticated
using (id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "customers_select_own_or_admin"
on public.customers
for select
to authenticated
using (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "customers_insert_own_or_admin"
on public.customers
for insert
to authenticated
with check (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "customers_update_own_or_admin"
on public.customers
for update
to authenticated
using (user_id = public.current_app_user_id() or public.current_app_user_is_admin())
with check (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "customers_delete_own_or_admin"
on public.customers
for delete
to authenticated
using (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "invoices_select_own_or_admin"
on public.invoices
for select
to authenticated
using (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "invoices_insert_own_or_admin"
on public.invoices
for insert
to authenticated
with check (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "invoices_update_own_or_admin"
on public.invoices
for update
to authenticated
using (user_id = public.current_app_user_id() or public.current_app_user_is_admin())
with check (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "invoices_delete_own_or_admin"
on public.invoices
for delete
to authenticated
using (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "quotations_select_own_or_admin"
on public.quotations
for select
to authenticated
using (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "quotations_insert_own_or_admin"
on public.quotations
for insert
to authenticated
with check (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "quotations_update_own_or_admin"
on public.quotations
for update
to authenticated
using (user_id = public.current_app_user_id() or public.current_app_user_is_admin())
with check (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "quotations_delete_own_or_admin"
on public.quotations
for delete
to authenticated
using (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "exactbills_select_own_or_admin"
on public.exactbills
for select
to authenticated
using (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "exactbills_insert_own_or_admin"
on public.exactbills
for insert
to authenticated
with check (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "exactbills_update_own_or_admin"
on public.exactbills
for update
to authenticated
using (user_id = public.current_app_user_id() or public.current_app_user_is_admin())
with check (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

create policy "exactbills_delete_own_or_admin"
on public.exactbills
for delete
to authenticated
using (user_id = public.current_app_user_id() or public.current_app_user_is_admin());

commit;
