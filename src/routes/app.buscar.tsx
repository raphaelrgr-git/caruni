import { createFileRoute } from "@tanstack/react-router";
import { BuscarPage } from "@/features/buscar/BuscarPage";

export const Route = createFileRoute("/app/buscar")({
  head: () => ({ meta: [{ title: "CarUni — Buscar carona" }] }),
  component: BuscarPage,
});
