import * as React from "react";
import { loadGoogleMaps } from "@/lib/google-maps";
import { useTheme } from "@/lib/theme";
import { anonymizePoint, clipPolylineEnds } from "@/lib/privacy";
import type { LatLng } from "@/lib/types";

interface RouteMapProps {
  path: LatLng[];
  origin?: LatLng;
  destination?: LatLng;
  stops?: LatLng[];
  carPosition?: LatLng;
  selectedPoint?: LatLng;
  selectable?: boolean;
  onSelectPoint?: (point: LatLng) => void;
  height?: number | string;
  interactive?: boolean;
  className?: string;
  fit?: boolean;
  privacyMode?: boolean;
  privacySeed?: string;
}

const JOINVILLE_CENTER: LatLng = [-26.3045, -48.8487];

const LIGHT_MAP_STYLES: Array<Record<string, unknown>> = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const DARK_MAP_STYLES: Array<Record<string, unknown>> = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#dbe4ef" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#172554" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1d4ed8" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#082f49" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

function toLatLngLiteral(point: LatLng) {
  return { lat: point[0], lng: point[1] };
}

function isFiniteCoord(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidLatLng(point: unknown): point is LatLng {
  if (!Array.isArray(point) || point.length < 2) return false;
  const [lat, lng] = point;
  return isFiniteCoord(lat) && isFiniteCoord(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function sanitizePoints(points: LatLng[] | undefined): LatLng[] {
  if (!points?.length) return [];
  return points.filter(isValidLatLng);
}

export function RouteMap({
  path,
  origin,
  destination,
  stops,
  carPosition,
  selectedPoint,
  selectable = false,
  onSelectPoint,
  height = 240,
  interactive = true,
  className = "",
  fit = true,
  privacyMode = false,
  privacySeed = "default",
}: RouteMapProps) {
  const { theme } = useTheme();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);
  const overlaysRef = React.useRef<Array<{ setMap(map: any): void }>>([]);
  const clickListenerRef = React.useRef<{ remove(): void } | null>(null);
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void loadGoogleMaps()
      .then((google) => {
        if (cancelled || !ref.current || mapRef.current) return;

        const map = new google.maps.Map(ref.current, {
          center: toLatLngLiteral(JOINVILLE_CENTER),
          zoom: 12,
          disableDefaultUI: true,
          clickableIcons: false,
          keyboardShortcuts: interactive,
          draggable: interactive,
          scrollwheel: interactive,
          disableDoubleClickZoom: !interactive,
          gestureHandling: interactive ? "auto" : "none",
          styles: theme === "dark" ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
        });
        mapRef.current = map;
        setReady(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao carregar mapa.");
        }
      });

    return () => {
      cancelled = true;
      clickListenerRef.current?.remove();
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
    };
  }, [interactive, theme]);

  React.useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setOptions({
      styles: theme === "dark" ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
      draggable: interactive,
      scrollwheel: interactive,
      disableDoubleClickZoom: !interactive,
      gestureHandling: interactive ? "auto" : "none",
    });
  }, [interactive, theme]);

  React.useEffect(() => {
    if (!ready || !mapRef.current) return;
    const google = (window as Window & { google?: any }).google;
    if (!google) return;

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
    clickListenerRef.current?.remove();
    clickListenerRef.current = null;

    const map = mapRef.current;
    const validPath = sanitizePoints(path);
    const validOrigin = isValidLatLng(origin) ? origin : undefined;
    const validDestination = isValidLatLng(destination) ? destination : undefined;
    const validStops = sanitizePoints(stops);
    const validSelectedPoint = isValidLatLng(selectedPoint) ? selectedPoint : undefined;
    const validCarPosition = isValidLatLng(carPosition) ? carPosition : undefined;

    const fallbackPath: LatLng[] =
      validPath.length > 0
        ? validPath
        : validOrigin && validDestination
          ? [validOrigin, validDestination]
          : [];

    const primary = theme === "dark" ? "#bef264" : "#0f766e";
    const accent = theme === "dark" ? "#fbbf24" : "#f97316";
    const stopColor = theme === "dark" ? "#f8fafc" : "#1f2937";
    const bgStroke = theme === "dark" ? "#0f172a" : "#ffffff";

    const clippedPath = privacyMode ? clipPolylineEnds(fallbackPath) : fallbackPath;
    const displayPath = sanitizePoints(clippedPath);

    if (displayPath.length > 0) {
      const pathOverlay = new google.maps.Polyline({
        path: displayPath.map(toLatLngLiteral),
        strokeColor: primary,
        strokeOpacity: 0.95,
        strokeWeight: 5,
        map,
      });
      overlaysRef.current.push(pathOverlay);

      const glowOverlay = new google.maps.Polyline({
        path: displayPath.map(toLatLngLiteral),
        strokeColor: primary,
        strokeOpacity: theme === "dark" ? 0.22 : 0.16,
        strokeWeight: 10,
        map,
      });
      overlaysRef.current.push(glowOverlay);
    }

    const dotIcon = (color: string, scale = 8) => ({
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: bgStroke,
      strokeWeight: 3,
      scale,
    });

    const o = validOrigin ?? fallbackPath[0];
    const d = validDestination ?? fallbackPath[fallbackPath.length - 1];

    const visiblePoints: LatLng[] = [];

    if (privacyMode) {
      const circleStyle = {
        strokeColor: primary,
        strokeOpacity: 0.45,
        strokeWeight: 1.5,
        fillColor: primary,
        fillOpacity: 0.08,
        radius: 500,
      };

      if (o) {
        const point = anonymizePoint(o[0], o[1], `${privacySeed}-o`) as LatLng;
        const circle = new google.maps.Circle({
          ...circleStyle,
          center: toLatLngLiteral(point),
          map,
        });
        const marker = new google.maps.Marker({
          position: toLatLngLiteral(point),
          icon: dotIcon(primary, 6),
          map,
        });
        overlaysRef.current.push(circle, marker);
        visiblePoints.push(point);
      }
      if (d) {
        const point = anonymizePoint(d[0], d[1], `${privacySeed}-d`) as LatLng;
        const circle = new google.maps.Circle({
          ...circleStyle,
          center: toLatLngLiteral(point),
          map,
        });
        const marker = new google.maps.Marker({
          position: toLatLngLiteral(point),
          icon: dotIcon(accent, 6),
          map,
        });
        overlaysRef.current.push(circle, marker);
        visiblePoints.push(point);
      }
    } else {
      if (o) {
        const marker = new google.maps.Marker({
          position: toLatLngLiteral(o),
          icon: dotIcon(primary, 8),
          map,
        });
        overlaysRef.current.push(marker);
        visiblePoints.push(o);
      }
      if (d) {
        const marker = new google.maps.Marker({
          position: toLatLngLiteral(d),
          icon: dotIcon(accent, 8),
          map,
        });
        overlaysRef.current.push(marker);
        visiblePoints.push(d);
      }
    }

    validStops.forEach((stop) => {
      const marker = new google.maps.Marker({
        position: toLatLngLiteral(stop),
        icon: dotIcon(stopColor, 5),
        map,
      });
      overlaysRef.current.push(marker);
      visiblePoints.push(stop);
    });

    if (validSelectedPoint) {
      const marker = new google.maps.Marker({
        position: toLatLngLiteral(validSelectedPoint),
        icon: dotIcon("#2563eb", 7),
        map,
      });
      overlaysRef.current.push(marker);
      visiblePoints.push(validSelectedPoint);
    }

    if (validCarPosition) {
      const marker = new google.maps.Marker({
        position: toLatLngLiteral(validCarPosition),
        icon: dotIcon(primary, 9),
        map,
      });
      overlaysRef.current.push(marker);
      visiblePoints.push(validCarPosition);
    }

    if (selectable && onSelectPoint) {
      clickListenerRef.current = map.addListener("click", (event: any) => {
        if (!event.latLng) return;
        onSelectPoint([event.latLng.lat(), event.latLng.lng()]);
      });
    }

    const boundsSource = sanitizePoints([...visiblePoints, ...displayPath]);

    if (fit && boundsSource.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      boundsSource.forEach((point) => bounds.extend(toLatLngLiteral(point)));
      map.fitBounds(bounds, 48);
    } else if (boundsSource.length) {
      map.setCenter(toLatLngLiteral(boundsSource[0]));
      map.setZoom(14);
    } else {
      map.setCenter(toLatLngLiteral(JOINVILLE_CENTER));
      map.setZoom(12);
    }
  }, [
    ready,
    path,
    origin,
    destination,
    stops,
    carPosition,
    selectedPoint,
    selectable,
    onSelectPoint,
    fit,
    privacyMode,
    privacySeed,
    theme,
  ]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border bg-surface ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
      aria-label="Mapa da rota"
    >
      <div ref={ref} className="h-full w-full" />
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/90 px-4 text-center text-sm text-muted-foreground">
          {error}
        </div>
      ) : null}
    </div>
  );
}
