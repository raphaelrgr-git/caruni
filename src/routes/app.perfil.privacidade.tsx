import { createFileRoute } from "@tanstack/react-router";
import { ProfilePrivacyPage } from "@/features/perfil/PerfilPage";

export const Route = createFileRoute("/app/perfil/privacidade")({
  head: () => ({ meta: [{ title: "CarUni — Privacidade" }] }),
  component: ProfilePrivacyPage,
});
