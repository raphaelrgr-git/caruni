import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, AlertCircle, Clock, Users } from "lucide-react";
import { rotas, getPessoa, calcDivisao, formatBRL, diasSemanaLabels, eu } from "@/data/mock";

export const Route = createFileRoute("/app/minhas-caronas")({
  head: () => ({ meta: [{ title: "CarUni — Minhas caronas" }] }),
  component: Minhas,
});

function Minhas() {
  const [aba, setAba] = React.useState<"passageiro" | "motorista">("passageiro");
  const minhasInscricoes = rotas.filter((r) => r.inscritos.includes(eu.id));
  const minhasComoMotorista = rotas.filter((r) => r.motoristaId === eu.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Minhas caronas</h1>

      <div className="mt-4 inline-flex rounded-md border border-border bg-surface p-1">
        {(["passageiro", "motorista"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              aba === a ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Como {a}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {aba === "passageiro" ? (
          minhasInscricoes.length === 0 ? (
            <Empty texto="Você ainda não assinou nenhuma rota recorrente." />
          ) : (
            minhasInscricoes.map((r) => {
              const m = getPessoa(r.motoristaId);
              const div = calcDivisao(r, r.inscritos.length);
              return (
                <Link
                  key={r.id}
                  to="/app/rota/$id"
                  params={{ id: r.id }}
                  className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-surface-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.nome}</p>
                      <p className="num mt-1 text-[11px] text-muted-foreground">
                        {r.diasSemana.map((d) => diasSemanaLabels[d]).join(" · ")} · {r.horarioIda}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Motorista: {m.nome}</p>
                    </div>
                    <div className="text-right">
                      <p className="num text-lg font-semibold text-foreground">{formatBRL(div.porPassageiro)}</p>
                      <p className="text-[10px] text-muted-foreground">por carona</p>
                    </div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[10px] text-success">
                    <CalendarCheck size={10} /> Próxima: amanhã {r.horarioIda}
                  </div>
                </Link>
              );
            })
          )
        ) : minhasComoMotorista.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted-foreground">Você ainda não opera nenhuma rota.</p>
            <button className="mt-3 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              Cadastrar minha rota
            </button>
          </div>
        ) : (
          minhasComoMotorista.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm font-semibold text-foreground">{r.nome}</p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="num">{r.inscritos.length}/{r.vagas} vagas</span>
                <span className="num">{r.horarioIda}</span>
              </div>
            </div>
          ))
        )}

        {/* Banner substituição (apenas demo, na aba passageiro) */}
        {aba === "passageiro" && (
          <div className="rounded-xl border border-warn/40 bg-warn/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={16} className="mt-0.5 text-warn" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Buscando substituto · qua 23/04 · 07:30</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  <Clock size={10} className="-mt-0.5 mr-1 inline" /> 2 candidatos avaliando · resposta esperada em 18 min
                </p>
              </div>
              <Users size={14} className="text-warn" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ texto }: { texto: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
      {texto}
    </div>
  );
}
