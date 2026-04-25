import * as React from "react";
import { Link } from "@tanstack/react-router";
import { CalendarCheck, AlertCircle, Clock, Users, PlusCircle, Ban } from "lucide-react";
import { diasSemanaLabels, eu, getPessoa } from "@/data/mock";
import { useCaruniStore } from "@/data/store";

export function MinhasCaronasPage() {
  const { rotas, bookings, cancelBooking, cancelRouteDay, activePlan } = useCaruniStore();
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
              aba === a
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
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
                      <p className="num text-lg font-semibold text-foreground">1 crédito</p>
                      <p className="text-[10px] text-muted-foreground">por viagem</p>
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
            <Link
              to="/app/criar-rota"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <PlusCircle size={13} /> Cadastrar minha rota
            </Link>
          </div>
        ) : (
          minhasComoMotorista.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.nome}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="num">
                      {r.inscritos.length}/{r.vagas} vagas
                    </span>
                    <span className="num">{r.horarioIda}</span>
                    <span>{r.diasSemana.map((d) => diasSemanaLabels[d]).join(" · ")}</span>
                  </div>
                </div>
                <Link
                  to="/app/rota/$id"
                  params={{ id: r.id }}
                  className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-2"
                >
                  Editar
                </Link>
              </div>
              <div className="mt-4 rounded-lg border border-border bg-surface-2/40 p-3">
                <p className="label-cockpit text-[10px] text-muted-foreground">
                  Passageiros recorrentes
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.inscritos.length ? (
                    r.inscritos.map((id) => {
                      const p = getPessoa(id);
                      return (
                        <span
                          key={id}
                          className="rounded-md bg-surface px-2 py-1 text-xs text-foreground"
                        >
                          {p.nome}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground">Nenhum passageiro ainda.</span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {r.diasSemana.map((d) => (
                  <button
                    key={d}
                    onClick={() => cancelRouteDay(r.id, d)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground hover:bg-surface-2"
                  >
                    <Ban size={10} /> Cancelar {diasSemanaLabels[d]}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}

        {aba === "passageiro" &&
          bookings
            .filter((b) => b.passageiroId === eu.id && b.status === "ativa")
            .map((booking) => {
              const rota = rotas.find((r) => r.id === booking.rotaId);
              if (!rota) return null;
              return (
                <div key={booking.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Créditos reservados · {rota.nome}
                      </p>
                      <p className="num mt-1 text-xs text-muted-foreground">
                        {booking.creditIds.length} crédito · Plano {activePlan.nome} ·{" "}
                        {booking.diasSemana.map((d) => diasSemanaLabels[d]).join(" · ")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-2"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => cancelBooking(booking.id, true)}
                        className="rounded-md border border-warn/40 bg-warn/5 px-3 py-2 text-xs font-medium text-warn"
                      >
                        Cancelar tarde
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

        {aba === "passageiro" && (
          <div className="rounded-xl border border-warn/40 bg-warn/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={16} className="mt-0.5 text-warn" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Buscando substituto · qua 23/04 · 07:30
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  <Clock size={10} className="-mt-0.5 mr-1 inline" /> 2 candidatos avaliando ·
                  resposta esperada em 18 min
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
