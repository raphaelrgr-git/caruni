import * as React from "react";
import { Car, CalendarClock, CreditCard, Map, MessageCircle, Route, ShieldCheck, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { completeOnboarding } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

const PASSENGER_STEPS = [
  {
    icon: CreditCard,
    title: "Escolha um plano",
    body: "Ative créditos semanais para reservar viagens sem depender de pagamento por corrida.",
  },
  {
    icon: Map,
    title: "Busque rotas compatíveis",
    body: "Veja trajetos reais, horários e confiança do motorista antes de entrar.",
  },
  {
    icon: MessageCircle,
    title: "Reserve e confirme",
    body: "Entre no chat da rota, apareça na corrida e confirme a viagem para consumir o crédito.",
  },
] as const;

const DRIVER_STEPS = [
  {
    icon: Car,
    title: "Complete seu veículo",
    body: "Sua conta precisa dos dados do carro para operar rotas e receber repasses.",
  },
  {
    icon: Route,
    title: "Crie uma rota recorrente",
    body: "Publique origem, destino, dias e horários para começar a formar ocupação previsível.",
  },
  {
    icon: Users,
    title: "Acompanhe ocupação e embarques",
    body: "Veja passageiros ativos, próximas viagens e confirme embarque diretamente pelo app.",
  },
] as const;

export function OnboardingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
}) {
  const { user, setUserFromMe } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);

  if (!user) return null;

  const role = user.role;
  const steps = role === "MOTORISTA" ? DRIVER_STEPS : PASSENGER_STEPS;

  const closeAndPersist = async () => {
    setSubmitting(true);
    try {
      const me = await completeOnboarding(role as UserRole);
      setUserFromMe(me);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-[28px] border-border bg-surface p-0 sm:max-w-4xl">
        <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_45%),linear-gradient(135deg,rgba(15,118,110,0.08),rgba(249,115,22,0.12))] p-7 md:p-9">
            <div className="inline-flex rounded-full border border-border bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground">
              {role === "MOTORISTA" ? "Onboarding do motorista" : "Onboarding do passageiro"}
            </div>
            <DialogHeader className="mt-5 space-y-3 text-left">
              <DialogTitle className="text-3xl leading-tight tracking-tight text-foreground">
                {role === "MOTORISTA"
                  ? "Organize sua operação e ganhe recorrência logo no primeiro dia."
                  : "Entenda o fluxo do app e entre em uma rota sem ruído."}
              </DialogTitle>
              <DialogDescription className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {role === "MOTORISTA"
                  ? "O app foi separado por papel. Aqui você acompanha rotas, ocupação, corridas e repasses."
                  : "O app foi separado por papel. Aqui você escolhe plano, reserva vaga, acompanha corridas e confirma a viagem."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 rounded-[24px] border border-border bg-background/70 p-5">
              <p className="label-cockpit">O que muda agora</p>
              <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <CalendarClock size={16} className="mt-0.5 text-primary" />
                  <span>As telas e ações do app mudam conforme seu papel.</span>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck size={16} className="mt-0.5 text-primary" />
                  <span>Permissões de rota, booking e confirmação agora são validadas no backend.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-7 md:p-9">
            <div className="space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="flex gap-4 rounded-[24px] border border-border bg-surface-2/60 p-5"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="label-cockpit">Etapa {index + 1}</p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="mt-8 flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                onClick={() => void closeAndPersist()}
                disabled={submitting}
                className="rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground"
              >
                Pular por agora
              </button>
              <button
                onClick={() => void closeAndPersist()}
                disabled={submitting}
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                {submitting ? "Salvando..." : "Entendi, continuar"}
              </button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
