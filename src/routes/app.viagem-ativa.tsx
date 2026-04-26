import { createFileRoute } from "@tanstack/react-router";
import { ViagemAtivaPage } from "@/features/viagem-ativa/ViagemAtivaPage";

export const Route = createFileRoute("/app/viagem-ativa")({
  validateSearch: (search: Record<string, unknown>) => ({
    rideId: typeof search.rideId === "string" ? search.rideId : undefined,
  }),
  head: () => ({ meta: [{ title: "CarUni — Viagem ativa" }] }),
  component: ViagemAtivaPage,
});
