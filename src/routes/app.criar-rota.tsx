import { createFileRoute } from "@tanstack/react-router";
import { CriarRotaPage } from "@/features/criar-rota/CriarRotaPage";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/criar-rota")({
  head: () => ({ meta: [{ title: "CarUni — Criar rota" }] }),
  component: function CreateRouteGuard() {
    const { user } = useAuth();
    if (user?.role !== "MOTORISTA") {
      return (
        <div className="mx-auto max-w-2xl px-4 py-10 text-center">
          <h1 className="text-xl font-semibold text-foreground">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Apenas contas de motorista podem criar rotas. Atualize seu papel em Perfil.
          </p>
        </div>
      );
    }
    return <CriarRotaPage />;
  },
});
