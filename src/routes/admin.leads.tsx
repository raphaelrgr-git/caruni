import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Loader2, LogOut, Download, Search, Users, Car, ShieldCheck, Calendar, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/Brand";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "CarUni — Leads" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLeads,
});

type Lead = {
  id: string;
  nome: string;
  email: string;
  tipo: "motorista" | "passageiro";
  origem: string;
  user_agent: string | null;
  created_at: string;
};

function AdminLeads() {
  const navigate = useNavigate();
  const [checking, setChecking] = React.useState(true);
  const [authorized, setAuthorized] = React.useState(false);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"all" | "motorista" | "passageiro">("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let active = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/admin/login" });
        return;
      }
      const { data: roleRow, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!active) return;
      if (error || !roleRow) {
        setChecking(false);
        setAuthorized(false);
        return;
      }
      setAuthorized(true);
      setChecking(false);
      void load();
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("id, nome, email, tipo, origem, user_agent, created_at")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível carregar leads", { description: error.message });
      return;
    }
    setLeads((data ?? []) as Lead[]);
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  async function deleteLead(id: string) {
    if (!confirm("Remover este lead permanentemente?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      toast.error("Falha ao remover", { description: error.message });
      return;
    }
    setLeads((cur) => cur.filter((l) => l.id !== id));
    toast.success("Lead removido");
  }

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (filter !== "all" && l.tipo !== filter) return false;
      if (q && !`${l.nome} ${l.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [leads, filter, search]);

  const stats = React.useMemo(() => {
    const total = leads.length;
    const motoristas = leads.filter((l) => l.tipo === "motorista").length;
    const passageiros = leads.filter((l) => l.tipo === "passageiro").length;
    const dia = Date.now() - 24 * 60 * 60 * 1000;
    const ultimas24h = leads.filter((l) => new Date(l.created_at).getTime() > dia).length;
    return { total, motoristas, passageiros, ultimas24h };
  }, [leads]);

  function exportCsv(rows: Lead[]) {
    const header = ["nome", "email", "tipo", "origem", "created_at"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        [r.nome, r.email, r.tipo, r.origem, r.created_at].map((v) => escape(String(v ?? ""))).join(","),
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caruni-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} lead(s) exportado(s)`);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <ShieldCheck size={32} className="text-warn" />
        <h1 className="mt-3 text-xl font-semibold text-foreground">Sem permissão</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Sua conta está autenticada, mas não tem o papel <span className="font-mono">admin</span>. Peça pra um admin existente te promover.
        </p>
        <button onClick={logout} className="mt-5 rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-2">
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-foreground"><BrandLogo /></Link>
            <span className="hidden sm:inline label-cockpit">/ Leads</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft size={12} /> Site
            </Link>
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-2">
              <LogOut size={12} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
        <div className="mb-6">
          <p className="label-cockpit">Painel</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">Lista de espera CarUni</h1>
          <p className="mt-1 text-sm text-muted-foreground">Todas as inscrições da landing.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Total" value={stats.total} />
          <Kpi label="Motoristas" value={stats.motoristas} icon={<Car size={14} className="text-primary" />} />
          <Kpi label="Passageiros" value={stats.passageiros} icon={<Users size={14} className="text-accent" />} />
          <Kpi label="Últimas 24h" value={stats.ultimas24h} icon={<Calendar size={14} className="text-success" />} />
        </div>

        {/* Toolbar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <label className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
              <Search size={14} className="text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
            <div className="inline-flex rounded-md border border-border bg-surface p-1">
              {(["all", "motorista", "passageiro"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {f === "all" ? "Todos" : f === "motorista" ? "Motoristas" : "Passageiros"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-2 disabled:opacity-50"
            >
              <Download size={13} /> CSV ({filtered.length})
            </button>
            <button
              onClick={() => exportCsv(leads)}
              disabled={leads.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Download size={13} /> Tudo
            </button>
          </div>
        </div>

        {/* Tabela / lista */}
        <div className="mt-4 rounded-xl border border-border bg-surface overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              {leads.length === 0 ? "Nenhum lead ainda. Compartilhe o site!" : "Nenhum resultado pra esses filtros."}
            </div>
          ) : (
            <>
              {/* Desktop: tabela */}
              <table className="hidden md:table w-full text-sm">
                <thead>
                  <tr className="bg-surface-2/60 text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium label-cockpit">Data</th>
                    <th className="px-4 py-3 text-left font-medium label-cockpit">Nome</th>
                    <th className="px-4 py-3 text-left font-medium label-cockpit">E-mail</th>
                    <th className="px-4 py-3 text-left font-medium label-cockpit">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium label-cockpit">Origem</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id} className="border-t border-border hover:bg-surface-2/30">
                      <td className="px-4 py-3 num text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 font-medium">{l.nome}</td>
                      <td className="px-4 py-3 num text-muted-foreground">{l.email}</td>
                      <td className="px-4 py-3"><TipoBadge tipo={l.tipo} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{l.origem}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteLead(l.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remover">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile: cards */}
              <ul className="md:hidden divide-y divide-border">
                {filtered.map((l) => (
                  <li key={l.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{l.nome}</p>
                        <p className="num text-xs text-muted-foreground truncate">{l.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <TipoBadge tipo={l.tipo} />
                          <span className="num text-[10px] text-muted-foreground">
                            {new Date(l.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => deleteLead(l.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="label-cockpit">{label}</span>
      </div>
      <p className="num mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function TipoBadge({ tipo }: { tipo: "motorista" | "passageiro" }) {
  const isMot = tipo === "motorista";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
      isMot ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
    }`}>
      {isMot ? <Car size={10} /> : <Users size={10} />}
      {tipo}
    </span>
  );
}