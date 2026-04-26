import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, ChevronDown } from "lucide-react";
import { useNotifications } from "@/lib/notifications";
import { getNotifications, type AppNotification } from "@/lib/api";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days} dias atrás`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function kindToEmoji(kind: string): string {
  if (kind.startsWith("NEGOTIATION")) return "🤝";
  if (kind.startsWith("BOOKING")) return "🎫";
  if (kind.startsWith("RIDE_CONFIRMATION")) return "⏰";
  if (kind.startsWith("RIDE_CONFIRMED")) return "✅";
  if (kind.startsWith("RIDE_CANCELLED")) return "❌";
  if (kind.startsWith("RIDE_DISPUTE")) return "⚠️";
  if (kind.startsWith("RIDE_COMPLETED")) return "🏁";
  if (kind === "REVIEW_RECEIVED") return "⭐";
  if (kind.startsWith("STREAK")) return "🔥";
  if (kind === "CONNECTION_CREATED") return "👋";
  return "🔔";
}

function NotificationCard({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead(id: string, deepLink: string | null): void;
}) {
  const isUnread = notification.status === "UNREAD";

  return (
    <button
      onClick={() => onRead(notification.id, notification.deepLink)}
      className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-surface-2 ${
        isUnread
          ? "border-primary/20 bg-primary/5"
          : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-xl leading-none" aria-hidden>
          {kindToEmoji(notification.kind)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm ${isUnread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
              {notification.title}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              {isUnread && (
                <span className="h-2 w-2 rounded-full bg-primary" aria-label="Não lida" />
              )}
              {notification.actionRequired && (
                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  Ação
                </span>
              )}
            </div>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p>
          <p className="mt-1.5 text-xs text-muted-foreground/70">{relativeTime(notification.createdAt)}</p>
        </div>
      </div>
    </button>
  );
}

export function NotificacoesPage() {
  const { notifications, unreadCount, loading, markRead, markAllRead, refresh } =
    useNotifications();
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [extraNotifications, setExtraNotifications] = React.useState<AppNotification[]>([]);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const allNotifications = React.useMemo(() => {
    const seen = new Set(notifications.map((n) => n.id));
    const extras = extraNotifications.filter((n) => !seen.has(n.id));
    return [...notifications, ...extras];
  }, [notifications, extraNotifications]);

  const handleRead = React.useCallback(
    async (id: string, deepLink: string | null) => {
      await markRead(id);
      if (deepLink) {
        void navigate({ to: deepLink as never });
      }
    },
    [markRead, navigate],
  );

  const handleLoadMore = React.useCallback(async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const more = await getNotifications(nextPage);
      if (more.length < 30) setHasMore(false);
      setExtraNotifications((prev) => [...prev, ...more]);
      setPage(nextPage);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [page]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Notificações</h1>
          {unreadCount > 0 && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => void markAllRead()}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <CheckCheck size={14} />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      ) : allNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface py-16 text-center">
          <Bell size={40} className="text-muted-foreground/40" />
          <p className="font-medium text-foreground">Nenhuma notificação</p>
          <p className="text-sm text-muted-foreground">Você está em dia por enquanto.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {allNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRead={(id, deepLink) => void handleRead(id, deepLink)}
              />
            ))}
          </div>

          {hasMore && allNotifications.length >= 30 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => void handleLoadMore()}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
              >
                {loadingMore ? (
                  "Carregando..."
                ) : (
                  <>
                    <ChevronDown size={16} />
                    Ver mais
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
