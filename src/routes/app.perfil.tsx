import { createFileRoute } from "@tanstack/react-router";
import { PerfilPage } from "@/features/perfil/PerfilPage";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "CarUni — Perfil" }] }),
  component: PerfilPage,
});
