import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Check,
  CalendarDays,
  CalendarRange,
  Clock3,
  MapPinned,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { AppBackButton } from "@/components/AppBackButton";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { Avatar, StarRating } from "@/components/Brand";
import { DeleteRouteDialog } from "@/components/DeleteRouteDialog";
import { NegotiationPanel } from "@/components/NegotiationPanel";
import { OccupancyTrack } from "@/components/OccupancyTrack";
import { RouteMap } from "@/components/RouteMap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createBooking,
  deleteRoute,
  getMyNegotiations,
  getRouteDetail,
  previewRouteChange,
  updateRoute,
  type BackendRouteDetail,
  type GeocodeSuggestion,
  type RideNegotiation,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRideStatus } from "@/lib/labels";
import type { LatLng } from "@/lib/types";
import { WEEKDAY_LABELS } from "@/lib/types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function estimateUber99(km: number) {
  return Math.max(12, +(6 + km * 2.8).toFixed(2));
}

const statusTone: Record<string, string> = {
  SCHEDULED: "bg-primary/10 text-primary",
  CONFIRMED: "bg-success/15 text-success",
  DISPUTE: "bg-warn/15 text-warn",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export function RotaDetalhePage({ id }: { id: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [route, setRoute] = React.useState<BackendRouteDetail | null>(null);
  const [days, setDays] = React.useState<number[]>([]);
  const [type, setType] = React.useState<"RECORRENTE" | "AVULSO">("RECORRENTE");
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [negotiations, setNegotiations] = React.useState<RideNegotiation[]>([]);
  const [confirmReservationOpen, setConfirmReservationOpen] = React.useState(false);
  const [reservationSuccessOpen, setReservationSuccessOpen] = React.useState(false);
  const [reservationSuccessReady, setReservationSuccessReady] = React.useState(false);
  const [editOrigin, setEditOrigin] = React.useState<GeocodeSuggestion | null>(null);
  const [editDestination, setEditDestination] = React.useState<GeocodeSuggestion | null>(null);
  const [editDepartureTime, setEditDepartureTime] = React.useState("07:30");
  const [editSeats, setEditSeats] = React.useState(4);
  const [editMode, setEditMode] = React.useState<"PUBLICA" | "PRIVADA" | "HIBRIDA">("PUBLICA");
  const [editPublicSeats, setEditPublicSeats] = React.useState(4);
  const [editPrivateSeats, setEditPrivateSeats] = React.useState(0);
  const [changePreview, setChangePreview] = React.useState<null | Awaited<ReturnType<typeof previewRouteChange>>>(null);

  const loadRoute = React.useCallback(async () => {
    return getRouteDetail(id);
  }, [id]);

  const canLoadNegotiations = React.useCallback(
    (routeData: BackendRouteDetail) => {
      if (!user) return false;
      const isOwner = user.role === "MOTORISTA" && user.id === routeData.driver.id;
      const isPassengerBooked = routeData.passengers.some((passenger) => passenger.id === user.id);
      return isOwner || isPassengerBooked;
    },
    [user],
  );

  const loadNegotiations = React.useCallback(
    async (routeData: BackendRouteDetail) => {
      if (!canLoadNegotiations(routeData)) return [] as RideNegotiation[];
      try {
        const negotiationData = await getMyNegotiations();
        return negotiationData.filter((item) => item.routeId === id);
      } catch {
        return [] as RideNegotiation[];
      }
    },
    [canLoadNegotiations, id],
  );

  const reloadNegotiations = React.useCallback(async () => {
    if (!route || !canLoadNegotiations(route)) {
      setNegotiations([]);
      return;
    }
    setNegotiations((await getMyNegotiations().catch(() => [])).filter((item) => item.routeId === id));
  }, [canLoadNegotiations, id, route]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadRoute()
      .then(async (data) => {
        if (cancelled) return;
        setRoute(data);
        setDays(data.weekdays);
        setEditOrigin({
          label: data.origin.label,
          lat: data.origin.lat,
          lng: data.origin.lng,
        });
        setEditDestination({
          label: data.destination.label,
          lat: data.destination.lat,
          lng: data.destination.lng,
        });
        setEditDepartureTime(data.departureTime);
        setEditSeats(data.seats);
        setEditMode(data.visibilityMode);
        setEditPublicSeats(data.publicSeats);
        setEditPrivateSeats(data.privateSeats);

        try {
          const negotiationData = await loadNegotiations(data);
          if (!cancelled) {
            setNegotiations(negotiationData);
          }
        } catch {
          if (!cancelled) {
            setNegotiations([]);
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Erro ao carregar rota.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadNegotiations, loadRoute]);

  React.useEffect(() => {
    if (!reservationSuccessOpen) {
      setReservationSuccessReady(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setReservationSuccessReady(true);
    }, 550);
    return () => window.clearTimeout(timer);
  }, [reservationSuccessOpen]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Carregando rota…</div>;
  }

  if (!route) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Rota não encontrada.{" "}
        <Link to="/app/buscar" className="text-primary">
          Voltar
        </Link>
      </div>
    );
  }

  const isOwner = user?.role === "MOTORISTA" && user.id === route.driver.id;
  const isPassengerBooked = route.passengers.some((passenger) => passenger.id === user?.id);
  const km = +(route.distanceMeters / 1000).toFixed(1);
  const minutes = Math.max(1, Math.round(route.durationSeconds / 60));
  const mapPath: LatLng[] =
    route.geometry?.coordinates.map(([lng, lat]) => [lat, lng] as LatLng) ?? [];

  const reserve = async () => {
    setSubmitting(true);
    try {
      await createBooking({
        routeId: route.id,
        weekdays: days,
        type,
      });
      const updatedRoute = await loadRoute();
      setRoute(updatedRoute);
      setDays(updatedRoute.weekdays);
      setNegotiations(await loadNegotiations(updatedRoute));
      setConfirmReservationOpen(false);
      setReservationSuccessOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao reservar.");
    } finally {
      setSubmitting(false);
    }
  };

  const removeRoute = async () => {
    setSubmitting(true);
    try {
      await deleteRoute(route.id);
      void navigate({ to: "/app/minhas-caronas" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir rota.");
    } finally {
      setSubmitting(false);
    }
  };

  const simulateChange = async () => {
    if (!route || !editOrigin || !editDestination) return;
    try {
      const preview = await previewRouteChange(route.id, {
        originLabel: editOrigin.label,
        originLat: editOrigin.lat,
        originLng: editOrigin.lng,
        destinationLabel: editDestination.label,
        destinationLat: editDestination.lat,
        destinationLng: editDestination.lng,
        departureTime: editDepartureTime,
      });
      setChangePreview(preview);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao simular alteração.");
    }
  };

  const saveRouteEdit = async () => {
    if (!route || !editOrigin || !editDestination) return;
    setSubmitting(true);
    try {
      const result = await updateRoute(route.id, {
        name: route.name,
        city: route.city,
        originLabel: editOrigin.label,
        originLat: editOrigin.lat,
        originLng: editOrigin.lng,
        destinationLabel: editDestination.label,
        destinationLat: editDestination.lat,
        destinationLng: editDestination.lng,
        weekdays: route.weekdays,
        departureTime: editDepartureTime,
        seats: editSeats,
        visibilityMode: editMode,
        publicSeats: editMode === "HIBRIDA" ? editPublicSeats : undefined,
        privateSeats: editMode === "HIBRIDA" ? editPrivateSeats : undefined,
      });
      toast.success(
        result.hasPendingConfirmations
          ? "Alteração salva. Os passageiros precisam reconfirmar a rota."
          : "Rota atualizada com sucesso.",
      );
      setRoute(await loadRoute());
      setChangePreview(result.change);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao editar rota.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
      <AppBackButton fallbackTo="/app/minhas-caronas" />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
            {isOwner ? "Sua rota" : "Rota disponível"}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
            {route.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground lg:text-[15px]">
            {route.origin.label} → {route.destination.label}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/app/chat/$rotaId"
            params={{ rotaId: route.id }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
          >
            <MessageCircle size={15} /> Chat
          </Link>
          {isOwner ? (
            <DeleteRouteDialog
              routeName={route.name}
              disabled={submitting}
              onConfirm={() => void removeRoute()}
              triggerClassName="rounded-full px-4 py-2.5 text-sm"
            />
          ) : null}
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-[34px] border border-border bg-surface shadow-sm">
        <div className="grid gap-0 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden">
            <RouteMap
              path={mapPath}
              origin={[route.origin.lat, route.origin.lng]}
              destination={[route.destination.lat, route.destination.lng]}
              height={420}
              className="rounded-none border-0"
              privacyMode={!isOwner}
              privacySeed={route.id}
            />
          </div>

          <div className="grid gap-px border-t border-border bg-border xl:border-l xl:border-t-0">
            <InfoTile
              icon={<MapPinned size={16} />}
              label="Distância"
              value={`${km} km`}
              description="Trajeto real calculado para a rota publicada"
            />
            <InfoTile
              icon={<Clock3 size={16} />}
              label="Duração"
              value={`${minutes} min`}
              description={`Saída às ${route.departureTime}`}
            />
            <InfoTile
              icon={<Sparkles size={16} />}
              label="Economia vs Uber/99"
              value={brl.format(estimateUber99(km) - 4)}
              description="Comparativo por trajeto com estimativa do app"
            />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <div className="space-y-6">
          <div className="rounded-[30px] border border-border bg-surface p-5 shadow-sm lg:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={route.driver.name}
                  size={52}
                  iniciais={route.driver.name.slice(0, 2).toUpperCase()}
                  src={route.driver.photoUrl}
                />
                <div>
                  <p className="text-lg font-semibold text-foreground">{route.driver.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <StarRating value={route.driver.rating ?? 5} />
                    <span>{route.driver.course || "Sem curso informado"}</span>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-md">
                <OccupancyTrack
                  name={route.driver.name}
                  seats={route.seats}
                  occupiedSeats={route.occupiedSeats}
                  passengerNames={route.passengers.map((passenger) => passenger.name)}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-[24px] border border-border bg-surface-2/60 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays size={15} />
                  <span className="label-cockpit text-[10px]">Dias da rota</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {route.weekdays.map((day) => (
                    <span
                      key={day}
                      className="rounded-full bg-background px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      {WEEKDAY_LABELS[day]}
                    </span>
                  ))}
                  <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    {route.departureTime}
                  </span>
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-surface-2/60 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users size={15} />
                  <span className="label-cockpit text-[10px]">Passageiros ativos</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {route.passengers.length > 0 ? (
                    route.passengers.map((passenger) => (
                      <span
                        key={passenger.id}
                        className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs text-foreground"
                      >
                        <Avatar name={passenger.name} size={22} />
                        {passenger.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Nenhum passageiro ainda.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-border bg-surface p-5 shadow-sm lg:p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet size={15} />
              <span className="label-cockpit text-[10px]">Reserva</span>
            </div>

            <div className="mt-4 inline-flex rounded-full border border-border bg-surface-2 p-1">
              {(["RECORRENTE", "AVULSO"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setType(option)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    type === option ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {option === "RECORRENTE" ? "Fixo" : "Avulso"}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {route.weekdays.map((day) => {
                const active = days.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() =>
                      setDays((current) =>
                        current.includes(day)
                          ? current.filter((value) => value !== day)
                          : [...current, day].sort(),
                      )
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {WEEKDAY_LABELS[day]}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="rounded-[24px] border border-border bg-surface-2/60 p-4">
                <p className="text-sm font-medium text-foreground">1 crédito bloqueado por reserva</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  O crédito é consumido só após confirmação da viagem.
                </p>
              </div>

              {user?.role === "PASSAGEIRO" ? (
                <button
                  onClick={() => setConfirmReservationOpen(true)}
                  disabled={days.length === 0 || submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <ShieldCheck size={15} /> {submitting ? "Reservando..." : "Reservar vaga"}
                </button>
              ) : (
                <span className="rounded-full border border-border px-4 py-3 text-sm text-muted-foreground">
                  Apenas passageiros podem reservar.
                </span>
              )}
            </div>
          </div>

          {isOwner ? (
            <div className="rounded-[30px] border border-border bg-surface p-5 shadow-sm lg:p-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays size={15} />
                <span className="label-cockpit text-[10px]">Editar recorrência futura</span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <AddressAutocomplete label="Nova origem" value={editOrigin} onChange={setEditOrigin} />
                </div>
                <div>
                  <AddressAutocomplete
                    label="Novo destino"
                    value={editDestination}
                    onChange={setEditDestination}
                  />
                </div>
                <label className="block text-sm">
                  <span className="text-muted-foreground">Novo horário</span>
                  <input
                    type="time"
                    value={editDepartureTime}
                    onChange={(e) => setEditDepartureTime(e.target.value)}
                    className="field-input mt-1"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-muted-foreground">Assentos totais</span>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={editSeats}
                    onChange={(e) => setEditSeats(Number(e.target.value))}
                    className="field-input mt-1"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  { key: "PUBLICA", label: "Pública" },
                  { key: "PRIVADA", label: "Privada" },
                  { key: "HIBRIDA", label: "Híbrida" },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setEditMode(mode.key as typeof editMode)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                      editMode === mode.key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface-2 text-foreground"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {editMode === "HIBRIDA" ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-muted-foreground">Vagas públicas</span>
                    <input
                      type="number"
                      min={0}
                      max={editSeats}
                      value={editPublicSeats}
                      onChange={(e) => {
                        const next = Math.max(0, Math.min(editSeats, Number(e.target.value)));
                        setEditPublicSeats(next);
                        setEditPrivateSeats(Math.max(0, editSeats - next));
                      }}
                      className="field-input mt-1"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-muted-foreground">Vagas privadas</span>
                    <input value={editPrivateSeats} readOnly className="field-input mt-1 bg-surface-2/60" />
                  </label>
                </div>
              ) : null}

              {changePreview ? (
                <div className="mt-4 rounded-[24px] border border-border bg-surface-2/60 p-4">
                  <p className="text-sm font-medium text-foreground">
                    {changePreview.previousDepartureTime} → {changePreview.nextDepartureTime}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {changePreview.previousOriginLabel} → {changePreview.nextOriginLabel}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Impacto estimado: {changePreview.impactMinutes >= 0 ? "+" : ""}
                    {changePreview.impactMinutes} min
                  </p>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => void simulateChange()}
                  className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
                >
                  Ver impacto
                </button>
                <button
                  onClick={() => void saveRouteEdit()}
                  disabled={submitting || !editOrigin || !editDestination}
                  className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Salvar nova versão
                </button>
              </div>
            </div>
          ) : null}

          {isOwner || isPassengerBooked || negotiations.length > 0 ? (
            <NegotiationPanel
              mode={isOwner ? "driver" : "passenger"}
              routeId={route.id}
              routeName={route.name}
              rideId={route.nextRides[0]?.id}
              origin={[route.origin.lat, route.origin.lng]}
              destination={[route.destination.lat, route.destination.lng]}
              path={mapPath}
              negotiations={negotiations}
              onRefresh={reloadNegotiations}
            />
          ) : null}
        </div>

        <div className="rounded-[30px] border border-border bg-surface p-5 shadow-sm lg:p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarRange size={15} />
            <span className="label-cockpit text-[10px]">Próximas viagens</span>
          </div>

          <div className="mt-5 space-y-5">
            {groupRidesByMonth(route.nextRides.slice(0, 6)).map((group) => (
              <div key={group.label}>
                <p className="mb-3 text-sm font-semibold text-foreground">{group.label}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.items.map((ride) => (
                    <RideCalendarCard key={ride.id} ride={ride} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={confirmReservationOpen} onOpenChange={setConfirmReservationOpen}>
        <DialogContent className="max-w-xl rounded-[28px] border-border bg-surface p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl tracking-tight text-foreground">
                Confirmar reserva
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Você vai bloquear 1 crédito para garantir vaga nessa rota.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 rounded-[24px] border border-border bg-surface-2/60 p-5">
              <p className="text-lg font-semibold text-foreground">{route.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {route.origin.label} → {route.destination.label}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ConfirmMetric
                  label="Tipo da reserva"
                  value={type === "RECORRENTE" ? "Fixo" : "Avulso"}
                />
                <ConfirmMetric
                  label="Crédito bloqueado"
                  value="1 crédito"
                />
                <ConfirmMetric
                  label="Dias"
                  value={days.map((day) => WEEKDAY_LABELS[day]).join(" · ")}
                />
                <ConfirmMetric label="Saída" value={route.departureTime} />
              </div>
            </div>
            <DialogFooter className="mt-6 flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                onClick={() => setConfirmReservationOpen(false)}
                className="rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground"
              >
                Revisar seleção
              </button>
              <button
                onClick={() => void reserve()}
                disabled={submitting || days.length === 0}
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {submitting ? "Garantindo vaga..." : "Confirmar reserva"}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {reservationSuccessOpen ? (
        <ReservationSuccessOverlay
          routeId={route.id}
          routeName={route.name}
          ready={reservationSuccessReady}
          onClose={() => setReservationSuccessOpen(false)}
        />
      ) : null}
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="bg-surface p-5 lg:p-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="label-cockpit text-[10px]">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function RideCalendarCard({
  ride,
}: {
  ride: BackendRouteDetail["nextRides"][number];
}) {
  const date = new Date(ride.scheduledAt);
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date);
  const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return (
    <article className="rounded-[26px] border border-border bg-surface-2/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-[22px] bg-background px-3 py-2 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {month}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{day}</p>
          <p className="text-[11px] uppercase text-muted-foreground">{weekday}</p>
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{time}</p>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-medium uppercase ${statusTone[ride.status] ?? "bg-surface text-muted-foreground"}`}
          >
            {formatRideStatus(ride.status)}
          </span>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            {ride.driverConfirmedAt ? <p>Motorista confirmou embarque</p> : null}
            {ride.passengerConfirmedAt ? <p>Passageiro confirmou viagem</p> : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function groupRidesByMonth(rides: BackendRouteDetail["nextRides"]) {
  const map = new Map<string, BackendRouteDetail["nextRides"]>();
  for (const ride of rides) {
    const label = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(new Date(ride.scheduledAt));
    const current = map.get(label) ?? [];
    current.push(ride);
    map.set(label, current);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function ConfirmMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-border bg-background/90 p-3">
      <p className="label-cockpit text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function ReservationSuccessOverlay({
  routeId,
  routeName,
  ready,
  onClose,
}: {
  routeId: string;
  routeName: string;
  ready: boolean;
  onClose(): void;
}) {
  return (
    <div className="fixed inset-0 z-[120] overflow-hidden bg-background/92 backdrop-blur-md">
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary animate-reservation-burst" />

      <div
        className={`relative z-10 flex min-h-screen items-center justify-center p-6 transition-opacity duration-300 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-background text-primary shadow-[0_30px_80px_rgba(0,0,0,0.15)] animate-reservation-badge">
            <Check size={42} strokeWidth={3} />
          </div>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white animate-reservation-fade-up">
            Vaga garantida
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/85 animate-reservation-fade-up">
            Sua reserva na rota <span className="font-semibold text-white">{routeName}</span> foi
            criada. O próximo passo agora é acompanhar tudo em Minhas caronas ou abrir o chat.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              to="/app/chat/$rotaId"
              params={{ rotaId: routeId }}
              className="text-lg font-semibold text-white"
            >
              Abrir chat
            </Link>
            <Link
              to="/app/minhas-caronas"
              className="text-lg font-semibold text-white"
            >
              Ir para Minhas caronas
            </Link>
          </div>

          <button
            onClick={onClose}
            className="mt-5 text-base font-medium text-white/65 transition-colors hover:text-white"
          >
            Continuar navegando
          </button>
        </div>
      </div>
    </div>
  );
}
