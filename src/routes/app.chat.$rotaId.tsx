import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "@/features/chat/ChatPage";

export const Route = createFileRoute("/app/chat/$rotaId")({
  head: () => ({ meta: [{ title: "CarUni — Chat da rota" }] }),
  component: function ChatRoute() {
    const { rotaId } = Route.useParams();
    return <ChatPage rotaId={rotaId} />;
  },
});
