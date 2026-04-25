import { createFileRoute } from "@tanstack/react-router";
import { CriarRotaPage } from "@/features/criar-rota/CriarRotaPage";

export const Route = createFileRoute("/app/criar-rota")({
  head: () => ({ meta: [{ title: "CarUni — Criar rota" }] }),
  component: CriarRotaPage,
});
