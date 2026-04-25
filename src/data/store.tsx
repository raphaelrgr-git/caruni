import * as React from "react";
import {
  eu,
  formatBRL,
  getPessoa,
  rotas as seedRotas,
  transacoes as seedTransacoes,
  type Rota,
  type Transacao,
} from "@/data/mock";
import {
  distanceKm,
  estimateUber99,
  getPlace,
  makeRoutePath,
  type PlaceSuggestion,
} from "@/data/places";

export type BookingKind = "recorrente" | "avulso";
export type BookingStatus = "ativa" | "cancelada";
export type RideStatus = "agendada" | "confirmada" | "disputa" | "cancelada";
export type SubscriptionPlanId = "calouro" | "veterano";
export type CreditStatus = "disponivel" | "reservado" | "consumido" | "expirado" | "perdido";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  nome: string;
  weeklyPrice: number;
  creditsIncluded: number;
  costPerTrip: number;
  extraTripPrice: number;
  driverPayoutPerCredit: number;
  priority: boolean;
  accent: string;
  pitch: string;
}

export interface UserSubscription {
  planId: SubscriptionPlanId;
  cycleStart: string;
  cycleEnd: string;
  autoRenew: boolean;
}

export interface CreditLedgerEntry {
  id: string;
  status: CreditStatus;
  planId: SubscriptionPlanId;
  rotaId?: string;
  bookingId?: string;
  rideId?: string;
  monetaryValue: number;
  createdAt: string;
  description: string;
}

export interface TransportSavingsSummary {
  confirmedTrips: number;
  caruniCost: number;
  busCost: number;
  busSavings: number;
  privateCost: number;
  privateSavings: number;
  weeklyProjectionBus: number;
  weeklyProjectionPrivate: number;
}

export interface Booking {
  id: string;
  rotaId: string;
  passageiroId: string;
  diasSemana: number[];
  tipo: BookingKind;
  status: BookingStatus;
  creditIds: string[];
  criadaEm: string;
}

export interface RideInstance {
  id: string;
  rotaId: string;
  data: string;
  status: RideStatus;
  motoristaConfirmou: boolean;
  passageiroConfirmou: boolean;
  passageiroEmbarcou: boolean | null;
  creditId?: string;
}

export interface Review {
  id: string;
  rotaId: string;
  fromId: string;
  toId: string;
  rating: number;
  texto: string;
  criadaEm: string;
}

interface AppState {
  rotas: Rota[];
  bookings: Booking[];
  rides: RideInstance[];
  reviews: Review[];
  transacoes: Transacao[];
  subscription: UserSubscription;
  creditLedger: CreditLedgerEntry[];
  extraCreditsPurchased: number;
}

interface CreateRouteInput {
  nome: string;
  origem: PlaceSuggestion;
  destino: PlaceSuggestion;
  diasSemana: number[];
  horarioIda: string;
  vagas: number;
  caminho?: LatLng[];
  km?: number;
}

interface CreditSummary {
  total: number;
  disponivel: number;
  reservado: number;
  consumido: number;
  expirado: number;
  perdido: number;
}

interface StoreContextValue extends AppState {
  plans: SubscriptionPlan[];
  activePlan: SubscriptionPlan;
  creditSummary: CreditSummary;
  savings: TransportSavingsSummary;
  saldo: number;
  reservado: number;
  saldoDisponivel: number;
  createRoute: (input: CreateRouteInput) => Rota;
  selectPlan: (planId: SubscriptionPlanId) => void;
  reserveCredit: (rotaId: string, diasSemana: number[], tipo: BookingKind) => Booking | null;
  consumeReservedCredit: (rideId: string) => void;
  releaseReservedCredit: (bookingId: string, late?: boolean) => void;
  buyExtraCredit: () => void;
  calculateSavings: () => TransportSavingsSummary;
  bookRoute: (rotaId: string, diasSemana: number[], tipo: BookingKind) => Booking | null;
  cancelBooking: (bookingId: string, late?: boolean) => void;
  cancelRouteDay: (rotaId: string, day: number) => void;
  confirmDriverBoarded: (rideId: string, boarded: boolean) => void;
  confirmPassengerRide: (rideId: string) => void;
  addReview: (rotaId: string, toId: string, rating: number, texto: string) => void;
  topUp: () => void;
  resetDemo: () => void;
}

