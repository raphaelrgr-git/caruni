# Feature: Carteira

**Rota:** `/app/carteira`  
**Componente:** `CarteiraPage.tsx`

## O que faz

Gerenciamento de créditos, troca de plano, compra de viagem extra e extrato de transações.

## Seções

1. **Header do plano** — nome, pitch, badge de prioridade, créditos disponíveis/reservados/usados
2. **Seletor de plano** — botões Calouro vs Veterano + "Comprar viagem extra"
3. **Cards de resumo** — créditos restantes, ganhos do mês, economia vs Uber/99
4. **Extrato** — lista de `transacoes` do store, mais recente primeiro

## Tipos de transação no extrato

| `tipo` | Ícone | Cor |
|---|---|---|
| `assinatura` | ArrowUpRight | neutro |
| `credito_reservado` | ArrowUpRight | neutro |
| `credito_consumido` | ArrowUpRight | neutro |
| `credito_devolvido` | ArrowDownLeft | success |
| `credito_perdido` | AlertCircle | warn |
| `recarga` | ArrowUpRight | neutro |
| `penalizacao` | AlertCircle | warn |

## Ações do store

```ts
const { activePlan, creditSummary, transacoes, buyExtraCredit, plans, selectPlan, savings } = useCaruniStore()
```

| Ação | Efeito |
|---|---|
| `selectPlan(id)` | Troca plano, reseta ledger, limpa bookings |
| `buyExtraCredit()` | Adiciona 1 crédito extra ao ledger, registra transação de recarga |
