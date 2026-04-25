import { createFileRoute } from "@tanstack/react-router";
import { CarteiraPage } from "@/features/carteira/CarteiraPage";

export const Route = createFileRoute("/app/carteira")({
  head: () => ({ meta: [{ title: "CarUni — Carteira" }] }),
  component: CarteiraPage,
});
