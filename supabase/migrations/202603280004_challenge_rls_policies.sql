-- Enable RLS (idempotent)
alter table public.challenges enable row level security;
alter table public.challenge_days enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "challenges: lectura según campaña" on public.challenges;
drop policy if exists "challenges: marca gestiona los suyos" on public.challenges;
drop policy if exists "challenge_days: lectura según challenge" on public.challenge_days;
drop policy if exists "challenge_days: marca gestiona" on public.challenge_days;

-- challenges: readable for active campaigns, fully manageable by the owning brand
create policy "challenges: lectura según campaña" on public.challenges
  for select using (
    campaign_id in (select id from public.campaigns where status = 'active')
    or campaign_id in (
      select id from public.campaigns where brand_id in (
        select id from public.brand_profiles where user_id = auth.uid()
      )
    )
  );

create policy "challenges: marca gestiona los suyos" on public.challenges
  for all using (
    campaign_id in (
      select id from public.campaigns where brand_id in (
        select id from public.brand_profiles where user_id = auth.uid()
      )
    )
  )
  with check (
    campaign_id in (
      select id from public.campaigns where brand_id in (
        select id from public.brand_profiles where user_id = auth.uid()
      )
    )
  );

-- challenge_days: readable via challenge/campaign, fully manageable by the owning brand
create policy "challenge_days: lectura según challenge" on public.challenge_days
  for select using (
    challenge_id in (
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

create policy "challenge_days: marca gestiona" on public.challenge_days
  for all using (
    challenge_id in (
      select ch.id
      from public.challenges ch
      join public.campaigns c on c.id = ch.campaign_id
      join public.brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  )
  with check (
    challenge_id in (
      select ch.id
      from public.challenges ch
      join public.campaigns c on c.id = ch.campaign_id
      join public.brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  );
