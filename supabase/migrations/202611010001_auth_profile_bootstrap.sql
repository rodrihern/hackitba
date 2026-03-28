-- Ensure auth/profile bootstrap is consistent with RLS and FK constraints.

begin;

-- Keep only one row per user_id before adding uniqueness.
delete from public.user_profiles a
using public.user_profiles b
where a.user_id = b.user_id
  and a.ctid < b.ctid;

delete from public.brand_profiles a
using public.brand_profiles b
where a.user_id = b.user_id
  and a.ctid < b.ctid;

-- One app profile per authenticated user.
create unique index if not exists user_profiles_user_id_key
  on public.user_profiles (user_id);

create unique index if not exists brand_profiles_user_id_key
  on public.brand_profiles (user_id);

-- Backfill missing base profile rows for existing auth users.
insert into public.profiles (id, email, role)
select
  u.id,
  coalesce(u.email, ''),
  case
    when lower(coalesce(u.raw_user_meta_data->>'role', '')) = 'brand' then 'brand'::public.user_role
    else 'user'::public.user_role
  end
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Auto-create base profile when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    coalesce(new.email, ''),
    case
      when lower(coalesce(new.raw_user_meta_data->>'role', '')) = 'brand' then 'brand'::public.user_role
      else 'user'::public.user_role
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Explicit insert policies for clarity with RLS.
drop policy if exists "user_profiles: crear propio" on public.user_profiles;
create policy "user_profiles: crear propio" on public.user_profiles
  for insert with check (user_id = auth.uid());

drop policy if exists "brand_profiles: crear propio" on public.brand_profiles;
create policy "brand_profiles: crear propio" on public.brand_profiles
  for insert with check (user_id = auth.uid());

commit;
