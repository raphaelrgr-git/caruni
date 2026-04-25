import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, MessageCircle, CheckCircle2, XCircle, Star } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { Avatar, CnhBadge, StarRating } from "@/components/Brand";
import { getPessoa, contatoEmergencia, formatHora } from "@/data/mock";
import { useCaruniStore } from "@/data/store";

export function ViagemAtivaPage() {
  const { rotas, rides, confirmDriverBoarded, confirmPassengerRide, addReview } = useCaruniStore();
  const activeRide = rides[0];
  const r = rotas.find((rota) => rota.id === activeRide?.rotaId) ?? rotas[0];
  const m = getPessoa(r.motoristaId);
  const [rating, setRating] = React.useState(5);
  const [reviewSent, setReviewSent] = React.useState(false);

  const [step, setStep] = React.useState(1);
  React.useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % r.caminho.length), 2200);
    return () => clearInterval(t);
  }, [r.caminho.length]);

  const [holding, setHolding] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [armed, setArmed] = React.useState(false);
  const ref = React.useRef<number | null>(null);

  const start = () => {
    setHolding(true);
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1500);
      setProgress(p);
      if (p < 1 && holding !== false) ref.current = requestAnimationFrame(tick);
      if (p >= 1) {
        setArmed(true);
        setHolding(false);
      }
    };
    ref.current = requestAnimationFrame(tick);
  };
  const cancel = () => {
    setHolding(false);
    setProgress(0);
    if (ref.current) cancelAnimationFrame(ref.current);
  };

  const eta = new Date(Date.now() + 14 * 60 * 1000);

  return (
    <div className="relative h-[calc(100vh-7rem)] w-full overflow-hidden lg:h-[calc(100vh-3rem)]">
      <RouteMap
        path={r.caminho}
        origin={r.origem.coord}
        destination={r.destino.coord}
        carPosition={r.caminho[step]}
        height="100%"
        interactive={false}
        fit
      />

      <div className="pointer-events-auto absolute left-3 right-3 top-3 z-[400] rounded-xl border border-border bg-surface/95 p-4 backdrop-blur lg:left-6 lg:right-auto lg:w-96">
        <div className="flex items-center justify-between">
          <Link
            to="/app"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={12} /> Sair
          </Link>
          <span className="num rounded-md bg-success/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success">
            • em rota
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Avatar name={m.nome} color={m.cor} size={42} iniciais={m.iniciais} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">{m.nome}</span>
              {m.cnhVerificada && <CnhBadge />}
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-[10px] text-muted-foreground">
              <StarRating value={m.avaliacao} />
              {m.carro && <span className="num">{m.carro.placa}</span>}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
          <span className="label-cockpit text-[10px] text-muted-foreground">ETA</span>
          <span className="num text-2xl font-semibold text-foreground">{formatHora(eta)}</span>
        </div>
        {activeRide && (
          <div className="mt-3 rounded-lg border border-border bg-surface-2/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="label-cockpit text-[10px] text-muted-foreground">Confirmação</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Status: <span className="font-medium text-foreground">{activeRide.status}</span>
                </p>
              </div>
              {activeRide.status === "confirmada" && (
                <CheckCircle2 size={18} className="text-success" />
              )}
              {activeRide.status === "disputa" && <XCircle size={18} className="text-warn" />}
            </div>
            {activeRide.status === "agendada" ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  onClick={() => confirmDriverBoarded(activeRide.id, true)}
                  className="rounded-md bg-primary px-2 py-2 text-[10px] font-medium text-primary-foreground"
                >
                  Motorista: embarcou
                </button>
                <button
                  onClick={() => confirmPassengerRide(activeRide.id)}
                  className="rounded-md border border-border px-2 py-2 text-[10px] font-medium text-foreground"
                >
                  Passageiro: viajei
                </button>
                <button
                  onClick={() => confirmDriverBoarded(activeRide.id, false)}
                  className="rounded-md border border-warn/40 bg-warn/5 px-2 py-2 text-[10px] font-medium text-warn"
                >
                  No-show
                </button>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      className={n <= rating ? "text-warn" : "text-muted-foreground"}
                    >
                      <Star size={16} fill="currentColor" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    addReview(r.id, m.id, rating, "Viagem confirmada pelo fluxo do MVP.");
                    setReviewSent(true);
                  }}
                  disabled={reviewSent}
                  className="mt-2 rounded-md bg-primary px-3 py-2 text-[10px] font-medium text-primary-foreground disabled:opacity-60"
                >
                  {reviewSent ? "Avaliação enviada" : "Avaliar motorista"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Link
        to="/app/chat/$rotaId"
        params={{ rotaId: r.id }}
        className="absolute right-3 top-[180px] z-[400] inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/95 text-foreground shadow-lg backdrop-blur lg:top-3"
        aria-label="Chat da rota"
      >
        <MessageCircle size={18} />
      </Link>

      <div className="absolute bottom-4 right-4 z-[400]">
        <button
          onMouseDown={start}
          onTouchStart={start}
          onMouseUp={cancel}
          onMouseLeave={cancel}
          onTouchEnd={cancel}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full border shadow-lg transition-colors ${
            armed
              ? "border-warn bg-warn text-warn-foreground pulse-warn"
              : "border-border bg-surface/95 text-foreground backdrop-blur"
          }`}
          aria-label="SOS — segure para acionar"
        >
          <Shield size={20} />
          {holding && (
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r="26"
                fill="none"
                stroke="oklch(var(--warn))"
                strokeWidth="3"
                strokeDasharray={163.36}
                strokeDashoffset={163.36 * (1 - progress)}
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {armed && (
        <div
          role="dialog"
          className="absolute inset-0 z-[500] flex items-center justify-center bg-black/60 p-6"
          onClick={() => {
            setArmed(false);
            setProgress(0);
          }}
        >
          <div className="max-w-sm rounded-xl border border-warn/40 bg-surface p-6 text-center">
            <Shield size={28} className="mx-auto text-warn" />
            <p className="mt-3 text-base font-semibold text-foreground">SOS acionado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Localização enviada para{" "}
              <span className="font-medium text-foreground">{contatoEmergencia.nome}</span> (
              {contatoEmergencia.relacao}) via WhatsApp.
            </p>
            <button className="mt-4 rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-2">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
