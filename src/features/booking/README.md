# Feature: Booking (Detalhe da Rota)

**Rota:** `/app/rota/$id`  
**Componente:** `RotaDetalhePage.tsx`  
**Props:** `{ id: string }` — passado pelo wrapper `RotaDetalheRoute` via `Route.useParams()`

## O que faz

Página de detalhe de uma rota específica. Permite ao passageiro reservar vagas e visualizar informações de confiança do motorista.

## Fluxo de reserva

```
Usuário seleciona dias + tipo (recorrente/avulso)
  → clica "Reservar vaga"
  → reserveCredit(rotaId, diasSelecionados, tipo)
  → 1 crédito muda de "disponivel" → "reservado" no ledger
  → booking criado no store
  → ride instance criada com status "agendada"
  → feedback inline exibido
```

## Estados do botão de reserva

| Condição | Estado |
|---|---|
| `minhaReserva` existe | Desabilitado · "Rota reservada" |
| `diasSelecionados` vazio | Desabilitado |
| Normal | Habilitado · "Reservar vaga" |

## Dados do store

```ts
const { rotas, bookings, reviews, reserveCredit, creditSummary, activePlan } = useCaruniStore()
```

## Cálculo de economia

```ts
economiaOnibus = BUS_FARE(6.5) - activePlan.costPerTrip
economiaParticular = estimateUber99(rota.km) - activePlan.costPerTrip
```

## Reviews

Exibe reviews onde `rev.rotaId === rota.id && rev.toId === motorista.id`. Se nenhuma review real existe, exibe um fallback hardcoded para não mostrar tela vazia.
