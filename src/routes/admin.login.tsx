import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/Brand";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "CarUni — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogin,
});

const credSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(255),
  password: z.string().min(8, "Senha precisa ter ao menos 8 caracteres").max(100),
});

function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Se já estiver logado, redireciona pro painel
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/admin/leads" });
      }
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Confira os dados");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin/leads`,
          },
        });
        if (error) {
          toast.error("Não foi possível criar a conta", { description: error.message });
          return;
        }
        toast.success("Conta criada", {
          description: "Você foi promovido a admin (primeiro usuário).",
        });
        navigate({ to: "/admin/leads" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          toast.error("Falha no login", { description: "E-mail ou senha incorretos." });
          return;
        }
        navigate({ to: "/admin/leads" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-3 flex items-center justify-between">
          <Link to="/" className="text-foreground"><BrandLogo /></Link>
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Voltar ao site
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary mb-4">
              <ShieldCheck size={22} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Painel administrativo</h1>
            <p className="mt-1 text-sm text-muted-foreground">Acesso restrito da equipe CarUni</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex p-1 bg-surface-2 rounded-lg gap-1 mb-5">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="text-xs">
                <span className="label-cockpit">E-mail</span>
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="text-xs">
                <span className="label-cockpit">Senha</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {mode === "login" ? "Entrar" : "Criar conta"}
              </button>
            </form>

            {mode === "signup" && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                A primeira conta criada vira automaticamente administradora. Demais usuários precisam ser promovidos por um admin.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}