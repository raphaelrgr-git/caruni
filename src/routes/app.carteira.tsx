import { createFileRoute } from "@tanstack/react-router";
import { Plus, ArrowDownLeft, ArrowUpRight, AlertCircle } from "lucide-react";
import { saldoAtual, transacoes, formatBRL, formatData, ganhosMes } from "@/data/mock";

export const Route = createFileRoute("/app/carteira")({
  head: () => ({ meta: [{ title: "CarUni — Carteira" }] }),
  component: Carteira,
});

function Carteira() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="label-cockpit text-[10px] text-muted-foreground">Saldo</p>
        <p className="num mt-1 text-4xl font-semibold text-foreground">{formatBRL(saldoAtual)}</p>
        <button className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
          <Plus size={13} /> Adicionar saldo via Pix
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Card label="Gasto no mês" value={formatBRL(38.5)} />
        <Card label="Ganhos no mês" value={formatBRL(ganhosMes.total)} tone="success" />
        <Card label="vs Uber comum" value={formatBRL(ganhosMes.vsUberComum)} sub="economizou" tone="primary" />
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-foreground">Extrato</h2>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {transacoes.map((t) => {
            const negativo = t.valor < 0;
            const Icon = t.tipo === "penalizacao" ? AlertCircle : negativo ? ArrowUpRight : ArrowDownLeft;
            return (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    t.tipo === "penalizacao"
                      ? "bg-warn/15 text-warn"
                      : negativo
                      ? "bg-surface-2 text-muted-foreground"
                      : "bg-success/15 text-success"
                  }`}
                >
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{t.descricao}</p>
                  <p className="num text-[11px] text-muted-foreground">{formatData(t.data)}</p>
                </div>
                <span className={`num text-sm font-semibold ${negativo ? "text-foreground" : "text-success"}`}>
                  {negativo ? "" : "+"}{formatBRL(t.valor)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "success" | "primary" }) {
  const t = tone === "success" ? "text-success" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="label-cockpit text-[10px] text-muted-foreground">{label}</p>
      <p className={`num mt-1 text-xl font-semibold ${t}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
