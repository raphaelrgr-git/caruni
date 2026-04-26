-- Substitui a policy permissiva por uma com restrição explícita de origem
drop policy if exists "Qualquer um pode entrar na lista" on public.leads;

create policy "Visitantes entram na lista pela landing"
  on public.leads for insert
  to anon, authenticated
  with check (origem = 'landing_waitlist');