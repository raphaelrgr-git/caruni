import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Users, ShieldCheck, ArrowRight, MessageCircle, Fuel, TrendingUp, CalendarCheck, AlertCircle, MapPin, Navigation, Search, Car, Info } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { Avatar, CnhBadge, PresenceBar, StarRating } from "@/components/Brand";
import {
  proximaCarona,
  semanaCaronas,
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
  const [mounted, setMounted] = React.useState(false);
  const [prox, setProx] = React.useState(() => proximaCarona());
  
  React.useEffect(() => {
    setProx(proximaCarona());
    setMounted(true);
  }, []);
  
  const motorista = prox.motorista;

  return (
    <div className="mx-auto max-w-6xl p-5 md:p-8 space-y-8 pb-24 lg:pb-12">
      {/* HEADER */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bom dia, {eu.nome.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui está o resumo das suas caronas e ganhos.
          </p>
        </div>
        <Link
          to="/app/buscar"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Search size={16} /> Buscar Carona
        </Link>
      </header>

      {/* MAIN GRID */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Próxima Carona & Semana */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Card: Próxima Carona */}
          <section className="rounded-xl border border-border bg-surface p-5 sm:p-7 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Próxima Carona</h2>
                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin size={14} className="text-primary" />
                  {prox.rota.origem.label.split('·')[0]} → {prox.rota.destino.label.split('·')[0]}
                </div>
              </div>
              <div className="text-right">
                <p className="num text-2xl font-bold text-foreground sm:text-3xl" suppressHydrationWarning>
                  {mounted ? formatHora(prox.horario) : "--:--"}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-warn/15 px-2 py-0.5 text-[11px] font-medium text-warn" suppressHydrationWarning>
                  <Clock size={11} /> em {mounted ? prox.minutosFaltando : 23} min
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 rounded-lg border border-border bg-background p-4 mb-6">
              <div className="flex items-center gap-3">
                <Avatar name={motorista.nome} color={motorista.cor} size={42} iniciais={motorista.iniciais} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{motorista.nome}</span>
                    {motorista.cnhVerificada && <CnhBadge />}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <StarRating value={motorista.avaliacao} />
                    {motorista.carro && <span className="flex items-center gap-1 num"><Car size={12}/> {motorista.carro.placa}</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 sm:justify-end border-t border-border pt-4 sm:pt-0 sm:border-0">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Vagas</p>
                  <p className="num mt-0.5 text-base font-semibold text-foreground">
                    {prox.ocupadas}<span className="text-muted-foreground text-sm font-normal">/{prox.rota.vagas}</span>
                  </p>
                </div>
                <div className="h-8 w-px bg-border hidden sm:block"></div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Valor Fixo</p>
                  <p className="num mt-0.5 text-base font-semibold text-primary">{formatBRL(prox.valor)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to="/app/viagem-ativa"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Navigation size={16} /> Iniciar
              </Link>
              <Link
                to="/app/chat/$rotaId"
                params={{ rotaId: prox.rota.id }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface py-2.5 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
              >
                <MessageCircle size={16} /> Chat da Rota
                <span className="num flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
              </Link>
            </div>
          </section>

          {/* Card: Esta semana */}
          <section className="rounded-xl border border-border bg-surface p-5 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground">Sua Semana</h3>
              <Link to="/app/minhas-caronas" className="text-xs text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {semanaCaronas.map((c) => {
                const isSub = c.status === "substituto";
                const isFeita = c.status === "feita";
                const tone = isFeita
                    ? "border-border text-muted-foreground bg-background"
                    : isSub
                    ? "border-warn/30 bg-warn/5 text-warn"
                    : "border-primary/30 bg-primary/5 text-primary";
                
                return (
                  <div key={c.data} className={`rounded-lg border p-3 ${tone}`}>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[10px] font-medium uppercase">{c.dia}</span>
                      <span className="num text-[10px] opacity-70">{c.data}</span>
                    </div>
                    <div className="flex items-center text-[10px] font-medium">
                      {isSub ? (
                        <span className="inline-flex items-center gap-1"><AlertCircle size={12} /> Substituto</span>
                      ) : isFeita ? (
                        <span className="inline-flex items-center gap-1"><CalendarCheck size={12} /> Concluída</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Clock size={12} /> Agendada</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Map, Reputação, Ganhos */}
        <aside className="flex flex-col gap-6">
          
          {/* Card: Mapa Contido */}
          <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col h-[280px]">
            <div className="px-4 py-3 border-b border-border bg-surface flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Trajeto Ao Vivo</span>
              <span className="text-xs text-muted-foreground num">{prox.rota.km} km</span>
            </div>
            <div className="flex-1 relative bg-surface-2">
              <RouteMap
                path={prox.rota.caminho}
                origin={prox.rota.origem.coord}
                destination={prox.rota.destino.coord}
                height="100%"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Card: Ganhos */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ganhos no Mês</p>
                <p className="num mt-1 text-2xl font-bold text-foreground">{formatBRL(ganhosMes.total)}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[11px] font-medium text-success">
                <TrendingUp size={12} /> +12%
              </span>
            </div>
            
            {/* Mini gráfico */}
            <div className="mt-5 flex items-end gap-2 h-14">
              {ganhosMes.semanal.map((v, i) => {
                const max = Math.max(...ganhosMes.semanal);
                const h = (v / max) * 100;
                return (
                  <div key={i} className="flex h-full flex-1 flex-col justify-end gap-1">
                    <div className="w-full rounded-sm bg-primary/40 transition-all hover:bg-primary" style={{ height: `${h}%` }} />
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Fuel size={14} className="text-primary" />
                Gasolina poupada
              </div>
              <span className="num text-sm font-semibold text-foreground">{formatBRL(ganhosMes.combustivelRecuperado)}</span>
            </div>
          </div>

          {/* Card: Reputação */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Presença</span>
                <span className="num text-xs font-bold text-foreground">{eu.presenca}%</span>
              </div>
              <PresenceBar value={eu.presenca} label={false} />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avaliação</span>
                <StarRating value={eu.avaliacao} />
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full bg-warn" style={{ width: `${(eu.avaliacao / 5) * 100}%` }} />
              </div>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}
