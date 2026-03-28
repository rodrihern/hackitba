-- ============================================
-- CollabSpace - Schema completo para Supabase
-- Correr en: Supabase Dashboard > SQL Editor
-- ============================================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

create type user_role as enum ('brand', 'user');
create type campaign_type as enum ('exchange', 'challenge');
create type campaign_status as enum ('draft', 'active', 'closed');
create type application_status as enum ('applied', 'invited', 'accepted', 'rejected');
create type user_level as enum ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond');
create type reward_type as enum ('product', 'discount', 'experience');
create type exchange_reward_type as enum ('product', 'money', 'both');
create type exchange_form_field_type as enum ('short_text', 'long_text', 'select', 'radio');
create type content_type as enum ('video', 'image', 'text', 'link');
create type invitation_status as enum ('pending', 'accepted', 'rejected');

-- ============================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- Guarda el rol y datos base del usuario autenticado
-- ============================================

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        user_role not null,
  created_at  timestamptz not null default now()
);

-- ============================================
-- TABLA: user_profiles (creadores)
-- ============================================

create table user_profiles (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references profiles(id) on delete cascade,
  username              text not null unique,
  bio                   text,
  profile_image         text,
  instagram_url         text,
  tiktok_url            text,
  youtube_url           text,
  followers_instagram   int not null default 0,
  followers_tiktok      int not null default 0,
  followers_youtube     int not null default 0,
  total_points          int not null default 0,
  level                 user_level not null default 'Bronze',
  category              text,
  location              text,
  created_at            timestamptz not null default now()
);

-- ============================================
-- TABLA: brand_profiles (marcas)
-- ============================================

create table brand_profiles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  description text,
  logo        text,
  industry    text,
  created_at  timestamptz not null default now()
);

-- ============================================
-- TABLA: campaigns
-- ============================================

create table campaigns (
  id          uuid primary key default uuid_generate_v4(),
  brand_id    uuid not null references brand_profiles(id) on delete cascade,
  type        campaign_type not null,
  title       text not null,
  description text,
  status      campaign_status not null default 'draft',
  created_at  timestamptz not null default now()
);

-- ============================================
-- TABLA: exchanges (canjes)
-- ============================================

create table exchanges (
  id                  uuid primary key default uuid_generate_v4(),
  campaign_id         uuid not null references campaigns(id) on delete cascade,
  requirements        jsonb,
  reward_description  text,
  reward_type         exchange_reward_type not null default 'product',
  money_amount        numeric(10,2),
  product_description text,
  slots               int not null default 1,
  deadline            timestamptz
);

-- ============================================
-- TABLA: exchange_applications (aplicaciones a canjes)
-- ============================================

create table exchange_applications (
  id              uuid primary key default uuid_generate_v4(),
  exchange_id     uuid not null references exchanges(id) on delete cascade,
  user_id         uuid not null references user_profiles(id) on delete cascade,
  status          application_status not null default 'applied',
  proposal_text   text,
  created_at      timestamptz not null default now(),
  unique (exchange_id, user_id)
);

-- ============================================
-- TABLA: exchange_form_questions (preguntas del formulario de canje)
-- ============================================

create table exchange_form_questions (
  id          uuid primary key default uuid_generate_v4(),
  exchange_id uuid not null references exchanges(id) on delete cascade,
  label       text not null,
  field_type  exchange_form_field_type not null default 'short_text',
  required    boolean not null default true,
  position    int not null default 0,
  options     jsonb,
  created_at  timestamptz not null default now(),
  unique (exchange_id, position)
);

-- ============================================
-- TABLA: exchange_application_answers (respuestas del formulario)
-- ============================================

create table exchange_application_answers (
  id             uuid primary key default uuid_generate_v4(),
  application_id uuid not null references exchange_applications(id) on delete cascade,
  question_id    uuid not null references exchange_form_questions(id) on delete cascade,
  answer_text    text,
  answer_json    jsonb,
  created_at     timestamptz not null default now(),
  unique (application_id, question_id)
);

-- ============================================
-- TABLA: challenges (retos)
-- ============================================

create table challenges (
  id              uuid primary key default uuid_generate_v4(),
  campaign_id     uuid not null references campaigns(id) on delete cascade,
  is_multi_day    boolean not null default false,
  total_days      int not null default 1,
  has_leaderboard boolean not null default true,
  max_winners     int not null default 1,
  scoring_type    text not null default 'manual'
);

-- ============================================
-- TABLA: challenge_days
-- ============================================

create table challenge_days (
  id            uuid primary key default uuid_generate_v4(),
  challenge_id  uuid not null references challenges(id) on delete cascade,
  day_number    int not null,
  title         text not null,
  description   text,
  content_type  content_type not null default 'link',
  instructions  text,
  unique (challenge_id, day_number)
);

