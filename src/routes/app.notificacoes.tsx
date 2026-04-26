import { createFileRoute } from "@tanstack/react-router";
import { NotificacoesPage } from "@/features/notificacoes/NotificacoesPage";

export const Route = createFileRoute("/app/notificacoes")({
  head: () => ({ meta: [{ title: "CarUni — Notificações" }] }),
  component: NotificacoesPage,
});
