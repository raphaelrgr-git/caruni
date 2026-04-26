import type { LatLng, UserRole } from "@/lib/types";
import { geocodeAddressWithGoogle } from "@/lib/google-maps";

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";

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

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  universityName: string;
  course?: string;
  role: UserRole;
}

export interface SignupResponse {
  user: { id: string; email: string; name: string; isEmailVerified: boolean };
  verificationToken: string;
}

export interface VehicleResponse {
  id: string;
  model: string;
  color: string;
  plate: string;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  course: string | null;
  photoUrl: string | null;
  bio: string | null;
  birthYear: number | null;
  petsPref: string | null;
  baggageSize: string | null;
  temperaturePref: string | null;
  restrictions: string | null;
  socialStyle: string | null;
  conversationStyle: string | null;
  musicPref: string | null;
  chatPref: string | null;
  punctualityPref: string | null;
  interests: string[];
  isEmailVerified: boolean;
  university: { id: string; name: string; city: string } | null;
  vehicle: VehicleResponse | null;
  drivenRoutesCount: number;
  onboarding: {
    passengerSeen: boolean;
    driverSeen: boolean;
    shouldShow: boolean;
  };
  streak: {
    current: number;
    longest: number;
    total: number;
    freeRidesEarned: number;
    milestones: { m5: boolean; m10: boolean; m20: boolean };
  } | null;
}

export interface UserProfile {
  id: string;
  name: string;
  photoUrl: string | null;
  role: UserRole;
  bio: string | null;
  birthYear: number | null;
  age: number | null;
  petsPref: string | null;
  baggageSize: string | null;
  temperaturePref: string | null;
  restrictions: string | null;
  socialStyle: string | null;
  conversationStyle: string | null;
  musicPref: string | null;
  chatPref: string | null;
  punctualityPref: string | null;
  interests: string[];
  university: { name: string; city: string } | null;
  stats: {
    avgRating: number | null;
    totalRides: number;
    presenceRate: number;
    cancellationRate: number;
  };
  streak: { current: number; longest: number } | null;
  badges: {
    emailVerified: boolean;
    isDriver: boolean;
    milestone5: boolean;
    milestone10: boolean;
    milestone20: boolean;
  };
  reviews: Array<{
    id: string;
    rating: number;
    body: string;
    createdAt: string;
    from: { id: string; name: string; photoUrl: string | null };
  }>;
}

export interface BackendRoute {
  id: string;
  name: string;
  city: string;
  originLabel: string;
  originLat: number;
  originLng: number;
  destinationLabel: string;
  destinationLat: number;
  destinationLng: number;
  distanceMeters: number;
  durationSeconds: number;
  geometry: { type: string; coordinates: [number, number][] } | null;
  departureTime: string;
  weekdays: number[];
  seats: number;
  version: number;
  status: "ATIVA" | "PENDENTE_CONFIRMACAO";
  visibilityMode: "PUBLICA" | "PRIVADA" | "HIBRIDA";
  publicSeats: number;
  privateSeats: number;
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
  visibilityMode?: "PUBLICA" | "PRIVADA" | "HIBRIDA";
  publicSeats?: number;
  privateSeats?: number;
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
  version: number;
  status: "ATIVA" | "PENDENTE_CONFIRMACAO";
  visibilityMode: "PUBLICA" | "PRIVADA" | "HIBRIDA";
  publicSeats: number;
  privateSeats: number;
  occupiedSeats: number;
  driver: {
    id: string;
    name: string;
    course: string | null;
    photoUrl: string | null;
    rating: number | null;
    role: UserRole;
  };
  passengers: { id: string; name: string; course: string | null }[];
  nextRides: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    driverConfirmedAt: string | null;
    passengerConfirmedAt: string | null;
  }>;
}

export interface SubscriptionPlan {
  id: string;
  key: "CALOURO" | "VETERANO";
  name: string;
  weeklyPrice: number;
  creditsIncluded: number;
  costPerTrip: number;
  extraTripPrice: number;
  driverPayoutPerCredit: number;
  priority: boolean;
}

