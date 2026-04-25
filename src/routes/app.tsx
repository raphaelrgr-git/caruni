import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getMe } from "@/lib/api";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "CarUni — App" },
      { name: "description", content: "Painel CarUni: próximas caronas, busca de rotas, carteira e perfil." },
    ],
  }),
  beforeLoad: async () => {
    try {
      await getMe();
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
