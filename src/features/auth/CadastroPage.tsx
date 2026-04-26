import * as React from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Role = "passageiro" | "condutor";

export function CadastroPage() {
  const { signup, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = React.useState<Role>("passageiro");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [university, setUniversity] = React.useState("");
  const [course, setCourse] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { verificationToken } = await signup({
        name,
        email,
        password,
        universityName: university,
        course: course || undefined,
        role: role === "condutor" ? "MOTORISTA" : "PASSAGEIRO",
      });
      // Auto-verify in dev (backend returns token directly)
      await verifyEmail(verificationToken);
      void navigate({ to: "/login", search: { registered: "1" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">CarUni</h1>
          <p className="mt-1 text-sm text-muted-foreground">Carona recorrente universitária</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Criar conta</CardTitle>
            <CardDescription>Preencha os dados para se cadastrar</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role toggle */}
            <div className="mb-4 flex rounded-lg border border-border p-1">
              {(["passageiro", "condutor"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                    role === r
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r === "passageiro" ? "Passageiro" : "Condutor"}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="university">Universidade</Label>
                <Input
                  id="university"
                  placeholder="Ex: UNIVILLE, UDESC, UFSC"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="course">
                  Curso <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="course"
                  placeholder="Ex: Engenharia de Software"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando conta…" : "Criar conta"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
