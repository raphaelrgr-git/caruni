import * as React from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  MessageSquare,
  X,
} from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { RouteMap } from "@/components/RouteMap";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { reverseGeocodeLatLng } from "@/lib/google-maps";
import {
  acceptNegotiation,
  cancelNegotiation,
  counterNegotiation,
  createNegotiation,
  previewNegotiation,
  rejectNegotiation,
  type GeocodeSuggestion,
  type RideNegotiation,
} from "@/lib/api";
import { formatNegotiationStatus } from "@/lib/labels";
import type { LatLng } from "@/lib/types";

const MIN_EXTRA_AMOUNT_CENTS = 400;
const MAX_EXTRA_AMOUNT_CENTS = 3000;
const EXTRA_AMOUNT_STEP_CENTS = 50;

function statusClass(status: RideNegotiation["status"]) {
  switch (status) {
    case "ACCEPTED":
      return "bg-success/15 text-success";
    case "REJECTED":
      return "bg-destructive/10 text-destructive";
    case "COUNTERED":
      return "bg-primary/10 text-primary";
    case "PENDING":
      return "bg-warn/10 text-warn";
    default:
      return "bg-surface-2 text-muted-foreground";
  }
}

function currentPoint(negotiation: RideNegotiation): LatLng {
  if (negotiation.status === "COUNTERED" && negotiation.counterLatReal && negotiation.counterLngReal) {
    return [negotiation.counterLatReal, negotiation.counterLngReal];
  }
  return [negotiation.proposedLatReal, negotiation.proposedLngReal];
}

function currentExtraAmountCents(negotiation: RideNegotiation) {
  if (negotiation.status === "COUNTERED" && negotiation.counterExtraAmountCents != null) {
    return negotiation.counterExtraAmountCents;
  }
  return negotiation.extraAmountCents;
}

function formatExtra(amountCents: number) {
  return `R$ ${(amountCents / 100).toFixed(2).replace(".", ",")}`;
}

