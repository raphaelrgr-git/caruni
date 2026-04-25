# Feature: Dashboard

**Rota:** `/app`  
**Componente:** `DashboardPage.tsx`

## O que exibe

Painel principal do usuário após login. Três seções principais:

1. **Próxima carona** — card com mapa Leaflet, motorista, vagas, links para viagem ativa e chat
2. **Coluna lateral** — plano ativo + créditos, economia realizada vs ônibus/Uber, reputação, ganhos do mês
3. **Esta semana** — grade de 5 cards com status de cada dia (feita / agendada / substituto)
4. **Comunidade da rota** — avatares dos outros passageiros da rota principal

## Dados do store

```ts
const { activePlan, creditSummary, savings, subscription, selectPlan, plans } = useCaruniStore()
```

## Funções auxiliares de mock.ts

- `proximaCarona()` — calcula a próxima carona com base em `Date.now()` (SSR-safe via `suppressHydrationWarning`)
- `semanaCaronas` — array fixo dos 5 dias da semana com status
- `ganhosMes` — dados do gráfico de barras de ganhos

## Notas

- `proximaCarona()` recalcula a cada render — mover para `useEffect` com `useState` evita mismatch SSR/CSR
- O gráfico de ganhos é manual (array de alturas), não usa Recharts; ok para MVP
