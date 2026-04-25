
# CarUni — Caronas recorrentes urbanas

Um produto que parece startup brasileira de verdade: denso de informação como Uber Driver, com mapas protagonistas como no Google Maps, e a calma tipográfica de uma fintech (Nubank/Iti). Tudo mockado para a v1, focando 100% em design e fluxo navegável.

---

## Direção visual

**Identidade**
- Nome com peso editorial: "Car**Uni**" — segunda metade em destaque cromático.
- Tipografia: **Geist Sans** para UI, **Geist Mono** para números (preço, ganhos, horários, placas, %). Mono em números é o truque que dá ar utilitário de cockpit.
- Hierarquia: títulos enxutos, muito uso de *labels* minúsculas em maiúsculas com tracking aberto (estilo painel de bordo), números enormes ao lado.
- Ícones: Lucide, traço fino, sempre acompanhados de microlabel.

**Paleta dual com toggle persistente**

*Modo escuro (default — vibe Uber Driver / cockpit):*
- Fundo grafite quase preto, painéis em camadas de cinza-azulado.
- Acento principal: **verde-lima elétrico** (sinal de "rota ativa", saldo, ganhos).
- Acento secundário: **âmbar quente** (alertas, penalização, SOS quando armado).
- Vermelho profundo só para erro real.

*Modo claro (vibe fintech BR moderna):*
- Off-white levemente quente, cartões brancos com sombra suave de 1px.
- Acento principal: **verde-petróleo profundo**.
- Acento secundário: **laranja queimado/terracota**.
- Linhas de divisão hairline, muito respiro.

Toggle no canto superior do header, com transição suave. Estado salvo em localStorage.

**Princípios de layout**
- Mapa quase sempre visível, ocupando 40–60% da viewport mobile, lateralmente no desktop.
- *Bottom sheet* arrastável sobre o mapa no mobile (padrão Uber/iFood) — três snap points: peek, half, full.
- Cards com bordas finas e cantos sutis (radius 8–12px, nada de bolha).
- Densidade real: muitos micro-dados visíveis sem parecer poluído (ETA, vagas, %presença, R$/vaga ao mesmo tempo).

---

## Arquitetura de rotas

**Marketing (público)**
- `/` — Landing pública

**App demo (entra direto, sem login real)**
- `/app` — Início
- `/app/buscar` — Buscar carona
- `/app/rota/$id` — Detalhe de uma rota recorrente
- `/app/minhas-caronas` — Minhas caronas (motorista + passageiro em abas)
- `/app/carteira` — Carteira e extrato
- `/app/chat/$rotaId` — Chat da comunidade de rota
- `/app/perfil` — Perfil
- `/app/viagem-ativa` — Tela de viagem em andamento (com SOS)

Tab bar inferior fixa no mobile com 4 destinos (Início, Buscar, Minhas, Perfil). Sidebar densa no desktop com os mesmos atalhos + carteira e chat acessíveis.

---

## Telas detalhadas

### 1. Landing `/`
Não é landing genérica de IA. Estrutura:
- **Hero**: frase forte ("A carona que já era sua, agora confiável."), mockup do app flutuando à direita, mapa estilizado de fundo com uma rota desenhada animada entre dois pontos.
- **Faixa de prova social mockada**: "1.842 universitários · 312 rotas ativas em São Paulo, Campinas e BH".
- **Como funciona** em 3 passos com ilustrações tipográficas (sem stock photos): Cadastra rota → Entra na sua vaga fixa → Débito automático.
- **Bloco do motorista** com a métrica-chave gigante: "Recupere até **R$ 612/mês** em combustível" — número em mono, animação de contador.
- **Diferenciais** em grid denso: substituição automática, divisão por vagas, presença vs avaliação, SOS, chat de rota.
- **Comparativo honesto** "WhatsApp vs CarUni" em tabela.
- **CTA duplo**: "Quero pegar carona" / "Quero oferecer carona" — ambos levam ao `/app`.
- Footer minimal.

### 2. Início `/app`
A tela mais densa, no espírito Uber Driver. Cabeçalho com saudação, saldo da carteira em mono e toggle de tema. Abaixo:
- **Card-protagonista "Próxima carona"**: mapa Leaflet pequeno com a rota desenhada, horário em tipografia gigante mono ("07:42"), countdown ("em 23 min"), motorista (foto, nome, selo CNH verificada), 3 outros passageiros com avatar em pilha, valor a debitar, vagas (3/4), botão "Ver detalhes".
- **Faixa horizontal "Esta semana"**: mini cards com cada carona da semana, status (confirmada, esperando substituto, cancelada).
- **Bloco motorista** (se o usuário tem perfil duplo): card com ganhos do mês (mono gigante) + "Combustível recuperado: R$ 287" como destaque âmbar/lima.
- **Reputação em duas barras**: presença 96% e avaliação 4,8 — separadas, conforme pedido.
- **Atalho** para chat da rota com badge de mensagens novas.

### 3. Buscar carona `/app/buscar`
Layout split: mapa Leaflet ocupando metade superior (mobile) ou esquerda (desktop) com pins das rotas disponíveis.
- Inputs no topo: origem, destino, dias da semana (chips), faixa de horário (slider duplo).
- Lista resultados em bottom sheet: cada rota mostra motorista, horário, dias recorrentes, vagas restantes, valor por vaga *agora* e *com vagas cheias* (mostra a economia em tempo real), distância do seu ponto, %presença do motorista, selo CNH.
- Pin selecionado expande mini-card sobre o mapa.
- Filtros laterais: só motoristas verificados, presença >90%, gênero do motorista, ar-condicionado, etc.

