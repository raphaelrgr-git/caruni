import * as React from "react";
import type { Layer, Map as LeafletMap, TileLayer } from "leaflet";
import { useTheme } from "@/lib/theme";
import type { LatLng } from "@/data/mock";

interface RouteMapProps {
  path: LatLng[];
  origin?: LatLng;
  destination?: LatLng;
  stops?: LatLng[];
  carPosition?: LatLng; // marcador de carro em movimento
  height?: number | string;
  interactive?: boolean;
  className?: string;
  fit?: boolean;
}

export function RouteMap({
  path,
  origin,
  destination,
  stops,
  carPosition,
  height = 240,
  interactive = true,
  className = "",
  fit = true,
}: RouteMapProps) {
  const { theme } = useTheme();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);
  const tileRef = React.useRef<TileLayer | null>(null);
  const layersRef = React.useRef<Layer[]>([]);
  const [ready, setReady] = React.useState(false);

  // Init mapa client-side
  React.useEffect(() => {
    let cancelled = false;
    if (typeof window === "undefined") return;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !ref.current) return;

      const map = L.map(ref.current, {
        zoomControl: false,
        attributionControl: true,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
      });
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trocar tile com tema
  React.useEffect(() => {
    const run = async () => {
      if (!ready || !mapRef.current) return;
      const L = (await import("leaflet")).default;
      if (tileRef.current) {
        mapRef.current.removeLayer(tileRef.current);
      }
      const url =
        theme === "dark"
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      tileRef.current = L.tileLayer(url, {
        subdomains: theme === "dark" ? "abcd" : "abc",
        maxZoom: 19,
        attribution: theme === "dark" ? "© OSM · CARTO" : "© OpenStreetMap",
      }).addTo(mapRef.current);
      mapRef.current.invalidateSize();
    };
    void run();
  }, [theme, ready]);

  // Desenhar rota + markers
  React.useEffect(() => {
    const run = async () => {
      if (!ready || !mapRef.current) return;
      const L = (await import("leaflet")).default;
      // limpar
      layersRef.current.forEach((lyr) => mapRef.current.removeLayer(lyr));
      layersRef.current = [];
      if (!path.length) {
        mapRef.current.setView([-26.3045, -48.8487], 12);
        return;
      }

      const primary = theme === "dark" ? "#bef264" : "#0f766e";
      const accent = theme === "dark" ? "#fbbf24" : "#f97316";
      const fg = theme === "dark" ? "#f8fafc" : "#0f172a";
      const bg = theme === "dark" ? "#111827" : "#ffffff";
      const stopColor = theme === "dark" ? "#f8fafc" : "#1f2937";

      // Glow line (mais larga, opaca)
      const glow = L.polyline(path, {
        color: primary,
        weight: 9,
        opacity: theme === "dark" ? 0.2 : 0.14,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(mapRef.current);
      const line = L.polyline(path, {
        color: primary,
        weight: 4,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(mapRef.current);
      layersRef.current.push(glow, line);

      const dotIcon = (color: string, ring = "transparent", size = 14) =>
        L.divIcon({
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid ${ring};box-shadow:0 0 0 3px ${bg}, 0 4px 12px rgba(0,0,0,.35);"></div>`,
        });

      const o = origin ?? path[0];
      const d = destination ?? path[path.length - 1];
      if (o) {
        const m = L.marker(o, { icon: dotIcon(primary, fg, 14) }).addTo(mapRef.current);
        layersRef.current.push(m);
      }
      if (d) {
        const m = L.marker(d, { icon: dotIcon(accent, fg, 14) }).addTo(mapRef.current);
        layersRef.current.push(m);
      }
      stops?.forEach((s) => {
        const m = L.marker(s, { icon: dotIcon(stopColor, bg, 8) }).addTo(mapRef.current);
        layersRef.current.push(m);
      });

      if (carPosition) {
        const carIcon = L.divIcon({
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          html: `<div style="width:36px;height:36px;border-radius:9999px;background:${primary};display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px ${bg}, 0 0 0 8px color-mix(in oklab, ${primary} 25%, transparent), 0 8px 24px rgba(0,0,0,.4);">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${bg}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>
          </div>`,
        });
        const m = L.marker(carPosition, { icon: carIcon }).addTo(mapRef.current);
        layersRef.current.push(m);
      }

      if (fit && path.length > 1) {
        const bounds = L.latLngBounds(path);
        mapRef.current.fitBounds(bounds, { padding: [28, 28] });
      } else if (path.length) {
        mapRef.current.setView(path[0], 14);
      }
    };
    void run();
  }, [ready, theme, path, origin, destination, stops, carPosition, fit]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-lg border border-border bg-surface ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
      aria-label="Mapa da rota"
    />
  );
}
