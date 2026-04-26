import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Clock, Calendar, Wallet, Users } from "lucide-react";
import { formatBRL } from "@/data/mock";

export const Route = createFileRoute("/app/publicar")({
  head: () => ({ meta: [{ title: "CarUni — Publicar Rota" }] }),
  component: Publicar,
});

function Publicar() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Rota publicada com sucesso! (Simulação)");
    navigate({ to: "/app/minhas-caronas" });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 lg:py-10">
      <Link to="/app/minhas-caronas" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Voltar para Minhas Caronas
      </Link>
      
      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Publicar nova rota</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preencha os detalhes para oferecer caronas recorrentes.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin size={16} className="text-primary" /> Percurso
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Origem (Bairro ou Rua)</label>
              <input required placeholder="Ex: Centro, Joinville" className="mt-1.5 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Destino (Universidade)</label>
              <select className="mt-1.5 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option>UDESC · CCT</option>
                <option>UNIVILLE</option>
                <option>IFSC</option>
                <option>UFSC</option>
                <option>Sociesc</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock size={16} className="text-primary" /> Horário
            </h2>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saída da origem</label>
              <input type="time" defaultValue="07:30" className="mt-1.5 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none" />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users size={16} className="text-primary" /> Capacidade
            </h2>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vagas disponíveis</label>
              <input type="number" defaultValue="3" min="1" max="6" className="mt-1.5 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none" />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar size={16} className="text-primary" /> Dias da semana
          </h2>
          <div className="flex flex-wrap gap-2">
            {["Seg", "Ter", "Qua", "Qui", "Sex"].map(d => (
              <label key={d} className="flex flex-1 items-center justify-center rounded-md border border-border bg-background py-2 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 cursor-pointer">
                <input type="checkbox" defaultChecked className="hidden" />
                <span className="text-xs font-medium">{d}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wallet size={16} className="text-primary" /> Valor por vaga
            </h2>
            <span className="text-xs font-bold text-primary">{formatBRL(3.50)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            O CarUni utiliza um valor fixo de R$ 3,50 por vaga para garantir a competitividade com o transporte público e a divisão justa dos custos.
          </p>
        </div>

        <button type="submit" className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]">
          Publicar Rota
        </button>
      </form>
    </div>
  );
}
