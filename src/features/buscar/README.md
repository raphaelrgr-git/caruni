# Feature: Buscar

**Rota:** `/app/buscar`  
**Componente:** `BuscarPage.tsx`

## O que faz

Listagem e filtro de rotas disponíveis em Joinville. O usuário digita origem e destino (texto livre com `<datalist>`) e o mapa Leaflet à esquerda atualiza para a rota selecionada.

## Fluxo

1. Lista todas as rotas do store
2. Filtra pelo texto de origem/destino (substring match no `nome + origem.label + destino.label`)
3. Clique em um card → seleciona a rota e atualiza o mapa
4. Botão "Ver rota" → navega para `/app/rota/$id`

## Dados do store

```ts
const { rotas, activePlan, creditSummary } = useCaruniStore()
```

## Algoritmo de filtro

```ts
const haystack = `${rota.nome} ${rota.origem.label} ${rota.destino.label}`.toLowerCase()
return [origem, destino].every(term => haystack.includes(term.toLowerCase().trim()))
```

Simples substring AND — funciona para MVP, pode ser substituído por fuzzy search em produção.

## Limitações MVP

- Sem paginação (todas as rotas são renderizadas)
- Sem filtro por horário ou dia da semana
- Sem busca por raio geográfico
- Botão "Filtros" é visual apenas (sem funcionalidade)
