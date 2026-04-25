import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Search, Filter, ShieldCheck } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { Avatar, StarRating } from "@/components/Brand";
import { formatBRL } from "@/data/mock";
import { estimateUber99, useCaruniStore } from "@/data/store";
import { getRoutes, getRouteDetail, type BackendRoute, type BackendRouteDetail } from "@/lib/api";
import type { LatLng } from "@/data/mock";

export function BuscarPage() {
  const { rotas } = useCaruniStore();
  const [origem, setOrigem] = React.useState("");
  const [destino, setDestino] = React.useState("");
  const [backendRoutes, setBackendRoutes] = React.useState<BackendRoute[] | null>(null);
  const [backendLoading, setBackendLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [selectedDetail, setSelectedDetail] = React.useState<BackendRouteDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  // Fetch routes from backend on mount and when search terms change
  React.useEffect(() => {
    let cancelled = false;
    setBackendLoading(true);
    getRoutes({
      origin: origem.trim() || undefined,
      destination: destino.trim() || undefined,
    })
      .then((routes) => {
        if (cancelled) return;
        setBackendRoutes(routes);
        if (routes.length > 0 && !selectedId) {
          setSelectedId(routes[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setBackendRoutes(null);
      })
      .finally(() => {
        if (!cancelled) setBackendLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origem, destino]);

  // Fetch detail when a backend route is selected
  React.useEffect(() => {
    if (!selectedId || !backendRoutes?.some((r) => r.id === selectedId)) {
      setSelectedDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    getRouteDetail(selectedId)
      .then((detail) => {
        if (!cancelled) setSelectedDetail(detail);
      })
      .catch(() => {
        if (!cancelled) setSelectedDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, backendRoutes]);

  // Decide which routes to render
  const usingBackend = backendRoutes !== null && backendRoutes.length > 0;

  // Fallback mock routes filtered by text
  const mockFiltered = React.useMemo(() => {
    if (usingBackend) return [];
    return rotas.filter((rota) => {
      const haystack = `${rota.nome} ${rota.origem.label} ${rota.destino.label}`.toLowerCase();
      return [origem, destino].every((term) => haystack.includes(term.toLowerCase().trim()));
    });
  }, [usingBackend, rotas, origem, destino]);

  // Map path for the selected route
  const mapPath: LatLng[] = React.useMemo(() => {
    if (usingBackend && selectedDetail?.geometry) {
      return selectedDetail.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng);
    }
    if (!usingBackend) {
      const r = rotas.find((x) => x.id === selectedId) ?? rotas[0];
      return r?.caminho ?? [];
    }
    return [];
  }, [usingBackend, selectedDetail, rotas, selectedId]);

  const mapOrigin: LatLng | undefined = React.useMemo(() => {
    if (usingBackend && selectedDetail) {
      return [selectedDetail.origin.lat, selectedDetail.origin.lng];
    }
    if (!usingBackend) {
      const r = rotas.find((x) => x.id === selectedId) ?? rotas[0];
      return r?.origem.coord;
    }
    return undefined;
  }, [usingBackend, selectedDetail, rotas, selectedId]);

  const mapDestination: LatLng | undefined = React.useMemo(() => {
    if (usingBackend && selectedDetail) {
      return [selectedDetail.destination.lat, selectedDetail.destination.lng];
    }
    if (!usingBackend) {
      const r = rotas.find((x) => x.id === selectedId) ?? rotas[0];
      return r?.destino.coord;
    }
    return undefined;
  }, [usingBackend, selectedDetail, rotas, selectedId]);

  const totalCount = usingBackend ? backendRoutes.length : rotas.length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Buscar carona</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {backendLoading
            ? "Buscando rotas…"
            : `${totalCount} rota(s) disponível(is)`}
          {!usingBackend && !backendLoading && " (dados locais)"}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <Search size={14} className="text-muted-foreground" />
          <input
            placeholder="Origem (ex: Centro, Bairro América)"
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <label className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <Search size={14} className="text-muted-foreground" />
          <input
            placeholder="Destino (ex: UDESC, UNIVILLE)"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <button className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-2">
          <Filter size={13} /> Filtros
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-xl border border-border bg-surface lg:col-span-3">
          <RouteMap
            path={mapPath}
            origin={mapOrigin}
            destination={mapDestination}
            height={420}
          />
        </div>

        <div className="flex flex-col gap-2 lg:col-span-2">
          {usingBackend
            ? backendRoutes.map((rt) => {
                const isSel = rt.id === selectedId;
                const km = +(rt.distanceMeters / 1000).toFixed(1);
                const vagasLivres = rt.seats - rt.occupiedSeats;
                return (
                  <button
                    key={rt.id}
                    onClick={() => setSelectedId(rt.id)}
                    className={`text-left rounded-lg border p-4 transition-colors ${
                      isSel
                        ? "border-primary bg-primary/5"
                        : "border-border bg-surface hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{rt.name}</p>
                        <p className="num mt-0.5 text-[11px] text-muted-foreground">
                          {rt.departureTime} · {km} km · {vagasLivres} vaga(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="num text-base font-semibold text-foreground">1 crédito</p>
                        <p className="num text-[10px] text-muted-foreground">
                          Uber/99: {formatBRL(estimateUber99(km))}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Avatar name={rt.driver.name} size={26} iniciais={rt.driver.name.slice(0, 2).toUpperCase()} />
                      <span className="text-xs text-foreground">{rt.driver.name.split(" ")[0]}</span>
                      {isSel && selectedDetail?.driver.rating != null && (
                        <span className="ml-auto">
                          <StarRating value={selectedDetail.driver.rating} />
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-md bg-surface-2/60 px-2 py-1.5 text-[10px] text-muted-foreground">
                      <span>{vagasLivres} vaga(s) livres</span>
                      <span>{rt.originLabel} → {rt.destinationLabel}</span>
                    </div>
                    {isSel && (
                      <Link
                        to="/app/rota/$id"
                        params={{ id: rt.id }}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        <ShieldCheck size={12} /> Ver rota
                      </Link>
                    )}
                  </button>
                );
              })
            : mockFiltered.map((rt) => {
                const isSel = rt.id === selectedId;
                const vagasLivres = rt.vagas - rt.inscritos.length;
                return (
                  <button
                    key={rt.id}
                    onClick={() => setSelectedId(rt.id)}
                    className={`text-left rounded-lg border p-4 transition-colors ${
                      isSel
                        ? "border-primary bg-primary/5"
                        : "border-border bg-surface hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{rt.nome}</p>
                        <p className="num mt-0.5 text-[11px] text-muted-foreground">
                          {rt.horarioIda} · {rt.km} km · {vagasLivres} vaga(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="num text-base font-semibold text-foreground">1 crédito</p>
                        <p className="num text-[10px] text-muted-foreground">
                          Uber/99: {formatBRL(estimateUber99(rt.km))}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Avatar name={rt.motoristaId} size={26} iniciais={rt.motoristaId.slice(0, 2).toUpperCase()} />
                      <span className="text-xs text-foreground">{rt.motoristaId}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-md bg-surface-2/60 px-2 py-1.5 text-[10px] text-muted-foreground">
                      <span>{vagasLivres} vaga(s) livres</span>
                    </div>
                    {isSel && (
                      <Link
                        to="/app/rota/$id"
                        params={{ id: rt.id }}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        <ShieldCheck size={12} /> Ver rota
                      </Link>
                    )}
                  </button>
                );
              })}

          {!backendLoading && !usingBackend && mockFiltered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma rota encontrada.
            </p>
          )}

          {backendLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">Buscando rotas…</p>
          )}
        </div>
      </div>
    </div>
  );
}
