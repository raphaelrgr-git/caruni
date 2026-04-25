import { createFileRoute } from "@tanstack/react-router";
import { MinhasCaronasPage } from "@/features/minhas-caronas/MinhasCaronasPage";

export const Route = createFileRoute("/app/minhas-caronas")({
  head: () => ({ meta: [{ title: "CarUni — Minhas caronas" }] }),
  component: MinhasCaronasPage,
});
