# Feature: Criar Rota

**Rota:** `/app/criar-rota`  
**Componente:** `CriarRotaPage.tsx`

## O que faz

Formulário para motoristas cadastrarem uma rota recorrente. Integra com a API real para calcular distância e traçar o caminho no mapa antes de salvar.

## Fluxo

```
Usuário preenche: origem, destino, horário, vagas, dias da semana
  → useEffect dispara previewRoute() quando origem/destino mudam
  → API em http://localhost:3001/routing/preview calcula rota real
  → Mapa atualiza com o trajeto calculado
  → Usuário clica "Publicar rota"
  → createRoute() salva no store com path e km reais
  → Navega para /app/rota/$id da nova rota
```

## Integração com API

```ts
// src/lib/api.ts
previewRoute({ origin: { lat, lng }, destination: { lat, lng } })
  → POST /routing/preview
  → Retorna { path: LatLng[], distanceMeters, durationSeconds, provider }
```

O botão "Publicar rota" fica **desabilitado** enquanto o preview não retorna. Se a API estiver offline, exibe a mensagem de erro mas não tem retry automático.

## Estado do formulário

| Campo | Tipo | Validação |
|---|---|---|
| Nome | string | Opcional (usa `origem → destino` como padrão) |
| Origem | select de `placeSuggestions` | Obrigatório |
| Destino | select de `placeSuggestions` | Obrigatório |
| Horário | time input | Obrigatório |
| Vagas | number 1–7 | Obrigatório |
| Dias | toggle buttons | Mínimo 1 (validado pelo `disabled`) |

## Dados do store

```ts
const { createRoute } = useCaruniStore()
```

## Limitações MVP

- Origem e destino são dropdowns fixos (12 lugares em `places.ts`), não geocoding livre
- Sem validação de rota circular (origem === destino permitido)
- Sem configuração de preço — calculado automaticamente pelo backend
