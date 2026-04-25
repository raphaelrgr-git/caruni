# Features

Cada pasta aqui representa um domínio do produto CarUni. A lógica de UI fica aqui; as rotas em `src/routes/` são wrappers finos que apenas importam o componente de página.

## Índice

| Feature | Rota | Arquivo de página | Status |
|---|---|---|---|
| **dashboard** | `/app` | `DashboardPage.tsx` | ✅ MVP |
| **buscar** | `/app/buscar` | `BuscarPage.tsx` | ✅ MVP |
| **booking** | `/app/rota/$id` | `RotaDetalhePage.tsx` | ✅ MVP |
| **criar-rota** | `/app/criar-rota` | `CriarRotaPage.tsx` | ✅ MVP (requer API) |
| **minhas-caronas** | `/app/minhas-caronas` | `MinhasCaronasPage.tsx` | ✅ MVP |
| **viagem-ativa** | `/app/viagem-ativa` | `ViagemAtivaPage.tsx` | ✅ MVP |
| **carteira** | `/app/carteira` | `CarteiraPage.tsx` | ✅ MVP |
| **perfil** | `/app/perfil` | `PerfilPage.tsx` | ✅ MVP |
| **chat** | `/app/chat/$rotaId` | `ChatPage.tsx` | ⚠️ Mock (sem backend) |

## Dependências entre features

```
dashboard ──→ viagem-ativa (link direto)
dashboard ──→ booking (link para detalhes)
buscar    ──→ booking (navega ao clicar em "Ver rota")
booking   ──→ chat (link para chat da rota)
criar-rota ──→ booking (navega após criar)
minhas-caronas ──→ criar-rota (CTA para motoristas sem rota)
viagem-ativa ──→ chat (shortcut flutuante)
```

## Store compartilhado

Todas as features consomem `useCaruniStore()` de `@/data/store`. O store é o único source of truth — sem prop drilling, sem estado local para dados que precisam persistir.
