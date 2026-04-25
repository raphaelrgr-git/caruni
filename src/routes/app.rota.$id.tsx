import { createFileRoute } from "@tanstack/react-router";
import { RotaDetalhePage } from "@/features/booking/RotaDetalhePage";

export const Route = createFileRoute("/app/rota/$id")({
  head: () => ({ meta: [{ title: "CarUni — Detalhe da rota" }] }),
  component: function RotaDetalheRoute() {
    const { id } = Route.useParams();
    return <RotaDetalhePage id={id} />;
  },
});
