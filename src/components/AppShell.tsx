import * as React from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Bell, CalendarClock, Car, Home, Moon, Search, Sun, User, Wallet } from "lucide-react";
import { BrandLogo } from "@/components/Brand";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { RideDock } from "@/components/RideDock";
import { getWallet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";
import { useTheme } from "@/lib/theme";

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors hover:bg-surface-2"
      aria-label="Alternar tema"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export function AppShell({ children }: { children?: React.ReactNode }) {
  const loc = useLocation();
  const { user } = useAuth();
  const [availableCredits, setAvailableCredits] = React.useState<number | null>(null);
  const [planName, setPlanName] = React.useState<string>("Sem plano");
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    getWallet()
      .then((wallet) => {
        if (cancelled) return;
        setAvailableCredits(wallet.credits.available);
        setPlanName(wallet.subscription?.plan.name ?? "Sem plano");
      })
      .catch(() => {
        if (cancelled) return;
        setAvailableCredits(null);
      });
    return () => {
      cancelled = true;
    };
  }, [loc.pathname]);

  React.useEffect(() => {
    setShowOnboarding(Boolean(user?.onboarding.shouldShow));
  }, [user?.onboarding.shouldShow]);

  const { unreadCount } = useNotifications();
  const isDriver = user?.role === "MOTORISTA";
  const sidebarItems = isDriver
    ? [
        { to: "/app", label: "Início", icon: Home, exact: true },
        { to: "/app/minhas-caronas", label: "Minhas rotas", icon: CalendarClock, exact: false },
        { to: "/app/criar-rota", label: "Criar rota", icon: Car, exact: false },
        { to: "/app/carteira", label: "Carteira", icon: Wallet, exact: false },
        { to: "/app/notificacoes", label: "Notificações", icon: Bell, exact: false },
        { to: "/app/perfil", label: "Perfil", icon: User, exact: false },
      ]
    : [
        { to: "/app", label: "Início", icon: Home, exact: true },
        { to: "/app/buscar", label: "Buscar", icon: Search, exact: false },
        { to: "/app/minhas-caronas", label: "Minhas caronas", icon: CalendarClock, exact: false },
        { to: "/app/carteira", label: "Carteira", icon: Wallet, exact: false },
        { to: "/app/notificacoes", label: "Notificações", icon: Bell, exact: false },
        { to: "/app/perfil", label: "Perfil", icon: User, exact: false },
      ];
  const mobileItems = isDriver
    ? [
        { to: "/app", label: "Início", icon: Home, exact: true },
        { to: "/app/minhas-caronas", label: "Minhas rotas", icon: CalendarClock, exact: false },
        { to: "/app/criar-rota", label: "Criar rota", icon: Car, exact: false },
        { to: "/app/perfil", label: "Perfil", icon: User, exact: false },
      ]
    : [
        { to: "/app", label: "Início", icon: Home, exact: true },
        { to: "/app/buscar", label: "Buscar", icon: Search, exact: false },
        { to: "/app/minhas-caronas", label: "Minhas caronas", icon: CalendarClock, exact: false },
        { to: "/app/perfil", label: "Perfil", icon: User, exact: false },
      ];

  const mobileTabs = mobileItems.slice(0, 4);
  const isActive = (to: string, exact: boolean) =>
    exact ? loc.pathname === to : loc.pathname.startsWith(to);
  const showRideDock = loc.pathname.startsWith("/app");

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <Link to="/" className="text-foreground">
            <BrandLogo />
          </Link>
        </div>

        <div className="px-3 pb-2">
          <div className="rounded-lg border border-border bg-surface px-3 py-3">
            <div className="label-cockpit">Perfil</div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {user?.name ?? "Conta"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {isDriver ? "Motorista" : "Passageiro"} · {planName}
            </div>
            <div className="num mt-2 text-lg font-semibold text-foreground">
              {availableCredits == null ? "--" : availableCredits} créditos
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-2">
          {sidebarItems.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(to, exact);
            const isBell = to === "/app/notificacoes";
            return (
              <Link
                key={to}
                to={to}
                className={`mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-surface-2 text-foreground"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon size={16} className={active ? "text-primary" : ""} />
                  {isBell && unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                {label}
                {isBell && unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-cockpit">Sessão</div>
              <div className="text-xs text-muted-foreground">API real conectada</div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="text-foreground">
          <BrandLogo />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/app/carteira"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5"
          >
            <Wallet size={14} className="text-muted-foreground" />
            <span className="num text-xs font-semibold">
              {availableCredits == null ? "--" : availableCredits}
            </span>
          </Link>
          <Link
            to="/app/notificacoes"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors hover:bg-surface-2"
            aria-label="Notificações"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {showRideDock ? <RideDock /> : null}

      <main className="lg:pl-64">
        <div className={`pb-24 lg:pb-12 ${showRideDock ? "pt-24 lg:pt-[6.5rem]" : ""}`}>
          {children ?? <Outlet />}
        </div>
      </main>

      <OnboardingDialog open={showOnboarding} onOpenChange={setShowOnboarding} />

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className={`grid ${mobileTabs.length === 4 ? "grid-cols-4" : "grid-cols-5"}`}>
          {mobileTabs.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(to, exact);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium uppercase tracking-wider ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
