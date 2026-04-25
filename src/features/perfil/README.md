# Feature: Perfil

**Rota:** `/app/perfil`  
**Componente:** `PerfilPage.tsx`

## O que faz

Visualização e edição dos dados do usuário logado, informações do veículo, contato de emergência e estatísticas acumuladas.

## Seções

1. **Header** — avatar, nome, badges (email verificado, CNH, "Motorista desde")
2. **Presença e avaliação** — barras de progresso com valores de `mock.ts`
3. **Autenticação MVP** — formulário de nome/email/curso/universidade (local apenas, não persiste no backend)
4. **Veículo** — modelo, cor, placa de `eu.carro`
5. **Contato de emergência** — nome, relação, telefone de `contatoEmergencia` (usado pelo SOS)
6. **Estatísticas** — Caronas, CO₂ evitado, Km economizados (valores fixos no MVP)

## Dados

```ts
const { resetDemo } = useCaruniStore()
// eu, contatoEmergencia importados de @/data/mock
```

## Botão "Resetar demo local"

Chama `resetDemo()` que recria o estado inicial e sobrescreve o localStorage. Útil para demonstrações e testes manuais.

## Limitações MVP

- Edições no formulário são locais (`useState`) e não persistem além do reload
- Estatísticas são hardcoded (128 caronas, 84 kg CO₂, 612 km)
- Sem upload de foto de perfil
- Sem verificação real de CNH ou email
