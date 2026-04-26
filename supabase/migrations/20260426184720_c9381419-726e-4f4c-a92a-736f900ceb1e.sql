-- Enum de papéis
create type public.app_role as enum ('admin');

-- Tabela de papéis (segurança: roles em tabela separada do perfil)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Função SECURITY DEFINER para checar role sem causar recursão de RLS
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Policies de user_roles: só admins veem/gerenciam
create policy "Admins veem todos os papéis"
  on public.user_roles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins gerenciam papéis"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Tabela de leads
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 100),
  email text not null check (char_length(email) between 3 and 255),
  tipo text not null check (tipo in ('motorista', 'passageiro')),
  origem text not null default 'landing_waitlist',
  user_agent text,
  created_at timestamptz not null default now(),
  unique (email, tipo)
);

alter table public.leads enable row level security;

-- Qualquer visitante pode inserir lead
create policy "Qualquer um pode entrar na lista"
  on public.leads for insert
  to anon, authenticated
  with check (true);

-- Apenas admins podem ler leads
create policy "Admins veem todos os leads"
  on public.leads for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins gerenciam leads"
  on public.leads for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Index para queries do painel
create index leads_created_at_desc_idx on public.leads (created_at desc);
create index leads_tipo_idx on public.leads (tipo);

-- Trigger: primeiro usuário cadastrado vira admin automaticamente
create or replace function public.promote_first_user_to_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Se ainda não existe nenhum admin, promove esse usuário
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created_promote_admin
  after insert on auth.users
  for each row
  execute function public.promote_first_user_to_admin();