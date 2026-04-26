import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Mail, CreditCard, Camera, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/app/verificacao")({
  head: () => ({ meta: [{ title: "CarUni — Verificação" }] }),
  component: Verificacao,
});

function Verificacao() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);

  const next = () => {
    if (step < 3) setStep(step + 1);
    else navigate({ to: "/app/perfil" });
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 lg:py-10">
      <Link to="/app/perfil" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Voltar ao Perfil
      </Link>

      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Verificação CarUni</h1>
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1 w-6 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail size={24} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">E-mail Universitário</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Para garantir que apenas universitários usem o CarUni, precisamos validar seu e-mail da instituição.
            </p>
            <div className="mt-8 space-y-4">
              <input type="email" placeholder="nome@universidade.edu.br" className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              <button onClick={next} className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90">Solicitar código</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard size={24} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Documento (CNH)</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Obrigatório apenas para motoristas. Verificamos os dados da CNH para garantir a segurança de todos.
            </p>
            <div className="mt-8 space-y-4">
              <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
                <Camera size={32} className="mx-auto text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">Toque para escanear a frente da CNH</p>
              </div>
              <button onClick={next} className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90">Enviar documento</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center py-10">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-foreground">Análise em andamento</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Recebemos seus dados! Nossa equipe (ou IA) validará as informações em até 24 horas úteis. Você receberá uma notificação quando seu selo de verificação estiver ativo.
            </p>
            <button onClick={next} className="mt-10 w-full rounded-lg border border-border bg-surface py-3 text-sm font-semibold text-foreground hover:bg-surface-2 transition-colors">Entendi</button>
          </div>
        )}
      </div>

      <div className="mt-12 rounded-xl bg-surface-2/40 p-4 text-center">
        <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck size={12} className="text-success" /> Seus dados são criptografados e usados apenas para fins de segurança.
        </p>
      </div>
    </div>
  );
}
