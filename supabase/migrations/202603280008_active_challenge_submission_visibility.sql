drop policy if exists "submissions: usuario ve las suyas" on public.challenge_submissions;

create policy "submissions: usuario ve las suyas" on public.challenge_submissions
  for select using (
    user_id in (select id from public.user_profiles where user_id = auth.uid())
    or challenge_id in (
      select ch.id
      from public.challenges ch
      join public.campaigns c on c.id = ch.campaign_id
      where c.status = 'active'
    )
    or challenge_id in (
      select ch.id
      from public.challenges ch
      join public.campaigns c on c.id = ch.campaign_id
      join public.brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  );
