import { createFileRoute } from "@tanstack/react-router";
import { ProfileConnectionsPage } from "@/features/perfil/PerfilPage";

export const Route = createFileRoute("/app/perfil/conexoes")({
  head: () => ({ meta: [{ title: "CarUni — Conexões" }] }),
  component: ProfileConnectionsPage,
});