export interface WalletResponse {
  subscription: {
    id: string;
    status: string;
    autoRenew: boolean;
    cycleStart: string;
    cycleEnd: string;
    plan: SubscriptionPlan;
  } | null;
  credits: {
    total: number;
    available: number;
    reserved: number;
    consumed: number;
    expired: number;
    lost: number;
    entries: Array<{
      id: string;
      status: string;
      monetaryValue: number;
      description: string;
      createdAt: string;
      expiresAt: string | null;
      routeName: string | null;
    }>;
  };
  transactions: Array<{
    id: string;
    type: string;
    description: string;
    amount: number;
    createdAt: string;
  }>;
}

export interface DashboardSummaryResponse {
  nextRides: Array<{
    id: string;
    routeId: string;
    routeName: string;
    scheduledAt: string;
    status: string;
    originLabel: string;
    destinationLabel: string;
    distanceMeters: number;
  }>;
  credits: {
    total: number;
    available: number;
    reserved: number;
    consumed: number;
  };
  savings: {
    confirmedTrips: number;
    caruniCost: number;
    busCost: number;
    busSavings: number;
    privateCost: number;
    privateSavings: number;
    weeklyProjectionBus: number;
    weeklyProjectionPrivate: number;
  };
  timeline?: Array<{
    label: string;
    caruni: number;
    bus: number;
    private: number;
    savings: number;
  }>;
  earningsTimeline?: Array<{
    label: string;
    earnings: number;
    rides: number;
  }>;
  occupancyTimeline?: Array<{
    label: string;
    occupancy: number;
  }>;
  fuelSavingsTimeline?: Array<{
    label: string;
    netSavings: number;
    earnings: number;
    estimatedCost: number;
  }>;
  estimatedFuelSavings?: number;
  estimatedCostPerKm?: number;
}

export interface BookingResponse {
  id: string;
  type: "RECORRENTE" | "AVULSO";
  status: string;
  weekdays: number[];
  routeId: string;
  rideInstanceId: string;
}

export interface MyBooking {
  id: string;
  type: "RECORRENTE" | "AVULSO";
  status: string;
  weekdays: number[];
  cancelledAt: string | null;
  approvedAt?: string | null;
  createdAt: string;
  route: {
    id: string;
    name: string;
    originLabel: string;
    originLat: number;
    originLng: number;
    destinationLabel: string;
    destinationLat: number;
    destinationLng: number;
    departureTime: string;
    visibilityMode?: "PUBLICA" | "PRIVADA" | "HIBRIDA";
    driver: { id: string; name: string; photoUrl: string | null };
  };
  ride: {
    id: string;
    scheduledAt: string;
    status: string;
    driverConfirmedAt: string | null;
    passengerConfirmedAt: string | null;
    passengerBoarded: boolean | null;
  } | null;
  credits: Array<{
    id: string;
    status: string;
    monetaryValue: number;
  }>;
}

export interface MyRoute {
  id: string;
  name: string;
  originLabel: string;
  destinationLabel: string;
  departureTime: string;
  weekdays: number[];
  seats: number;
  version?: number;
  status?: "ATIVA" | "PENDENTE_CONFIRMACAO";
  visibilityMode?: "PUBLICA" | "PRIVADA" | "HIBRIDA";
  publicSeats?: number;
  privateSeats?: number;
  occupiedSeats: number;
  passengers: Array<{ id: string; name: string; course: string | null }>;
  pendingApprovals?: Array<{ id: string; bookingId: string; name: string; course: string | null }>;
  nextRides: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    driverConfirmedAt: string | null;
    passengerConfirmedAt: string | null;
  }>;
  map?: {
    geometry: { type: string; coordinates: [number, number][] } | null;
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  };
}

export interface MyRide {
  id: string;
  role: UserRole;
  status: string;
  scheduledAt: string;
  driverConfirmedAt: string | null;
  passengerConfirmedAt: string | null;
  passengerBoarded: boolean | null;
  route: {
    id: string;
    name: string;
    originLabel: string;
    destinationLabel: string;
    geometry: { type: string; coordinates: [number, number][] } | null;
    distanceMeters: number;
    durationSeconds: number;
    driver?: { id: string; name: string; photoUrl: string | null };
  };
  participants?: Array<{ id: string; name: string; course: string | null }>;
  booking?: {
    id: string;
    type: "RECORRENTE" | "AVULSO";
    credits: Array<{ id: string; status: string; monetaryValue: number }>;
  };
}

