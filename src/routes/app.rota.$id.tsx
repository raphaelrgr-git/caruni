import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft, MessageCircle } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { Avatar, CnhBadge, PresenceBar, StarRating } from "@/components/Brand";
import { getRota, getPessoa, calcDivisao, formatBRL, diasSemanaLabels } from "@/data/mock";

export const Route = createFileRoute("/app/rota/$id")({
  head: () => ({ meta: [{ title: "CarUni — Detalhe da rota" }] }),
  loader: ({ params }) => {
    const r = getRota(params.id);
    if (!r) throw notFound();
    return r;
  },
  notFoundComponent: () => (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Rota não encontrada. <Link to="/app" className="text-primary">Voltar</Link>
    </div>
  ),
  component: Detalhe,
});

function Detalhe() {
  const r = Route.useLoaderData();
  const m = getPessoa(r.motoristaId);
  const [vagas, setVagas] = React.useState(r.inscritos.length || 1);
  const div = calcDivisao(r, vagas);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 lg:py-10">
      <Link to="/app/buscar" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft size={12} /> Voltar
      </Link>

      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
        <RouteMap path={r.caminho} origin={r.origem.coord} destination={r.destino.coord} height={320} />
        <div className="p-5">
          <h1 className="text-xl font-semibold text-foreground">{r.nome}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {r.origem.label} → {r.destino.label}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <Avatar name={m.nome} color={m.cor} size={44} iniciais={m.iniciais} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{m.nome}</span>
                {m.cnhVerificada && <CnhBadge />}
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                <StarRating value={m.avaliacao} />
                <span className="num">{m.presenca}% presença</span>
                {m.carro && <span className="num">{m.carro.modelo} · {m.carro.placa}</span>}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-border bg-surface-2/40 p-4">
            <p className="label-cockpit text-[10px] text-muted-foreground">Calculadora de divisão</p>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="num text-3xl font-semibold text-foreground">{formatBRL(div.porPassageiro)}</p>
              <p className="text-[11px] text-muted-foreground">
                por passageiro · {vagas}/{r.vagas} vaga(s)
              </p>
            </div>
            <input
              type="range"
              min={1}
              max={r.vagas}
              value={vagas}
              onChange={(e) => setVagas(+e.target.value)}
              className="mt-3 w-full accent-[oklch(var(--primary))]"
            />
            <div className="mt-2 grid grid-cols-2 gap-3 text-[11px] text-muted-foreground">
              <span>Total da rota: <span className="num text-foreground">{formatBRL(div.totalRota)}</span></span>
              <span className="text-right">Motorista recebe: <span className="num text-foreground">{formatBRL(div.ganhoMotorista)}</span></span>
            </div>
          </div>

          <div className="mt-5">
            <p className="label-cockpit text-[10px] text-muted-foreground">Recorrência</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                const ativo = r.diasSemana.includes(d);
                return (
                  <span
                    key={d}
                    className={`num rounded-md px-2 py-1 text-[11px] ${
                      ativo ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"
                    }`}
                  >
                    {diasSemanaLabels[d]}
                  </span>
                );
              })}
              <span className="num ml-2 self-center text-[11px] text-muted-foreground">{r.horarioIda}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              <ShieldCheck size={13} /> Assinar esta rota
            </button>
            <Link
              to="/app/chat/$rotaId"
              params={{ rotaId: r.id }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-2"
            >
              <MessageCircle size={13} /> Chat da rota
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
