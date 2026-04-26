import * as React from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarCheck, CalendarClock, MessageCircle, PlusCircle, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { AppBackButton } from "@/components/AppBackButton";
import { Avatar } from "@/components/Brand";
import { DeleteRouteDialog } from "@/components/DeleteRouteDialog";
import { NegotiationPanel } from "@/components/NegotiationPanel";
import { OccupancyTrack } from "@/components/OccupancyTrack";
import { RouteMap } from "@/components/RouteMap";
import {
  approvePrivateBooking,
  cancelBooking,
  confirmRouteChange,
  declineRouteChange,
  deleteRoute,
  getMyBookings,
  getMyPendingRouteChanges,
  getMyNegotiations,
  getMyRoutes,
  rejectPrivateBooking,
  type MyBooking,
  type MyRoute,
  type PendingRouteChange,
  type RideNegotiation,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatBookingStatus, formatRideStatus } from "@/lib/labels";
import type { LatLng } from "@/lib/types";
import { WEEKDAY_LABELS } from "@/lib/types";

export function MinhasCaronasPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = React.useState<MyBooking[]>([]);
  const [routes, setRoutes] = React.useState<MyRoute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pendingRouteId, setPendingRouteId] = React.useState<string | null>(null);
  const [negotiations, setNegotiations] = React.useState<RideNegotiation[]>([]);
  const [pendingChanges, setPendingChanges] = React.useState<PendingRouteChange[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [timeFilter, setTimeFilter] = React.useState<"todos" | "hoje" | "semana" | "mes">("hoje");
  const [statusFilter, setStatusFilter] = React.useState<
    "todos" | "confirmadas" | "pendentes" | "canceladas" | "problema"
  >("todos");

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      if (user?.role === "MOTORISTA") {
        const [driverRoutes, negotiationData] = await Promise.all([
          getMyRoutes(),
          getMyNegotiations().catch(() => []),
        ]);
        setRoutes(driverRoutes);
        setNegotiations(negotiationData);
        setPendingChanges([]);
      } else {
        const [passengerBookings, negotiationData, routeChanges] = await Promise.all([
          getMyBookings(),
          getMyNegotiations().catch(() => []),
          getMyPendingRouteChanges().catch(() => []),
        ]);
        setBookings(passengerBookings);
        setNegotiations(negotiationData);
        setPendingChanges(routeChanges);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const onCancel = async (bookingId: string) => {
    try {
      const result = await cancelBooking(bookingId);
      toast.success(
        result.late ? "Reserva cancelada com penalidade." : "Reserva cancelada e crédito devolvido.",
      );
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao cancelar reserva.");
    }
  };

  const onDeleteRoute = async (routeId: string) => {
    setPendingRouteId(routeId);
    try {
      await deleteRoute(routeId);
      toast.success("Rota excluída com sucesso.");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir rota.");
    } finally {
      setPendingRouteId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
      <AppBackButton fallbackTo="/app" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {user?.role === "MOTORISTA" ? "Minhas rotas" : "Minhas caronas"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user?.role === "MOTORISTA"
              ? "Visualize ocupação, próximos embarques e o mapa de cada rota que você opera."
              : "Acompanhe suas reservas, próximas corridas e acesso rápido ao chat da rota."}
          </p>
        </div>

        {user?.role === "MOTORISTA" ? (
          <Link
            to="/app/criar-rota"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <PlusCircle size={15} /> Criar nova rota
          </Link>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={
              user?.role === "MOTORISTA"
                ? "Buscar por rota, origem, destino ou passageiro"
                : "Buscar por rota, origem, destino ou motorista"
            }
            className="field-input h-12 w-full rounded-full pl-11"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "todos", label: "Todos" },
            { key: "hoje", label: "Hoje" },
            { key: "semana", label: "Semana" },
            { key: "mes", label: "Mês" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTimeFilter(item.key as typeof timeFilter)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
                timeFilter === item.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "todos", label: "Todos" },
            { key: "confirmadas", label: "Confirmadas" },
            { key: "pendentes", label: "Pendentes" },
            { key: "canceladas", label: "Canceladas" },
            { key: "problema", label: "Com problema", icon: AlertTriangle },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key as typeof statusFilter)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                  statusFilter === item.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground"
                }`}
              >
                {Icon ? <Icon size={14} /> : null}
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando…</p>
      ) : user?.role === "MOTORISTA" ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {filterDriverRoutes(routes, negotiations, searchQuery, timeFilter, statusFilter).length === 0 ? (
            <EmptyState
              title="Nenhuma rota encontrada para os filtros atuais."
              ctaLabel="Cadastrar minha rota"
              ctaTo="/app/criar-rota"
            />
          ) : (
            filterDriverRoutes(routes, negotiations, searchQuery, timeFilter, statusFilter).map((route) => (
              <DriverRouteCard
                key={route.id}
                route={route}
                negotiations={negotiations.filter((item) => item.routeId === route.id)}
                pendingDelete={pendingRouteId === route.id}
                onDelete={onDeleteRoute}
                onRefresh={reload}
              />
            ))
          )}
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {filterPassengerBookings(bookings, pendingChanges, searchQuery, timeFilter, statusFilter).length === 0 ? (
            <EmptyState title="Nenhuma carona encontrada para os filtros atuais." />
          ) : (
            filterPassengerBookings(bookings, pendingChanges, searchQuery, timeFilter, statusFilter)
              .map((booking) => (
              <PassengerBookingCard
                key={booking.id}
                booking={booking}
                pendingChange={pendingChanges.find((change) => change.bookingId === booking.id) ?? null}
                negotiations={negotiations.filter((n) => n.routeId === booking.route.id)}
                onCancel={onCancel}
                onRefresh={reload}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function DriverRouteCard({
  route,
  negotiations,
  pendingDelete,
  onDelete,
  onRefresh,
}: {
  route: MyRoute;
  negotiations: RideNegotiation[];
  pendingDelete: boolean;
  onDelete(routeId: string): Promise<void>;
  onRefresh(): Promise<void>;
}) {
  const hasMap = Boolean(route.map?.origin && route.map?.destination);
  const path =
    route.map?.geometry?.coordinates.map(([lng, lat]) => [lat, lng] as LatLng) ?? [];

  return (
    <article className="overflow-hidden rounded-[30px] border border-border bg-surface shadow-sm">
      <div className="relative">
        {hasMap ? (
          <RouteMap
            path={path}
            origin={[route.map.origin.lat, route.map.origin.lng]}
            destination={[route.map.destination.lat, route.map.destination.lng]}
            height={240}
            interactive={false}
            className="rounded-none border-0"
          />
        ) : (
          <div className="flex h-[240px] items-center justify-center bg-[linear-gradient(135deg,rgba(15,118,110,0.18),rgba(249,115,22,0.16))]">
            <div className="rounded-full border border-white/35 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur">
              Mapa da rota indisponível
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-semibold tracking-tight">{route.name}</p>
              <p className="mt-1 text-sm text-white/85">
                {route.originLabel} → {route.destinationLabel}
              </p>
            </div>
            <div className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur">
              {route.occupiedSeats}/{route.seats} vagas ocupadas
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">
              {route.departureTime}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">
              {route.weekdays.map((day) => WEEKDAY_LABELS[day]).join(" · ")}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">

        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <OccupancyTrack
          name={route.name}
          seats={route.seats}
          occupiedSeats={route.occupiedSeats}
          passengerNames={route.passengers.map((passenger) => passenger.name)}
          compact
        />
          <div className="rounded-[24px] border border-border bg-surface-2/60 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users size={14} />
              <span className="label-cockpit text-[10px]">Passageiros ativos</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {route.passengers.length > 0 ? (
                route.passengers.map((passenger) => (
                  <span
                    key={passenger.id}
                    className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs text-foreground"
                  >
                    <Avatar name={passenger.name} size={24} />
                    {passenger.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Nenhum passageiro ainda.</span>
              )}
            </div>
            {route.pendingApprovals && route.pendingApprovals.length > 0 ? (
              <div className="mt-4 border-t border-border pt-4">
                <p className="label-cockpit text-[10px] text-muted-foreground">
                  Solicitações privadas pendentes
                </p>
                <div className="mt-3 space-y-2">
                  {route.pendingApprovals.map((passenger) => (
                    <div
                      key={passenger.bookingId}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-background px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{passenger.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {passenger.course || "Sem curso informado"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => void approvePrivateBooking(route.id, passenger.bookingId).then(onRefresh)}
                          className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => void rejectPrivateBooking(route.id, passenger.bookingId).then(onRefresh)}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
            <Link
              to="/app/rota/$id"
              params={{ id: route.id }}
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
            >
              Ver rota
            </Link>
            <DeleteRouteDialog
              routeName={route.name}
              disabled={pendingDelete}
              onConfirm={() => void onDelete(route.id)}
              triggerLabel={pendingDelete ? "Excluindo..." : "Excluir"}
              triggerClassName="justify-center rounded-full px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="label-cockpit text-[10px] text-muted-foreground">Próximos embarques</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {route.nextRides.slice(0, 3).map((ride) => (
              <RidePillCard key={ride.id} scheduledAt={ride.scheduledAt} status={ride.status} />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <NegotiationPanel
            mode="driver"
            routeId={route.id}
            routeName={route.name}
            rideId={route.nextRides[0]?.id}
            origin={
              route.map?.origin ? [route.map.origin.lat, route.map.origin.lng] : ([-26.3045, -48.8487] as LatLng)
            }
            destination={
              route.map?.destination
                ? [route.map.destination.lat, route.map.destination.lng]
                : ([-26.2906, -48.8793] as LatLng)
            }
            path={path}
            negotiations={negotiations}
            onRefresh={onRefresh}
          />
        </div>
      </div>
    </article>
  );
}

function PassengerBookingCard({
  booking,
  pendingChange,
  negotiations,
  onCancel,
  onRefresh,
}: {
  booking: MyBooking;
  pendingChange: PendingRouteChange | null;
  negotiations: RideNegotiation[];
  onCancel(bookingId: string): Promise<void>;
  onRefresh(): Promise<void>;
}) {
  return (
    <article className="rounded-[30px] border border-border bg-surface p-5 shadow-sm lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
            {formatBookingStatus(booking.status)}
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
            {booking.route.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {booking.route.originLabel} → {booking.route.destinationLabel}
          </p>
        </div>
        <Link
          to="/app/chat/$rotaId"
          params={{ rotaId: booking.route.id }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-2/60 text-foreground"
          aria-label="Abrir chat da rota"
        >
          <MessageCircle size={16} />
        </Link>
      </div>

      <div className="mt-5 grid gap-4">
        {pendingChange ? (
          <div className="rounded-[24px] border border-warn/40 bg-warn/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label-cockpit text-[10px] text-warn">Rota alterada</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {pendingChange.diff.previousDepartureTime} → {pendingChange.diff.nextDepartureTime} · impacto de{" "}
                  {pendingChange.diff.impactMinutes >= 0 ? "+" : ""}
                  {pendingChange.diff.impactMinutes} min
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pendingChange.diff.previousOriginLabel} → {pendingChange.diff.nextOriginLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  Responda até {new Date(pendingChange.deadlineAt).toLocaleString("pt-BR")}.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() =>
                    void confirmRouteChange(pendingChange.id).then(async () => {
                      toast.success("Você confirmou permanência na rota.");
                      await onRefresh();
                    })
                  }
                  className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
                >
                  Continuar
                </button>
                <button
                  onClick={() =>
                    void declineRouteChange(pendingChange.id).then(async () => {
                      toast.success("Reserva cancelada sem penalidade.");
                      await onRefresh();
                    })
                  }
                  className="rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground"
                >
                  Cancelar sem penalidade
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="rounded-[24px] border border-border bg-surface-2/60 p-4">
            <p className="label-cockpit text-[10px] text-muted-foreground">Motorista</p>
            <div className="mt-3 inline-flex items-center gap-2">
              <Avatar name={booking.route.driver.name} src={booking.route.driver.photoUrl} size={28} />
              <span className="text-sm font-medium text-foreground">{booking.route.driver.name}</span>
            </div>
          </div>

          <div className="rounded-[24px] border border-border bg-surface-2/60 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarCheck size={14} />
              <span className="label-cockpit text-[10px]">Próxima corrida</span>
            </div>
            <p className="mt-3 text-base font-medium text-foreground">
              {booking.ride
                ? new Date(booking.ride.scheduledAt).toLocaleString("pt-BR")
                : booking.status === "PENDING_APPROVAL"
                  ? "Aguardando aprovação do motorista"
                  : "Próxima viagem em geração"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Dias: {booking.weekdays.map((day) => WEEKDAY_LABELS[day]).join(" · ")}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <Link
                to="/app/rota/$id"
                params={{ id: booking.route.id }}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Ver rota
              </Link>
              {booking.status === "PENDING_APPROVAL" ? (
                <span className="text-xs font-medium text-muted-foreground">
                  Solicitação enviada
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {booking.ride ? (
        <div className="mt-5">
          <NegotiationPanel
            mode="passenger"
            routeId={booking.route.id}
            routeName={booking.route.name}
            rideId={booking.ride.id}
            origin={[booking.route.originLat ?? 0, booking.route.originLng ?? 0] as LatLng}
            destination={[booking.route.destinationLat ?? 0, booking.route.destinationLng ?? 0] as LatLng}
            path={[
              [booking.route.originLat ?? 0, booking.route.originLng ?? 0] as LatLng,
              [booking.route.destinationLat ?? 0, booking.route.destinationLng ?? 0] as LatLng,
            ]}
            negotiations={negotiations}
            onRefresh={onRefresh}
            actionLabel="Negociar"
          />
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={() => void onCancel(booking.id)}
          disabled={booking.status === "CANCELLED"}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>
        {booking.ride ? (
          <Link
            to="/app/viagem-ativa"
            search={{ rideId: booking.ride.id }}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            Entrar na corrida
          </Link>
        ) : (
          <span className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary/45 px-4 py-3 text-sm font-medium text-primary-foreground/90">
            Entrar na corrida
          </span>
        )}
      </div>
    </article>
  );
}

function isWithinTimeFilter(dateLike: string | null | undefined, filter: "todos" | "hoje" | "semana" | "mes") {
  if (!dateLike) return filter === "todos";
  if (filter === "todos") return true;

  const now = new Date();
  const date = new Date(dateLike);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  if (filter === "hoje") {
    return date >= startOfToday && date < endOfToday;
  }

  const daysAhead = filter === "semana" ? 7 : 30;
  const end = new Date(startOfToday);
  end.setDate(end.getDate() + daysAhead);
  return date >= startOfToday && date < end;
}

function filterPassengerBookings(
  bookings: MyBooking[],
  pendingChanges: PendingRouteChange[],
  searchQuery: string,
  timeFilter: "todos" | "hoje" | "semana" | "mes",
  statusFilter: "todos" | "confirmadas" | "pendentes" | "canceladas" | "problema",
) {
  const query = searchQuery.trim().toLowerCase();

  return bookings.filter((booking) => {
    const pendingChange = pendingChanges.find((change) => change.bookingId === booking.id) ?? null;
    const hasIssue =
      Boolean(pendingChange) ||
      booking.ride?.status === "DISPUTE" ||
      booking.ride?.status === "CANCELLED";
    const referenceDate = booking.ride?.scheduledAt ?? booking.createdAt;

    const matchesQuery =
      !query ||
      [
        booking.route.name,
        booking.route.originLabel,
        booking.route.destinationLabel,
        booking.route.driver.name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

    const matchesStatus =
      statusFilter === "todos"
        ? true
        : statusFilter === "confirmadas"
          ? booking.status === "ACTIVE" && !pendingChange
          : statusFilter === "pendentes"
            ? booking.status === "PENDING_APPROVAL" || Boolean(pendingChange)
            : statusFilter === "canceladas"
              ? booking.status === "CANCELLED"
              : hasIssue;

    return matchesQuery && matchesStatus && isWithinTimeFilter(referenceDate, timeFilter);
  });
}

function filterDriverRoutes(
  routes: MyRoute[],
  negotiations: RideNegotiation[],
  searchQuery: string,
  timeFilter: "todos" | "hoje" | "semana" | "mes",
  statusFilter: "todos" | "confirmadas" | "pendentes" | "canceladas" | "problema",
) {
  const query = searchQuery.trim().toLowerCase();

  return routes.filter((route) => {
    const hasIssue =
      route.status === "PENDENTE_CONFIRMACAO" ||
      route.nextRides.some((ride) => ride.status === "DISPUTE" || ride.status === "CANCELLED");
    const hasPending =
      route.status === "PENDENTE_CONFIRMACAO" ||
      Boolean(route.pendingApprovals?.length) ||
      negotiations.some((item) => item.routeId === route.id && (item.status === "PENDING" || item.status === "COUNTERED"));
    const referenceDate = route.nextRides[0]?.scheduledAt ?? null;

    const matchesQuery =
      !query ||
      [
        route.name,
        route.originLabel,
        route.destinationLabel,
        route.passengers.map((passenger) => passenger.name).join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

    const matchesStatus =
      statusFilter === "todos"
        ? true
        : statusFilter === "confirmadas"
          ? route.status === "ATIVA"
          : statusFilter === "pendentes"
            ? hasPending
            : statusFilter === "canceladas"
              ? route.nextRides.every((ride) => ride.status === "CANCELLED")
              : hasIssue;

    return matchesQuery && matchesStatus && isWithinTimeFilter(referenceDate, timeFilter);
  });
}

function RidePillCard({ scheduledAt, status }: { scheduledAt: string; status: string }) {
  const date = new Date(scheduledAt);
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date);
  const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return (
    <div className="rounded-[22px] border border-border bg-surface-2/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-background px-3 py-2 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {month}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{day}</p>
          <p className="text-[11px] uppercase text-muted-foreground">{weekday}</p>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{time}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {formatRideStatus(status)}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  ctaLabel,
  ctaTo,
}: {
  title: string;
  ctaLabel?: string;
  ctaTo?: "/app/criar-rota";
}) {
  return (
    <div className="rounded-[30px] border border-dashed border-border bg-surface p-10 text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
      {ctaLabel && ctaTo ? (
        <Link
          to={ctaTo}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <PlusCircle size={15} /> {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
