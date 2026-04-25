import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Filter, ShieldCheck } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { Avatar, CnhBadge, StarRating } from "@/components/Brand";
import { rotas, getPessoa, calcDivisao, formatBRL } from "@/data/mock";

export const Route = createFileRoute("/app/buscar")({
  head: () => ({ meta: [{ title: "CarUni — Buscar carona" }] }),
  component: Buscar,
});

function Buscar() {
  const [sel, setSel] = React.useState(rotas[0].id);
  const r = rotas.find((x) => x.id === sel) ?? rotas[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Buscar carona</h1>
        <p className="mt-1 text-sm text-muted-foreground">Joinville · {rotas.length} rotas ativas perto de você</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <Search size={14} className="text-muted-foreground" />
          <input
            placeholder="Origem"
            defaultValue="Centro"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <label className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <Search size={14} className="text-muted-foreground" />
          <input
            placeholder="Destino"
            defaultValue="UDESC"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <button className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-2">
          <Filter size={13} /> Filtros
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-xl border border-border bg-surface lg:col-span-3">
          <RouteMap path={r.caminho} origin={r.origem.coord} destination={r.destino.coord} height={420} />
        </div>

        <div className="flex flex-col gap-2 lg:col-span-2">
          {rotas.map((rt) => {
            const m = getPessoa(rt.motoristaId);
            const div = calcDivisao(rt, rt.inscritos.length || 1);
            const cheio = calcDivisao(rt, rt.vagas);
            const isSel = rt.id === sel;
            return (
              <button
                key={rt.id}
                onClick={() => setSel(rt.id)}
                className={`text-left rounded-lg border p-4 transition-colors ${
                  isSel ? "border-primary bg-primary/5" : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{rt.nome}</p>
                    <p className="num mt-0.5 text-[11px] text-muted-foreground">
                      {rt.horarioIda} · {rt.km} km · {rt.vagas - rt.inscritos.length} vaga(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num text-base font-semibold text-foreground">{formatBRL(div.porPassageiro)}</p>
                    <p className="num text-[10px] text-muted-foreground">cheio: {formatBRL(cheio.porPassageiro)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Avatar name={m.nome} color={m.cor} size={26} iniciais={m.iniciais} />
                  <span className="text-xs text-foreground">{m.nome.split(" ")[0]}</span>
                  {m.cnhVerificada && <CnhBadge />}
                  <span className="ml-auto"><StarRating value={m.avaliacao} /></span>
                </div>
                {isSel && (
                  <Link
                    to="/app/rota/$id"
                    params={{ id: rt.id }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <ShieldCheck size={12} /> Ver rota
                  </Link>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
