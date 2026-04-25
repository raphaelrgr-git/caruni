import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, MessageCircle } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { Avatar, CnhBadge, StarRating } from "@/components/Brand";
import { rotas, getPessoa, contatoEmergencia, formatHora } from "@/data/mock";

export const Route = createFileRoute("/app/viagem-ativa")({
  head: () => ({ meta: [{ title: "CarUni — Viagem ativa" }] }),
  component: Viagem,
});

function Viagem() {
  const r = rotas[0];
  const m = getPessoa(r.motoristaId);

  // animar o carro pelo caminho
  const [step, setStep] = React.useState(1);
  React.useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % r.caminho.length), 2200);
    return () => clearInterval(t);
  }, [r.caminho.length]);

  // SOS
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

      {/* Header flutuante */}
      <div className="pointer-events-auto absolute left-3 right-3 top-3 z-[400] rounded-xl border border-border bg-surface/95 p-4 backdrop-blur lg:left-6 lg:right-auto lg:w-96">
        <div className="flex items-center justify-between">
          <Link to="/app" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
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
      </div>

      {/* Chat shortcut */}
      <Link
        to="/app/chat/$rotaId"
        params={{ rotaId: r.id }}
        className="absolute right-3 top-[180px] z-[400] inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/95 text-foreground shadow-lg backdrop-blur lg:top-3"
        aria-label="Chat da rota"
      >
        <MessageCircle size={18} />
      </Link>

      {/* SOS */}
      <div className="absolute bottom-4 right-4 z-[400]">
        <button
          onMouseDown={start}
          onTouchStart={start}
          onMouseUp={cancel}
          onMouseLeave={cancel}
          onTouchEnd={cancel}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full border shadow-lg transition-colors ${
            armed ? "border-warn bg-warn text-warn-foreground pulse-warn" : "border-border bg-surface/95 text-foreground backdrop-blur"
          }`}
          aria-label="SOS — segure para acionar"
        >
          <Shield size={20} />
          {holding && (
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="26" fill="none" stroke="oklch(var(--warn))" strokeWidth="3" strokeDasharray={163.36} strokeDashoffset={163.36 * (1 - progress)} strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {armed && (
        <div
          role="dialog"
          className="absolute inset-0 z-[500] flex items-center justify-center bg-black/60 p-6"
          onClick={() => { setArmed(false); setProgress(0); }}
        >
          <div className="max-w-sm rounded-xl border border-warn/40 bg-surface p-6 text-center">
            <Shield size={28} className="mx-auto text-warn" />
            <p className="mt-3 text-base font-semibold text-foreground">SOS acionado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Localização enviada para <span className="font-medium text-foreground">{contatoEmergencia.nome}</span> ({contatoEmergencia.relacao}) via WhatsApp.
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
