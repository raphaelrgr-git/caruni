# Data Layer

Três arquivos que compõem toda a camada de dados do frontend MVP.

## mock.ts — Dados de exemplo

Tipos TypeScript (`Person`, `Rota`, `Transacao`, `ChatMsg`) e instâncias realistas de Joinville/BR.

**Exports principais:**
- `eu` — usuário logado (ID `u1`)
- `pessoas` — array com 10 usuários fake
- `rotas` — 6 rotas com coordenadas reais de Joinville
- `mensagens` — histórico de chat mockado
- `transacoes` — histórico de transações seed
- `contatoEmergencia` — usado pela feature viagem-ativa/SOS
- `getPessoa(id)` / `getRota(id)` — lookups por ID
- `formatBRL(n)` / `formatData(iso)` / `formatHora(date)` — formatação

**⚠️ Nota:** `eu.nome === "Você"` — o app é orientado a um único usuário demo. Em produção substituir por auth real.

## places.ts — Localizações de Joinville

12 pontos fixos (universidades, bairros, terminais) com coordenadas WGS84.

**Exports:**
- `placeSuggestions` — array completo de lugares
- `searchPlaces(query)` — filtro por label/tags
- `getPlace(id)` — lookup por ID
- `distanceKm(a, b)` — Haversine entre dois `LatLng`
- `makeRoutePath(origin, dest)` — path interpolado (4 pontos) para mock sem API
- `estimateUber99(km)` — `max(12, 6 + km * 2.8)`

## store.tsx — Estado global

Context API com persistência em localStorage (`"caruni-mvp-state-v2"`).

### Estado (`AppState`)

```ts
{
  rotas: Rota[]           // inclui rotas criadas pelo usuário
  bookings: Booking[]     // reservas ativas e canceladas
  rides: RideInstance[]   // viagens individuais (por booking)
  reviews: Review[]       // avaliações pós-viagem
  transacoes: Transacao[] // ledger de transações financeiras
  subscription: UserSubscription
  creditLedger: CreditLedgerEntry[]
  extraCreditsPurchased: number
}
```

### Ciclo de vida de um crédito

```
disponivel
  → reservado   (reserveCredit)
  → consumido   (consumeReservedCredit, após confirmação dupla)
  → perdido     (markNoShow ou cancelBooking com late=true)
  → disponivel  (releaseReservedCredit, cancelamento normal)
```

### Hook

```ts
const { ... } = useCaruniStore()
// Lança erro se usado fora do CaruniStoreProvider
```
