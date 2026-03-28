begin;

drop function if exists public.accept_exchange_application(uuid);

create or replace function public.accept_exchange_application(target_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_application public.exchange_applications%rowtype;
  exchange_slot_count integer;
  accepted_count integer;
  auto_rejected_ids uuid[];
begin
  select ea.*
  into target_application
  from public.exchange_applications ea
  where ea.id = target_application_id;

  if not found then
    raise exception 'Application not found';
  end if;

  if not exists (
    select 1
    from public.exchanges e
    join public.campaigns c on c.id = e.campaign_id
    join public.brand_profiles bp on bp.id = c.brand_id
    where e.id = target_application.exchange_id
      and bp.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to accept this application';
  end if;

  select e.slots
  into exchange_slot_count
  from public.exchanges e
  where e.id = target_application.exchange_id
  for update;

  select count(*)
  into accepted_count
  from public.exchange_applications ea
  where ea.exchange_id = target_application.exchange_id
    and ea.status = 'accepted'
    and ea.id <> target_application_id;

  if target_application.status <> 'accepted' and accepted_count >= exchange_slot_count then
    raise exception 'No slots available for this exchange';
  end if;

  update public.exchange_applications
  set status = 'accepted'
  where id = target_application_id
  returning *
  into target_application;

  select count(*)
  into accepted_count
  from public.exchange_applications ea
  where ea.exchange_id = target_application.exchange_id
    and ea.status = 'accepted';

  auto_rejected_ids := '{}';

  if accepted_count >= exchange_slot_count then
    with updated as (
      update public.exchange_applications
      set status = 'rejected'
      where exchange_id = target_application.exchange_id
        and status = 'applied'
      returning id
    )
    select coalesce(array_agg(id), '{}')
    into auto_rejected_ids
    from updated;
  end if;

  return jsonb_build_object(
    'selectedApplicationId', target_application.id,
    'selectedStatus', target_application.status,
    'exchangeId', target_application.exchange_id,
    'autoRejectedApplicationIds', auto_rejected_ids,
    'slotsFilled', accepted_count >= exchange_slot_count
  );
end;
$$;

commit;
