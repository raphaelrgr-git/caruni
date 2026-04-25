# Feature: Chat

**Rota:** `/app/chat/$rotaId`  
**Componente:** `ChatPage.tsx`  
**Props:** `{ rota: Rota }` — injetado pelo loader em `app.chat.$rotaId.tsx`

## O que faz

Chat em grupo da rota entre todos os participantes (motorista + passageiros). No MVP é somente leitura de dados mockados — mensagens digitadas são descartadas.

## Loader (no arquivo de rota)

```ts
loader: ({ params }) => {
  const r = getRota(params.rotaId)
  if (!r) throw notFound()
  return r
}
```

O `notFound()` ativa o `notFoundComponent` definido na rota.

## Mensagens

Filtradas de `mensagens` em `mock.ts` por `rotaId`. Suportam dois tipos:

| `autorId` | Renderização |
|---|---|
| `"sistema"` | Pill centralizado com texto em uppercase |
| ID de usuário | Bolha esquerda (outros) ou direita com fundo primary (eu) |

## Formulário de envio

Existe visualmente mas `onSubmit` apenas limpa o draft — não envia para nenhum backend.

## Limitações MVP

- Sem WebSocket / polling — mensagens não atualizam em tempo real
- Envio de mensagens é no-op
- Sem scroll automático para a última mensagem
- Sem paginação de histórico
