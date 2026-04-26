import * as React from "react";
import { Link } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, MapPinned, Users } from "lucide-react";
import { Avatar } from "@/components/Brand";
import { getMyRides, type MyRide } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { pickRelevantMyRide } from "@/lib/rides";

type DockStage = "prepare" | "confirm" | "in-progress";

function resolveStage(ride: MyRide, now: number): DockStage {
  const start = new Date(ride.scheduledAt).getTime();
  if (now >= start) return "in-progress";
  if (start - now <= 5 * 60 * 1000) return "confirm";
  return "prepare";
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RideDock() {
  const { user } = useAuth();
  const [rides, setRides] = React.useState<MyRide[]>([]);
  const [now, setNow] = React.useState(Date.now());

  const load = React.useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMyRides();
      setRides(data);
    } catch {
      setRides([]);
    }
  }, [user]);

  React.useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(poll);
  }, [load]);

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const ride = React.useMemo(() => {
    const relevantRide = pickRelevantMyRide(rides, now);
    if (!relevantRide) return null;
    const start = new Date(relevantRide.scheduledAt).getTime();
    const end = start + ((relevantRide.route.durationSeconds ?? 0) + 15 * 60) * 1000;
    if (start - now > 15 * 60 * 1000 || end <= now) return null;
    return relevantRide;
  }, [rides, now]);

  if (!ride) return null;

  const stage = resolveStage(ride, now);
  const scheduledAt = new Date(ride.scheduledAt).getTime();
  const countdown = formatCountdown(scheduledAt - now);
  const primaryLabel =
    stage === "prepare" ? "Ver rota" : stage === "confirm" ? "Confirmar presença" : "Ver status";
  const headline =
    stage === "prepare"
      ? `Sua carona começa em ${countdown}`
      : stage === "confirm"
        ? `Está chegando a hora · ${countdown}`
        : "Corrida em andamento";
  const supporting =
    user?.role === "MOTORISTA"
      ? ride.participants?.length
        ? `${ride.participants.length} passageiro(s) nesta corrida`
        : "Nenhum passageiro confirmado ainda"
      : ride.route.driver?.name ?? "Motorista da rota";

  return (
    <div className="fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+4.5rem)] z-40 lg:left-[calc(16rem+1.5rem)] lg:right-6 lg:top-4">
      <div className="rounded-[28px] border border-primary/25 bg-primary text-primary-foreground shadow-[0_18px_50px_rgba(15,118,110,0.32)] animate-pulse">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/18">
            {user?.role === "MOTORISTA" ? (
              <Users size={18} className="text-white" />
            ) : (
              <Avatar
                name={ride.route.driver?.name ?? "Motorista"}
                src={ride.route.driver?.photoUrl}
                size={40}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground/75">
              {stage === "prepare" ? <CalendarClock size={12} /> : <CheckCircle2 size={12} />}
              {stage === "prepare" ? "Prepare-se" : stage === "confirm" ? "Confirme presença" : "Em andamento"}
            </div>
            <p className="mt-1 truncate text-sm font-semibold lg:text-base">{headline}</p>
            <p className="truncate text-xs text-primary-foreground/80">
              {ride.route.name} · {supporting}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <Link
              to="/app/rota/$id"
              params={{ id: ride.route.id }}
              className="hidden rounded-full border border-white/25 px-3 py-2 text-xs font-medium text-white/95 sm:inline-flex"
            >
              <MapPinned size={14} className="mr-1.5" />
              Ver rota
            </Link>
            <Link
              to="/app/viagem-ativa"
              search={{ rideId: ride.id }}
              className="inline-flex rounded-full bg-white px-3 py-2 text-xs font-semibold text-primary"
            >
              {primaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
