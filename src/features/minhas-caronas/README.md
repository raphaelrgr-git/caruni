# Feature: Minhas Caronas

**Rota:** `/app/minhas-caronas`  
**Componente:** `MinhasCaronasPage.tsx`

## O que faz

Visão consolidada das caronas do usuário em dois papéis: passageiro e motorista.

## Tabs

### Como passageiro
- Lista rotas onde `rota.inscritos.includes(eu.id)`
- Mostra bookings ativos com opção de cancelar (normal ou tardio)
- Banner demo de "buscando substituto" para ilustrar o fluxo

### Como motorista
- Lista rotas onde `rota.motoristaId === eu.id`
- Mostra passageiros inscritos por rota
- Botões para cancelar dias individuais da rota
- CTA para criar rota se não houver nenhuma

## Ações do store

```ts
const { rotas, bookings, cancelBooking, cancelRouteDay, activePlan } = useCaruniStore()
```

| Ação | Efeito |
|---|---|
| `cancelBooking(id)` | Devolve crédito, booking → "cancelada" |
| `cancelBooking(id, true)` | Cancela tardio: perde 50% do crédito |
| `cancelRouteDay(rotaId, dia)` | Remove o dia da semana da rota |

## Cancelamento tardio

Regra: cancela com `late = true` → `releaseReservedCredit(bookingId, late=true)` → crédito vai para status "perdido" + transação `credito_perdido` com valor `-costPerTrip * 0.5`.