export const BUS_FARE = 6.5;

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "calouro",
    nome: "Calouro",
    weeklyPrice: 20,
    creditsIncluded: 5,
    costPerTrip: 4,
    extraTripPrice: 5,
    driverPayoutPerCredit: 3.2,
    priority: false,
    accent: "success",
    pitch: "5 viagens garantidas essa semana",
  },
  {
    id: "veterano",
    nome: "Veterano",
    weeklyPrice: 35,
    creditsIncluded: 10,
    costPerTrip: 3.5,
    extraTripPrice: 4,
    driverPayoutPerCredit: 3.25,
    priority: true,
    accent: "primary",
    pitch: "10 viagens garantidas essa semana",
  },
];

const hoje = new Date().toISOString().slice(0, 10);
const STORAGE_KEY = "caruni-mvp-state-v2";

function getPlan(planId: SubscriptionPlanId) {
  return subscriptionPlans.find((plan) => plan.id === planId) ?? subscriptionPlans[1];
}

function cycleBounds() {
  const start = new Date();
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function safeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function clampMoney(value: number) {
  return +value.toFixed(2);
}

function createCredit(
  plan: SubscriptionPlan,
  index: number,
  status: CreditStatus,
  overrides: Partial<CreditLedgerEntry> = {},
): CreditLedgerEntry {
  return {
    id: overrides.id ?? `credit-${plan.id}-${index + 1}`,
    status,
    planId: plan.id,
    monetaryValue: plan.costPerTrip,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    description: overrides.description ?? `${plan.nome} · crédito semanal`,
    ...overrides,
  };
}

function makeInitialState(): AppState {
  const plan = getPlan("veterano");
  const { start, end } = cycleBounds();
  const rota = seedRotas[0];
  const creditLedger = Array.from({ length: plan.creditsIncluded }, (_, index) =>
    createCredit(plan, index, index < 6 ? "consumido" : index === 6 ? "reservado" : "disponivel", {
      rotaId: index < 7 ? rota.id : undefined,
      bookingId: index === 6 ? "b1" : undefined,
      rideId: index < 6 ? `ride-done-${index + 1}` : undefined,
      description:
        index < 6
          ? `Viagem confirmada · ${rota.nome}`
          : index === 6
            ? `Crédito reservado · ${rota.nome}`
            : `${plan.nome} · crédito semanal`,
    }),
  );

  return {
    rotas: seedRotas,
    bookings: [
      {
        id: "b1",
        rotaId: rota.id,
        passageiroId: eu.id,
        diasSemana: [1, 2, 3, 4, 5],
        tipo: "recorrente",
        status: "ativa",
        creditIds: ["credit-veterano-7"],
        criadaEm: new Date().toISOString(),
      },
    ],
    rides: [
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `ride-done-${index + 1}`,
        rotaId: rota.id,
        data: hoje,
        status: "confirmada" as const,
        motoristaConfirmou: true,
        passageiroConfirmou: true,
        passageiroEmbarcou: true,
        creditId: `credit-veterano-${index + 1}`,
      })),
      {
        id: "ride-1",
        rotaId: rota.id,
        data: hoje,
        status: "agendada",
        motoristaConfirmou: false,
        passageiroConfirmou: false,
        passageiroEmbarcou: null,
        creditId: "credit-veterano-7",
      },
    ],
    reviews: [
      {
        id: "rev-1",
        rotaId: "r1",
        fromId: "u1",
        toId: "u2",
        rating: 5,
        texto: "Pontual e rota bem combinada.",
        criadaEm: new Date().toISOString(),
      },
      {
        id: "rev-2",
        rotaId: "r1",
        fromId: "u2",
        toId: "u1",
        rating: 5,
        texto: "Sempre confirma antes e chega no ponto.",
        criadaEm: new Date().toISOString(),
      },
    ],
    transacoes: [
      {
        id: "sub-veterano",
        tipo: "assinatura",
        descricao: "Plano Veterano · 10 viagens garantidas",
        valor: -plan.weeklyPrice,
        data: start,
      },
      {
        id: "credit-reserved-r1",
        tipo: "credito_reservado",
        descricao: "Crédito reservado · Centro → UDESC",
        valor: 0,
        data: new Date().toISOString(),
        rotaId: rota.id,
      },
      ...seedTransacoes.slice(0, 4),
    ],
    subscription: {
      planId: plan.id,
      cycleStart: start,
      cycleEnd: end,
      autoRenew: false,
    },
    creditLedger,
    extraCreditsPurchased: 0,
  };
}

