# CarUni API

Backend em Node.js/TypeScript com Fastify + Prisma ORM.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Fastify |
| ORM | Prisma (PostgreSQL) |
| Auth | JWT via plugin `plugins/auth.ts` |
| Runtime | Node.js (compilado para `dist/`) |

## Subir localmente

```bash
# Na raiz do projeto
docker-compose up -d      # sobe o PostgreSQL
npm run dev:api           # compila e inicia o servidor em :3001
```

Variáveis de ambiente em `.env` (copiar de `.env.example`).

## Módulos

| Arquivo | Responsabilidade | Endpoints |
|---|---|---|
| `auth.ts` | Registro e login de usuários | `POST /auth/register`, `POST /auth/login` |
| `routes.ts` | CRUD de rotas recorrentes | `GET /routes`, `POST /routes`, `GET /routes/:id` |
| `bookings.ts` | Reserva de vagas | `POST /bookings`, `DELETE /bookings/:id` |
| `rides.ts` | Instâncias de viagem e confirmações | `GET /rides`, `POST /rides/:id/confirm` |
| `wallet.ts` | Ledger de créditos | `GET /wallet`, `POST /wallet/topup` |
| `plans.ts` | Planos de assinatura | `GET /plans` |
| `reviews.ts` | Avaliações pós-viagem | `POST /reviews`, `GET /reviews/:userId` |
| `dashboard.ts` | Dados agregados para o painel | `GET /dashboard` |
| `routing.ts` | Cálculo de rota via provider externo | `POST /routing/preview` |

## Endpoint em uso pelo frontend

Apenas `POST /routing/preview` é chamado pelo frontend MVP (`src/lib/api.ts`). Os demais módulos existem mas o frontend ainda usa mock/localStorage.

### POST /routing/preview

```json
// Request
{
  "origin": { "lat": -26.3045, "lng": -48.8487 },
  "destination": { "lat": -26.2906, "lng": -48.8793 },
  "profile": "driving-car"
}

// Response
{
  "provider": "openrouteservice",
  "distanceMeters": 4200,
  "durationSeconds": 780,
  "geometry": {
    "type": "LineString",
    "coordinates": [[-48.8487, -26.3045], ...]
  }
}
```

**Nota:** as coordenadas retornadas estão em formato GeoJSON `[lng, lat]`. O frontend inverte para `[lat, lng]` ao receber.