-- ============================================
-- TABLA: challenge_submissions
-- ============================================

create table challenge_submissions (
  id               uuid primary key default uuid_generate_v4(),
  challenge_id     uuid not null references challenges(id) on delete cascade,
  day_id           uuid not null references challenge_days(id) on delete cascade,
  user_id          uuid not null references user_profiles(id) on delete cascade,
  submission_url   text,
  submission_text  text,
  score            int check (score >= 1 and score <= 100),
  created_at       timestamptz not null default now(),
  unique (day_id, user_id)
);

-- ============================================
-- TABLA: brand_points (puntos por marca)
-- ============================================

create table brand_points (
  id          uuid primary key default uuid_generate_v4(),
  brand_id    uuid not null references brand_profiles(id) on delete cascade,
  user_id     uuid not null references user_profiles(id) on delete cascade,
  points      int not null default 0,
  unique (brand_id, user_id)
);

-- ============================================
-- TABLA: rewards (tienda de recompensas)
-- ============================================

create table rewards (
  id           uuid primary key default uuid_generate_v4(),
  brand_id     uuid not null references brand_profiles(id) on delete cascade,
  title        text not null,
  description  text,
  points_cost  int not null default 0,
  money_cost   numeric(10,2),
  reward_type  reward_type not null default 'product',
  image        text,
  created_at   timestamptz not null default now()
);

-- ============================================
-- TABLA: redemptions (canjes de rewards)
-- ============================================

create table redemptions (
  id           uuid primary key default uuid_generate_v4(),
  reward_id    uuid not null references rewards(id) on delete cascade,
  user_id      uuid not null references user_profiles(id) on delete cascade,
  points_used  int not null default 0,
  money_paid   numeric(10,2) default 0,
  created_at   timestamptz not null default now()
);

-- ============================================
-- TABLA: follows (usuarios siguen marcas)
-- ============================================

create table follows (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references user_profiles(id) on delete cascade,
  brand_id    uuid not null references brand_profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, brand_id)
);

-- ============================================
-- TABLA: invitations (marca invita usuario)
-- ============================================

create table invitations (
  id           uuid primary key default uuid_generate_v4(),
  brand_id     uuid not null references brand_profiles(id) on delete cascade,
  user_id      uuid not null references user_profiles(id) on delete cascade,
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  type         text not null default 'exchange',
  status       invitation_status not null default 'pending',
  created_at   timestamptz not null default now()
);

-- ============================================
-- TABLA: notifications
-- ============================================

create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  message     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================
-- ÍNDICES para performance
-- ============================================

create index on campaigns (brand_id, status);
create index on exchange_applications (exchange_id, status);
create index on exchange_form_questions (exchange_id, position);
create index on exchange_application_answers (application_id);
create index on exchange_application_answers (question_id);
create index on challenge_submissions (challenge_id, user_id);
create index on brand_points (brand_id, user_id);
create index on notifications (user_id, read);
create index on follows (user_id);
create index on follows (brand_id);

-- ============================================
-- FUNCIÓN: recalcular nivel de usuario
-- Se llama automáticamente cuando cambian los puntos
-- ============================================

create or replace function recalculate_user_level()
returns trigger as $$
declare
  total_score numeric;
  canjes_count int;
  retos_count int;
  veces_seleccionado int;
begin
  -- Contar canjes obtenidos (aplicaciones aceptadas)
  select count(*) into canjes_count
  from exchange_applications
  where user_id = new.id and status = 'accepted';

  -- Contar retos completados (submissions con score)
  select count(distinct challenge_id) into retos_count
  from challenge_submissions
  where user_id = new.id and score is not null;

  -- Contar veces seleccionado por marcas
  select count(*) into veces_seleccionado
  from exchange_applications
  where user_id = new.id and status = 'accepted';

  -- Fórmula del PRD
  total_score :=
    (canjes_count * 5) +
    (retos_count * 3) +
    (new.total_points / 100.0) +
    ((new.followers_instagram + new.followers_tiktok) / 1000.0) +
    (veces_seleccionado * 4);

  -- Asignar nivel según rango
  if total_score >= 600 then
    new.level := 'Diamond';
  elsif total_score >= 300 then
    new.level := 'Platinum';
  elsif total_score >= 150 then
    new.level := 'Gold';
  elsif total_score >= 50 then
    new.level := 'Silver';
  else
    new.level := 'Bronze';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trigger_recalculate_level
before update of total_points, followers_instagram, followers_tiktok
on user_profiles
for each row
execute function recalculate_user_level();

-- ============================================
-- FUNCIÓN: sumar puntos al recibir score en submission
-- ============================================

create or replace function add_points_on_score()
returns trigger as $$
declare
  brand_uuid uuid;
