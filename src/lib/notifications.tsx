import * as React from "react";
import {
  API_BASE,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "./api";

interface NotificationCtx {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh(): Promise<void>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

const NotificationContext = React.createContext<NotificationCtx | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const esRef = React.useRef<EventSource | null>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const [notifs, { count }] = await Promise.all([getNotifications(), getUnreadCount()]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch {
      // Silently ignore — user might not be authenticated yet
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = React.useCallback(async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "READ" as const } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllRead = React.useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" as const })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    void refresh();

    const startSse = () => {
      const es = new EventSource(`${API_BASE}/notifications/stream`, { withCredentials: true });
      esRef.current = es;

      es.onmessage = (e: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(e.data) as { type: string; data?: AppNotification };
          if (msg.type === "notification" && msg.data) {
            setNotifications((prev) => [msg.data!, ...prev]);
            setUnreadCount((c) => c + 1);
          }
        } catch {
          // Ignore malformed SSE frames
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        // Fall back to polling every 30s
        if (!pollRef.current) {
          pollRef.current = setInterval(() => void refresh(), 30_000);
        }
      };
    };

    startSse();

    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [refresh]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationCtx {
  const ctx = React.useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}
