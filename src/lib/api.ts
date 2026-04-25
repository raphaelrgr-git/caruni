import type { LatLng } from "@/data/mock";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";

// ── Routing preview ─────────────────────────────────────────────────────────

interface RoutePreviewRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  profile?: "driving-car";
}

interface RoutePreviewResponse {
  provider: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

export interface FrontendRoutePreview {
  provider: string;
  distanceMeters: number;
  durationSeconds: number;
  path: LatLng[];
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  universityName: string;
  course?: string;
}

export interface SignupResponse {
  user: { id: string; email: string; name: string; isEmailVerified: boolean };
  verificationToken: string;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  course: string | null;
  photoUrl: string | null;
  isEmailVerified: boolean;
  university: { id: string; name: string; city: string } | null;
  vehicle: unknown;
  drivenRoutesCount: number;
}

// ── Routes ───────────────────────────────────────────────────────────────────

export interface BackendRoute {
  id: string;
  name: string;
  city: string;
  originLabel: string;
  destinationLabel: string;
  distanceMeters: number;
  durationSeconds: number;
  departureTime: string;
  weekdays: number[];
  seats: number;
  occupiedSeats: number;
  driver: { id: string; name: string; photoUrl: string | null };
}

export interface CreateRoutePayload {
  name: string;
  city?: string;
  originLabel: string;
  originLat: number;
  originLng: number;
  destinationLabel: string;
  destinationLat: number;
  destinationLng: number;
  weekdays: number[];
  departureTime: string;
  seats: number;
}

// ── Geocoding ────────────────────────────────────────────────────────────────

export interface GeocodeSuggestion {
  label: string;
  lat: number;
  lng: number;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

// ── Auth functions ────────────────────────────────────────────────────────────

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  return request<SignupResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmail(token: string): Promise<{ ok: boolean; userId: string }> {
  return request<{ ok: boolean; userId: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<{ token: string; user: MeResponse }> {
  return request<{ token: string; user: MeResponse }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>("/me");
}

export async function logout(): Promise<void> {
  try {
    await request<void>("/auth/logout", { method: "POST" });
  } catch {
    // Endpoint may not exist; cookie will expire naturally
  }
}

// ── Routes functions ──────────────────────────────────────────────────────────

export async function getRoutes(params?: {
  origin?: string;
  destination?: string;
}): Promise<BackendRoute[]> {
  const qs = new URLSearchParams();
  if (params?.origin) qs.set("origin", params.origin);
  if (params?.destination) qs.set("destination", params.destination);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return request<BackendRoute[]>(`/routes${query}`);
}

export interface BackendRouteDetail {
  id: string;
  name: string;
  city: string;
  origin: { label: string; lat: number; lng: number };
  destination: { label: string; lat: number; lng: number };
  distanceMeters: number;
  durationSeconds: number;
  geometry: { type: string; coordinates: [number, number][] } | null;
  weekdays: number[];
  departureTime: string;
  seats: number;
  occupiedSeats: number;
  driver: { id: string; name: string; course: string | null; photoUrl: string | null; rating: number | null };
  passengers: { id: string; name: string; course: string | null }[];
}

export async function getRouteDetail(id: string): Promise<BackendRouteDetail> {
  return request<BackendRouteDetail>(`/routes/${id}`);
}

export async function createRoute(
  payload: CreateRoutePayload,
): Promise<FrontendRoutePreview & { id: string; name: string }> {
  const data = await request<
    RoutePreviewResponse & { id: string; name: string; provider: string }
  >("/routes", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    id: data.id,
    name: data.name,
    provider: data.provider,
    distanceMeters: data.distanceMeters,
    durationSeconds: data.durationSeconds,
    path: (data.geometry as RoutePreviewResponse["geometry"]).coordinates.map(
      ([lng, lat]) => [lat, lng] as LatLng,
    ),
  };
}

// ── Routing preview ───────────────────────────────────────────────────────────

export async function previewRoute(payload: RoutePreviewRequest): Promise<FrontendRoutePreview> {
  const data = await request<RoutePreviewResponse>("/routing/preview", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      profile: payload.profile ?? "driving-car",
    }),
  });

  return {
    provider: data.provider,
    distanceMeters: data.distanceMeters,
    durationSeconds: data.durationSeconds,
    path: data.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng),
  };
}

// ── Geocoding (Nominatim) ─────────────────────────────────────────────────────

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeSuggestion[]> {
  const qs = new URLSearchParams({
    q: query,
    format: "json",
    limit: "5",
    "accept-language": "pt-BR",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${qs.toString()}`,
    {
      headers: { "User-Agent": "CarUni/1.0" },
    },
  );

  if (!response.ok) return [];

  const results = (await response.json()) as NominatimResult[];
  return results.map((r) => ({
    label: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}
