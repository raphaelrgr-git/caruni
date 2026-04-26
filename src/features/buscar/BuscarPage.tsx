import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Landmark,
  Search,
  X,
} from "lucide-react";
import { Avatar, StarRating } from "@/components/Brand";
import { RouteMap } from "@/components/RouteMap";
import { getRoutes, type BackendRoute } from "@/lib/api";
import type { LatLng } from "@/lib/types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function estimateUber99(km: number) {
  return Math.max(12, +(6 + km * 2.8).toFixed(2));
}

const CAMPUS_GROUPS = [
  { key: "ufsc", label: "UFSC", icon: Landmark, match: ["ufsc"] },
  { key: "udesc", label: "UDESC", icon: GraduationCap, match: ["udesc"] },
  { key: "univille", label: "Univille", icon: Building2, match: ["univille"] },
  { key: "unisociesc", label: "UniSociesc", icon: Building2, match: ["unisociesc", "sociesc"] },
  { key: "catolica", label: "Católica", icon: Building2, match: ["católica", "catolica"] },
  { key: "outras", label: "Outras rotas", icon: GraduationCap, match: [] },
] as const;

function routeCampusKey(route: BackendRoute) {
  const haystack = `${route.name} ${route.originLabel} ${route.destinationLabel}`.toLowerCase();
  const matched = CAMPUS_GROUPS.find(
    (group) => group.key !== "outras" && group.match.some((term) => haystack.includes(term)),
  );
  return matched?.key ?? "outras";
}

export function BuscarPage() {
  const [query, setQuery] = React.useState("");
  const [routes, setRoutes] = React.useState<BackendRoute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ufsc");

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRoutes({
      origin: query.trim() || undefined,
      destination: query.trim() || undefined,
    })
      .then((data) => {
        if (cancelled) return;
        setRoutes(data);
      })
      .catch(() => {
        if (cancelled) return;
        setRoutes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, BackendRoute[]>();
    for (const group of CAMPUS_GROUPS) map.set(group.key, []);
    for (const route of routes) {
      map.get(routeCampusKey(route))?.push(route);
    }
    return CAMPUS_GROUPS.map((group) => ({
      ...group,
      routes: map.get(group.key) ?? [],
    })).filter((group) => group.routes.length > 0 || group.key === selectedCategory);
  }, [routes, selectedCategory]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 lg:px-8 lg:py-8">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="w-full max-w-3xl rounded-[24px] border border-border bg-surface px-4 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:rounded-[32px] sm:px-5 sm:py-4">
          <label className="flex items-center gap-3">
            <Search size={18} className="text-foreground sm:h-5 sm:w-5" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Inicie sua busca"
              className="w-full bg-transparent text-base font-medium text-foreground outline-none placeholder:text-foreground/70 sm:text-lg"
            />
          </label>
        </div>

        <Link
          to="/app"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background sm:h-14 sm:w-14"
          aria-label="Fechar busca"
        >
          <X size={20} className="sm:h-6 sm:w-6" />
        </Link>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-2 sm:mt-8 sm:gap-6">
        {CAMPUS_GROUPS.map((group) => {
          const Icon = group.icon;
          const active = selectedCategory === group.key;
          return (
            <button
              key={group.key}
              onClick={() => setSelectedCategory(group.key)}
              className="flex min-w-[88px] shrink-0 flex-col items-center gap-2 sm:min-w-[96px]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-foreground shadow-sm sm:h-14 sm:w-14">
                <Icon size={20} className="sm:h-6 sm:w-6" />
              </div>
              <span
                className={`border-b-2 pb-2 text-xs font-medium sm:text-sm ${
                  active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
                }`}
              >
                {group.label}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-muted-foreground">Buscando rotas…</p>
      ) : null}

      {!loading && routes.length === 0 ? (
        <div className="mt-10 rounded-[28px] border border-dashed border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          Nenhuma rota encontrada para essa busca.
        </div>
      ) : null}

      <div className="mt-8 space-y-10 sm:mt-10 sm:space-y-12">
        {grouped
          .sort((a, b) => {
            if (a.key === selectedCategory) return -1;
            if (b.key === selectedCategory) return 1;
            return 0;
          })
          .map((group) => (
            <section key={group.key}>
              <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
                  Rotas populares para {group.label}
                </h2>
                <button className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-foreground sm:h-12 sm:w-12">
                  <ArrowRight size={18} className="sm:h-5 sm:w-5" />
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 sm:gap-5">
                {group.routes.map((route) => (
                  <RouteDiscoveryCard key={route.id} route={route} />
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}

function RouteDiscoveryCard({ route }: { route: BackendRoute }) {
  const km = +(route.distanceMeters / 1000).toFixed(1);
  const freeSeats = Math.max(0, route.seats - route.occupiedSeats);
  const isFinitePoint = (point: unknown): point is [number, number] => {
    if (!Array.isArray(point) || point.length < 2) return false;
    return Number.isFinite(point[0]) && Number.isFinite(point[1]);
  };
  const isFiniteLatLng = (point: unknown): point is LatLng => {
    if (!Array.isArray(point) || point.length < 2) return false;
    return Number.isFinite(point[0]) && Number.isFinite(point[1]);
  };

  const geometryPath: LatLng[] =
    route.geometry?.coordinates
      ?.filter(isFinitePoint)
      .map(([lng, lat]) => [lat, lng] as LatLng)
      .filter(isFiniteLatLng) ?? [];

  const fallbackPoints: LatLng[] = [
    [route.originLat, route.originLng],
    [route.destinationLat, route.destinationLng],
  ].filter(isFiniteLatLng);

  const path: LatLng[] = geometryPath.length > 0 ? geometryPath : fallbackPoints;

  const originPoint = isFiniteLatLng([route.originLat, route.originLng])
    ? ([route.originLat, route.originLng] as LatLng)
    : path[0];
  const destinationPoint = isFiniteLatLng([route.destinationLat, route.destinationLng])
    ? ([route.destinationLat, route.destinationLng] as LatLng)
    : path[path.length - 1];

  return (
    <article className="w-[88vw] max-w-[320px] shrink-0 sm:w-[320px]">
      <div className="overflow-hidden rounded-[28px]">
        <RouteMap
          path={path}
          origin={originPoint}
          destination={destinationPoint}
          height={220}
          interactive={false}
          className="rounded-[28px] border-0"
          privacyMode
          privacySeed={route.id}
        />
      </div>

      <div className="mt-4 px-1 sm:mt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold leading-none tracking-tight text-foreground sm:text-[28px]">
              {route.name}
            </p>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {route.originLabel} → {route.destinationLabel}
            </p>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {route.departureTime} · {km} km · {freeSeats} vaga(s)
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground sm:text-xl">1 crédito</p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Uber/99: {brl.format(estimateUber99(km))}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Avatar
            name={route.driver.name}
            size={34}
            iniciais={route.driver.name.slice(0, 2).toUpperCase()}
            src={route.driver.photoUrl}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{route.driver.name}</p>
            <div className="mt-1">
              <StarRating value={5} />
            </div>
          </div>
        </div>

        <Link
          to="/app/rota/$id"
          params={{ id: route.id }}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          Ver rota <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
