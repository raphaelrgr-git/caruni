# Lib — Utilitários

## api.ts — Cliente HTTP

Wrapper de `fetch` para o backend em `apps/api/`.

**Base URL:** `VITE_API_URL` env var ou `http://localhost:3001` por padrão.

**Endpoint disponível:**

```ts
previewRoute({
  origin: { lat, lng },
  destination: { lat, lng },
  profile?: "driving-car"  // padrão
}): Promise<FrontendRoutePreview>
```

Resposta:
```ts
{
  provider: string          // ex: "openrouteservice"
  distanceMeters: number
  durationSeconds: number
  path: LatLng[]            // convertido de [lng,lat] → [lat,lng] para Leaflet
}
```

**Tratamento de erro:** lança `Error` com a mensagem do servidor. Quem chama (feature `criar-rota`) captura e exibe no estado local.

## theme.tsx — Alternância de tema

Provedor e hook para o sistema de temas light/dark.

```ts
const { theme, toggle } = useTheme()
// theme: "light" | "dark"
// toggle: () => void
```

Aplica a classe `dark` no `<html>` e persiste em localStorage.

## utils.ts — Utilitários gerais

Exporta `cn(...classes)` — wrapper de `clsx` + `tailwind-merge` para composição de classes Tailwind sem conflitos.

```ts
import { cn } from "@/lib/utils"
cn("px-4 py-2", isActive && "bg-primary", className)
```
