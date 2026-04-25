import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft, MessageCircle, CalendarDays, Wallet } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { Avatar, CnhBadge, PresenceBar, StarRating } from "@/components/Brand";
import { diasSemanaLabels, eu, formatBRL, getPessoa } from "@/data/mock";
import { estimateUber99, useCaruniStore, type BookingKind } from "@/data/store";

export function RotaDetalhePage({ id }: { id: string }) {
  const { rotas, bookings, reviews, reserveCredit, creditSummary, activePlan } = useCaruniStore();
  const r = rotas.find((rota) => rota.id === id);
  const [diasSelecionados, setDiasSelecionados] = React.useState<number[]>([1, 2, 3, 4, 5]);
  const [tipo, setTipo] = React.useState<BookingKind>("recorrente");
  const [feedback, setFeedback] = React.useState("");

  if (!r) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Rota não encontrada.{" "}
        <Link to="/app/buscar" className="text-primary">
          Voltar
        </Link>
      </div>
    );
  }

  const m = getPessoa(r.motoristaId);
  const minhaReserva = bookings.find(
    (b) => b.rotaId === r.id && b.passageiroId === eu.id && b.status === "ativa",
  );
  const routeReviews = reviews.filter((rev) => rev.rotaId === r.id && rev.toId === m.id);
  const economiaOnibus = 6.5 - activePlan.costPerTrip;
  const economiaParticular = estimateUber99(r.km) - activePlan.costPerTrip;

  const reservar = () => {
    const booking = reserveCredit(r.id, diasSelecionados, tipo);
    setFeedback(
      booking
        ? "Vaga reservada. 1 crédito ficou bloqueado até a confirmação da viagem."
        : "Não foi possível reservar: confira vagas, créditos disponíveis e reservas existentes.",
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 lg:py-10">
      <Link
        to="/app/buscar"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={12} /> Voltar
      </Link>

      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
        <RouteMap
          path={r.caminho}
          origin={r.origem.coord}
          destination={r.destino.coord}
          height={320}
        />
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
                {m.carro && (
                  <span className="num">
                    {m.carro.modelo} · {m.carro.placa}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-border bg-surface-2/40 p-4">
            <p className="label-cockpit text-[10px] text-muted-foreground">Plano de créditos</p>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
              <p className="num text-3xl font-semibold text-foreground">1 crédito</p>
              <p className="text-[11px] text-muted-foreground">
                Plano {activePlan.nome} · menos de {formatBRL(activePlan.costPerTrip)} por trajeto
              </p>
            </div>
            <div className="mt-3 grid gap-3 text-[11px] text-muted-foreground sm:grid-cols-3">
              <span>
                Créditos livres:{" "}
                <span className="num text-foreground">{creditSummary.disponivel}</span>
              </span>
              <span>
                Economia vs ônibus:{" "}
                <span className="num text-foreground">{formatBRL(economiaOnibus)}</span>
              </span>
              <span>
                Economia vs Uber/99:{" "}
                <span className="num text-foreground">{formatBRL(economiaParticular)}</span>
              </span>
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
                      ativo
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-2 text-muted-foreground"
                    }`}
                  >
                    {diasSemanaLabels[d]}
                  </span>
                );
              })}
              <span className="num ml-2 self-center text-[11px] text-muted-foreground">
                {r.horarioIda}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={reservar}
              disabled={!!minhaReserva || diasSelecionados.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck size={13} /> {minhaReserva ? "Rota reservada" : "Reservar vaga"}
            </button>
            <Link
              to="/app/chat/$rotaId"
              params={{ rotaId: r.id }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-2"
            >
              <MessageCircle size={13} /> Chat da rota
            </Link>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface-2/40 p-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} className="text-muted-foreground" />
                <p className="label-cockpit text-[10px] text-muted-foreground">Reserva</p>
              </div>
              <div className="mt-3 inline-flex rounded-md border border-border bg-surface p-1">
                {(["recorrente", "avulso"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setTipo(option)}
                    className={`rounded px-3 py-1.5 text-xs font-medium ${tipo === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {option === "recorrente" ? "Fixo" : "Avulso"}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {r.diasSemana.map((d) => {
                  const ativo = diasSelecionados.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() =>
                        setDiasSelecionados((old) =>
                          old.includes(d) ? old.filter((x) => x !== d) : [...old, d].sort(),
                        )
                      }
                      className={`num rounded-md px-2 py-1 text-[11px] ${ativo ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"}`}
                    >
                      {diasSemanaLabels[d]}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Wallet size={13} /> Esta reserva bloqueia{" "}
                <span className="num font-medium text-foreground">1 crédito</span>
                <span className="ml-auto">
                  Disponíveis: <span className="num">{creditSummary.disponivel}</span>
                </span>
              </div>
              {feedback && <p className="mt-3 text-xs text-muted-foreground">{feedback}</p>}
            </div>

            <div className="rounded-lg border border-border bg-surface-2/40 p-4">
              <p className="label-cockpit text-[10px] text-muted-foreground">Confiança</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Trust label="Viagens" value="128" />
                <Trust label="Cancel." value={`${100 - m.presenca}%`} />
                <Trust label="Reviews" value={String(routeReviews.length || 2)} />
              </div>
              <div className="mt-3 space-y-2">
                {(routeReviews.length
                  ? routeReviews
                  : [{ id: "fallback", texto: "Motorista pontual e carro limpo.", rating: 5 }]
                )
                  .slice(0, 2)
                  .map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted-foreground"
                    >
                      <StarRating value={rev.rating} /> <span className="ml-2">{rev.texto}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Trust({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-2">
      <p className="num text-base font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
