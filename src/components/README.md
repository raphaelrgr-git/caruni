# Componentes Compartilhados

Componentes reutilizados por múltiplas features. Não contêm lógica de domínio — apenas UI.

## AppShell

`AppShell.tsx` — Layout principal do app autenticado.

- **Desktop**: sidebar fixa de 240px (`w-60`) com nav vertical
- **Mobile**: header sticky + tab bar fixa na base (4 tabs)
- Lê `creditSummary` e `activePlan` do store para exibir créditos no sidebar
- `ThemeToggle` interno alterna light/dark via `useTheme()`

**Uso:**
```tsx
// src/routes/app.tsx
<AppShell />  // usa <Outlet /> internamente
```

## Brand

`Brand.tsx` — Primitivos visuais da identidade CarUni.

| Componente | Props | Uso |
|---|---|---|
| `BrandLogo` | — | Logo no header/sidebar |
| `Avatar` | `name, color, size, iniciais` | Avatar circular colorido |
| `CnhBadge` | — | Badge "CNH ✓" em teal |
| `PresenceBar` | `value: number, label?: boolean` | Barra de % de presença |
| `StarRating` | `value: number` | Estrelas (1–5) com fill parcial |

## RouteMap

`RouteMap.tsx` — Wrapper do Leaflet para renderizar rotas.

```tsx
<RouteMap
  path={rota.caminho}           // LatLng[] — polyline
  origin={rota.origem.coord}    // LatLng
  destination={rota.destino.coord}
  carPosition={rota.caminho[step]}  // opcional — marcador animado
  height={320}                  // número ou "100%"
  interactive={true}            // habilita zoom/pan
  fit={false}                   // auto-fit bounds ao path
/>
```

Suporta temas light/dark com tile layers diferentes (CartoDB Positron / DarkMatter).

## ui/

Componentes shadcn/ui gerados — não edite manualmente. Para adicionar novos componentes, use `npx shadcn@latest add <component>`.
