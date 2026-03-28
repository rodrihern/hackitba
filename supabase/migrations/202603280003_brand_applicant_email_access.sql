begin;

drop policy if exists "profiles: marca ve applicants" on public.profiles;

create policy "profiles: marca ve applicants" on public.profiles
  for select using (
    exists (
      select 1
      from public.user_profiles up
      join public.exchange_applications ea on ea.user_id = up.id
      join public.exchanges e on e.id = ea.exchange_id
      join public.campaigns c on c.id = e.campaign_id
      join public.brand_profiles bp on bp.id = c.brand_id
      where up.user_id = profiles.id
        and bp.user_id = auth.uid()
    )
  );

commit;
