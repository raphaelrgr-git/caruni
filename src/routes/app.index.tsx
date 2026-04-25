import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Users, ShieldCheck, ArrowRight, MessageCircle, Fuel, TrendingUp, CalendarCheck, AlertCircle } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { Avatar, CnhBadge, PresenceBar, StarRating } from "@/components/Brand";
import {
  proximaCarona,
  semanaCaronas,
  getRota,
  getPessoa,
  ganhosMes,
  eu,
  formatBRL,
  formatHora,
  pessoas,
} from "@/data/mock";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "CarUni — Início" },
      { name: "description", content: "Sua próxima carona, ganhos do mês e reputação no painel CarUni." },
    ],
  }),
  component: AppHome,
});

function AppHome() {
  // proximaCarona() depends on Date.now() — defer to client to avoid SSR/CSR mismatch
  const [mounted, setMounted] = React.useState(false);
  const [prox, setProx] = React.useState(() => proximaCarona());
  React.useEffect(() => {
    setProx(proximaCarona());
    setMounted(true);
  }, []);
  const motorista = prox.motorista;
  const inscritos = prox.rota.inscritos.map(getPessoa).filter((p) => p.id !== eu.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
      {/* Saudação */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="label-cockpit text-[10px] text-muted-foreground">Bom dia</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
            Pronto pra rodar, {eu.nome.split(" ")[0]}?
          </h1>
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <span className="label-cockpit text-[10px] text-muted-foreground">Hoje</span>
          <span className="num text-sm text-foreground" suppressHydrationWarning>
            {mounted ? new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }) : ""}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Próxima carona — protagonista */}
        <section className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <RouteMap
              path={prox.rota.caminho}
              origin={prox.rota.origem.coord}
              destination={prox.rota.destino.coord}
              height={260}
            />
            <div className="border-t border-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="label-cockpit text-[10px] text-muted-foreground">Próxima carona</p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">{prox.rota.nome}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {prox.rota.origem.label} → {prox.rota.destino.label}
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-3xl font-semibold leading-none text-foreground lg:text-4xl" suppressHydrationWarning>
                    {mounted ? formatHora(prox.horario) : "--:--"}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary" suppressHydrationWarning>
                    <Clock size={11} /> em {mounted ? prox.minutosFaltando : 23} min
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={motorista.nome} color={motorista.cor} size={42} iniciais={motorista.iniciais} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{motorista.nome}</span>
                      {motorista.cnhVerificada && <CnhBadge />}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <StarRating value={motorista.avaliacao} />
                      <span className="num">{motorista.presenca}% presença</span>
                      {motorista.carro && <span className="num hidden sm:inline">{motorista.carro.placa}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {inscritos.slice(0, 3).map((p) => (
                    <Avatar key={p.id} name={p.nome} color={p.cor} size={28} iniciais={p.iniciais} />
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
                <div>
                  <p className="label-cockpit text-[9px] text-muted-foreground">Vagas</p>
                  <p className="num mt-0.5 text-base font-semibold text-foreground">
                    {prox.ocupadas}<span className="text-muted-foreground">/{prox.rota.vagas}</span>
                  </p>
                </div>
                <div>
                  <p className="label-cockpit text-[9px] text-muted-foreground">A debitar</p>
                  <p className="num mt-0.5 text-base font-semibold text-foreground">{formatBRL(prox.valor)}</p>
                </div>
                <div>
                  <p className="label-cockpit text-[9px] text-muted-foreground">Distância</p>
                  <p className="num mt-0.5 text-base font-semibold text-foreground">{prox.rota.km} km</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to="/app/viagem-ativa"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Ver viagem ativa <ArrowRight size={13} />
                </Link>
                <Link
                  to="/app/rota/$id"
                  params={{ id: prox.rota.id }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
                >
                  Detalhes da rota
                </Link>
                <Link
                  to="/app/chat/$rotaId"
                  params={{ rotaId: prox.rota.id }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
                >
                  <MessageCircle size={13} /> Chat <span className="num rounded bg-warn/20 px-1 text-[10px] text-warn">2</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Coluna lateral */}
        <aside className="flex flex-col gap-4">
          {/* Reputação */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="label-cockpit text-[10px] text-muted-foreground">Sua reputação</p>
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Presença</span>
                  <span className="num text-xs font-medium text-foreground">{eu.presenca}%</span>
                </div>
                <PresenceBar value={eu.presenca} label={false} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Avaliação</span>
                  <StarRating value={eu.avaliacao} />
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full bg-warn" style={{ width: `${(eu.avaliacao / 5) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-surface-2/60 px-3 py-2 text-[11px] text-muted-foreground">
              <ShieldCheck size={13} className="text-success" />
              CNH validada · 12/03/25
            </div>
          </div>

          {/* Ganhos do mês */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="label-cockpit text-[10px] text-muted-foreground">Ganhos · este mês</p>
                <p className="num mt-1 text-3xl font-semibold text-foreground">{formatBRL(ganhosMes.total)}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                <TrendingUp size={11} /> +12%
              </span>
            </div>
            <div className="mt-4 flex items-end gap-1.5">
              {ganhosMes.semanal.map((v, i) => {
                const max = Math.max(...ganhosMes.semanal);
                const h = (v / max) * 56;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-sm bg-primary/70" style={{ height: `${h}px` }} />
                    <span className="text-[9px] text-muted-foreground">S{i + 1}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-surface-2/60 px-3 py-2 text-[11px]">
              <Fuel size={13} className="text-primary" />
              <span className="text-muted-foreground">Combustível recuperado</span>
              <span className="num ml-auto font-medium text-foreground">{formatBRL(ganhosMes.combustivelRecuperado)}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Esta semana */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Esta semana</h3>
          <Link to="/app/minhas-caronas" className="text-[11px] text-muted-foreground hover:text-foreground">
            Ver todas →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {semanaCaronas.map((c) => {
            const r = getRota(c.rotaId);
            const tone =
              c.status === "feita"
                ? "border-border text-muted-foreground"
                : c.status === "substituto"
                ? "border-warn/40 bg-warn/5 text-warn"
                : "border-primary/40 bg-primary/5 text-foreground";
            return (
              <div key={c.data} className={`rounded-lg border p-3 ${tone}`}>
                <div className="flex items-baseline justify-between">
                  <span className="label-cockpit text-[10px]">{c.dia}</span>
                  <span className="num text-[10px] opacity-80">{c.data}</span>
                </div>
                <p className="num mt-1 text-base font-semibold text-foreground">{r?.horarioIda}</p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{r?.nome}</p>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="capitalize">
                    {c.status === "substituto" ? (
                      <span className="inline-flex items-center gap-1"><AlertCircle size={10} /> substituto</span>
                    ) : c.status === "feita" ? (
                      <span className="inline-flex items-center gap-1"><CalendarCheck size={10} /> feita</span>
                    ) : (
                      <span className="inline-flex items-center gap-1"><Clock size={10} /> agendada</span>
                    )}
                  </span>
                  <span className="num font-medium text-foreground">{formatBRL(c.valor)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comunidade da rota */}
      <section className="mt-8">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-cockpit text-[10px] text-muted-foreground">Comunidade da rota</p>
              <p className="mt-1 text-sm font-semibold text-foreground">Centro → UDESC · 7 universitários</p>
            </div>
            <Link to="/app/chat/$rotaId" params={{ rotaId: "r1" }} className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
              Abrir chat <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-3 flex -space-x-2">
            {pessoas.slice(1, 7).map((p) => (
              <Avatar key={p.id} name={p.nome} color={p.cor} size={30} iniciais={p.iniciais} />
            ))}
            <span className="ml-3 inline-flex items-center text-[11px] text-muted-foreground">+ você</span>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Users size={12} /> 2 mensagens novas hoje
          </p>
        </div>
      </section>
    </div>
  );
}