begin
  -- Solo actuar cuando se asigna score (de null a valor)
  if old.score is null and new.score is not null then
    -- Obtener brand_id desde el challenge -> campaign
    select c.brand_id into brand_uuid
    from challenges ch
    join campaigns c on c.id = ch.campaign_id
    where ch.id = new.challenge_id;

    -- Upsert en brand_points
    insert into brand_points (brand_id, user_id, points)
    values (brand_uuid, new.user_id, new.score)
    on conflict (brand_id, user_id)
    do update set points = brand_points.points + new.score;

    -- Actualizar total_points global del usuario
    update user_profiles
    set total_points = total_points + new.score
    where id = new.user_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trigger_add_points
after update of score
on challenge_submissions
for each row
execute function add_points_on_score();

-- ============================================
-- FUNCIÓN: crear profile al registrarse
-- Se ejecuta automáticamente al crear usuario en auth
-- ============================================

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

-- ============================================
-- FUNCIÓN: aceptar aplicación respetando slots
-- ============================================

create or replace function public.accept_exchange_application(target_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_application exchange_applications%rowtype;
  exchange_slot_count int;
  accepted_count int;
  auto_rejected_ids uuid[];
begin
  select ea.*
  into target_application
  from exchange_applications ea
  where ea.id = target_application_id;

  if not found then
    raise exception 'Application not found';
  end if;

  if not exists (
    select 1
    from exchanges e
    join campaigns c on c.id = e.campaign_id
    join brand_profiles bp on bp.id = c.brand_id
    where e.id = target_application.exchange_id
      and bp.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to accept this application';
  end if;

  select e.slots
  into exchange_slot_count
  from exchanges e
  where e.id = target_application.exchange_id
  for update;

  select count(*)
  into accepted_count
  from exchange_applications ea
  where ea.exchange_id = target_application.exchange_id
    and ea.status = 'accepted'
    and ea.id <> target_application_id;

  if target_application.status <> 'accepted' and accepted_count >= exchange_slot_count then
    raise exception 'No slots available for this exchange';
  end if;

  update exchange_applications
  set status = 'accepted'
  where id = target_application_id
  returning *
  into target_application;

  select count(*)
  into accepted_count
  from exchange_applications ea
  where ea.exchange_id = target_application.exchange_id
    and ea.status = 'accepted';

  auto_rejected_ids := '{}';

  if accepted_count >= exchange_slot_count then
    with updated as (
      update exchange_applications
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

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

alter table profiles enable row level security;
alter table user_profiles enable row level security;
alter table brand_profiles enable row level security;
alter table campaigns enable row level security;
alter table exchanges enable row level security;
alter table exchange_applications enable row level security;
alter table exchange_form_questions enable row level security;
alter table exchange_application_answers enable row level security;
alter table challenges enable row level security;
alter table challenge_days enable row level security;
alter table challenge_submissions enable row level security;
alter table brand_points enable row level security;
alter table rewards enable row level security;
alter table redemptions enable row level security;
alter table follows enable row level security;
alter table invitations enable row level security;
alter table notifications enable row level security;

-- profiles: cada uno ve el suyo
create policy "profiles: ver propio" on profiles
  for select using (auth.uid() = id);

create policy "profiles: marca ve applicants" on profiles
  for select using (
    exists (
      select 1
      from user_profiles up
      join exchange_applications ea on ea.user_id = up.id
      join exchanges e on e.id = ea.exchange_id
      join campaigns c on c.id = e.campaign_id
      join brand_profiles bp on bp.id = c.brand_id
      where up.user_id = profiles.id
        and bp.user_id = auth.uid()
    )
  );

-- user_profiles: público para leer, solo el dueño edita
create policy "user_profiles: lectura pública" on user_profiles
  for select using (true);

create policy "user_profiles: editar propio" on user_profiles
  for all using (user_id = auth.uid());

-- brand_profiles: público para leer, solo el dueño edita
create policy "brand_profiles: lectura pública" on brand_profiles
  for select using (true);

create policy "brand_profiles: editar propio" on brand_profiles
  for all using (user_id = auth.uid());

-- campaigns: activas visibles para todos, draft/closed solo para la marca
create policy "campaigns: ver activas" on campaigns
  for select using (
    status = 'active'
    or brand_id in (
      select id from brand_profiles where user_id = auth.uid()
    )
  );

create policy "campaigns: marca gestiona las suyas" on campaigns
  for all using (
    brand_id in (
      select id from brand_profiles where user_id = auth.uid()
    )
  );

-- exchanges: mismo criterio que campaigns (a través de campaign)
create policy "exchanges: lectura según campaña" on exchanges
  for select using (
    campaign_id in (select id from campaigns where status = 'active')
    or campaign_id in (
      select id from campaigns where brand_id in (
        select id from brand_profiles where user_id = auth.uid()
      )
    )
  );

create policy "exchanges: marca gestiona los suyos" on exchanges
  for all using (
    campaign_id in (
      select id from campaigns where brand_id in (
        select id from brand_profiles where user_id = auth.uid()
      )
    )
  );

-- exchange_applications: usuario ve las suyas, marca ve las de sus campañas
create policy "applications: usuario ve las suyas" on exchange_applications
  for select using (
    user_id in (select id from user_profiles where user_id = auth.uid())
    or exchange_id in (
      select e.id from exchanges e
      join campaigns c on c.id = e.campaign_id
      join brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  );

create policy "applications: usuario crea" on exchange_applications
  for insert with check (
    user_id in (select id from user_profiles where user_id = auth.uid())
  );

create policy "applications: marca actualiza estado" on exchange_applications
  for update using (
    exchange_id in (
      select e.id from exchanges e
      join campaigns c on c.id = e.campaign_id
      join brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  );

-- exchange_form_questions: visibles para campañas activas y gestionables por la marca dueña
create policy "exchange_form_questions: lectura según campaña" on exchange_form_questions
  for select using (
    exchange_id in (
      select e.id
      from exchanges e
      join campaigns c on c.id = e.campaign_id
      where c.status = 'active'
    )
    or exchange_id in (
      select e.id
      from exchanges e
      join campaigns c on c.id = e.campaign_id
      join brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  );

create policy "exchange_form_questions: marca gestiona" on exchange_form_questions
  for all using (
    exchange_id in (
      select e.id
      from exchanges e
      join campaigns c on c.id = e.campaign_id
      join brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  )
  with check (
    exchange_id in (
      select e.id
      from exchanges e
      join campaigns c on c.id = e.campaign_id
      join brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  );

-- exchange_application_answers: usuario ve/crea las suyas, marca ve las de sus campañas
create policy "exchange_application_answers: lectura propia o de marca" on exchange_application_answers
  for select using (
    application_id in (
      select ea.id
      from exchange_applications ea
      join user_profiles up on up.id = ea.user_id
      where up.user_id = auth.uid()
    )
    or application_id in (
      select ea.id
      from exchange_applications ea
      join exchanges e on e.id = ea.exchange_id
      join campaigns c on c.id = e.campaign_id
      join brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  );

create policy "exchange_application_answers: usuario crea propias" on exchange_application_answers
  for insert with check (
    application_id in (
      select ea.id
      from exchange_applications ea
      join user_profiles up on up.id = ea.user_id
      where up.user_id = auth.uid()
    )
  );

-- challenge_submissions: usuario ve las suyas, marca ve las de sus retos
create policy "submissions: usuario ve las suyas" on challenge_submissions
  for select using (
    user_id in (select id from user_profiles where user_id = auth.uid())
    or challenge_id in (
      select ch.id from challenges ch
      join campaigns c on c.id = ch.campaign_id
      join brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  );

create policy "submissions: usuario crea" on challenge_submissions
  for insert with check (
    user_id in (select id from user_profiles where user_id = auth.uid())
  );

create policy "submissions: marca puntúa" on challenge_submissions
  for update using (
    challenge_id in (
      select ch.id from challenges ch
      join campaigns c on c.id = ch.campaign_id
      join brand_profiles bp on bp.id = c.brand_id
      where bp.user_id = auth.uid()
    )
  );

-- brand_points: usuario ve los suyos, marca ve los de sus usuarios
create policy "brand_points: lectura" on brand_points
  for select using (
    user_id in (select id from user_profiles where user_id = auth.uid())
    or brand_id in (select id from brand_profiles where user_id = auth.uid())
  );

-- rewards: públicos para leer
create policy "rewards: lectura pública" on rewards
  for select using (true);

create policy "rewards: marca gestiona" on rewards
  for all using (
    brand_id in (select id from brand_profiles where user_id = auth.uid())
  );

-- redemptions: usuario ve las suyas
create policy "redemptions: usuario ve las suyas" on redemptions
  for select using (
    user_id in (select id from user_profiles where user_id = auth.uid())
  );

create policy "redemptions: usuario crea" on redemptions
  for insert with check (
    user_id in (select id from user_profiles where user_id = auth.uid())
  );

-- notifications: cada uno ve las suyas
create policy "notifications: ver propias" on notifications
  for all using (user_id = auth.uid());

-- follows e invitations: usuario ve los suyos
create policy "follows: gestión propia" on follows
  for all using (
    user_id in (select id from user_profiles where user_id = auth.uid())
  );

create policy "invitations: ver propias" on invitations
  for select using (
    user_id in (select id from user_profiles where user_id = auth.uid())
    or brand_id in (select id from brand_profiles where user_id = auth.uid())
  );

create policy "invitations: marca crea" on invitations
  for insert with check (
    brand_id in (select id from brand_profiles where user_id = auth.uid())
  );
