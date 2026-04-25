# Routes — TanStack Router

Esta pasta contém **apenas boilerplate de roteamento**. A lógica de UI e negócio fica em `src/features/`.

## Convenção de arquivos

TanStack Router usa file-based routing com nomes de arquivo mapeados para URLs:

| Arquivo | URL |
|---|---|
| `index.tsx` | `/` (landing page) |
| `app.tsx` | `/app` (layout wrapper com AppShell) |
| `app.index.tsx` | `/app` (dashboard, exige `index`) |
| `app.buscar.tsx` | `/app/buscar` |
| `app.rota.$id.tsx` | `/app/rota/:id` |
| `app.criar-rota.tsx` | `/app/criar-rota` |
| `app.minhas-caronas.tsx` | `/app/minhas-caronas` |
| `app.viagem-ativa.tsx` | `/app/viagem-ativa` |
| `app.carteira.tsx` | `/app/carteira` |
| `app.perfil.tsx` | `/app/perfil` |
| `app.chat.$rotaId.tsx` | `/app/chat/:rotaId` |
| `__root.tsx` | Root layout (providers globais) |

## Padrão de wrapper fino

```tsx
// src/routes/app.buscar.tsx
import { createFileRoute } from "@tanstack/react-router"
import { BuscarPage } from "@/features/buscar/BuscarPage"

export const Route = createFileRoute("/app/buscar")({
  head: () => ({ meta: [{ title: "CarUni — Buscar carona" }] }),
  component: BuscarPage,
})
```

## Rotas com parâmetros dinâmicos

Parâmetros (`$id`, `$rotaId`) ficam no wrapper de rota e são passados como props:

```tsx
// app.rota.$id.tsx
component: function RotaDetalheRoute() {
  const { id } = Route.useParams()
  return <RotaDetalhePage id={id} />
}
```

## Rotas com loader

Loader fica no arquivo de rota; dados são passados como props via `useLoaderData()`:

```tsx
// app.chat.$rotaId.tsx
loader: ({ params }) => {
  const r = getRota(params.rotaId)
  if (!r) throw notFound()
  return r
},
component: function ChatRoute() {
  const rota = Route.useLoaderData()
  return <ChatPage rota={rota} />
}
```

## ⚠️ Não edite routeTree.gen.ts

Este arquivo é gerado automaticamente pelo TanStack Router Vite plugin ao salvar qualquer arquivo de rota. Edições manuais serão sobrescritas.
