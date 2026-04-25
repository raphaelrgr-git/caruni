# Feature: Viagem Ativa

**Rota:** `/app/viagem-ativa`  
**Componente:** `ViagemAtivaPage.tsx`

## O que faz

Tela full-screen com mapa animado durante a viagem em andamento. Permite confirmar embarque, avaliar o motorista e acionar SOS.

## Animação do carro

```ts
const [step, setStep] = React.useState(1)
useEffect(() => {
  const t = setInterval(() => setStep(s => (s + 1) % rota.caminho.length), 2200)
  return () => clearInterval(t)
}, [rota.caminho.length])
```

O marcador de carro percorre os pontos do polyline a cada 2.2 segundos.

## Fluxo de confirmação dupla

```
ride.status === "agendada"
  ├─ Motorista clica "embarcou" → confirmDriverBoarded(id, true)
  │   └─ Se passageiro já confirmou → consumeReservedCredit() → status "confirmada"
  └─ Passageiro clica "viajei" → confirmPassengerRide(id)
      └─ Se motorista já confirmou e boarded=true → consumeReservedCredit()

Motorista clica "No-show" → confirmDriverBoarded(id, false)
  → markNoShow() → crédito "perdido", ride "disputa"
```

Após `status === "confirmada"`, o painel de confirmação é substituído pelo widget de avaliação (1–5 estrelas).

## SOS (hold-to-activate)

Implementado com `requestAnimationFrame` para animar o círculo de progresso SVG. Requer 1500ms de pressão contínua para armar. Após armado, exibe modal com dados do `contatoEmergencia` de `mock.ts`.

## Dados do store

```ts
const { rotas, rides, confirmDriverBoarded, confirmPassengerRide, addReview } = useCaruniStore()
```

## Limitações MVP

- `rides[0]` é sempre usado como a viagem ativa (sem seleção)
- Localização real do carro não é rastreada (animação é simulada)
- SOS não envia WhatsApp de verdade
