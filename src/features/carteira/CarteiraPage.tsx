import { Plus, ArrowDownLeft, ArrowUpRight, AlertCircle, Sparkles } from "lucide-react";
import { formatBRL, formatData, ganhosMes } from "@/data/mock";
import { useCaruniStore } from "@/data/store";

export function CarteiraPage() {
  const { activePlan, creditSummary, transacoes, buyExtraCredit, plans, selectPlan, savings } =
    useCaruniStore();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="label-cockpit text-[10px] text-muted-foreground">Plano atual</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-semibold text-foreground">{activePlan.nome}</p>
            <p className="mt-1 text-sm text-muted-foreground">{activePlan.pitch}</p>
          </div>
          {activePlan.priority && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-1 text-[11px] font-medium text-primary">
              <Sparkles size={12} /> prioridade em rotas cheias
            </span>
          )}
        </div>
        <p className="num mt-1 text-xs text-muted-foreground">
          {creditSummary.disponivel} disponíveis · {creditSummary.reservado} reservados ·{" "}
          {creditSummary.consumido} usados
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => selectPlan(plan.id)}
              className={`rounded-md border px-3 py-2 text-left text-xs ${
                plan.id === activePlan.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-surface-2/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="font-medium">Plano {plan.nome}</span>
              <span className="num mt-0.5 block">
                {plan.creditsIncluded} viagens · extra {formatBRL(plan.extraTripPrice)}
              </span>
            </button>
          ))}
          <button
            onClick={buyExtraCredit}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={13} /> Comprar viagem extra
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Card
          label="Créditos restantes"
          value={`${creditSummary.disponivel}/${creditSummary.total}`}
        />
        <Card label="Ganhos no mês" value={formatBRL(ganhosMes.total)} tone="success" />
        <Card
          label="Economia vs Uber/99"
          value={formatBRL(savings.privateSavings)}
          sub={`${savings.confirmedTrips} viagens confirmadas`}
          tone="primary"
        />
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-foreground">Extrato</h2>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {transacoes.map((t) => {
            const negativo = t.valor < 0;
            const Icon =
              t.tipo === "penalizacao" ? AlertCircle : negativo ? ArrowUpRight : ArrowDownLeft;
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
                <span
                  className={`num text-sm font-semibold ${negativo ? "text-foreground" : "text-success"}`}
                >
                  {negativo ? "" : "+"}
                  {formatBRL(t.valor)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "success" | "primary";
}) {
  const t =
    tone === "success" ? "text-success" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="label-cockpit text-[10px] text-muted-foreground">{label}</p>
      <p className={`num mt-1 text-xl font-semibold ${t}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
