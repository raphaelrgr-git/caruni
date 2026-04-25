import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Users, ShieldCheck, ArrowRight, MessageCircle, Fuel, TrendingUp, CalendarCheck, AlertCircle, MapPin, Navigation, Search, Car, Info } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { Avatar, CnhBadge, PresenceBar, StarRating } from "@/components/Brand";
import { Drawer } from "vaul";
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

  if (!mounted) return null;

  return (
    <>
      {/* FULL SCREEN MAP */}
      <div className="fixed inset-x-0 bottom-[64px] top-[56px] lg:bottom-0 lg:left-60 lg:top-0 z-0 bg-background">
        <RouteMap
          path={prox.rota.caminho}
          origin={prox.rota.origem.coord}
          destination={prox.rota.destino.coord}
          height="100%"
          className="h-full w-full"
        />

        {/* MOBILE TOP OVERLAY */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none lg:hidden">
          <div className="pointer-events-auto rounded-full bg-background/85 px-4 py-2 backdrop-blur-xl shadow-lg border border-border/50">
            <span className="text-xs font-semibold text-foreground">Pronto, {eu.nome.split(" ")[0]}?</span>
          </div>
          <Link to="/app/buscar" className="pointer-events-auto h-10 w-10 flex items-center justify-center rounded-full bg-background/85 backdrop-blur-xl shadow-lg border border-border/50 text-foreground transition-transform hover:scale-105">
             <Search size={16} />
          </Link>
        </div>

        {/* DESKTOP SIDE PANEL (Google Maps Web Style) */}
        <div className="hidden lg:block absolute top-6 left-6 z-20 w-[420px] max-h-[calc(100vh-3rem)] overflow-y-auto rounded-3xl bg-background/95 backdrop-blur-3xl shadow-2xl border border-border/60 pointer-events-auto custom-scrollbar">
          <div className="p-6">
            <AppHomeContent prox={prox} motorista={motorista} />
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET (Uber Style) */}
      <div className="lg:hidden">
        <Drawer.Root open={true} dismissible={false} modal={false} snapPoints={[0.33, 0.85]}>
          <Drawer.Overlay className="fixed inset-0 z-10 bg-transparent pointer-events-none" />
          <Drawer.Content className="fixed bottom-[64px] left-0 right-0 z-20 flex h-full max-h-[90vh] flex-col rounded-t-3xl bg-background/95 backdrop-blur-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.15)] border border-border/50 outline-none">
            <div className="mx-auto mt-3 h-1.5 w-12 flex-shrink-0 rounded-full bg-foreground/15" />
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-10">
              <AppHomeContent prox={prox} motorista={motorista} />
            </div>
          </Drawer.Content>
        </Drawer.Root>
      </div>
    </>
  );
}

// CONTEÚDO REUTILIZÁVEL (Painel Desktop ou Gaveta Mobile)
function AppHomeContent({ prox, motorista }: { prox: any, motorista: any }) {
  return (
    <div className="space-y-6">
      
      {/* Próxima Carona Hero */}
      <section>
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-ring" />
              Sua Carona
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warn">
              <Clock size={12} /> {prox.minutosFaltando} min
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground leading-tight mt-1">{prox.rota.nome}</h2>
          <p className="text-xs text-muted-foreground">{prox.rota.origem.label.split('·')[0]} → {prox.rota.destino.label.split('·')[0]}</p>
        </div>

        {/* Info Motorista & Vagas */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-surface/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={motorista.nome} color={motorista.cor} size={42} iniciais={motorista.iniciais} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{motorista.nome}</span>
                  {motorista.cnhVerificada && <CnhBadge />}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <StarRating value={motorista.avaliacao} />
                  <span>·</span>
                  {motorista.carro && <span className="flex items-center gap-1 num"><Car size={12}/> {motorista.carro.placa}</span>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vagas ocupadas</p>
              <p className="num mt-0.5 text-base font-bold text-foreground">
                {prox.ocupadas}<span className="text-muted-foreground text-sm font-medium">/{prox.rota.vagas}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valor Fixo</p>
              <p className="num mt-0.5 text-lg font-bold text-primary">{formatBRL(prox.valor)}</p>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mt-4 flex gap-3">
          <Link
            to="/app/viagem-ativa"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-bold text-background shadow-md hover:bg-foreground/90 transition-transform active:scale-95"
          >
            <Navigation size={18} /> Iniciar
          </Link>
          <Link
            to="/app/chat/$rotaId"
            params={{ rotaId: prox.rota.id }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-bold text-foreground shadow-sm hover:bg-surface-2 transition-transform active:scale-95"
          >
            <MessageCircle size={18} /> Chat <span className="num flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">2</span>
          </Link>
        </div>
      </section>

      {/* Mini Resumo da Semana */}
      <section className="pt-4 border-t border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-bold text-foreground">Sua Semana</h3>
          <Link to="/app/minhas-caronas" className="text-[11px] font-medium text-primary hover:underline">Ver todas</Link>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {semanaCaronas.map((c) => {
            const isSub = c.status === "substituto";
            const isFeita = c.status === "feita";
            const tone = isFeita
                ? "border-border/60 text-muted-foreground bg-transparent"
                : isSub
                ? "border-warn/40 bg-warn/10 text-warn"
                : "border-primary/40 bg-primary/10 text-primary";
            
            return (
              <div key={c.data} className={`flex flex-col items-center justify-center rounded-lg border py-2 ${tone}`}>
                <span className="text-[9px] font-bold uppercase tracking-wide">{c.dia}</span>
                <span className="num text-[10px] mt-0.5 opacity-80">{c.data}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mini Resumo Ganhos (se for motorista da rota, senão oculta ou mostra gasto) */}
      <section className="pt-4 border-t border-border/50">
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface/30 p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ganhos em Abril</p>
            <p className="num mt-0.5 text-xl font-bold text-foreground">{formatBRL(ganhosMes.total)}</p>
          </div>
          <div className="text-right">
             <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-[10px] font-bold text-success">
              <TrendingUp size={12} /> +12%
            </span>
            <p className="text-[9px] text-muted-foreground mt-1 text-right">vs último mês</p>
          </div>
        </div>
      </section>

    </div>
  );
}
