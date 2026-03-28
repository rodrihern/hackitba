insert into public.challenge_days (
  challenge_id,
  day_number,
  title,
  description,
  content_type,
  instructions
)
select
  ch.id,
  1,
  'Entrega principal',
  '',
  'link'::public.content_type,
  'Compartí el link de tu entrega.'
from public.challenges ch
left join public.challenge_days cd on cd.challenge_id = ch.id
where cd.id is null
  and coalesce(ch.total_days, 1) = 1;
