import * as React from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Home, Search, CalendarClock, User, Wallet, MessageCircle, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { BrandLogo } from "./Brand";
import { saldoAtual, formatBRL } from "@/data/mock";

const tabs = [
  { to: "/app", label: "Início", icon: Home, exact: true },
  { to: "/app/buscar", label: "Buscar", icon: Search, exact: false },
  { to: "/app/minhas-caronas", label: "Minhas", icon: CalendarClock, exact: false },
  { to: "/app/perfil", label: "Perfil", icon: User, exact: false },
] as const;

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
  const isActive = (to: string, exact: boolean) => (exact ? loc.pathname === to : loc.pathname.startsWith(to));

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <Link to="/" className="text-foreground"><BrandLogo /></Link>
        </div>
        <div className="px-3 pb-2">
          <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
            <div className="label-cockpit">Saldo</div>
            <div className="num text-lg font-semibold text-foreground">{formatBRL(saldoAtual)}</div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-2">
          {[
            { to: "/app", label: "Início", icon: Home, exact: true },
            { to: "/app/buscar", label: "Buscar carona", icon: Search, exact: false },
            { to: "/app/minhas-caronas", label: "Minhas caronas", icon: CalendarClock, exact: false },
            { to: "/app/carteira", label: "Carteira", icon: Wallet, exact: false },
            { to: "/app/chat/r1", label: "Chat de rota", icon: MessageCircle, exact: false },
            { to: "/app/perfil", label: "Perfil", icon: User, exact: false },
          ].map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(to, exact);
            return (
              <Link
                key={to}
                to={to}
                className={`mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <Icon size={16} className={active ? "text-primary" : ""} />
                {label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary pulse-ring" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            to="/"
            className="mb-3 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-warn transition-colors hover:bg-warn/10"
          >
            <LogOut size={16} /> Sair do App
          </Link>
          <div className="flex items-center justify-between px-3">
            <div>
              <div className="label-cockpit">Modo demo</div>
              <div className="text-xs text-muted-foreground">Dados mockados</div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="text-foreground"><BrandLogo /></Link>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-2"
            aria-label="Sair"
          >
            <LogOut size={16} />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="lg:pl-60">
        <div className="pb-24 lg:pb-12">{children ?? <Outlet />}</div>
      </main>

      {/* Tab bar mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-4">
          {tabs.map(({ to, label, icon: Icon, exact }) => {
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