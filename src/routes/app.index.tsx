import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  CalendarClock,
  Car,
  CreditCard,
  MapPin,
  MessageCircle,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { OccupancyTrack } from "@/components/OccupancyTrack";
import { RouteMap } from "@/components/RouteMap";
import { Avatar } from "@/components/Brand";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  getDashboardSummary,
  getMyBookings,
  getMyRoutes,
  getRouteDetail,
  type DashboardSummaryResponse,
  type MyBooking,
  type MyRoute,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatBookingStatus, formatRideStatus } from "@/lib/labels";
import { pickRelevantSummaryRide } from "@/lib/rides";
import type { LatLng } from "@/lib/types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const dashboardChartConfig = {
  savings: { label: "Economia", color: "hsl(var(--primary))" },
  bus: { label: "Ônibus", color: "#f97316" },
  private: { label: "Uber/99", color: "#0f172a" },
  earnings: { label: "Ganhos", color: "hsl(var(--primary))" },
  occupancy: { label: "Ocupação", color: "#f97316" },
} as const;

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "CarUni — Início" },
      {
        name: "description",
        content: "Painel do CarUni com economia, ganhos, próximas viagens e operação da rota.",
      },
    ],
  }),
  component: AppHome,
});

function AppHome() {
  const { user } = useAuth();
  const [summary, setSummary] = React.useState<DashboardSummaryResponse | null>(null);
  const [bookings, setBookings] = React.useState<MyBooking[]>([]);
  const [routes, setRoutes] = React.useState<MyRoute[]>([]);
  const [path, setPath] = React.useState<LatLng[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getDashboardSummary().catch(() => null),
      user?.role === "MOTORISTA" ? getMyRoutes().catch(() => []) : getMyBookings().catch(() => []),
    ])
      .then(async ([dashboard, roleData]) => {
        if (cancelled) return;
        setSummary(dashboard);
        const relevantRide = dashboard ? pickRelevantSummaryRide(dashboard.nextRides) : null;
        if (relevantRide?.routeId) {
          const detail = await getRouteDetail(relevantRide.routeId).catch(() => null);
          if (!cancelled) {
            setPath(detail?.geometry?.coordinates.map(([lng, lat]) => [lat, lng] as LatLng) ?? []);
          }
        } else {
          setPath([]);
        }
        if (user?.role === "MOTORISTA") {
          setRoutes(roleData as MyRoute[]);
        } else {
          setBookings(roleData as MyBooking[]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  const nextRide = React.useMemo(
    () => (summary ? pickRelevantSummaryRide(summary.nextRides) : null),
    [summary],
  );
  const isDriver = user?.role === "MOTORISTA";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="overflow-hidden rounded-[30px] border border-border bg-surface shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-5 lg:p-7">
              <div className="inline-flex rounded-full border border-border bg-surface-2 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                {isDriver ? "Painel do motorista" : "Painel do passageiro"}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                {isDriver
                  ? "Ganhos previsíveis com rotas recorrentes."
                  : "Economia recorrente para sua rotina universitária."}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-[15px]">
                {isDriver
                  ? "Acompanhe ocupação, repasses e próximas corridas sem depender de grupo improvisado."
                  : "Compare o que você já economizou contra ônibus e Uber/99 e entre na próxima rota com menos atrito."}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {isDriver ? (
                  <>
                    <MetricCard
                      icon={<Wallet size={16} />}
                      label="Ganho líquido estimado"
                      value={brl.format(summary?.estimatedFuelSavings ?? 0)}
                      hint={`Estimativa com custo médio de ${brl.format(summary?.estimatedCostPerKm ?? 0.62)}/km`}
                    />
                    <MetricCard
                      icon={<Users size={16} />}
                      label="Ocupação média"
                      value={`${average(summary?.occupancyTimeline?.map((item) => item.occupancy) ?? [])}%`}
                      hint="Baseado nas suas rotas ativas"
                    />
                  </>
                ) : (
                  <>
                    <MetricCard
                      icon={<TrendingUp size={16} />}
                      label="Economia vs ônibus"
                      value={brl.format(summary?.savings.busSavings ?? 0)}
                      hint={`${summary?.savings.confirmedTrips ?? 0} viagens confirmadas`}
                    />
                    <MetricCard
                      icon={<TrendingUp size={16} />}
                      label="Economia vs Uber/99"
                      value={brl.format(summary?.savings.privateSavings ?? 0)}
                      hint={`Projeção semanal: ${brl.format(summary?.savings.weeklyProjectionPrivate ?? 0)}`}
                    />
                  </>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {isDriver ? (
                  <>
                    <Link
                      to="/app/criar-rota"
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                      <Car size={15} /> Publicar rota
                    </Link>
                    <Link
                      to="/app/minhas-caronas"
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
                    >
                      <Users size={15} /> Ver operação
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/app/buscar"
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                      <Search size={15} /> Buscar carona
                    </Link>
                    <Link
                      to="/app/minhas-caronas"
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
                    >
                      <CalendarClock size={15} /> Ver reservas
                    </Link>
                  </>
                )}
                {nextRide ? (
                  <Link
                    to="/app/viagem-ativa"
                    search={{ rideId: nextRide.id }}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
                  >
                    <MapPin size={15} /> Entrar na corrida
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col border-t border-border bg-surface-2/50 lg:border-l lg:border-t-0">
              <div className="overflow-hidden border-b border-border">
                <RouteMap path={path} height={260} interactive={false} className="rounded-none border-0" />
              </div>
              <div className="flex-1 p-5">
                <p className="label-cockpit text-[10px] text-muted-foreground">Próxima viagem</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                  {nextRide?.routeName ?? "Sem corrida agendada"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {nextRide
                    ? `${nextRide.originLabel} → ${nextRide.destinationLabel}`
                    : isDriver
                      ? "Crie uma rota para começar a receber passageiros."
                      : "Reserve uma rota para aparecer aqui."}
                </p>
                {nextRide ? (
                  <div className="mt-4 rounded-2xl border border-border bg-background/80 p-4">
                    <p className="text-sm font-medium text-foreground">
                      {new Date(nextRide.scheduledAt).toLocaleString("pt-BR")}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock size={12} />
                        {formatRideStatus(nextRide.status)}
                      </span>
                      <Link
                        to="/app/chat/$rotaId"
                        params={{ rotaId: nextRide.routeId }}
                        className="inline-flex items-center gap-1 text-primary"
                      >
                        Abrir chat <ArrowUpRight size={12} />
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5">
          <div className="overflow-hidden rounded-[30px] border border-border bg-surface p-5 lg:p-6">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="label-cockpit text-[10px] text-muted-foreground">
                  {isDriver ? "Economia de combustível" : "Série de economia"}
                </p>
                <h2 className="mt-1 max-w-full text-wrap text-xl font-semibold leading-tight text-foreground">
                  {isDriver ? "Quanto você está economizando de gasolina" : "Quanto o app já evitou de gasto"}
                </h2>
              </div>
            </div>

            <div className="mt-5 h-[220px] min-w-0 overflow-hidden sm:h-[260px]">
              {isDriver ? (
                <DriverCharts summary={summary} />
              ) : (
                <PassengerChart summary={summary} />
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-border bg-surface p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="label-cockpit text-[10px] text-muted-foreground">
                  {isDriver ? "Rotas em operação" : "Reservas e corridas"}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  {isDriver ? "O que precisa da sua atenção agora" : "Suas próximas movimentações"}
                </h2>
              </div>
              <Link
                to={isDriver ? "/app/minhas-caronas" : "/app/minhas-caronas"}
                className="text-sm font-medium text-primary"
              >
                Ver tudo
              </Link>
            </div>

            {loading ? (
              <p className="mt-5 text-sm text-muted-foreground">Carregando…</p>
            ) : isDriver ? (
              <div className="mt-5 space-y-3">
                {routes.slice(0, 3).map((route) => (
                  <div
                    key={route.id}
                    className="rounded-2xl border border-border bg-surface-2/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{route.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {route.originLabel} → {route.destinationLabel}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        {route.occupiedSeats}/{route.seats} vagas ocupadas
                      </span>
                    </div>
                    <div className="mt-4">
                      <OccupancyTrack
                        name={route.name}
                        seats={route.seats}
                        occupiedSeats={route.occupiedSeats}
                        passengerNames={route.passengers.map((passenger) => passenger.name)}
                        compact
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {route.passengers.slice(0, 4).map((passenger) => (
                        <span key={passenger.id} className="inline-flex items-center gap-2 rounded-full bg-background px-2 py-1 text-xs text-foreground">
                          <Avatar name={passenger.name} size={20} />
                          {passenger.name}
                        </span>
                      ))}
                      {route.passengers.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Nenhum passageiro ativo ainda.</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {bookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-border bg-surface-2/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{booking.route.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {booking.route.originLabel} → {booking.route.destinationLabel}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        {formatBookingStatus(booking.status)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-xs text-foreground">
                        <CalendarClock size={12} />
                        {booking.ride
                          ? new Date(booking.ride.scheduledAt).toLocaleString("pt-BR")
                          : "Aguardando próxima instância"}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-xs text-foreground">
                        <MessageCircle size={12} />
                        Motorista: {booking.route.driver.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function PassengerChart({ summary }: { summary: DashboardSummaryResponse | null }) {
  const data = summary?.timeline ?? [];

  if (data.length === 0) {
    return <EmptyChart text="Assim que você confirmar viagens, a curva de economia aparece aqui." />;
  }

  return (
    <ChartContainer config={dashboardChartConfig} className="h-full w-full">
      <AreaChart data={data} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
        <defs>
          <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-savings)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--color-savings)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={44} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="savings"
          stroke="var(--color-savings)"
          strokeWidth={2.5}
          fill="url(#savingsFill)"
        />
        <Line type="monotone" dataKey="bus" stroke="var(--color-bus)" strokeWidth={2} dot={false} />
        <Line
          type="monotone"
          dataKey="private"
          stroke="var(--color-private)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

function DriverCharts({ summary }: { summary: DashboardSummaryResponse | null }) {
  const earnings = summary?.fuelSavingsTimeline ?? [];

  if (earnings.length === 0) {
    return <EmptyChart text="A curva aparece quando houver repasses em rotas confirmadas." />;
  }

  return (
    <ChartContainer config={dashboardChartConfig} className="h-full min-h-0 w-full min-w-0">
      <LineChart data={earnings} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(value) => brl.format(Number(value)).replace(",00", "")}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => brl.format(Number(value))}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="netSavings"
          stroke="var(--color-earnings)"
          strokeWidth={3}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-background/80 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="label-cockpit text-[10px]">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-border bg-surface-2/40 px-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
