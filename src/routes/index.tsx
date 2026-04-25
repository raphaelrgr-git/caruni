import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bus,
  Car,
  CheckCircle2,
  Clock3,
  MapPinned,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  WalletCards,
} from "lucide-react";
import { BrandLogo } from "@/components/Brand";
import { RouteMap } from "@/components/RouteMap";
import { useTheme } from "@/lib/theme";

const plans = [
  {
    name: "Calouro",
    price: "R$20/semana",
    trips: "5 viagens",
    unit: "R$4 por trajeto",
    extra: "Extra: R$5",
    emphasis: "Resolve a semana curta sem depender de ônibus lotado.",
    recommended: false,
  },
  {
    name: "Veterano",
    price: "R$35/semana",
    trips: "10 viagens",
    unit: "R$3,50 por trajeto",
    extra: "Extra: R$4",
    emphasis: "Prioridade em rotas cheias e rotina garantida de segunda a sexta.",
    recommended: true,
  },
] as const;

const comparison = [
  {
    label: "Preço médio por trajeto",
    caruni: "R$3,50 a R$4",
    bus: "R$6,50",
    uber: "R$18 a R$35",
    own: "R$12 a R$20 + estacionamento",
  },
  {
    label: "Previsibilidade",
    caruni: "Alta",
    bus: "Média",
    uber: "Média",
    own: "Alta",
  },
  {
    label: "Rota fixa para universidade",
    caruni: "Sim",
    bus: "Parcial",
    uber: "Não",
    own: "Sim",
  },
  {
    label: "Flexibilidade",
    caruni: "Recorrente + avulso",
    bus: "Baixa",
    uber: "Alta",
    own: "Alta",
  },
  {
    label: "Emissão de carbono",
    caruni: "Baixa por pessoa",
    bus: "Média",
    uber: "Alta",
    own: "Alta",
  },
  {
    label: "Socialização e networking",
    caruni: "Alta",
    bus: "Baixa",
    uber: "Quase nula",
    own: "Nula",
  },
  {
    label: "Desvantagens",
    caruni: "Precisa aderir à rotina",
    bus: "Demora e lotação",
    uber: "Preço instável",
    own: "Custo total alto",
  },
] as const;

const mapPath: [number, number][] = [
  [-26.3045, -48.8487],
  [-26.3026, -48.8533],
  [-26.3008, -48.8579],
  [-26.2985, -48.8636],
  [-26.2958, -48.8704],
  [-26.2906, -48.8793],
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CarUni — Rotina universitária previsível sem pagar Uber todo dia" },
      {
        name: "description",
        content:
          "Planos semanais de carona universitária, rota real no mapa, economia contra ônibus e Uber/99 e uma rede confiável para quem chegou agora na cidade.",
      },
    ],
  }),
  component: Landing,
});

