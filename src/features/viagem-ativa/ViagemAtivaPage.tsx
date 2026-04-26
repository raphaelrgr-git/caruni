import * as React from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { CheckCircle2, MessageCircle, Shield, XCircle } from "lucide-react";
import { AppBackButton } from "@/components/AppBackButton";
import { RouteMap } from "@/components/RouteMap";
import {
  disputeRide,
  driverConfirmRide,
  getMyRides,
  passengerConfirmRide,
  type MyRide,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRideStatus } from "@/lib/labels";
import { pickRelevantMyRide } from "@/lib/rides";
import type { LatLng } from "@/lib/types";

export function ViagemAtivaPage() {
  const { user } = useAuth();
  const search = useSearch({ strict: false }) as { rideId?: string };
  const [rides, setRides] = React.useState<MyRide[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [feedback, setFeedback] = React.useState("");

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyRides();
      setRides(data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const activeRide = React.useMemo(() => {
    if (search.rideId) {
      return rides.find((ride) => ride.id === search.rideId) ?? pickRelevantMyRide(rides);
    }
    return pickRelevantMyRide(rides);
  }, [rides, search.rideId]);
  const path: LatLng[] =
    activeRide?.route.geometry?.coordinates.map(([lng, lat]) => [lat, lng] as LatLng) ?? [];

  const handleAction = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      setFeedback(message);
      await reload();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha na atualização da viagem.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Carregando viagem…</div>;
  }

  if (!activeRide) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Nenhuma corrida ativa encontrada.
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-7rem)] w-full overflow-hidden lg:h-[calc(100vh-3rem)]">
      <RouteMap
        path={path}
        origin={path[0]}
        destination={path[path.length - 1]}
        height="100%"
        interactive={false}
        fit
        privacyMode={user?.role === "PASSAGEIRO"}
        privacySeed={activeRide.route.id}
      />

      <div className="absolute left-3 right-3 top-3 z-[400] rounded-xl border border-border bg-surface/95 p-4 backdrop-blur lg:left-6 lg:right-auto lg:w-[28rem]">
        <div className="flex items-center justify-between">
          <AppBackButton fallbackTo="/app" label="Voltar" className="text-[11px]" />
          <span className="rounded-md bg-success/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-success">
            {formatRideStatus(activeRide.status)}
          </span>
        </div>

        <h1 className="mt-3 text-lg font-semibold text-foreground">{activeRide.route.name}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {activeRide.route.originLabel} → {activeRide.route.destinationLabel}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(activeRide.scheduledAt).toLocaleString("pt-BR")}
        </p>

        {activeRide.route.driver ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Motorista: <span className="text-foreground">{activeRide.route.driver.name}</span>
          </p>
        ) : null}

        {activeRide.participants?.length ? (
          <div className="mt-3 text-xs text-muted-foreground">
            Passageiros: {activeRide.participants.map((participant) => participant.name).join(", ")}
          </div>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {user?.role === "MOTORISTA" ? (
            <>
              <button
                onClick={() =>
                  void handleAction(
                    () => driverConfirmRide(activeRide.id, true),
                    "Embarque confirmado pelo motorista.",
                  )
                }
                className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
              >
                Confirmar embarque
              </button>
              <button
                onClick={() =>
                  void handleAction(
                    () => driverConfirmRide(activeRide.id, false),
                    "No-show registrado.",
                  )
                }
                className="rounded-md border border-warn/40 bg-warn/5 px-3 py-2 text-xs font-medium text-warn"
              >
                Registrar no-show
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() =>
                  void handleAction(
                    () => passengerConfirmRide(activeRide.id),
                    "Viagem confirmada pelo passageiro.",
                  )
                }
                className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
              >
                Confirmar viagem
              </button>
              <button
                onClick={() =>
                  void handleAction(
                    () => disputeRide(activeRide.id),
                    "Disputa aberta para a viagem.",
                  )
                }
                className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground"
              >
                Abrir disputa
              </button>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          {activeRide.driverConfirmedAt ? (
            <span className="inline-flex items-center gap-1 text-success">
              <CheckCircle2 size={14} /> motorista confirmou
            </span>
          ) : null}
          {activeRide.passengerConfirmedAt ? (
            <span className="inline-flex items-center gap-1 text-success">
              <CheckCircle2 size={14} /> passageiro confirmou
            </span>
          ) : null}
          {activeRide.status === "DISPUTE" ? (
            <span className="inline-flex items-center gap-1 text-warn">
              <XCircle size={14} /> em disputa
            </span>
          ) : null}
        </div>

        {feedback ? <p className="mt-3 text-xs text-muted-foreground">{feedback}</p> : null}
      </div>

      <Link
        to="/app/chat/$rotaId"
        params={{ rotaId: activeRide.route.id }}
        className="absolute right-3 top-[180px] z-[400] inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/95 text-foreground shadow-lg backdrop-blur lg:top-3"
        aria-label="Chat da rota"
      >
        <MessageCircle size={18} />
      </Link>

      <div className="absolute bottom-4 right-4 z-[400] rounded-full border border-border bg-surface/95 p-4 shadow-lg backdrop-blur">
        <Shield size={20} className="text-foreground" />
      </div>
    </div>
  );
}
