begin;

create type public.exchange_form_field_type as enum ('short_text', 'long_text', 'select', 'radio');

create table if not exists public.exchange_form_questions (
  id uuid primary key default uuid_generate_v4(),
  exchange_id uuid not null references public.exchanges(id) on delete cascade,
  label text not null,
  field_type public.exchange_form_field_type not null default 'short_text',
  required boolean not null default true,
  position integer not null default 0,
  options jsonb,
  created_at timestamptz not null default now(),
  constraint exchange_form_questions_position_unique unique (exchange_id, position)
);

create table if not exists public.exchange_application_answers (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.exchange_applications(id) on delete cascade,
  question_id uuid not null references public.exchange_form_questions(id) on delete cascade,
  answer_text text,
  answer_json jsonb,
  created_at timestamptz not null default now(),
  constraint exchange_application_answers_unique unique (application_id, question_id)
);

create index if not exists exchange_form_questions_exchange_position_idx
  on public.exchange_form_questions (exchange_id, position);

create index if not exists exchange_application_answers_application_idx
  on public.exchange_application_answers (application_id);

create index if not exists exchange_application_answers_question_idx
  on public.exchange_application_answers (question_id);

alter table public.exchange_form_questions enable row level security;
alter table public.exchange_application_answers enable row level security;

drop policy if exists "exchange_form_questions: lectura según campaña" on public.exchange_form_questions;
create policy "exchange_form_questions: lectura según campaña" on public.exchange_form_questions
  for select using (
    exchange_id in (
      select e.id
      from public.exchanges e
      join public.campaigns c on c.id = e.campaign_id
      where c.status = 'active'
    )
    or exchange_id in (
      select e.id
      from public.exchanges e
      join public.campaigns c on c.id = e.campaign_id
      join public.brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  );

drop policy if exists "exchange_form_questions: marca gestiona" on public.exchange_form_questions;
create policy "exchange_form_questions: marca gestiona" on public.exchange_form_questions
  for all using (
    exchange_id in (
      select e.id
      from public.exchanges e
      join public.campaigns c on c.id = e.campaign_id
      join public.brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  )
  with check (
    exchange_id in (
      select e.id
      from public.exchanges e
      join public.campaigns c on c.id = e.campaign_id
      join public.brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  );

drop policy if exists "exchange_application_answers: lectura propia o de marca" on public.exchange_application_answers;
create policy "exchange_application_answers: lectura propia o de marca" on public.exchange_application_answers
  for select using (
    application_id in (
      select ea.id
      from public.exchange_applications ea
      join public.user_profiles up on up.id = ea.user_id
      where up.user_id = auth.uid()
    )
    or application_id in (
      select ea.id
      from public.exchange_applications ea
      join public.exchanges e on e.id = ea.exchange_id
      join public.campaigns c on c.id = e.campaign_id
      join public.brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  );

drop policy if exists "exchange_application_answers: usuario crea propias" on public.exchange_application_answers;
create policy "exchange_application_answers: usuario crea propias" on public.exchange_application_answers
  for insert with check (
    application_id in (
      select ea.id
      from public.exchange_applications ea
      join public.user_profiles up on up.id = ea.user_id
      where up.user_id = auth.uid()
    )
  );

create or replace function public.accept_exchange_application(target_application_id uuid)
returns public.exchange_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  target_application public.exchange_applications%rowtype;
  exchange_slot_count integer;
  accepted_count integer;
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

  return target_application;
end;
$$;

commit;