export function NegotiationPanel({
  rideId,
  routeId,
  routeName,
  origin,
  destination,
  path,
  negotiations,
  mode,
  actionLabel = "Negociar ponto",
  onRefresh,
}: {
  rideId?: string;
  routeId: string;
  routeName: string;
  origin: LatLng;
  destination: LatLng;
  path: LatLng[];
  negotiations: RideNegotiation[];
  mode: "driver" | "passenger";
  actionLabel?: string;
  onRefresh(): Promise<void>;
}) {
  const [preview, setPreview] = React.useState<{ minutes: number; meters: number } | null>(null);
  const [place, setPlace] = React.useState<GeocodeSuggestion | null>(null);
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerMode, setDrawerMode] = React.useState<"create" | "counter">("create");
  const [editingNegotiation, setEditingNegotiation] = React.useState<RideNegotiation | null>(null);
  const [extraAmountCents, setExtraAmountCents] = React.useState(MIN_EXTRA_AMOUNT_CENTS);
  const openNegotiations = negotiations.filter((item) =>
    ["PENDING", "COUNTERED", "ACCEPTED"].includes(item.status),
  );

  const previewRideId =
    drawerMode === "counter" ? editingNegotiation?.rideInstanceId : rideId;

  React.useEffect(() => {
    if (!previewRideId || !place) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    void previewNegotiation(previewRideId, { lat: place.lat, lng: place.lng })
      .then((data) => {
        if (!cancelled) {
          setPreview({
            minutes: data.estimatedDetourMinutes,
            meters: data.estimatedDetourMeters,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [place, previewRideId]);

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditingNegotiation(null);
    setPlace(null);
    setMessage("");
    setPreview(null);
    setExtraAmountCents(MIN_EXTRA_AMOUNT_CENTS);
    setDrawerOpen(true);
  };

  const openCounterDrawer = (negotiation: RideNegotiation) => {
    const point = currentPoint(negotiation);
    setDrawerMode("counter");
    setEditingNegotiation(negotiation);
    setPlace({
      label: "Ponto selecionado no mapa",
      lat: point[0],
      lng: point[1],
    });
    setMessage(negotiation.driverMessage ?? "");
    setPreview({
      minutes: negotiation.estimatedDetourMinutes,
      meters: negotiation.estimatedDetourMeters,
    });
    setExtraAmountCents(currentExtraAmountCents(negotiation));
    setDrawerOpen(true);
  };

  const adjustExtra = (direction: -1 | 1) => {
    setExtraAmountCents((current) =>
      Math.min(MAX_EXTRA_AMOUNT_CENTS, Math.max(MIN_EXTRA_AMOUNT_CENTS, current + direction * EXTRA_AMOUNT_STEP_CENTS)),
    );
  };

  const handlePointSelection = async ([lat, lng]: LatLng) => {
    try {
      const nextPlace = await reverseGeocodeLatLng(lat, lng);
      setPlace(nextPlace);
    } catch {
      setPlace({
        label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng,
      });
    }
  };

  const sendProposal = async () => {
    if (!previewRideId || !place) return;
    setLoading(true);
    try {
      if (drawerMode === "counter" && editingNegotiation) {
        await counterNegotiation(editingNegotiation.id, {
          lat: place.lat,
          lng: place.lng,
          driverMessage: message || undefined,
          counterExtraAmountCents: extraAmountCents,
        });
        toast.success("Contraproposta enviada.");
      } else {
        await createNegotiation(previewRideId, {
          lat: place.lat,
          lng: place.lng,
          passengerMessage: message || undefined,
          extraAmountCents,
        });
        toast.success("Proposta enviada ao motorista.");
      }
      setDrawerOpen(false);
      setPlace(null);
      setMessage("");
      setPreview(null);
      setEditingNegotiation(null);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar proposta.");
    } finally {
      setLoading(false);
    }
  };

  const run = async (action: () => Promise<unknown>, success: string) => {
    setLoading(true);
    try {
      await action();
      toast.success(success);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar negociação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label-cockpit text-[10px] text-muted-foreground">Negociação de ponto</p>
          <h3 className="mt-1 text-xl font-semibold text-foreground">
            {mode === "driver" ? "Pedidos recebidos" : "Seu ponto de encontro"}
          </h3>
        </div>
        {mode === "passenger" && rideId ? (
          <button
            onClick={openCreateDrawer}
            className="inline-flex items-center rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        {openNegotiations.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-border bg-surface-2/40 p-5 text-sm text-muted-foreground">
            Nenhuma negociação ativa para {routeName.toLowerCase()}.
          </div>
        ) : null}

        {openNegotiations.map((negotiation) => {
          const stop = currentPoint(negotiation);
          const extra = currentExtraAmountCents(negotiation);
          return (
            <div key={negotiation.id} className="rounded-[24px] border border-border bg-surface-2/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${statusClass(negotiation.status)}`}>
                    {formatNegotiationStatus(negotiation.status)}
                  </span>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {mode === "driver" ? negotiation.passenger.name : negotiation.driver.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    +{negotiation.estimatedDetourMinutes} min · +{(negotiation.estimatedDetourMeters / 1000).toFixed(1)} km · extra de {formatExtra(extra)}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{new Date(negotiation.expiresAt).toLocaleTimeString("pt-BR")}</p>
                  <p className="mt-1">Expira hoje</p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-[20px]">
                <RouteMap
                  path={negotiation.acceptedGeometry?.coordinates?.map(([lng, lat]) => [lat, lng] as LatLng) ?? path}
                  origin={origin}
                  destination={destination}
                  stops={[stop]}
                  height={220}
                  interactive={false}
                  privacyMode
                  privacySeed={`${routeId}-${negotiation.id}`}
                />
              </div>

              {negotiation.passengerMessage ? (
                <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare size={14} /> {negotiation.passengerMessage}
                </p>
              ) : null}
              {negotiation.driverMessage ? (
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare size={14} /> {negotiation.driverMessage}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {mode === "driver" && negotiation.status !== "ACCEPTED" ? (
                  <>
                    <button
                      onClick={() => void run(() => acceptNegotiation(negotiation.id), "Proposta aceita.")}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                      <Check size={14} /> Aceitar
                    </button>
                    <button
                      onClick={() => void run(() => rejectNegotiation(negotiation.id), "Proposta recusada.")}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
                    >
                      <X size={14} /> Recusar
                    </button>
                    <button
                      onClick={() => openCounterDrawer(negotiation)}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
                    >
                      <MapPin size={14} /> Contrapropor
                    </button>
                  </>
                ) : null}

                {mode === "passenger" && negotiation.status === "COUNTERED" ? (
                  <>
                    <button
                      onClick={() => void run(() => acceptNegotiation(negotiation.id), "Contraproposta aceita.")}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                      <Check size={14} /> Aceitar contraproposta
                    </button>
                    <button
                      onClick={() => void run(() => cancelNegotiation(negotiation.id), "Negociação cancelada.")}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
                    >
                      <X size={14} /> Recusar contraproposta
                    </button>
                  </>
                ) : null}

                {mode === "passenger" && negotiation.status === "PENDING" ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-2.5 text-sm text-muted-foreground">
                    <Clock3 size={14} /> Aguardando resposta do motorista
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="rounded-t-[28px] border-border bg-background">
          <DrawerHeader className="px-5 pt-4 text-left">
            <DrawerTitle className="text-2xl text-foreground">
              {drawerMode === "counter" ? "Enviar contraproposta" : "Negociar ponto de encontro"}
            </DrawerTitle>
            <DrawerDescription>
              Ajuste o ponto no mapa ou pelo endereço e defina o adicional para o motorista.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-5 pb-2">
            <div className="rounded-[24px] border border-border bg-surface p-4">
              <p className="text-sm font-medium text-foreground">{routeName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {typeof origin[0] === "number"
                  ? `${origin[0].toFixed(3)}, ${origin[1].toFixed(3)} → ${destination[0].toFixed(3)}, ${destination[1].toFixed(3)}`
                  : "Coordenadas não disponíveis"}
              </p>
            </div>

            <div className="mt-4">
              <AddressAutocomplete
                label="Escolha o ponto"
                value={place}
                onChange={setPlace}
                placeholder="Digite o endereço ou clique no mapa"
              />
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 180))}
              placeholder={drawerMode === "counter" ? "Mensagem para o passageiro" : "Mensagem para o motorista"}
              rows={3}
              className="field-input mt-3 resize-none"
            />

            <div className="mt-4 overflow-hidden rounded-[24px]">
              <RouteMap
                path={path}
                origin={origin}
                destination={destination}
                stops={place ? [[place.lat, place.lng]] : undefined}
                selectedPoint={place ? [place.lat, place.lng] : undefined}
                height={250}
                interactive
                selectable
                onSelectPoint={(point) => void handlePointSelection(point)}
                privacyMode
                privacySeed={`${routeId}-${drawerMode}`}
              />
            </div>

            {preview ? (
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span className="rounded-full bg-surface px-3 py-1.5">+{preview.minutes} min</span>
                <span className="rounded-full bg-surface px-3 py-1.5">
                  +{(preview.meters / 1000).toFixed(1)} km
                </span>
              </div>
            ) : null}

            <div className="mt-5 rounded-[24px] border border-border bg-surface p-4">
              <p className="label-cockpit text-[10px] text-muted-foreground">Adicional para o motorista</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => adjustExtra(-1)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-foreground"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="text-center">
                  <p className="text-3xl font-semibold text-foreground">{formatExtra(extraAmountCents)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">de R$ 4,00 até R$ 30,00</p>
                </div>
                <button
                  type="button"
                  onClick={() => adjustExtra(1)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-foreground"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <DrawerFooter className="px-5 pb-6">
            <button
              onClick={() => void sendProposal()}
              disabled={!place || loading}
              className="rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {drawerMode === "counter" ? "Enviar contraproposta" : "Enviar proposta"}
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              className="rounded-full border border-border px-4 py-3 text-sm font-medium text-foreground"
            >
              Fechar
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
