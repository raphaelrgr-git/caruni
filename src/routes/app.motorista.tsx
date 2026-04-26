import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, Users, PlusCircle, MessageCircle, Navigation, Calendar, Wallet, ChevronRight, Star } from "lucide-react";
import { rotas, getPessoa, formatBRL, ganhosMes, eu, calcDivisao } from "@/data/mock";

export const Route = createFileRoute("/app/motorista")({
  head: () => ({ meta: [{ title: "CarUni — Painel do Motorista" }] }),
  component: MotoristaHome,
});

function MotoristaHome() {
  const minhasRotas = rotas.filter(r => r.motoristaId === eu.id);
  const totalInscritos = minhasRotas.reduce((acc, r) => acc + r.inscritos.length, 0);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8 lg:py-10 space-y-8 animate-in fade-in duration-500">
      {/* Resumo Financeiro */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Ganhos em Abril</p>
            <h2 className="num mt-2 text-4xl font-black">{formatBRL(ganhosMes.total)}</h2>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                <TrendingUp size={12} /> +12%
              </span>
              <span className="text-[10px] opacity-70 italic text-white/90">vs último mês</span>
            </div>
          </div>
          <Wallet size={120} className="absolute -right-4 -bottom-4 text-white/10 transition-transform group-hover:scale-110" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-3xl border border-border bg-surface p-5 flex flex-col justify-between">
            <Users size={20} className="text-primary" />
            <div>
              <p className="num text-2xl font-bold text-foreground">{totalInscritos}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Passageiros Fixos</p>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-5 flex flex-col justify-between">
            <Star size={20} className="text-warn" />
            <div>
              <p className="num text-2xl font-bold text-foreground">{eu.avaliacao}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sua Avaliação</p>
            </div>
          </div>
        </div>
      </section>

      {/* Suas Rotas Ativas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Suas rotas ativas</h3>
          <Link to="/app/publicar" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
            <PlusCircle size={14} /> Nova rota
          </Link>
        </div>

        <div className="grid gap-4">
          {minhasRotas.map(r => {
            const div = calcDivisao(r, r.inscritos.length);
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-surface p-5 transition-all hover:border-primary/30 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground">{r.nome}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{r.horarioIda} · {r.km} km</p>
                  </div>
                  <div className="text-right">
                    <p className="num text-sm font-bold text-success">{formatBRL(div.ganhoMotorista)}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">por carona</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex -space-x-2">
                    {r.inscritos.map(id => {
                      const p = getPessoa(id);
                      return <div key={id} title={p.nome} className="h-7 w-7 rounded-full border-2 border-surface bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{p.iniciais}</div>
                    })}
                    {r.inscritos.length < r.vagas && (
                      <div className="h-7 w-7 rounded-full border-2 border-surface bg-surface-2 flex items-center justify-center text-[10px] text-muted-foreground">+</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link to="/app/chat/$rotaId" params={{ rotaId: r.id }} className="rounded-lg bg-surface-2 p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                      <MessageCircle size={18} />
                    </Link>
                    <Link to="/app/viagem-ativa" className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
                      <Navigation size={14} /> Iniciar
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Próximas Atividades */}
      <section className="rounded-3xl border border-border bg-surface p-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Agenda da Semana</h3>
        <div className="space-y-3">
          {[
            { dia: "Segunda", status: "Confirmado", time: "07:30" },
            { dia: "Terça", status: "Confirmado", time: "07:30" },
            { dia: "Quarta", status: "Confirmado", time: "07:30" },
          ].map(i => (
            <div key={i.dia} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">{i.dia}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="num text-xs font-bold">{i.time}</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
