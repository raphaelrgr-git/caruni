import { createFileRoute } from "@tanstack/react-router";
import { ProfileSettingsPage } from "@/features/perfil/PerfilPage";

export const Route = createFileRoute("/app/perfil/configuracoes")({
  head: () => ({ meta: [{ title: "CarUni — Configurações" }] }),
  component: ProfileSettingsPage,
});