### 4. Detalhe da rota `/app/rota/$id`
- Mapa grande com rota completa traçada, paradas marcadas.
- Bloco motorista com selo, presença, avaliação, carro (modelo, cor, placa em mono).
- **Calculadora de divisão ao vivo**: slider visual mostrando "Com 1 passageiro: R$ 18 | Com 4: R$ 6,50". Anima em tempo real.
- Dias e horários recorrentes em grid semanal.
- Lista de passageiros já inscritos (avatares + presença%).
- Política de cancelamento explicada de forma humana.
- CTA: "Assinar esta rota" → modal de confirmação que explica débito automático.

### 5. Minhas caronas `/app/minhas-caronas`
Abas: **Como passageiro** / **Como motorista**.
- Como passageiro: lista de assinaturas ativas, próxima ocorrência de cada uma, status (confirmada, em busca de substituto com badge âmbar pulsante), histórico colapsável.
- Como motorista: rotas que você opera, passageiros inscritos por rota, ganhos previstos da semana, botão "Cancelar próxima ocorrência" com aviso de janela de 1h.
- Banner de **substituição em andamento** quando aplicável: "Buscando outro motorista para sua carona de quinta 07:30… 2 candidatos avaliando" com animação sutil.

### 6. Viagem ativa `/app/viagem-ativa`
- Mapa em tela quase cheia, marcador do carro animado seguindo a rota.
- Header retrátil com motorista, ETA mono gigante, próximo passageiro a embarcar.
- Botão **SOS** discreto no canto: círculo com ícone de escudo. Ao **segurar** (1.5s), barra de progresso preenche, dispara animação âmbar pulsante e modal "Localização enviada para Maria (mãe) via WhatsApp" — tudo mockado.
- Atalho para o chat da rota.

### 7. Carteira `/app/carteira`
- Saldo gigante em mono no topo, botão "Adicionar saldo" (Pix mockado).
- Cards de resumo: gasto no mês, ganhos no mês, economia vs Uber comum.
- Extrato com transações categorizadas (carona, recarga, penalização, repasse), filtros por mês.
- Bloco "Combustível recuperado" para quem é motorista: gráfico simples de barras semanais.

### 8. Chat da rota `/app/chat/$rotaId`
- Cabeçalho com nome da rota, motorista, avatares dos passageiros.
- Lista de mensagens estilo WhatsApp mas mais clean, com timestamps mono.
- Input simples, só texto.
- Mensagens de sistema destacadas ("Lucas avisou: atrasado 5 min", "Carona de amanhã confirmada").

### 9. Perfil `/app/perfil`
- Header com avatar, nome, badges (CNH verificada com selo bem desenhado, "Motorista desde 2024", "Universitário UNICAMP").
- **Duas barras separadas e bem desenhadas**: Presença (com %) e Avaliação (com estrelas) — exatamente como pedido.
- Contato de emergência cadastrado (mockado: "Maria — mãe — (19) ****-1234").
- Histórico resumido: total de caronas, km economizados, CO₂ evitado.
- Configurações: tema, notificações, privacidade.
- Toggle entre "ver como passageiro" e "ver como motorista" (ambos perfis ativos).

---

## Componentes e detalhes que vendem o produto

- **Selo CNH verificada**: ícone custom (escudo + check), sempre em verde-lima/petróleo, com tooltip "Documentos validados em 12/03/25".
- **Calculadora de divisão**: slider de vagas com números animando — efeito de "quanto mais cheio, mais barato/mais ganho".
- **Mapa Leaflet** com tile customizado: usa CartoDB Voyager (light) e CartoDB Dark Matter (dark), trocando junto com o tema. Rotas desenhadas com `Polyline` em verde-lima/petróleo, marcadores customizados (divIcons) com avatar do motorista.
- **Bottom sheet** arrastável (Vaul ou implementação própria) com 3 snap points.
- **Skeleton loaders** densos enquanto "carrega" para reforçar sensação de produto real.
- **Microcopy brasileira** verdadeira, sem traduções genéricas ("Tô a caminho", "Falta 1 vaga", "Bora").

---

## Dados mockados (estruturados, prontos para virar Supabase depois)

Arquivo central `src/data/mock.ts` com:
- 1 usuário atual (perfil duplo, universitário UNICAMP morando em Barão Geraldo).
- 6 rotas recorrentes (Campinas↔Barão, Pinheiros↔USP, Santana↔Paulista, etc.) com coordenadas reais para o Leaflet renderizar bonito.
- 12 motoristas e 25 passageiros com nomes brasileiros realistas, presença e avaliação variadas.
- Transações de carteira dos últimos 60 dias.
- Mensagens de chat de uma rota.
- Próxima carona "em 23 min" sempre relativa ao now.

---

## Stack e implementação

- TanStack Start (rotas em `src/routes/`).
- Tailwind v4 + tokens semânticos no `styles.css` (definir paletas claro/escuro completas em oklch).
- Leaflet + react-leaflet, sem token, tiles CartoDB.
- Componentes shadcn já instalados; adicionar Vaul para bottom sheet.
- Tema persistido via `next-themes`-like simples em context (sem dependência extra).
- Sem Supabase real nesta v1 — toda a camada de dados em memória, mas tipada e organizada por domínio (rotas, usuários, transações, chat) para plugar backend depois sem reescrever telas.

---

## Fora do escopo desta v1
- Login real, cadastro de CNH, validação, pagamentos reais.
- Push notifications, envio real de WhatsApp no SOS.
- Algoritmo real de substituição (será visualmente simulado).
- Chat em tempo real (apenas mensagens estáticas + uma "digitando…" animada).

Tudo isso fica desenhado e navegável; quando você quiser ligar ao Supabase, a estrutura de dados já estará no formato certo.
