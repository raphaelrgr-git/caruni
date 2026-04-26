import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Crosshair, MapPin, PlusCircle, Route as RouteIcon, Users } from "lucide-react";
import { AppBackButton } from "@/components/AppBackButton";
import { RouteMap } from "@/components/RouteMap";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { reverseGeocodeLatLng } from "@/lib/google-maps";
import { previewRoute, createRoute, type GeocodeSuggestion } from "@/lib/api";
import { WEEKDAY_LABELS } from "@/lib/types";

export function CriarRotaPage() {
  const navigate = useNavigate();
  const [dias, setDias] = React.useState<number[]>([1, 2, 3, 4, 5]);
  const [nome, setNome] = React.useState("");
  const [horarioIda, setHorarioIda] = React.useState("07:30");
  const [vagas, setVagas] = React.useState(4);
  const [visibilityMode, setVisibilityMode] = React.useState<"PUBLICA" | "PRIVADA" | "HIBRIDA">("PUBLICA");
  const [publicSeats, setPublicSeats] = React.useState(2);
  const [privateSeats, setPrivateSeats] = React.useState(2);
  const [originPlace, setOriginPlace] = React.useState<GeocodeSuggestion | null>(null);
  const [destinationPlace, setDestinationPlace] = React.useState<GeocodeSuggestion | null>(null);
  const [mapTarget, setMapTarget] = React.useState<"origin" | "destination">("origin");
  const [preview, setPreview] = React.useState<{
    path: [number, number][];
    distanceMeters: number;
    durationSeconds: number;
    provider: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (visibilityMode !== "HIBRIDA") return;
    if (publicSeats + privateSeats === vagas) return;
    setPublicSeats(Math.min(publicSeats, vagas));
    setPrivateSeats(Math.max(0, vagas - Math.min(publicSeats, vagas)));
  }, [privateSeats, publicSeats, vagas, visibilityMode]);

  const km = preview ? +(preview.distanceMeters / 1000).toFixed(1) : 0;
  const autoNome =
    originPlace && destinationPlace
      ? `${originPlace.label.split(",")[0]} → ${destinationPlace.label.split(",")[0]}`
      : "";

  const handleMapSelection = async ([lat, lng]: [number, number]) => {
    try {
      const place = await reverseGeocodeLatLng(lat, lng);
      if (mapTarget === "origin") {
        setOriginPlace(place);
      } else {
        setDestinationPlace(place);
      }
    } catch {
      const fallback = {
        label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng,
      };
      if (mapTarget === "origin") {
        setOriginPlace(fallback);
      } else {
        setDestinationPlace(fallback);
      }
    }
  };

  // Recalculate route preview whenever origin or destination changes
  React.useEffect(() => {
    if (!originPlace || !destinationPlace) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);

    void previewRoute({
      origin: { lat: originPlace.lat, lng: originPlace.lng },
      destination: { lat: destinationPlace.lat, lng: destinationPlace.lng },
    })
      .then((result) => {
        if (cancelled) return;
        setPreview(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPreview(null);
        setPreviewError(error instanceof Error ? error.message : "Falha ao calcular rota real.");
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [originPlace, destinationPlace]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!preview || !originPlace || !destinationPlace || dias.length === 0) return;
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      await createRoute({
        name: nome || autoNome,
        originLabel: originPlace.label.split(",")[0],
        originLat: originPlace.lat,
        originLng: originPlace.lng,
        destinationLabel: destinationPlace.label.split(",")[0],
        destinationLat: destinationPlace.lat,
        destinationLng: destinationPlace.lng,
        weekdays: dias,
        departureTime: horarioIda,
        seats: vagas,
        visibilityMode,
        publicSeats: visibilityMode === "HIBRIDA" ? publicSeats : undefined,
        privateSeats: visibilityMode === "HIBRIDA" ? privateSeats : undefined,
      });
      void navigate({ to: "/app/minhas-caronas" });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao publicar rota.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 lg:py-10">
      <AppBackButton fallbackTo="/app/minhas-caronas" className="text-xs" />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <form id="criar-rota-form" onSubmit={(e) => void submit(e)} className="rounded-xl border border-border bg-surface p-5">
          <div>
            <p className="label-cockpit text-[10px] text-muted-foreground">Motorista</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Cadastrar rota recorrente
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Publique uma rotina semanal simples. Passageiros reservam dias fixos ou avulsos.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Nome da rota" className="sm:col-span-2">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={autoNome || "Ex: Bairro América → UDESC"}
                className="field-input"
              />
            </Field>

            <div className="space-y-1.5">
              <AddressAutocomplete
                label="Origem"
                value={originPlace}
                onChange={setOriginPlace}
                placeholder="Digite o endereço de partida"
              />
            </div>
            <div className="space-y-1.5">
              <AddressAutocomplete
                label="Destino"
                value={destinationPlace}
                onChange={setDestinationPlace}
                placeholder="Digite o endereço de chegada"
              />
            </div>

            <Field label="Horário de saída">
              <input
                type="time"
                value={horarioIda}
                onChange={(e) => setHorarioIda(e.target.value)}
                className="field-input"
                required
              />
            </Field>
            <Field label="Vagas">
              <input
                type="number"
                min={1}
                max={7}
                value={vagas}
                onChange={(e) => setVagas(Number(e.target.value))}
                className="field-input"
                required
              />
            </Field>
            <Field label="Modo da carona" className="sm:col-span-2">
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { key: "PUBLICA", label: "Pública" },
                  { key: "PRIVADA", label: "Privada" },
                  { key: "HIBRIDA", label: "Híbrida" },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setVisibilityMode(mode.key as typeof visibilityMode)}
                    className={`rounded-xl border px-3 py-3 text-sm font-medium ${
                      visibilityMode === mode.key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface-2 text-foreground"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </Field>
            {visibilityMode === "HIBRIDA" ? (
              <>
                <Field label="Vagas públicas">
                  <input
                    type="number"
                    min={0}
                    max={vagas}
                    value={publicSeats}
                    onChange={(e) => {
                      const next = Math.max(0, Math.min(vagas, Number(e.target.value)));
                      setPublicSeats(next);
                      setPrivateSeats(Math.max(0, vagas - next));
                    }}
                    className="field-input"
                  />
                </Field>
                <Field label="Vagas privadas">
                  <input type="number" value={privateSeats} readOnly className="field-input bg-surface-2/60" />
                </Field>
              </>
            ) : null}
          </div>

          <div className="mt-5">
            <p className="label-cockpit text-[10px] text-muted-foreground">Dias da semana</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const ativo = dias.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setDias((old) =>
                        old.includes(d) ? old.filter((x) => x !== d) : [...old, d].sort(),
                      )
                    }
                    className={`num rounded-md border px-3 py-2 text-xs transition-colors ${
                      ativo
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {WEEKDAY_LABELS[d]}
                  </button>
                );
              })}
            </div>
          </div>

        </form>

        <aside className="space-y-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="label-cockpit text-[10px] text-muted-foreground">Resumo</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMapTarget("origin")}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                  mapTarget === "origin"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 text-muted-foreground"
                }`}
              >
                <Crosshair size={13} /> Selecionar origem no mapa
              </button>
              <button
                type="button"
                onClick={() => setMapTarget("destination")}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                  mapTarget === "destination"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 text-muted-foreground"
                }`}
              >
                <Crosshair size={13} /> Selecionar destino no mapa
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg">
              <RouteMap
                path={preview?.path ?? []}
                origin={originPlace ? [originPlace.lat, originPlace.lng] : undefined}
                destination={destinationPlace ? [destinationPlace.lat, destinationPlace.lng] : undefined}
                selectedPoint={
                  mapTarget === "origin"
                    ? originPlace
                      ? [originPlace.lat, originPlace.lng]
                      : undefined
                    : destinationPlace
                      ? [destinationPlace.lat, destinationPlace.lng]
                      : undefined
                }
                height={220}
                interactive
                selectable
                onSelectPoint={(point) => void handleMapSelection(point)}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Clique no mapa para definir {mapTarget === "origin" ? "a origem" : "o destino"} ou
              use os campos de endereço acima.
            </p>
            <div className="mt-4 space-y-3 text-sm">
              {originPlace && destinationPlace && (
                <Row
                  icon={<MapPin size={14} />}
                  label="Trajeto"
                  value={`${originPlace.label.split(",")[0]} → ${destinationPlace.label.split(",")[0]}`}
                />
              )}
              <Row icon={<Clock size={14} />} label="Saída" value={horarioIda} />
              <Row icon={<Users size={14} />} label="Capacidade" value={`${vagas} vagas`} />
              <Row
                icon={<RouteIcon size={14} />}
                label="Distância estimada"
                value={
                  !originPlace || !destinationPlace
                    ? "Informe origem e destino"
                    : previewLoading
                      ? "Calculando..."
                      : preview
                        ? `${km} km`
                        : "Rota indisponível"
                }
                strong
              />
              <Row
                icon={<Clock size={14} />}
                label="Tempo estimado"
                value={
                  preview && !previewLoading
                    ? `${Math.max(1, Math.round(preview.durationSeconds / 60))} min`
                    : previewLoading
                      ? "Calculando..."
                      : "–"
                }
              />
            </div>
            {previewError ? (
              <p className="mt-3 text-xs leading-relaxed text-destructive">{previewError}</p>
            ) : null}
          </div>
        </aside>
      </div>

      {submitError && (
        <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        form="criar-rota-form"
        disabled={!preview || !originPlace || !destinationPlace || dias.length === 0 || submitLoading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PlusCircle size={16} />
        {submitLoading ? "Publicando…" : "Publicar rota"}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="label-cockpit text-[10px] text-muted-foreground">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function Row({
  icon,
  label,
  value,
  strong,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={`mt-0.5 ${strong ? "num text-base font-semibold text-primary" : "text-sm text-foreground"}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