const StoreContext = React.createContext<StoreContextValue | null>(null);

function getCreditSummary(state: AppState, plan: SubscriptionPlan): CreditSummary {
  const counts = state.creditLedger.reduce(
    (acc, credit) => {
      acc[credit.status] += 1;
      return acc;
    },
    { disponivel: 0, reservado: 0, consumido: 0, expirado: 0, perdido: 0 },
  );

  return {
    total: plan.creditsIncluded + state.extraCreditsPurchased,
    ...counts,
  };
}

function calculateSavingsForState(state: AppState): TransportSavingsSummary {
  const confirmedCredits = state.creditLedger.filter((credit) => credit.status === "consumido");
  const caruniCost = clampMoney(
    confirmedCredits.reduce((total, credit) => total + credit.monetaryValue, 0),
  );
  const busCost = clampMoney(confirmedCredits.length * BUS_FARE);
  const privateCost = clampMoney(
    confirmedCredits.reduce((total, credit) => {
      const rota = state.rotas.find((r) => r.id === credit.rotaId);
      return total + estimateUber99(rota?.km ?? 5.5);
    }, 0),
  );
  const plan = getPlan(state.subscription.planId);
  const avgKm =
    state.rotas.reduce((total, rota) => total + rota.km, 0) / Math.max(1, state.rotas.length);

  return {
    confirmedTrips: confirmedCredits.length,
    caruniCost,
    busCost,
    busSavings: clampMoney(busCost - caruniCost),
    privateCost,
    privateSavings: clampMoney(privateCost - caruniCost),
    weeklyProjectionBus: clampMoney(plan.creditsIncluded * (BUS_FARE - plan.costPerTrip)),
    weeklyProjectionPrivate: clampMoney(
      plan.creditsIncluded * (estimateUber99(avgKm) - plan.costPerTrip),
    ),
  };
}

function appendTransaction(state: AppState, transaction: Transacao): AppState {
  return { ...state, transacoes: [transaction, ...state.transacoes] };
}

