import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Users, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { BrandLogo } from "@/components/Brand";

export const Route = createFileRoute("/app/selecao")({
  head: () => ({ meta: [{ title: "CarUni — Escolha seu perfil" }] }),
  component: Selecao,
});

function Selecao() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center bg-background px-4 py-10 overflow-hidden relative">
      {/* Decoração de fundo */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 blur-[120px] rounded-full -z-10" />

      <div className="w-full max-w-4xl">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <BrandLogo className="mx-auto h-8 mb-6" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Como você vai usar o CarUni hoje?</h1>
          <p className="mt-4 text-muted-foreground">Escolha um perfil para acessar seu painel personalizado.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* CARD PASSAGEIRO */}
          <Link
            to="/app/passageiro"
            className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-8 shadow-sm transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 animate-in fade-in slide-in-from-left-8 duration-700 delay-150"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:rotate-3">
              <Users size={32} />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-foreground">Sou Passageiro</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Busque rotas recorrentes, assine sua carona mensal e viaje com segurança e conforto todos os dias.
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck size={14} className="text-success" /> Motoristas verificados
              </li>
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap size={14} className="text-primary" /> Substituição garantida
              </li>
            </ul>
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-primary">
              Acessar painel <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
            {/* Decoração interna */}
            <div className="absolute -right-8 -bottom-8 opacity-[0.03] transition-transform group-hover:scale-110">
              <Users size={180} />
            </div>
          </Link>

          {/* CARD MOTORISTA */}
          <Link
            to="/app/motorista"
            className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-8 shadow-sm transition-all hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/5 animate-in fade-in slide-in-from-right-8 duration-700 delay-300"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-transform group-hover:scale-110 group-hover:-rotate-3">
              <Car size={32} />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-foreground">Sou Motorista</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Publique sua rota, gerencie seus passageiros fixos e cubra os custos do seu deslocamento diário.
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap size={14} className="text-accent" /> Ganhos recorrentes
              </li>
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck size={14} className="text-success" /> Comunidade universitária
              </li>
            </ul>
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-accent">
              Acessar painel <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
            {/* Decoração interna */}
            <div className="absolute -right-8 -bottom-8 opacity-[0.03] transition-transform group-hover:scale-110">
              <Car size={180} />
            </div>
          </Link>
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Você pode alternar entre os perfis a qualquer momento através do menu lateral.
        </p>
      </div>
    </div>
  );
}
