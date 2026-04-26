import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Users, ShieldCheck, MessageCircle, Navigation, Search, Car, TrendingUp, CalendarCheck, AlertCircle, MapPin, ArrowRight } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { Avatar, CnhBadge, StarRating } from "@/components/Brand";
import { Drawer } from "vaul";
import {
  proximaCarona,
  semanaCaronas,
  eu,
  formatBRL,
} from "@/data/mock";

export const Route = createFileRoute("/app/passageiro")({
  head: () => ({ meta: [{ title: "CarUni — Painel do Passageiro" }] }),
  component: PassageiroHome,
});

function PassageiroHome() {
  const [mounted, setMounted] = React.useState(false);
  const prox = proximaCarona();
  const motorista = prox.motorista;
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-[64px] top-[56px] lg:bottom-0 lg:left-60 lg:top-0 z-0 bg-background">
        <RouteMap
          path={prox.rota.caminho}
          origin={prox.rota.origem.coord}
          destination={prox.rota.destino.coord}
          height="100%"
          className="h-full w-full"
        />

        {/* OVERLAY DESKTOP */}
        <div className="hidden lg:block absolute top-6 left-6 z-20 w-[420px] max-h-[calc(100vh-3rem)] overflow-y-auto rounded-3xl bg-background/95 backdrop-blur-3xl shadow-2xl border border-border/60 pointer-events-auto custom-scrollbar">
          <div className="p-6">
            <PassageiroContent prox={prox} motorista={motorista} />
          </div>
        </div>

        {/* OVERLAY MOBILE */}
        <div className="lg:hidden absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto rounded-full bg-background/85 px-4 py-2 backdrop-blur-xl shadow-lg border border-border/50">
            <span className="text-xs font-semibold text-foreground">Olá, {eu.nome.split(" ")[0]}!</span>
          </div>
          <Link to="/app/buscar" className="pointer-events-auto h-10 w-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105">
             <Search size={18} />
          </Link>
        </div>
      </div>

      <div className="lg:hidden">
        <Drawer.Root open={true} dismissible={false} modal={false} snapPoints={[0.4, 0.85]}>
          <Drawer.Content className="fixed bottom-[64px] left-0 right-0 z-20 flex h-full max-h-[90vh] flex-col rounded-t-3xl bg-background/95 backdrop-blur-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.15)] border border-border/50 outline-none">
            <div className="mx-auto mt-3 h-1.5 w-12 flex-shrink-0 rounded-full bg-foreground/15" />
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-10">
              <PassageiroContent prox={prox} motorista={motorista} />
            </div>
          </Drawer.Content>
        </Drawer.Root>
      </div>
    </>
  );
}

function PassageiroContent({ prox, motorista }: { prox: any, motorista: any }) {
  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Sua próxima carona</h2>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-warn animate-pulse">
            <Clock size={12} /> em {prox.minutosFaltando} min
          </span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface/50 p-4 shadow-sm">
           <div className="flex items-center gap-3 mb-4">
            <Avatar name={motorista.nome} color={motorista.cor} size={40} iniciais={motorista.iniciais} />
            <div>
              <p className="text-sm font-bold text-foreground">{motorista.nome}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Car size={10}/> {motorista.carro.modelo} · {motorista.carro.placa}</p>
            </div>
            <div className="ml-auto text-right">
              <StarRating value={motorista.avaliacao} />
            </div>
          </div>
          
          <div className="space-y-2 border-t border-border/50 pt-4">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-primary mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-foreground">{prox.rota.origem.label}</p>
                <p className="text-[10px] text-muted-foreground">Embarque às {prox.rota.horarioIda}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link to="/app/viagem-ativa" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
            <Navigation size={18} /> Acompanhar
          </Link>
          <Link to="/app/chat/$rotaId" params={{ rotaId: prox.rota.id }} className="h-12 w-12 flex items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-surface-2 transition-all">
            <MessageCircle size={20} />
          </Link>
        </div>
      </section>

      <section className="pt-4 border-t border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Sua agenda semanal</h3>
          <Link to="/app/minhas-caronas" className="text-[11px] font-semibold text-primary">Ver tudo</Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {semanaCaronas.map((c) => (
            <div key={c.data} className={`flex min-w-[70px] flex-col items-center rounded-xl border p-3 ${c.status === 'feita' ? 'bg-surface-2 opacity-50' : 'bg-surface border-primary/20'}`}>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{c.dia}</span>
              <span className="num text-xs font-bold text-foreground mt-1">{c.data}</span>
              {c.status === 'substituto' && <AlertCircle size={10} className="text-warn mt-1" />}
            </div>
          ))}
        </div>
      </section>

      <Link to="/app/buscar" className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-4 group">
        <div>
          <p className="text-sm font-bold text-primary">Buscar nova rota</p>
          <p className="text-[10px] text-primary/70">Encontre caronas para outros horários</p>
        </div>
        <ArrowRight size={18} className="text-primary transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