export function CaruniStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AppState>(() => makeInitialState());

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as AppState);
    } catch {
      // Demo only: if storage is unavailable, keep in-memory state.
    }
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore persistence errors in the MVP demo.
    }
  }, [state]);

  const selectPlan = React.useCallback((planId: SubscriptionPlanId) => {
    setState((s) => {
      const plan = getPlan(planId);
      const { start, end } = cycleBounds();
      const creditLedger = Array.from({ length: plan.creditsIncluded }, (_, index) =>
        createCredit(plan, index, "disponivel"),
      );
      return {
        ...s,
        subscription: { planId, cycleStart: start, cycleEnd: end, autoRenew: false },
        creditLedger,
        bookings: [],
        rides: s.rides.map((ride) =>
          ride.status === "agendada" ? { ...ride, creditId: undefined } : ride,
        ),
        extraCreditsPurchased: 0,
        transacoes: [
          {
            id: safeId("t"),
            tipo: "assinatura",
            descricao: `${plan.pitch} · menos de ${formatBRL(plan.costPerTrip)} por trajeto`,
            valor: -plan.weeklyPrice,
            data: new Date().toISOString(),
          },
          ...s.transacoes,
        ],
      };
    });
  }, []);

  const createRoute = React.useCallback((input: CreateRouteInput) => {
    const km = input.km ?? distanceKm(input.origem.coord, input.destino.coord);
    const rota: Rota = {
      id: safeId("r"),
      nome: input.nome || `${input.origem.shortLabel} → ${input.destino.shortLabel}`,
      origem: { label: input.origem.label, coord: input.origem.coord },
      destino: { label: input.destino.label, coord: input.destino.coord },
      caminho: input.caminho ?? makeRoutePath(input.origem.coord, input.destino.coord),
      motoristaId: eu.id,
      diasSemana: input.diasSemana,
      horarioIda: input.horarioIda,
      vagas: input.vagas,
      inscritos: [],
      precoBase: 0,
      km,
      cidade: "Joinville",
    };
    setState((s) => ({ ...s, rotas: [rota, ...s.rotas] }));
    return rota;
  }, []);

  const reserveCredit = React.useCallback(
    (rotaId: string, diasSemana: number[], tipo: BookingKind) => {
      let created: Booking | null = null;
      setState((s) => {
        const rota = s.rotas.find((r) => r.id === rotaId);
        if (!rota || diasSemana.length === 0 || rota.inscritos.length >= rota.vagas) return s;

        const alreadyBooked = s.bookings.some(
          (b) => b.rotaId === rotaId && b.passageiroId === eu.id && b.status === "ativa",
        );
        if (alreadyBooked) return s;

        const credit = s.creditLedger.find((entry) => entry.status === "disponivel");
        if (!credit) return s;

        const bookingId = safeId("b");
        const updatedCredit = {
          ...credit,
          status: "reservado" as const,
          rotaId,
          bookingId,
          description: `Crédito reservado · ${rota.nome}`,
        };
        created = {
          id: bookingId,
          rotaId,
          passageiroId: eu.id,
          diasSemana,
          tipo,
          status: "ativa",
          creditIds: [credit.id],
          criadaEm: new Date().toISOString(),
        };

        const nextRide: RideInstance = {
          id: safeId("ride"),
          rotaId,
          data: hoje,
          status: "agendada",
          motoristaConfirmou: false,
          passageiroConfirmou: false,
          passageiroEmbarcou: null,
          creditId: credit.id,
        };

        return appendTransaction(
          {
            ...s,
            bookings: [created, ...s.bookings],
            rides: [nextRide, ...s.rides],
            creditLedger: s.creditLedger.map((entry) =>
              entry.id === credit.id ? updatedCredit : entry,
            ),
            rotas: s.rotas.map((r) =>
              r.id === rotaId && !r.inscritos.includes(eu.id)
                ? { ...r, inscritos: [...r.inscritos, eu.id] }
                : r,
            ),
          },
          {
            id: safeId("t"),
            tipo: "credito_reservado",
            descricao: `${rota.nome} · 1 crédito bloqueado`,
            valor: 0,
            data: new Date().toISOString(),
            rotaId,
          },
        );
      });
      return created;
    },
    [],
  );

  const releaseReservedCredit = React.useCallback((bookingId: string, late = false) => {
    setState((s) => {
      const booking = s.bookings.find((b) => b.id === bookingId);
      if (!booking || booking.status === "cancelada") return s;
      const rota = s.rotas.find((r) => r.id === booking.rotaId);
      const transactionType = late ? "credito_perdido" : "credito_devolvido";
      const updatedLedger = s.creditLedger.map((credit) => {
        if (!booking.creditIds.includes(credit.id)) return credit;
        return {
          ...credit,
          status: late ? ("perdido" as const) : ("disponivel" as const),
          bookingId: late ? credit.bookingId : undefined,
          rotaId: late ? credit.rotaId : undefined,
          description: late
            ? `Cancelamento tardio · ${rota?.nome ?? "rota"}`
            : `Crédito devolvido · ${rota?.nome ?? "rota"}`,
        };
      });

      return appendTransaction(
        {
          ...s,
          bookings: s.bookings.map((b) => (b.id === bookingId ? { ...b, status: "cancelada" } : b)),
          creditLedger: updatedLedger,
          rotas: s.rotas.map((r) =>
            r.id === booking.rotaId
              ? { ...r, inscritos: r.inscritos.filter((id) => id !== booking.passageiroId) }
              : r,
          ),
        },
        {
          id: safeId("t"),
          tipo: transactionType,
          descricao: late
            ? `${rota?.nome ?? "Rota"} · cancelamento tardio perdeu 1 crédito`
            : `${rota?.nome ?? "Rota"} · crédito devolvido`,
          valor: late ? -getPlan(s.subscription.planId).costPerTrip * 0.5 : 0,
          data: new Date().toISOString(),
          rotaId: booking.rotaId,
        },
      );
    });
  }, []);

  const consumeReservedCredit = React.useCallback((rideId: string) => {
    setState((s) => {
      const ride = s.rides.find((r) => r.id === rideId);
      if (!ride?.creditId) return s;
      const rota = s.rotas.find((r) => r.id === ride.rotaId);
      const plan = getPlan(s.subscription.planId);

      return appendTransaction(
        {
          ...s,
          creditLedger: s.creditLedger.map((credit) =>
            credit.id === ride.creditId
              ? {
                  ...credit,
                  status: "consumido",
                  rideId,
                  description: `Viagem confirmada · ${rota?.nome ?? "rota"}`,
                }
              : credit,
          ),
          rides: s.rides.map((r) => (r.id === rideId ? { ...r, status: "confirmada" } : r)),
        },
        {
          id: safeId("t"),
          tipo: "credito_consumido",
          descricao: `${rota?.nome ?? "Rota"} · crédito transferido ao motorista`,
          valor: -plan.costPerTrip,
          data: new Date().toISOString(),
          rotaId: ride.rotaId,
        },
      );
    });
  }, []);

  const markNoShow = React.useCallback((rideId: string) => {
    setState((s) => {
      const ride = s.rides.find((r) => r.id === rideId);
      if (!ride?.creditId) return s;
      const rota = s.rotas.find((r) => r.id === ride.rotaId);
      const plan = getPlan(s.subscription.planId);
      return appendTransaction(
        {
          ...s,
          creditLedger: s.creditLedger.map((credit) =>
            credit.id === ride.creditId
              ? {
                  ...credit,
                  status: "perdido",
                  rideId,
                  description: `No-show · ${rota?.nome ?? "rota"}`,
                }
              : credit,
          ),
          rides: s.rides.map((r) => (r.id === rideId ? { ...r, status: "disputa" } : r)),
        },
        {
          id: safeId("t"),
          tipo: "credito_perdido",
          descricao: `${rota?.nome ?? "Rota"} · no-show perdeu 1 crédito`,
          valor: -plan.costPerTrip,
          data: new Date().toISOString(),
          rotaId: ride.rotaId,
        },
      );
    });
  }, []);

  const buyExtraCredit = React.useCallback(() => {
    setState((s) => {
      const plan = getPlan(s.subscription.planId);
      const extraCredit = createCredit(plan, s.creditLedger.length, "disponivel", {
        id: safeId("credit-extra"),
        monetaryValue: plan.extraTripPrice,
        description: `Viagem extra · Plano ${plan.nome}`,
      });
      return appendTransaction(
        {
          ...s,
          extraCreditsPurchased: s.extraCreditsPurchased + 1,
          creditLedger: [...s.creditLedger, extraCredit],
        },
        {
          id: safeId("t"),
          tipo: "recarga",
          descricao: `Viagem extra · Plano ${plan.nome}`,
          valor: -plan.extraTripPrice,
          data: new Date().toISOString(),
        },
      );
    });
  }, []);

  const cancelRouteDay = React.useCallback((rotaId: string, day: number) => {
    setState((s) => ({
      ...s,
      rotas: s.rotas.map((r) =>
        r.id === rotaId ? { ...r, diasSemana: r.diasSemana.filter((d) => d !== day) } : r,
      ),
    }));
  }, []);

  const confirmDriverBoarded = React.useCallback(
    (rideId: string, boarded: boolean) => {
      let shouldConsume = false;
      setState((s) => {
        const ride = s.rides.find((r) => r.id === rideId);
        if (!ride || ride.status !== "agendada") return s;
        shouldConsume = boarded && ride.passageiroConfirmou;
        return {
          ...s,
          rides: s.rides.map((r) =>
            r.id === rideId ? { ...r, motoristaConfirmou: true, passageiroEmbarcou: boarded } : r,
          ),
        };
      });
      if (!boarded) markNoShow(rideId);
      if (shouldConsume) consumeReservedCredit(rideId);
    },
    [consumeReservedCredit, markNoShow],
  );

  const confirmPassengerRide = React.useCallback(
    (rideId: string) => {
      let shouldConsume = false;
      setState((s) => {
        const ride = s.rides.find((r) => r.id === rideId);
        if (!ride || ride.status !== "agendada") return s;
        shouldConsume = ride.motoristaConfirmou && ride.passageiroEmbarcou === true;
        return {
          ...s,
          rides: s.rides.map((r) => (r.id === rideId ? { ...r, passageiroConfirmou: true } : r)),
        };
      });
      if (shouldConsume) consumeReservedCredit(rideId);
    },
    [consumeReservedCredit],
  );

  const addReview = React.useCallback(
    (rotaId: string, toId: string, rating: number, texto: string) => {
      setState((s) => ({
        ...s,
        reviews: [
          {
            id: safeId("rev"),
            rotaId,
            fromId: eu.id,
            toId,
            rating,
            texto,
            criadaEm: new Date().toISOString(),
          },
          ...s.reviews,
        ],
      }));
    },
    [],
  );

  const resetDemo = React.useCallback(() => {
    const fresh = makeInitialState();
    setState(fresh);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // noop
    }
  }, []);

  const activePlan = getPlan(state.subscription.planId);
  const creditSummary = getCreditSummary(state, activePlan);
  const savings = calculateSavingsForState(state);

  const value = React.useMemo<StoreContextValue>(
    () => ({
      ...state,
      plans: subscriptionPlans,
      activePlan,
      creditSummary,
      savings,
      saldo: creditSummary.disponivel,
      reservado: creditSummary.reservado,
      saldoDisponivel: creditSummary.disponivel,
      createRoute,
      selectPlan,
      reserveCredit,
      consumeReservedCredit,
      releaseReservedCredit,
      buyExtraCredit,
      calculateSavings: () => calculateSavingsForState(state),
      bookRoute: reserveCredit,
      cancelBooking: releaseReservedCredit,
      cancelRouteDay,
      confirmDriverBoarded,
      confirmPassengerRide,
      addReview,
      topUp: buyExtraCredit,
      resetDemo,
    }),
    [
      state,
      activePlan,
      creditSummary,
      savings,
      createRoute,
      selectPlan,
      reserveCredit,
      consumeReservedCredit,
      releaseReservedCredit,
      buyExtraCredit,
      cancelRouteDay,
      confirmDriverBoarded,
      confirmPassengerRide,
      addReview,
      resetDemo,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useCaruniStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useCaruniStore must be used inside CaruniStoreProvider");
  return ctx;
}

export { estimateUber99, getPlace };