function ThemeToggleLanding() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-foreground hover:bg-surface-2"
      aria-label="Alternar tema"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/" className="text-foreground">
            <BrandLogo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#planos" className="hover:text-foreground">
              Planos
            </a>
            <a href="#comparativo" className="hover:text-foreground">
              Comparativo
            </a>
            <a href="#impacto" className="hover:text-foreground">
              Impacto
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggleLanding />
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Abrir app <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:py-18 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="py-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-ring" />
              Joinville · rotas recorrentes para universidade
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
              Pare de perder tempo com grupo caótico, ônibus imprevisível e Uber caro todo dia.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              O CarUni vende rotina previsível. Você escolhe um plano semanal, entra em uma rota
              recorrente real, trava seus créditos e acompanha no mapa o trajeto que vai fazer de
              fato até a universidade.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Quero garantir meus trajetos
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/app/criar-rota"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground hover:bg-surface-2"
              >
                Quero oferecer rota
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Metric
                icon={<WalletCards size={15} />}
                label="Economia semanal"
                value="até R$145"
                sub="vs Uber/99 em 10 trajetos"
              />
              <Metric
                icon={<Clock3 size={15} />}
                label="Rotina"
                value="2 cliques"
                sub="para reservar a semana"
              />
              <Metric
                icon={<ShieldCheck size={15} />}
                label="Confiança"
                value="Histórico real"
                sub="avaliação, presença e cancelamentos"
              />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <RouteMap
                path={mapPath}
                origin={mapPath[0]}
                destination={mapPath[mapPath.length - 1]}
                height={280}
                interactive={false}
              />
              <div className="grid gap-4 border-t border-border p-5 sm:grid-cols-2">
                <div>
                  <p className="label-cockpit text-[10px] text-muted-foreground">Plano ativo</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">Veterano</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    10 viagens garantidas, prioridade em rota cheia e extra a R$4.
                  </p>
                </div>
                <div>
                  <p className="label-cockpit text-[10px] text-muted-foreground">
                    Economia acumulada
                  </p>
                  <p className="mt-1 text-lg font-semibold text-primary">R$98 vs ônibus</p>
                  <p className="mt-1 text-sm text-muted-foreground">R$214 vs Uber/99 no mês</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FeatureTile
                icon={<MapPinned size={16} />}
                title="Rota real"
                body="Nada de linha sintética. O trajeto é calculado por API de navegação e salvo com distância e duração reais."
              />
              <FeatureTile
                icon={<Users size={16} />}
                title="Rede da universidade"
                body="Você entra numa rotina com gente do mesmo campus e reduz o isolamento de quem acabou de chegar na cidade."
              />
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-18">
          <div className="max-w-2xl">
            <div className="label-cockpit mb-2">Planos semanais</div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              O produto não vende viagem solta. Vende semana organizada.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-xl border p-6 ${
                  plan.recommended ? "border-primary bg-primary/5" : "border-border bg-background"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.emphasis}</p>
                  </div>
                  {plan.recommended ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground">
                      <Sparkles size={12} /> recomendado
                    </span>
                  ) : null}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <PlanStat label="Preço" value={plan.price} />
                  <PlanStat label="Inclui" value={plan.trips} />
                  <PlanStat label="Custo unitário" value={plan.unit} />
                  <PlanStat label="Viagem extra" value={plan.extra} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="comparativo" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-18">
          <div className="max-w-2xl">
            <div className="label-cockpit mb-2">Comparativo</div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              O que você compra em cada modal de transporte
            </h2>
          </div>
          <div className="mt-8 overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left">
                  <th className="px-5 py-4 font-medium text-muted-foreground">Critério</th>
                  <th className="px-5 py-4 font-medium text-primary">CarUni</th>
                  <th className="px-5 py-4 font-medium">Ônibus</th>
                  <th className="px-5 py-4 font-medium">Uber/99</th>
                  <th className="px-5 py-4 font-medium">Carro sozinho</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <td className="px-5 py-4 text-muted-foreground">{row.label}</td>
                    <td className="px-5 py-4 font-medium text-foreground">{row.caruni}</td>
                    <td className="px-5 py-4">{row.bus}</td>
                    <td className="px-5 py-4">{row.uber}</td>
                    <td className="px-5 py-4">{row.own}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-18 lg:grid-cols-2">
          <div>
            <div className="label-cockpit mb-2">Integração social</div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Para quem não é da cidade, transporte também é porta de entrada.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              O aluno que chega em Joinville normalmente depende de ônibus, favor improvisado ou
              corrida cara. O CarUni coloca essa pessoa numa rotina com veteranos, gente do mesmo
              campus e contatos reais antes mesmo da primeira aula.
            </p>
          </div>
          <div className="grid gap-3">
            <FeatureTile
              icon={<Users size={16} />}
              title="Fazer amigos na prática"
              body="A carona recorrente vira convívio. Você encontra as mesmas pessoas durante a semana, não um motorista aleatório diferente por dia."
            />
            <FeatureTile
              icon={<CheckCircle2 size={16} />}
              title="Histórico e reputação"
              body="Presença, avaliações e cancelamentos aparecem no perfil. Isso aumenta confiança e corta ruído antes de trocar contato pessoal."
            />
            <FeatureTile
              icon={<Bus size={16} />}
              title="Saída do ônibus por necessidade, não por luxo"
              body="O ganho aqui é custo controlado, previsibilidade e menos tempo perdido, não uma promessa vazia de conveniência premium."
            />
          </div>
        </div>
      </section>

      <section id="impacto" className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-18 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="label-cockpit mb-2">Impacto ambiental</div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ocupação melhor do carro reduz custo e emissão por pessoa.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Um carro já vai sair de casa para a universidade. O ganho ambiental do CarUni vem de
              usar melhor esse deslocamento inevitável, reduzindo trajetos vazios e a pressão por
              mais carros individuais no mesmo corredor urbano.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ImpactTile
              icon={<Car size={16} />}
              title="CarUni"
              value="Baixa emissão por aluno"
              body="Quando o mesmo carro leva 3 ou 4 pessoas, o carbono por passageiro cai de forma relevante."
            />
            <ImpactTile
              icon={<Bus size={16} />}
              title="Ônibus"
              value="Bom quando eficiente"
              body="Continua importante, mas perde valor quando a linha é lotada, lenta ou incompatível com a rotina do campus."
            />
            <ImpactTile
              icon={<WalletCards size={16} />}
              title="Uber/99"
              value="Alto custo + alta emissão"
              body="Confortável no curto prazo, mas ruim para rotina diária e pouco eficiente por pessoa."
            />
            <ImpactTile
              icon={<Car size={16} />}
              title="Carro sozinho"
              value="Pior ocupação"
              body="É o cenário menos eficiente economicamente e ambientalmente quando a rota já poderia ser compartilhada."
            />
          </div>
        </div>
      </section>

      <section className="px-5 py-18">
        <div className="mx-auto max-w-4xl rounded-xl border border-border bg-surface px-6 py-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Menos improviso. Mais rotina. Menos gasto por trajeto.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Se o seu deslocamento se repete toda semana, tratar isso como produto recorrente faz
            mais sentido do que depender de tentativa diária.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Ver dashboard
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/app/criar-rota"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-surface-2"
            >
              Publicar rota
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-primary">{icon}</div>
      <p className="mt-4 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function PlanStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function FeatureTile({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-background p-5">
      <div className="text-primary">{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  );
}

function ImpactTile({
  icon,
  title,
  value,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  body: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <div className="text-primary">{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm font-medium text-primary">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  );
}
