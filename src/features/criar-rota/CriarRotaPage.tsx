import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock, MapPin, PlusCircle, Route as RouteIcon, Users } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { diasSemanaLabels } from "@/data/mock";
import { previewRoute, createRoute, type GeocodeSuggestion } from "@/lib/api";

export function CriarRotaPage() {
  const navigate = useNavigate();
  const [dias, setDias] = React.useState<number[]>([1, 2, 3, 4, 5]);
  const [nome, setNome] = React.useState("");
  const [horarioIda, setHorarioIda] = React.useState("07:30");
  const [vagas, setVagas] = React.useState(4);
  const [originPlace, setOriginPlace] = React.useState<GeocodeSuggestion | null>(null);
  const [destinationPlace, setDestinationPlace] = React.useState<GeocodeSuggestion | null>(null);
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

  const km = preview ? +(preview.distanceMeters / 1000).toFixed(1) : 0;
  const autoNome =
    originPlace && destinationPlace
      ? `${originPlace.label.split(",")[0]} → ${destinationPlace.label.split(",")[0]}`
      : "";

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
      <Link
        to="/app/minhas-caronas"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={12} /> Voltar
      </Link>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <form onSubmit={(e) => void submit(e)} className="rounded-xl border border-border bg-surface p-5">
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
                    {diasSemanaLabels[d]}
                  </button>
                );
              })}
            </div>
          </div>

          {submitError && (
            <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={
              dias.length === 0 ||
              previewLoading ||
              !preview ||
              !originPlace ||
              !destinationPlace ||
              submitLoading
            }
            className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusCircle size={14} /> {submitLoading ? "Publicando…" : "Publicar rota"}
          </button>
        </form>

        <aside className="space-y-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="label-cockpit text-[10px] text-muted-foreground">Resumo</p>
            <div className="mt-4 overflow-hidden rounded-lg">
              <RouteMap
                path={preview?.path ?? []}
                origin={originPlace ? [originPlace.lat, originPlace.lng] : undefined}
                destination={destinationPlace ? [destinationPlace.lat, destinationPlace.lng] : undefined}
                height={220}
                interactive={false}
              />
            </div>
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
              {preview?.provider && (
                <Row
                  icon={<RouteIcon size={14} />}
                  label="Provider"
                  value={preview.provider.toUpperCase()}
                />
              )}
            </div>
            {previewError ? (
              <p className="mt-3 text-xs leading-relaxed text-destructive">{previewError}</p>
            ) : null}
          </div>
          <div className="rounded-xl border border-warn/40 bg-warn/5 p-4">
            <p className="text-sm font-medium text-foreground">Regra de cancelamento</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              No MVP, cancelar com menos de 2h vira histórico de cancelamento e pode reter 50% dos
              créditos reservados.
            </p>
          </div>
        </aside>
      </div>
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
