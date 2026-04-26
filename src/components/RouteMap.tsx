import * as React from "react";
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
  const mapRef = React.useRef<any>(null);
  const tileRef = React.useRef<any>(null);
  const layersRef = React.useRef<any[]>([]);
  const [ready, setReady] = React.useState(false);

  // Init mapa client-side
  React.useEffect(() => {
    let cancelled = false;
    if (typeof window === "undefined") return;
    (async () => {
      const L = (await import("leaflet")).default;
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
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 200);
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
          ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      tileRef.current = L.tileLayer(url, {
        subdomains: "abcd",
        maxZoom: 19,
        attribution: '© OSM · CARTO',
      }).addTo(mapRef.current);
    };
    void run();
  }, [theme, ready]);

  // Desenhar rota + markers
  React.useEffect(() => {
    const run = async () => {
      if (!ready || !mapRef.current) return;
      const L = (await import("leaflet")).default;

      let actualPath = path;

      // Buscar rota real no OSRM se for apenas uma linha reta (poucos pontos)
      if (path.length >= 2 && path.length < 10) {
        try {
          const start = path[0];
          const end = path[path.length - 1];
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            actualPath = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          }
        } catch (e) {
          console.warn("Erro ao buscar rota real:", e);
        }
      }

      // limpar
      layersRef.current.forEach((lyr) => mapRef.current.removeLayer(lyr));
      layersRef.current = [];

      const styles = getComputedStyle(document.documentElement);
      const primary = styles.getPropertyValue("--primary").trim() || "#a3e635";
      const accent = styles.getPropertyValue("--accent").trim() || "#fb923c";
      const fg = styles.getPropertyValue("--foreground").trim() || "#fff";
      const bg = styles.getPropertyValue("--background").trim() || "#000";

      // Glow line
      const glow = L.polyline(actualPath, {
        color: primary,
        weight: 10,
        opacity: 0.2,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(mapRef.current);

      const line = L.polyline(actualPath, {
        color: primary,
        weight: 4,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round",
        dashArray: interactive ? "" : "8, 12",
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
        const m = L.marker(s, { icon: dotIcon(fg, bg, 8) }).addTo(mapRef.current);
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

      if (fit && actualPath.length > 1) {
        const bounds = L.latLngBounds(actualPath);
        mapRef.current.fitBounds(bounds, { padding: [30, 30], animate: interactive });
      } else if (actualPath.length) {
        mapRef.current.setView(actualPath[0], 15);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ready,
    theme,
    fit,
    JSON.stringify(path),
    JSON.stringify(origin),
    JSON.stringify(destination),
    JSON.stringify(stops),
    JSON.stringify(carPosition),
  ]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden w-full bg-surface ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height, zIndex: 0 }}
      aria-label="Mapa da rota"
    />
  );
}