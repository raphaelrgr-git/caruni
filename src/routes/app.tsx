import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "CarUni — App" },
      { name: "description", content: "Painel CarUni: próximas caronas, busca de rotas, carteira e perfil." },
    ],
  }),
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});