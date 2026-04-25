import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Users, ShieldCheck, ArrowRight, MessageCircle, Fuel, TrendingUp, CalendarCheck, AlertCircle, MapPin, ChevronUp, Navigation, Search } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { Avatar, CnhBadge, PresenceBar, StarRating } from "@/components/Brand";
import { Drawer } from "vaul";
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
  const [mounted, setMounted] = React.useState(false);
  const [prox, setProx] = React.useState(() => proximaCarona());
  
  React.useEffect(() => {
    setProx(proximaCarona());
    setMounted(true);
  }, []);
  
  const motorista = prox.motorista;
  const inscritos = prox.rota.inscritos.map(getPessoa).filter((p) => p.id !== eu.id);

  return (
    <div className="fixed inset-x-0 bottom-[64px] top-[54px] lg:bottom-0 lg:left-60 lg:top-0 overflow-hidden bg-background">
      {/* MAPA FULL SCREEN */}
      <div className="absolute inset-0 z-0">
        <RouteMap
          path={prox.rota.caminho}
          origin={prox.rota.origem.coord}
          destination={prox.rota.destino.coord}
          height="100%"
          className="h-full w-full"
        />
        
        {/* Overlay gradient top for better text visibility */}
        <div className="absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-background/80 to-transparent pointer-events-none" />
      </div>

      {/* ELEMENTOS FLUTUANTES (HUD) */}
      <div className="absolute inset-x-0 top-0 z-20 flex flex-col gap-4 p-4 lg:p-6 pointer-events-none">
        
        {/* Saudação (Glassmorphism) */}
        <div className="self-start rounded-full border border-border/50 bg-background/60 px-4 py-2 backdrop-blur-md shadow-sm pointer-events-auto">
          <p className="label-cockpit text-[10px] text-muted-foreground">Bom dia</p>
          <h1 className="text-sm font-semibold tracking-tight text-foreground">
            Pronto pra rodar, {eu.nome.split(" ")[0]}?
          </h1>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Quick Actions laterais */}
        <Link
          to="/app/buscar"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background/80 text-foreground backdrop-blur-md shadow-lg transition-transform hover:scale-105"
          aria-label="Buscar Carona"
        >
          <Search size={18} />
        </Link>
      </div>

      {/* BOTTOM SHEET (GAVETA) COM DETALHES DA CARONA */}
      <Drawer.Root snapPoints={[0.3, 0.8]} activeSnapPoint={0.3} open={true} dismissible={false} modal={false}>
        <Drawer.Portal>
          <Drawer.Content className="fixed bottom-[64px] lg:bottom-0 left-0 lg:left-60 right-0 z-30 flex flex-col rounded-t-[20px] border-t border-border bg-surface shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
            <div className="mx-auto mt-3 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
            
            <div className="flex-1 overflow-y-auto px-4 py-5 lg:px-8">
              <div className="mx-auto max-w-3xl">
                
                {/* Cabeçalho da Gaveta */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="label-cockpit text-[10px] text-primary pulse-ring px-2 py-0.5 rounded-full bg-primary/10 inline-flex mb-2">Próxima Carona</p>
                    <h2 className="text-xl font-semibold text-foreground leading-tight">{prox.rota.nome}</h2>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin size={12} />
                      {prox.rota.origem.label.split('·')[0]} → {prox.rota.destino.label.split('·')[0]}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="num text-3xl font-semibold leading-none text-foreground" suppressHydrationWarning>
                      {mounted ? formatHora(prox.horario) : "--:--"}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-warn/15 px-2 py-0.5 text-[11px] font-medium text-warn" suppressHydrationWarning>
                      <Clock size={11} /> em {mounted ? prox.minutosFaltando : 23} min
                    </p>
                  </div>
                </div>

                {/* Motorista e Vagas */}
                <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/50 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={motorista.nome} color={motorista.cor} size={46} iniciais={motorista.iniciais} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{motorista.nome}</span>
                        {motorista.cnhVerificada && <CnhBadge />}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <StarRating value={motorista.avaliacao} />
                        <span className="num hidden sm:inline">{motorista.carro?.placa}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                     <p className="label-cockpit text-[9px] text-muted-foreground">Vagas</p>
                     <p className="num mt-0.5 text-lg font-semibold text-foreground">
                        {prox.ocupadas}<span className="text-muted-foreground text-sm">/{prox.rota.vagas}</span>
                     </p>
                  </div>
                </div>

                {/* Botões de Ação Principais */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link
                    to="/app/viagem-ativa"
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02]"
                  >
                    <Navigation size={16} /> Ver no Mapa
                  </Link>
                  <Link
                    to="/app/chat/$rotaId"
                    params={{ rotaId: prox.rota.id }}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
                  >
                    <MessageCircle size={16} /> Chat da Rota
                  </Link>
                </div>
                
                {/* Área Expansível (Visível no SnapPoint 0.8) */}
                <div className="mt-8 space-y-6 border-t border-border pt-6">
                   <h3 className="text-sm font-semibold text-foreground">Resumo da Semana</h3>
                   <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {semanaCaronas.map((c) => {
                        const tone = c.status === "feita" ? "border-border text-muted-foreground"
                                   : c.status === "substituto" ? "border-warn/40 bg-warn/5 text-warn"
                                   : "border-primary/40 bg-primary/5 text-foreground";
                        return (
                          <div key={c.data} className={`rounded-lg border p-3 ${tone}`}>
                            <div className="flex items-baseline justify-between">
                              <span className="label-cockpit text-[10px]">{c.dia}</span>
                              <span className="num text-[10px] opacity-80">{c.data}</span>
                            </div>
                            <div className="mt-2 text-[10px] capitalize">
                                {c.status}
                            </div>
                          </div>
                        );
                      })}
                   </div>
                </div>

              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
