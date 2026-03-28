create policy "applications: usuario actualiza propias" on public.exchange_applications
  for update using (
    user_id in (select id from public.user_profiles where user_id = auth.uid())
  )
  with check (
    user_id in (select id from public.user_profiles where user_id = auth.uid())
  );
