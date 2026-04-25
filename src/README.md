# CarUni — Arquitetura do Frontend

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + TanStack Router v1 (file-based routing) |
| Estilização | Tailwind CSS 4 + design system em CSS custom properties (OKLch) |
| Componentes | Radix UI + shadcn/ui (`src/components/ui/`) |
| Estado | React Context API + localStorage (`src/data/store.tsx`) |
| Mapas | Leaflet + react-leaflet (`src/components/RouteMap.tsx`) |
| Forms | react-hook-form + Zod (usado em criar-rota) |
| API | Fetch nativo via `src/lib/api.ts` → backend em `apps/api/` |

## Estrutura de pastas

```
src/
├── features/          # Lógica e UI de cada domínio do produto
├── components/        # Componentes compartilhados (AppShell, Brand, RouteMap, ui/)
├── data/              # Estado global (store), mock data, lugares
├── lib/               # Utilitários (api, theme, utils)
├── hooks/             # Hooks reutilizáveis
└── routes/            # Wrappers finos do TanStack Router (não edite manualmente)
```

## Arquitetura feature-based

Cada feature em `src/features/[feature]/` é responsável por:
- Seu componente de página principal (`[Feature]Page.tsx`)
- Sua documentação (`README.md`)

As rotas em `src/routes/` são apenas boilerplate do TanStack Router que importam da feature correspondente. A lógica de negócio fica nas features.

## Como adicionar uma nova feature

1. Crie a pasta `src/features/minha-feature/`
2. Crie `MinhFeaturePage.tsx` com o componente exportado
3. Crie `README.md` documentando o domínio
4. Crie o arquivo de rota em `src/routes/app.minha-feature.tsx`:
   ```tsx
   import { createFileRoute } from "@tanstack/react-router"
   import { MinhaFeaturePage } from "@/features/minha-feature/MinhaFeaturePage"
   export const Route = createFileRoute("/app/minha-feature")({
     component: MinhaFeaturePage,
   })
   ```
5. O TanStack Router regenera `routeTree.gen.ts` automaticamente no dev

## Temas

Dois temas definidos em `src/styles.css`:
- **light**: off-white + teal verde primário + laranja accent
- **dark**: grafite + lima verde primário + âmbar accent

Alternância via `src/lib/theme.tsx` → botão no `AppShell`.

## MVP vs Produção

| Funcionalidade | Status MVP |
|---|---|
| Autenticação | ❌ Hardcoded (usuário "Você") |
| Persistência | ⚠️ localStorage apenas |
| Pagamentos | ❌ Créditos ficcionais |
| API routing | ✅ Endpoint real em `apps/api/` |
| Chat real-time | ❌ Mock estático |
| Push notifications | ❌ Não implementado |