export interface ConnectionSummary {
  id: string;
  tripsTogether: number;
  lastInteractedAt: string;
  strong: boolean;
  connectedUser: {
    id: string;
    name: string;
    photoUrl: string | null;
    university: { name: string; city: string } | null;
  };
}

export interface RouteMessagesResponse {
  routeId: string;
  messages: Array<{
    id: string;
    body: string;
    kind: "USER" | "SYSTEM";
    createdAt: string;
    author: {
      id: string;
      name: string;
      photoUrl: string | null;
    };
  }>;
}

export interface RideNegotiation {
  id: string;
  status: "PENDING" | "COUNTERED" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";
  routeId: string;
  rideInstanceId: string;
  passengerId: string;
  driverId: string;
  proposedLatReal: number;
  proposedLngReal: number;
  counterLatReal: number | null;
  counterLngReal: number | null;
  passengerMessage: string | null;
  driverMessage: string | null;
  extraAmountCents: number;
  counterExtraAmountCents: number | null;
  estimatedDetourMinutes: number;
  estimatedDetourMeters: number;
  acceptedGeometry: { type: string; coordinates: [number, number][] } | null;
  acceptedDistanceMeters: number | null;
  acceptedDurationSeconds: number | null;
  expiresAt: string;
  roundsUsed: number;
  createdAt: string;
  updatedAt: string;
  route: {
    id: string;
    name: string;
    originLabel: string;
    destinationLabel: string;
  };
  ride: {
    id: string;
    scheduledAt: string;
  };
  passenger: {
    id: string;
    name: string;
    photoUrl: string | null;
  };
  driver: {
    id: string;
    name: string;
    photoUrl: string | null;
  };
}

export interface GeocodeSuggestion {
  label: string;
  lat: number;
  lng: number;
}

export interface PendingRouteChange {
  id: string;
  routeId: string;
  bookingId: string;
  fromVersion: number;
  toVersion: number;
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "EXPIRED";
  deadlineAt: string;
  route: {
    id: string;
    name: string;
    status: "ATIVA" | "PENDENTE_CONFIRMACAO";
  };
  diff: {
    previousDepartureTime: string;
    nextDepartureTime: string;
    previousOriginLabel: string;
    nextOriginLabel: string;
    previousDestinationLabel: string;
    nextDestinationLabel: string;
    previousDistanceMeters: number;
    nextDistanceMeters: number;
    previousDurationSeconds: number;
    nextDurationSeconds: number;
    impactMinutes: number;
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    let message: string;
    try {
      const json = JSON.parse(text) as { message?: string };
      message = json.message ?? text;
    } catch {
      message = text;
    }
    throw new Error(message || `Falha na requisição (${response.status}).`);
  }

  return (await response.json()) as T;
}

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

export async function login(payload: { email: string; password: string }) {
  return request<{ token: string; user: MeResponse }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>("/me");
}

export async function logout(): Promise<void> {
  await request<void>("/auth/logout", { method: "POST" });
}

export async function updateProfile(payload: {
  name?: string;
  course?: string | null;
  bio?: string | null;
  birthYear?: number | null;
  petsPref?: string | null;
  baggageSize?: string | null;
  temperaturePref?: string | null;
  restrictions?: string | null;
  socialStyle?: string | null;
  conversationStyle?: string | null;
  musicPref?: string | null;
  chatPref?: string | null;
  punctualityPref?: string | null;
  interests?: string[];
}) {
  return request<MeResponse>("/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function uploadProfilePhoto(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/me/photo`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Falha ao enviar imagem.");
  }

  return (await response.json()) as MeResponse;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  return request<UserProfile>(`/users/${userId}/profile`);
}

export async function completeOnboarding(role?: UserRole) {
  return request<MeResponse>("/me/onboarding/complete", {
    method: "POST",
    body: JSON.stringify(role ? { role } : {}),
  });
}

