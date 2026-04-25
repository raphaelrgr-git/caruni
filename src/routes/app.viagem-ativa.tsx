import { createFileRoute } from "@tanstack/react-router";
import { ViagemAtivaPage } from "@/features/viagem-ativa/ViagemAtivaPage";

export const Route = createFileRoute("/app/viagem-ativa")({
  head: () => ({ meta: [{ title: "CarUni — Viagem ativa" }] }),
  component: ViagemAtivaPage,
});
