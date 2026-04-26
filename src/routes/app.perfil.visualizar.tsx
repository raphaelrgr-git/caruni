import { createFileRoute } from "@tanstack/react-router";
import { ProfileOverviewPage } from "@/features/perfil/PerfilPage";

export const Route = createFileRoute("/app/perfil/visualizar")({
  validateSearch: (search: Record<string, unknown>) => ({
    userId: typeof search.userId === "string" ? search.userId : undefined,
  }),
  head: () => ({ meta: [{ title: "CarUni — Ver perfil" }] }),
  component: ProfileOverviewPage,
});