export async function upgradeDriver(payload: { model: string; color: string; plate: string }) {
  return request<{ id: string; role: UserRole; vehicle: VehicleResponse }>("/me/upgrade-driver", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRoutes(params?: {
  origin?: string;
  destination?: string;
  driverId?: string;
}): Promise<BackendRoute[]> {
  const qs = new URLSearchParams();
  if (params?.origin) qs.set("origin", params.origin);
  if (params?.destination) qs.set("destination", params.destination);
  if (params?.driverId) qs.set("driverId", params.driverId);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return request<BackendRoute[]>(`/routes${query}`);
}

export async function getRouteDetail(id: string): Promise<BackendRouteDetail> {
  return request<BackendRouteDetail>(`/routes/${id}`);
}

export async function createRoute(
  payload: CreateRoutePayload,
): Promise<FrontendRoutePreview & { id: string; name: string }> {
  const data = await request<RoutePreviewResponse & { id: string; name: string; provider: string }>(
    "/routes",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return {
    id: data.id,
    name: data.name,
    provider: data.provider,
    distanceMeters: data.distanceMeters,
    durationSeconds: data.durationSeconds,
    path: data.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng),
  };
}

export async function deleteRoute(routeId: string) {
  return request<{ ok: boolean }>(`/routes/${routeId}`, {
    method: "DELETE",
  });
}

export async function updateRoute(routeId: string, payload: CreateRoutePayload) {
  return request<{
    id: string;
    version: number;
    status: "ATIVA" | "PENDENTE_CONFIRMACAO";
    hasPendingConfirmations: boolean;
    deadlineAt: string | null;
    change: PendingRouteChange["diff"];
  }>(`/routes/${routeId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function previewRouteChange(
  routeId: string,
  payload: {
    originLabel: string;
    originLat: number;
    originLng: number;
    destinationLabel: string;
    destinationLat: number;
    destinationLng: number;
    departureTime: string;
  },
) {
  const qs = new URLSearchParams({
    originLabel: payload.originLabel,
    originLat: String(payload.originLat),
    originLng: String(payload.originLng),
    destinationLabel: payload.destinationLabel,
    destinationLat: String(payload.destinationLat),
    destinationLng: String(payload.destinationLng),
    departureTime: payload.departureTime,
  });
  return request<PendingRouteChange["diff"]>(`/routes/${routeId}/change-preview?${qs.toString()}`);
}

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

export async function getPlans(): Promise<SubscriptionPlan[]> {
  return request<SubscriptionPlan[]>("/plans");
}

export async function selectPlan(payload: {
  planKey: "CALOURO" | "VETERANO";
  autoRenew?: boolean;
}) {
  return request<WalletResponse["subscription"]>("/subscriptions/select", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getWallet(): Promise<WalletResponse> {
  return request<WalletResponse>("/wallet");
}

export async function buyExtraCredit() {
  return request<{ id: string; status: string; monetaryValue: number; expiresAt: string | null }>(
    "/wallet/extra-credit",
    {
      method: "POST",
    },
  );
}

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  return request<DashboardSummaryResponse>("/dashboard/summary");
}

export async function createBooking(payload: {
  routeId: string;
  weekdays: number[];
  type: "RECORRENTE" | "AVULSO";
}) {
  return request<BookingResponse>("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelBooking(bookingId: string) {
  return request<{ ok: boolean; late: boolean }>(`/bookings/${bookingId}/cancel`, {
    method: "POST",
  });
}

export async function getMyBookings(): Promise<MyBooking[]> {
  return request<MyBooking[]>("/my/bookings");
}

export async function getMyPendingRouteChanges(): Promise<PendingRouteChange[]> {
  return request<PendingRouteChange[]>("/my/pending-route-changes");
}

export async function confirmRouteChange(changeId: string) {
  return request<{ ok: boolean }>(`/route-change-confirmations/${changeId}/confirm`, {
    method: "POST",
  });
}

export async function declineRouteChange(changeId: string) {
  return request<{ ok: boolean }>(`/route-change-confirmations/${changeId}/decline`, {
    method: "POST",
  });
}

export async function getMyRoutes(): Promise<MyRoute[]> {
  return request<MyRoute[]>("/my/routes");
}

export async function getMyRides(): Promise<MyRide[]> {
  return request<MyRide[]>("/my/rides");
}

export async function approvePrivateBooking(routeId: string, bookingId: string) {
  return request<{ ok: boolean }>(`/routes/${routeId}/private-bookings/${bookingId}/approve`, {
    method: "POST",
  });
}

export async function rejectPrivateBooking(routeId: string, bookingId: string) {
  return request<{ ok: boolean }>(`/routes/${routeId}/private-bookings/${bookingId}/reject`, {
    method: "POST",
  });
}

export async function getConnections(sort: "recentes" | "recorrentes" = "recorrentes") {
  return request<ConnectionSummary[]>(`/connections?sort=${sort}`);
}

export async function hideConnection(connectionId: string) {
  return request<{ ok: boolean }>(`/connections/${connectionId}/hide`, {
    method: "POST",
  });
}

export async function blockConnection(connectionId: string) {
  return request<{ ok: boolean }>(`/connections/${connectionId}/block`, {
    method: "POST",
  });
}

export async function removeConnection(connectionId: string) {
  return request<{ ok: boolean }>(`/connections/${connectionId}`, {
    method: "DELETE",
  });
}

export async function getConnectionRoutes(connectionId: string) {
  return request<BackendRoute[]>(`/connections/${connectionId}/routes`);
}

export async function driverConfirmRide(rideId: string, boarded = true) {
  return request<{ ok: boolean }>(`/rides/${rideId}/driver-confirm`, {
    method: "POST",
    body: JSON.stringify({ boarded }),
  });
}

export async function passengerConfirmRide(rideId: string) {
  return request<{ ok: boolean }>(`/rides/${rideId}/passenger-confirm`, {
    method: "POST",
  });
}

export async function disputeRide(rideId: string) {
  return request<{ ok: boolean }>(`/rides/${rideId}/dispute`, {
    method: "POST",
  });
}

export async function getRouteMessages(routeId: string, limit = 50) {
  return request<RouteMessagesResponse>(`/routes/${routeId}/messages?limit=${limit}`);
}

export async function postRouteMessage(routeId: string, body: string) {
  return request<RouteMessagesResponse["messages"][number]>(`/routes/${routeId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function previewNegotiation(rideId: string, payload: { lat: number; lng: number }) {
  return request<{ estimatedDetourMinutes: number; estimatedDetourMeters: number }>(
    `/rides/${rideId}/negotiations/preview`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function createNegotiation(
  rideId: string,
  payload: { lat: number; lng: number; passengerMessage?: string; extraAmountCents: number },
) {
  return request<RideNegotiation>(`/rides/${rideId}/negotiations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyNegotiations() {
  return request<RideNegotiation[]>("/my/negotiations");
}

export async function acceptNegotiation(negotiationId: string) {
  return request<RideNegotiation>(`/negotiations/${negotiationId}/accept`, {
    method: "POST",
  });
}

export async function rejectNegotiation(negotiationId: string, driverMessage?: string) {
  return request<RideNegotiation>(`/negotiations/${negotiationId}/reject`, {
    method: "POST",
    body: JSON.stringify(driverMessage ? { driverMessage } : {}),
  });
}

export async function counterNegotiation(
  negotiationId: string,
  payload: { lat: number; lng: number; driverMessage?: string; counterExtraAmountCents: number },
) {
  return request<RideNegotiation>(`/negotiations/${negotiationId}/counter`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelNegotiation(negotiationId: string) {
  return request<RideNegotiation>(`/negotiations/${negotiationId}/cancel`, {
    method: "POST",
  });
}

export async function geocodeAddress(query: string): Promise<GeocodeSuggestion[]> {
  return geocodeAddressWithGoogle(query);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface AppNotification {
  id: string;
  userId: string;
  kind: string;
  status: "UNREAD" | "READ" | "ACTED";
  title: string;
  message: string;
  actionRequired: boolean;
  deepLink: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export async function getNotifications(page = 1): Promise<AppNotification[]> {
  return request<AppNotification[]>(`/notifications?page=${page}`);
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return request<{ count: number }>("/notifications/unread-count");
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  return request<AppNotification>(`/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/notifications/read-all", { method: "POST" });
}
