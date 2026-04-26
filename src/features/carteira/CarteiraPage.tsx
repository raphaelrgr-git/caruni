import * as React from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Sparkles } from "lucide-react";
import { AppBackButton } from "@/components/AppBackButton";
import {
  buyExtraCredit,
  getPlans,
  getWallet,
  selectPlan,
  type SubscriptionPlan,
  type WalletResponse,
} from "@/lib/api";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function CarteiraPage() {
  const [wallet, setWallet] = React.useState<WalletResponse | null>(null);
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [feedback, setFeedback] = React.useState("");

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const [walletData, plansData] = await Promise.all([getWallet(), getPlans()]);
      setWallet(walletData);
      setPlans(plansData);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const handleSelectPlan = async (planKey: "CALOURO" | "VETERANO") => {
    try {
      await selectPlan({ planKey });
      setFeedback("Plano atualizado com sucesso.");
      await reload();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao selecionar plano.");
    }
  };

  const handleExtraCredit = async () => {
    try {
      await buyExtraCredit();
      setFeedback("Viagem extra registrada.");
      await reload();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao comprar viagem extra.");
    }
  };

  if (loading || !wallet) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">Carregando carteira…</div>
    );
  }

  const activePlan = wallet.subscription?.plan;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
      <AppBackButton fallbackTo="/app/perfil" />
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="label-cockpit text-[10px] text-muted-foreground">Plano atual</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-semibold text-foreground">
              {activePlan?.name ?? "Sem plano"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activePlan
                ? `${activePlan.creditsIncluded} viagens garantidas nesta semana`
                : "Selecione um plano para habilitar reservas."}
            </p>
          </div>
          {activePlan?.priority ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-1 text-[11px] font-medium text-primary">
              <Sparkles size={12} /> prioridade em rotas cheias
            </span>
          ) : null}
        </div>
        <p className="num mt-1 text-xs text-muted-foreground">
          {wallet.credits.available} disponíveis · {wallet.credits.reserved} reservados ·{" "}
          {wallet.credits.consumed} usados
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => void handleSelectPlan(plan.key)}
              className={`rounded-md border px-3 py-2 text-left text-xs ${
                plan.key === activePlan?.key
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-surface-2/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="font-medium">Plano {plan.name}</span>
              <span className="num mt-0.5 block">
                {plan.creditsIncluded} viagens · extra {brl.format(plan.extraTripPrice)}
              </span>
            </button>
          ))}
          <button
            onClick={() => void handleExtraCredit()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
          >
            <Plus size={13} /> Comprar viagem extra
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Card
          label="Créditos restantes"
          value={`${wallet.credits.available}/${wallet.credits.total}`}
        />
        <Card label="Créditos perdidos" value={String(wallet.credits.lost)} />
        <Card label="Créditos expirados" value={String(wallet.credits.expired)} />
      </div>

      {feedback ? <p className="mt-4 text-sm text-muted-foreground">{feedback}</p> : null}

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-foreground">Extrato</h2>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {wallet.transactions.map((transaction) => {
            const negative = transaction.amount < 0;
            const Icon = negative ? ArrowUpRight : ArrowDownLeft;
            return (
              <li key={transaction.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    negative ? "bg-surface-2 text-muted-foreground" : "bg-success/15 text-success"
                  }`}
                >
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{transaction.description}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <span
                  className={`num text-sm font-semibold ${negative ? "text-foreground" : "text-success"}`}
                >
                  {negative ? "" : "+"}
                  {brl.format(transaction.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="label-cockpit text-[10px] text-muted-foreground">{label}</p>
      <p className="num mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
