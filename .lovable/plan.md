## 🎯 Objetivo

Transformar o formulário de waitlist (hoje só `alert()`) em um sistema funcional de captura de leads, salvando nome, e-mail e tipo (motorista/passageiro) no Lovable Cloud, com painel administrativo protegido por senha e exportação CSV.

---

## 1. Backend — Lovable Cloud

### Habilitar Lovable Cloud
Necessário para criar a tabela e usar autenticação no painel admin.

### Tabela `leads`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `nome` | text | obrigatório, 2–100 chars |
| `email` | text | obrigatório, validado, único por tipo |
| `tipo` | text | `'motorista'` ou `'passageiro'` (CHECK constraint) |
| `origem` | text | de onde veio (ex.: `'landing_waitlist'`) — útil pra futuros formulários |
| `user_agent` | text | metadado opcional |
| `created_at` | timestamptz | `now()` |

**RLS habilitada** com duas policies:
- `INSERT` público (anônimo) — qualquer visitante pode se cadastrar
- `SELECT` apenas para usuários com role `admin` (via tabela `user_roles` + função `has_role`, padrão seguro de roles)

### Tabela `user_roles` (padrão de segurança)
Conforme regra de segurança do projeto: roles em tabela separada, nunca no perfil. Enum `app_role` com valor `admin`, função `has_role(uuid, app_role)` SECURITY DEFINER.

---

## 2. Frontend — Formulário funcional

### Refatorar `WaitlistForm` em `src/routes/index.tsx`
- Validação com **zod** (nome 2–100, e-mail válido, max 255)
- Estados: `idle` → `submitting` → `success` / `error`
- Ao enviar:
  - Chama `supabase.from('leads').insert({...})`
  - Se e-mail já existe pra aquele tipo → mensagem amigável "Você já está na nossa lista 💚"
  - Sucesso → substitui o formulário por um card de confirmação animado com nome do usuário e mensagem motivacional ("Te avisamos assim que abrir vaga em Joinville")
  - Erro genérico → toast com mensagem clara
- Loading state no botão (spinner + texto "Salvando...")
- Sem `alert()` — apenas UI inline + toast (sonner já está no projeto)

---

## 3. Painel administrativo `/admin/leads`

### Acesso
- Rota `src/routes/admin.leads.tsx`
- Usuário precisa estar logado **e** ter role `admin`
- Se não logado → redireciona para `/admin/login`
- Se logado mas sem role admin → mostra tela "Sem permissão"

### Tela de login `/admin/login`
- Form simples: e-mail + senha (Lovable Cloud Auth, email/password)
- **Auto-confirm de e-mail ativado** (sem confirmação por link, pra você entrar rápido)
- Você cria sua conta admin uma vez e eu adiciono manualmente seu `user_id` em `user_roles` via migração após você me passar o e-mail (ou já adiciono lógica que promove o primeiro usuário cadastrado a admin)

### UI do painel
- **Header com KPIs** em cards: total de leads, motoristas, passageiros, % de cada tipo, leads nas últimas 24h
- **Tabela densa** estilo dashboard (mesma estética do app):
  - Colunas: Data, Nome, E-mail, Tipo (badge colorido), Origem
  - Ordenação por data (mais recentes primeiro)
  - Busca por nome/e-mail (filtro client-side)
  - Filtro por tipo (todos / motoristas / passageiros)
- **Botão "Exportar CSV"** no canto superior direito:
  - Gera CSV com headers `nome,email,tipo,origem,created_at` no client
  - Download imediato como `caruni-leads-YYYY-MM-DD.csv`
  - Respeita os filtros aplicados (exporta só o que está visível) + opção "exportar tudo"
- **Botão "Sair"** com logout

### Visual
- Mantém o design system: dark/light, Geist Mono nos números, badges coloridos por tipo (motorista = primary, passageiro = accent), cards em `bg-surface`
- Mobile-friendly: tabela vira lista de cards em telas pequenas

---

## 4. Acesso ao admin pelo footer
Adiciono um link discreto **"admin"** no footer do site (texto bem pequeno, cor `muted-foreground`) apontando para `/admin/login`. Sem chamar atenção, mas você acessa rápido.

---

## 5. Arquivos a criar/editar

**Criar:**
- `src/routes/admin.leads.tsx` — painel
- `src/routes/admin.login.tsx` — login
- `src/lib/supabase.ts` — cliente Supabase (se ainda não existe)
- `src/lib/admin.ts` — helper `requireAdmin()` para guards
- Migrações: tabela `leads`, enum `app_role`, tabela `user_roles`, função `has_role`, policies RLS

**Editar:**
- `src/routes/index.tsx` — `WaitlistForm` funcional
- `src/routes/__root.tsx` — adicionar `<Toaster />` do sonner se ainda não estiver montado globalmente
- Footer da landing — link discreto pro admin

---

## 6. O que **não** faz parte deste plano (pra manter foco)
- Notificação por e-mail a cada lead novo (pode adicionar depois com Resend)
- Integração com Mailchimp / RD Station / planilha externa
- Captura UTM / tracking avançado
- Dashboard com gráficos temporais

---

## ✅ Resultado esperado

1. Visitante preenche o formulário na landing → vê confirmação animada
2. Lead salva no banco com tipo correto
3. Você acessa `/admin/login`, entra, vê painel com todas as leads, filtra, exporta CSV
4. Tudo no mesmo design do app, sem dependência externa