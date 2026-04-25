import { createFileRoute } from "@tanstack/react-router";
import { Phone, Leaf, Route as RouteIcon, ShieldCheck } from "lucide-react";
import { Avatar, CnhBadge, PresenceBar, StarRating } from "@/components/Brand";
import { eu, contatoEmergencia } from "@/data/mock";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "CarUni — Perfil" }] }),
  component: Perfil,
});

function Perfil() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center gap-4">
          <Avatar name={eu.nome} color={eu.cor} size={64} iniciais={eu.iniciais} />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground">{eu.nome}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{eu.uni}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CnhBadge />
              <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">Motorista desde {eu.desde}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface-2/40 p-4">
            <p className="label-cockpit text-[10px] text-muted-foreground">Presença</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="num text-2xl font-semibold text-foreground">{eu.presenca}%</span>
            </div>
            <div className="mt-2"><PresenceBar value={eu.presenca} label={false} /></div>
          </div>
          <div className="rounded-lg border border-border bg-surface-2/40 p-4">
            <p className="label-cockpit text-[10px] text-muted-foreground">Avaliação</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="num text-2xl font-semibold text-foreground">{eu.avaliacao.toFixed(1)}</span>
              <StarRating value={eu.avaliacao} />
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full bg-warn" style={{ width: `${(eu.avaliacao / 5) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {eu.carro && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-5">
          <p className="label-cockpit text-[10px] text-muted-foreground">Veículo</p>
          <p className="mt-2 text-sm font-medium text-foreground">{eu.carro.modelo} · {eu.carro.cor}</p>
          <p className="num mt-1 text-xs text-muted-foreground">Placa {eu.carro.placa}</p>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-muted-foreground" />
          <p className="label-cockpit text-[10px] text-muted-foreground">Contato de emergência</p>
        </div>
        <p className="mt-2 text-sm font-medium text-foreground">{contatoEmergencia.nome} · {contatoEmergencia.relacao}</p>
        <p className="num mt-0.5 text-xs text-muted-foreground">{contatoEmergencia.telefone}</p>
        <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-success">
          <ShieldCheck size={12} /> Receberá sua localização via WhatsApp se você acionar SOS
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat icon={<RouteIcon size={14} />} label="Caronas" value="128" />
        <Stat icon={<Leaf size={14} />} label="CO₂ evitado" value="84 kg" />
        <Stat icon={<RouteIcon size={14} />} label="Km economizados" value="612" />
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="label-cockpit text-[10px]">{label}</span></div>
      <p className="num mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
