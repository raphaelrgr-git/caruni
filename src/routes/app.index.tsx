import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "CarUni — Início" },
      {
        name: "description",
        content: "Sua próxima carona, ganhos do mês e reputação no painel CarUni.",
      },
    ],
  }),
  component: DashboardPage,
});
