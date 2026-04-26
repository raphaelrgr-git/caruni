import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bus,
  CalendarCheck,
  Car,
  Clock,
  Flame,
  PlusCircle,
  Route as RouteIcon,
  Search,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { getDashboardSummary, getRouteDetail, type DashboardSummaryResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRideStatus } from "@/lib/labels";
import type { LatLng } from "@/lib/types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = React.useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const isDriver = user?.role === "MOTORISTA";
  const greeting = isDriver ? "Pronto pra rodar?" : "Bom dia";

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">Carregando dashboard…</div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="label-cockpit text-[10px] text-muted-foreground">{greeting}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
            {user?.name?.split(" ")[0] ?? "Bem-vindo"}
          </h1>
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <span className="label-cockpit text-[10px] text-muted-foreground">Hoje</span>
          <span className="num text-sm text-foreground" suppressHydrationWarning>
            {mounted
              ? new Date().toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })
              : ""}
          </span>
        </div>
      </div>

      {isDriver ? (
        <DriverDashboard summary={summary} />
      ) : (
        <PassengerDashboard summary={summary} />
      )}
    </div>
  );
}

// ── Passageiro ────────────────────────────────────────────────────────────────

function PassengerDashboard({ summary }: { summary: DashboardSummaryResponse | null }) {
  const nextRide = summary?.nextRides[0] ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="lg:col-span-2 space-y-4">
        {nextRide ? (
          <NextRideCard ride={nextRide} />
        ) : (
          <EmptyRideCard />
        )}

        {summary && summary.nextRides.length > 1 && (
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="label-cockpit text-[10px] text-muted-foreground">Próximas corridas</p>
            <div className="mt-3 space-y-2">
              {summary.nextRides.slice(1, 5).map((ride) => (
                <div
                  key={ride.id}
                  className="flex items-center justify-between rounded-lg bg-surface-2/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{ride.routeName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {ride.originLabel} → {ride.destinationLabel}
                    </p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className="num text-xs font-medium text-foreground">
                      {new Date(ride.scheduledAt).toLocaleString("pt-BR", {
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {formatRideStatus(ride.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <aside className="flex flex-col gap-4">
        <CreditsCard credits={summary?.credits ?? null} />
        <StreakCard />

        {summary?.savings && (
          <SavingsCard savings={summary.savings} />
        )}

        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="label-cockpit text-[10px] text-muted-foreground">Acesso rápido</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              to="/app/buscar"
              className="flex items-center gap-2 rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground hover:bg-surface-2"
            >
              <Search size={14} className="text-muted-foreground" /> Buscar carona
            </Link>
            <Link
              to="/app/minhas-caronas"
              className="flex items-center gap-2 rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground hover:bg-surface-2"
            >
              <CalendarCheck size={14} className="text-muted-foreground" /> Minhas caronas
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ── Motorista ─────────────────────────────────────────────────────────────────

function DriverDashboard({ summary }: { summary: DashboardSummaryResponse | null }) {
  const nextRide = summary?.nextRides[0] ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="lg:col-span-2 space-y-4">
        {nextRide ? (
          <NextRideCard ride={nextRide} driverView />
        ) : (
          <div className="rounded-xl border border-border bg-surface p-6 text-center">
            <Car size={28} className="mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">Nenhuma viagem próxima</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crie ou gerencie suas rotas para começar a receber passageiros.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link
                to="/app/criar-rota"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
              >
                <PlusCircle size={13} /> Nova rota
              </Link>
              <Link
                to="/app/minhas-caronas"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground"
              >
                Minhas rotas
              </Link>
            </div>
          </div>
        )}

        {summary?.earningsTimeline && summary.earningsTimeline.length > 0 && (
          <EarningsChart data={summary.earningsTimeline} />
        )}
      </section>

      <aside className="flex flex-col gap-4">
        {summary?.occupancyTimeline && summary.occupancyTimeline.length > 0 && (
          <OccupancyCard data={summary.occupancyTimeline} />
        )}
        <StreakCard />

        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="label-cockpit text-[10px] text-muted-foreground">Acesso rápido</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              to="/app/criar-rota"
              className="flex items-center gap-2 rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground hover:bg-surface-2"
            >
              <PlusCircle size={14} className="text-muted-foreground" /> Criar nova rota
            </Link>
            <Link
              to="/app/minhas-caronas"
              className="flex items-center gap-2 rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground hover:bg-surface-2"
            >
              <Car size={14} className="text-muted-foreground" /> Minhas rotas
            </Link>
            <Link
              to="/app/viagem-ativa"
              search={{ rideId: nextRide.id }}
              className="flex items-center gap-2 rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground hover:bg-surface-2"
            >
              <RouteIcon size={14} className="text-muted-foreground" /> Viagem ativa
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ── Shared cards ─────────────────────────────────────────────────────────────

function NextRideCard({
  ride,
  driverView = false,
}: {
  ride: DashboardSummaryResponse["nextRides"][number];
  driverView?: boolean;
}) {
  const [mapPath, setMapPath] = React.useState<LatLng[]>([]);
  const [origin, setOrigin] = React.useState<LatLng | undefined>();
  const [destination, setDestination] = React.useState<LatLng | undefined>();

  React.useEffect(() => {
    getRouteDetail(ride.routeId)
      .then((detail) => {
        if (detail.geometry) {
          setMapPath(
            detail.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng),
          );
        }
        setOrigin([detail.origin.lat, detail.origin.lng]);
        setDestination([detail.destination.lat, detail.destination.lng]);
      })
      .catch(() => {});
  }, [ride.routeId]);

  const scheduled = new Date(ride.scheduledAt);
  const now = new Date();
  const diffMin = Math.round((scheduled.getTime() - now.getTime()) / 60000);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <RouteMap
        path={mapPath}
        origin={origin}
        destination={destination}
        height={260}
        privacyMode={!driverView}
        privacySeed={ride.routeId}
      />
      <div className="border-t border-border p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label-cockpit text-[10px] text-muted-foreground">
              {driverView ? "Próxima viagem a operar" : "Próxima carona"}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">{ride.routeName}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {ride.originLabel} → {ride.destinationLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="num text-3xl font-semibold leading-none text-foreground">
              {scheduled.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
            {diffMin > 0 && (
              <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Clock size={11} /> em {diffMin} min
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/app/viagem-ativa"
            search={{ rideId: ride.id }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
          >
            {driverView ? "Gerenciar viagem" : "Entrar na corrida"} <ArrowRight size={13} />
          </Link>
          <Link
            to="/app/rota/$id"
            params={{ id: ride.routeId }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground"
          >
            Detalhes da rota
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyRideCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 text-center">
      <Search size={28} className="mx-auto text-muted-foreground" />
      <p className="mt-3 text-sm font-medium text-foreground">Nenhuma carona agendada</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Busque rotas disponíveis e reserve sua próxima carona.
      </p>
      <Link
        to="/app/buscar"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
      >
        <Search size={13} /> Buscar carona
      </Link>
    </div>
  );
}

function CreditsCard({
  credits,
}: {
  credits: DashboardSummaryResponse["credits"] | null;
}) {
  if (!credits) return null;
  const pct = credits.total > 0 ? (credits.available / credits.total) * 100 : 0;
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="label-cockpit text-[10px] text-muted-foreground">Créditos</p>
      <p className="num mt-1 text-2xl font-semibold text-foreground">
        {credits.available}
        <span className="text-base text-muted-foreground">/{credits.total}</span>
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {credits.reserved} reservado · {credits.consumed} usados
      </p>
      <Link
        to="/app/carteira"
        className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        Ver carteira <ArrowRight size={11} />
      </Link>
    </div>
  );
}

function SavingsCard({
  savings,
}: {
  savings: DashboardSummaryResponse["savings"];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="label-cockpit text-[10px] text-muted-foreground">Economia realizada</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface-2/40 p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Bus size={13} />
            <span className="label-cockpit text-[9px]">vs ônibus</span>
          </div>
          <p className="num mt-2 text-lg font-semibold text-primary">
            {brl.format(savings.busSavings)}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {savings.confirmedTrips} viagens
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-2/40 p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <RouteIcon size={13} />
            <span className="label-cockpit text-[9px]">vs Uber/99</span>
          </div>
          <p className="num mt-2 text-lg font-semibold text-primary">
            {brl.format(savings.privateSavings)}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">estimativa km</p>
        </div>
      </div>
    </div>
  );
}

function EarningsChart({
  data,
}: {
  data: NonNullable<DashboardSummaryResponse["earningsTimeline"]>;
}) {
  const max = Math.max(...data.map((d) => d.earnings), 1);
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="label-cockpit text-[10px] text-muted-foreground">Ganhos por semana</p>
          <p className="num mt-1 text-2xl font-semibold text-foreground">
            {brl.format(data.reduce((sum, d) => sum + d.earnings, 0))}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
          <TrendingUp size={11} />
        </span>
      </div>
      <div className="mt-4 flex items-end gap-1.5">
        {data.map((d, i) => {
          const h = Math.max(4, (d.earnings / max) * 56);
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-sm bg-primary/70" style={{ height: `${h}px` }} />
              <span className="text-[9px] text-muted-foreground">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── StreakCard ─────────────────────────────────────────────────────────────

function StreakCard() {
  const { user } = useAuth();
  const streak = user?.streak;
  if (!streak || streak.current === 0) return null;

  const isDriver = user?.role === "MOTORISTA";

  // Milestones to show
  const milestones = isDriver
    ? [
        { threshold: 5, label: "Visibilidade +", reached: streak.milestones.m5 },
        { threshold: 10, label: "Prioridade", reached: streak.milestones.m10 },
        { threshold: 20, label: "Taxa 10%", reached: streak.milestones.m20 },
      ]
    : [
        { threshold: 8, label: "Viagem grátis a cada 8", reached: streak.freeRidesEarned > 0 },
      ];

  const nextMilestone = isDriver
    ? [5, 10, 20].find((t) => streak.current < t) ?? null
    : streak.current % 8 === 0 ? null : 8 - (streak.current % 8);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <Flame size={15} className="text-warn" />
        <p className="label-cockpit text-[10px] text-muted-foreground">Sequência</p>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="num text-3xl font-semibold text-foreground">{streak.current}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            viagens seguidas · recorde {streak.longest}
          </p>
        </div>
        {nextMilestone != null && typeof nextMilestone === "number" && (
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">próximo bônus em</p>
            <p className="num text-lg font-semibold text-primary">{nextMilestone}</p>
          </div>
        )}
      </div>

      {milestones.some((m) => m.reached) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {milestones.filter((m) => m.reached).map((m) => (
            <span
              key={m.threshold}
              className="inline-flex items-center gap-1 rounded-full bg-warn/15 px-2 py-0.5 text-[10px] font-medium text-warn"
            >
              <Trophy size={9} /> {m.label}
            </span>
          ))}
        </div>
      )}

      {streak.freeRidesEarned > 0 && !isDriver && (
        <p className="mt-2 text-[11px] text-success">
          🎁 {streak.freeRidesEarned} viagem(ns) grátis ganhas
        </p>
      )}
    </div>
  );
}

function OccupancyCard({
  data,
}: {
  data: NonNullable<DashboardSummaryResponse["occupancyTimeline"]>;
}) {
  const avg = data.length > 0 ? data.reduce((s, d) => s + d.occupancy, 0) / data.length : 0;
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="label-cockpit text-[10px] text-muted-foreground">Ocupação média</p>
      <p className="num mt-1 text-2xl font-semibold text-foreground">{avg.toFixed(0)}%</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full bg-primary" style={{ width: `${avg}%` }} />
      </div>
    </div>
  );
}
