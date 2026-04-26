import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { AppBackButton } from "@/components/AppBackButton";
import { Avatar } from "@/components/Brand";
import { getRouteDetail, getRouteMessages, postRouteMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function ChatPage({ rotaId }: { rotaId: string }) {
  const { user } = useAuth();
  const [routeName, setRouteName] = React.useState("Chat da rota");
  const [participantCount, setParticipantCount] = React.useState(0);
  const [messages, setMessages] = React.useState<
    Array<{
      id: string;
      body: string;
      createdAt: string;
      author: { id: string; name: string; photoUrl: string | null };
    }>
  >([]);
  const [draft, setDraft] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [hasNewMessages, setHasNewMessages] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const lastMessageIdRef = React.useRef<string | null>(null);

  const load = React.useCallback(async () => {
    const [detail, messageData] = await Promise.all([
      getRouteDetail(rotaId),
      getRouteMessages(rotaId),
    ]);
    setRouteName(detail.name);
    setParticipantCount(detail.passengers.length + 1);
    const newLastId = messageData.messages.at(-1)?.id ?? null;
    if (
      lastMessageIdRef.current &&
      newLastId &&
      newLastId !== lastMessageIdRef.current &&
      scrollRef.current
    ) {
      const nearBottom =
        scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight <
        120;
      if (!nearBottom) setHasNewMessages(true);
    }
    lastMessageIdRef.current = newLastId;
    setMessages(messageData.messages);
  }, [rotaId]);

  React.useEffect(() => {
    void load().catch((error) => {
      setFeedback(error instanceof Error ? error.message : "Falha ao carregar chat.");
    });
  }, [load]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      void load().catch(() => {});
    }, 3000);
    return () => window.clearInterval(timer);
  }, [load]);

  React.useEffect(() => {
    if (!scrollRef.current) return;
    if (hasNewMessages) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, hasNewMessages]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      body: draft.trim(),
      kind: "USER" as const,
      createdAt: new Date().toISOString(),
      author: {
        id: user?.id ?? "me",
        name: user?.name ?? "Você",
        photoUrl: user?.photoUrl ?? null,
      },
    };
    try {
      setSending(true);
      setMessages((current) => [...current, optimisticMessage]);
      setDraft("");
      setFeedback("");
      await postRouteMessage(rotaId, optimisticMessage.body);
      await load();
    } catch (error) {
      setMessages((current) => current.filter((message) => message.id !== tempId));
      setFeedback(error instanceof Error ? error.message : "Falha ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] w-full max-w-3xl flex-col px-4 py-4 lg:px-8 lg:py-6">
      <div className="flex items-center justify-between">
        <AppBackButton fallbackTo="/app" className="text-xs" />
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{routeName}</p>
          <p className="text-[10px] text-muted-foreground">{participantCount} pessoas</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-xl border border-border bg-surface p-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full min-h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-surface-2/40 px-6 text-center text-sm text-muted-foreground">
            Assim que alguém mandar mensagem na rota, a conversa aparece aqui.
          </div>
        ) : null}
        {messages.map((message) => {
          const mine = message.author.id === user?.id;
          const system = message.kind === "SYSTEM";

          if (system) {
            return (
              <div key={message.id} className="flex justify-center">
                <div className="max-w-[85%] rounded-full bg-surface-2 px-4 py-2 text-center text-xs text-muted-foreground">
                  {message.body}
                </div>
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}
            >
              <Avatar
                name={message.author.name}
                size={26}
                iniciais={message.author.name.slice(0, 2).toUpperCase()}
                src={message.author.photoUrl}
              />
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-primary text-primary-foreground" : "bg-surface-2 text-foreground"
                }`}
              >
                {!mine ? (
                  <p className="text-[10px] font-medium opacity-70">
                    {message.author.name.split(" ")[0]}
                  </p>
                ) : null}
                <p>{message.body}</p>
                <p className="mt-0.5 text-[10px] opacity-60">
                  {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {hasNewMessages ? (
        <button
          onClick={() => {
            if (!scrollRef.current) return;
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            setHasNewMessages(false);
          }}
          className="mt-3 inline-flex self-center rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Ver mensagens novas
        </button>
      ) : null}

      {feedback ? <p className="mt-2 text-xs text-muted-foreground">{feedback}</p> : null}

      <form
        onSubmit={(e) => void submit(e)}
        className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Mensagem para a rota…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground",
            "disabled:opacity-50",
          )}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
