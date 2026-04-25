import { createFileRoute, notFound } from "@tanstack/react-router";
import { getRota } from "@/data/mock";
import { ChatPage } from "@/features/chat/ChatPage";

export const Route = createFileRoute("/app/chat/$rotaId")({
  head: () => ({ meta: [{ title: "CarUni — Chat da rota" }] }),
  loader: ({ params }) => {
    const r = getRota(params.rotaId);
    if (!r) throw notFound();
    return r;
  },
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted-foreground">Rota não encontrada.</div>
  ),
  component: function ChatRoute() {
    const rota = Route.useLoaderData();
    return <ChatPage rota={rota} />;
  },
});
