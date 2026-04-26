import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Repeat, Users, MessageCircle, Zap, Wallet, Car, Phone, BadgeCheck, Leaf, CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";
import { BrandLogo, BrandMark, CnhBadge, Avatar, PresenceBar, StarRating } from "@/components/Brand";
import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";
import { ganhosMes, formatBRL, calcDivisao, rotas } from "@/data/mock";
import { RouteMap } from "@/components/RouteMap";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CarUni — Carona recorrente pra quem faz a mesma rota todo dia" },
      { name: "description", content: "Substitui o grupo de WhatsApp caótico: rotas fixas, débito automático, motorista verificado e substituição garantida." },
      { property: "og:title", content: "CarUni — Carona recorrente confiável" },
      { property: "og:description", content: "A carona universitária e de trabalho organizada de verdade." },
    ],
  }),
  component: Landing,
});

function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const start = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(to * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <span>{prefix}{Math.round(v).toLocaleString("pt-BR")}{suffix}</span>;
}

function ThemeToggleLanding() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-foreground hover:bg-surface-2" aria-label="Alternar tema">
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function Landing() {
  const r = rotas[0];
  const div = calcDivisao(r, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/" className="text-foreground"><BrandLogo /></Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#como" className="hover:text-foreground">Como funciona</a>
            <a href="#motorista" className="hover:text-foreground">Pra motoristas</a>
            <a href="#diferenciais" className="hover:text-foreground">Diferenciais</a>
            <a href="#comparativo" className="hover:text-foreground">vs WhatsApp</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggleLanding />
            <Link to="/selecao" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Entrar no app <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <BackgroundMap />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-ring" />
              12 rotas verificadas hoje em Joinville · SC
            </div>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              A carona que <span className="italic">já era sua</span>,<br />
              agora <span className="text-primary">confiável</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              CarUni transforma o caos do grupo de WhatsApp em assinatura de deslocamento: rota fixa, débito automático, motorista verificado e substituição garantida quando alguém cancela.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/app/passageiro" className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Quero pegar carona
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/app/motorista" className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground hover:bg-surface-2">
                Quero oferecer carona
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-3 border-t border-border pt-6 text-sm">
              <div>
                <dt className="label-cockpit">Universitários</dt>
                <dd className="num mt-1 text-2xl font-semibold"><Counter to={312} />*</dd>
              </div>
              <div>
                <dt className="label-cockpit">Rotas ativas</dt>
                <dd className="num mt-1 text-2xl font-semibold"><Counter to={87} />*</dd>
              </div>
              <div>
                <dt className="label-cockpit">Presença média</dt>
                <dd className="num mt-1 text-2xl font-semibold"><Counter to={94} suffix="%" />*</dd>
              </div>
            </dl>
            <p className="mt-4 text-[10px] text-muted-foreground italic">
              * Valores baseados em simulação demonstrativa para a região de Joinville.
            </p>
          </div>

          {/* App mockup card */}
          <div className="relative">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-12 max-w-2xl">
            <div className="label-cockpit mb-2">Como funciona</div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Três passos. Depois, ela acontece sozinha.</h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
            {[
              { n: "01", t: "Cadastra a rota", d: "Motorista publica trajeto, dias e horário. Passageiro busca quem faz exatamente o caminho dele.", icon: Repeat },
              { n: "02", t: "Entra na vaga fixa", d: "Você se inscreve na rota recorrente. Vira sua assinatura de deslocamento, igual academia.", icon: BadgeCheck },
              { n: "03", t: "Débito automático", d: "Ao final de cada viagem, o valor é debitado do seu saldo. Sem combinar dinheiro toda vez.", icon: Wallet },
            ].map(({ n, t, d, icon: Icon }) => (
              <div key={n} className="bg-background p-7">
                <div className="flex items-baseline justify-between">
                  <span className="num text-xs text-muted-foreground">{n}</span>
                  <Icon size={18} className="text-primary" />
                </div>
                <h3 className="mt-6 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VANTAGENS */}
      <section id="vantagens" className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col justify-center">
            <div className="label-cockpit mb-2 text-primary">Para todos</div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Bom para quem dirige.<br />
              Melhor para quem vai.
            </h2>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Um carro com lugares vazios é dinheiro jogado fora. O motorista multiplica seus ganhos. O passageiro paga um valor fixo e justo, economizando em relação ao ônibus.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5"><ShieldCheck size={14} className="text-primary"/> CNH Verificada</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5"><Wallet size={14} className="text-primary"/> Sem inadimplência</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5"><Repeat size={14} className="text-primary"/> Assinatura mensal</span>
            </div>
          </div>
          <CalculadoraVantagens vagas={r.vagas} />
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section id="diferenciais" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="label-cockpit mb-2">Diferenciais</div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">O que não tem em lugar nenhum.</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              { i: ShieldCheck, t: "CNH e Identidade verificada", d: "Documentos validados para motoristas e passageiros (como e-mail universitário). Você sabe com quem está entrando no carro." },
              { i: Zap, t: "Substituição automática", d: "Motorista cancelou? O app devolve o dinheiro na hora e avisa o passageiro. Faltas sem aviso geram penalidades." },
              { i: Wallet, t: "Preço fixo. Ganho escalável.", d: "O passageiro paga sempre os mesmos R$ 3,50 da passagem. O motorista ganha cumulativamente por cada vaga ocupada." },
              { i: BadgeCheck, t: "Reputação de presença", d: "Porcentagem de presença separada da nota de qualidade. A carona rotineira exige pontualidade e previsibilidade." },
              { i: MessageCircle, t: "Chat por rota", d: "Mini grupo só com quem faz seu trajeto. Texto, simples, sem ruído." },
              { i: Phone, t: "SOS durante viagem", d: "Botão discreto. Segura por 1.5s e seu contato de emergência recebe sua localização no WhatsApp." },
            ].map(({ i: Icon, t, d }) => (
              <article key={t} className="rounded-xl border border-border bg-surface p-6 shadow-sm transition-transform hover:-translate-y-1">
                <Icon size={24} className="text-primary mb-2" />
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section id="comparativo" className="border-b border-border bg-surface overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-12 text-center md:text-left">
            <div className="label-cockpit mb-2 text-primary">A melhor escolha</div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Por que CarUni é imbatível?</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl">Comparado com outras formas de se deslocar, o CarUni é o único focado em previsibilidade e custo fixo para quem faz a mesma rota todo dia.</p>
          </div>

          <div className="relative">
            {/* Sombra de scroll mobile */}
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface to-transparent z-10 pointer-events-none md:hidden" />
            
            <div className="overflow-x-auto pb-4 no-scrollbar">
              <table className="w-full min-w-[800px] border-separate border-spacing-0 rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
                <thead>
                  <tr className="bg-surface-2/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-5 text-left border-b border-border">Vantagem</th>
                    <th className="px-6 py-5 text-left border-b border-border">Apps (Uber/99)</th>
                    <th className="px-6 py-5 text-left border-b border-border">BlaBlaCar</th>
                    <th className="px-6 py-5 text-left border-b border-border bg-primary/10 text-primary border-l border-primary/20">CarUni</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { v: "Modelo de Viagem", a: "Aleatória (on-demand)", b: "Eventual (viagens longas)", c: "Recorrente (fixa todo dia)", s: true },
                    { v: "Preço", a: "Dinâmico (varia com chuva/hora)", b: "Variável (por motorista)", c: "Fixo (valor de ônibus)", s: true },
                    { v: "Segurança", a: "Desconhecidos", b: "Avaliações gerais", c: "Comunidade Universitária", s: true },
                    { v: "Previsibilidade", a: "Pode demorar pra aceitar", b: "Depende de oferta", c: "Assinatura mensal garantida", s: true },
                    { v: "Custo-Benefício", a: "Caro para uso diário", b: "Moderado", c: "Economia imbatível", s: true },
                  ].map((row, i) => (
                    <tr key={row.v} className="group transition-colors hover:bg-surface/50">
                      <td className="px-6 py-5 font-semibold text-foreground border-b border-border whitespace-nowrap">{row.v}</td>
                      <td className="px-6 py-5 text-muted-foreground border-b border-border">
                        <div className="flex items-center gap-2">
                           <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                           {row.a}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-muted-foreground border-b border-border">
                        <div className="flex items-center gap-2">
                           <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                           {row.b}
                        </div>
                      </td>
                      <td className="px-6 py-5 font-bold text-foreground border-b border-primary/10 bg-primary/5 border-l border-primary/20 group-hover:bg-primary/10 transition-colors">
                        <div className="flex items-center gap-2 text-primary">
                          <CheckCircle2 size={18} className="shrink-0" />
                          <span>{row.c}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
             <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className="text-2xl font-bold text-foreground mb-1">94%</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Mais barato que Uber</div>
             </div>
             <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className="text-2xl font-bold text-foreground mb-1">100%</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Público Universitário</div>
             </div>
             <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className="text-2xl font-bold text-foreground mb-1">Zero</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Preço Dinâmico</div>
             </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="mb-12 text-center">
            <div className="label-cockpit mb-2 text-primary">Preços Justos</div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Feito para o bolso universitário.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-lg">Sem surpresas, sem preço dinâmico. Escolha um plano de caronas e garanta seu lugar com o mesmo motorista, toda semana.</p>
          </div>

          <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
            {/* PLANO CALOURO */}
            <div className="flex flex-col rounded-3xl border border-border bg-surface p-8 shadow-sm transition-transform hover:-translate-y-1">
              <div className="mb-4">
                <span className="inline-flex rounded-full bg-surface-2 px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Plano Calouro</span>
                <div className="mt-4 flex items-baseline text-4xl font-black text-foreground">
                  R$ 17,50<span className="ml-1 text-sm font-medium text-muted-foreground">/mês</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Ideal para quem tem aulas esporádicas.</p>
              </div>
              <ul className="mb-8 flex-1 space-y-4 text-sm mt-6">
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-primary" />
                  <span>Até <strong className="font-bold">5 caronas</strong> por mês</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-primary" />
                  <span>R$ 3,50 por viagem</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-primary" />
                  <span>Garantia de substituição</span>
                </li>
              </ul>
              <Link to="/selecao" className="w-full rounded-xl border border-border bg-background py-3 text-center text-sm font-bold text-foreground hover:bg-surface-2 transition-colors">
                Começar como Calouro
              </Link>
            </div>

            {/* PLANO VETERANO */}
            <div className="relative flex flex-col rounded-3xl border-2 border-primary bg-surface p-8 shadow-2xl shadow-primary/10 transition-transform hover:-translate-y-1">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                Mais Popular
              </div>
              <div className="mb-4">
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">Plano Veterano</span>
                <div className="mt-4 flex items-baseline text-4xl font-black text-foreground">
                  R$ 32,00<span className="ml-1 text-sm font-medium text-muted-foreground">/mês</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Para quem vai pra faculdade todo dia.</p>
              </div>
              <ul className="mb-8 flex-1 space-y-4 text-sm mt-6">
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-primary" />
                  <span>Até <strong className="font-bold">10 caronas</strong> por mês</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-primary" />
                  <span>Apenas R$ 3,20 por viagem</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-primary" />
                  <span>Prioridade na lista de espera</span>
                </li>
              </ul>
              <Link to="/selecao" className="w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-colors">
                Garantir meu lugar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WAITLIST */}
      <section className="border-b border-border bg-surface-2/30">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            A revolução da carona está chegando.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Entre na nossa lista de espera e seja o primeiro a saber quando o CarUni estiver disponível na sua região.
          </p>
          <WaitlistForm />
        </div>
      </section>

      <footer className="bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 text-xs text-muted-foreground md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span>· Caronas recorrentes urbanas</span>
          </div>
          <div className="flex items-center gap-5">
            <span>Feito em Joinville · SC</span>
            <span className="num">v0.1 demo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function WaitlistForm() {
  const [modo, setModo] = React.useState<"motorista" | "passageiro">("motorista");

  return (
    <div className="mx-auto mt-12 max-w-md rounded-2xl border border-border bg-surface shadow-xl overflow-hidden text-left">
      <div className="flex p-2 bg-surface-2 gap-2 border-b border-border/50">
        <button 
          onClick={() => setModo("motorista")} 
          className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-all ${modo === "motorista" ? "bg-background text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"}`}
        >
          Para Motoristas
        </button>
        <button 
          onClick={() => setModo("passageiro")} 
          className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-all ${modo === "passageiro" ? "bg-background text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"}`}
        >
          Para Passageiros
        </button>
      </div>

      <div className="p-6 md:p-8 bg-surface">
        {modo === "motorista" ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground"><Car size={20} className="text-primary"/> Quero ser Motorista</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Transforme seus assentos vazios em dinheiro todo mês e ajude a reduzir o trânsito da sua cidade.</p>
            <form className="mt-8 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); alert("Cadastro realizado na lista de espera para motoristas!"); }}>
              <input type="text" placeholder="Qual o seu nome?" required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary" />
              <input type="email" placeholder="Seu melhor e-mail" required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary" />
              <button type="submit" className="w-full mt-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg">Zerar meu gasto com combustível</button>
            </form>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground"><Users size={20} className="text-primary"/> Quero ser Passageiro</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Economize em relação ao ônibus, viaje com conforto e tenha sempre uma carona recorrente garantida.</p>
            <form className="mt-8 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); alert("Cadastro realizado na lista de espera para passageiros!"); }}>
              <input type="text" placeholder="Qual o seu nome?" required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary" />
              <input type="email" placeholder="Seu melhor e-mail" required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary" />
              <button type="submit" className="w-full mt-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg">Quero caronas mais baratas</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function CalculadoraVantagens({ vagas }: { vagas: number }) {
  const [modo, setModo] = React.useState<"motorista" | "passageiro">("motorista");
  const [n, setN] = React.useState(vagas);
  const [dias, setDias] = React.useState(22);
  const [caronasMes, setCaronasMes] = React.useState(44);

  const precoOnibus = 6.50; // valor Joinville
  const r = { vagas } as any;
  const d = calcDivisao(r, n);
  
  const ganhoMensal = d.ganhoMotorista * 2 * dias;
  const custoOnibus = caronasMes * precoOnibus;
  const custoCaruni = caronasMes * d.porPassageiro;
  const economia = custoOnibus - custoCaruni;
  const percentualEconomia = custoOnibus > 0 ? Math.round((economia / custoOnibus) * 100) : 0;

  // Estimativa: 2.4kg de CO2 economizado por carona compartilhada (média de 10-15km)
  const CO2_POR_CARONA = 2.4;
  const carbonoMotorista = (n * 2 * dias * CO2_POR_CARONA).toFixed(1);
  const carbonoPassageiro = (caronasMes * CO2_POR_CARONA).toFixed(1);

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col">
      <div className="flex p-2 bg-surface-2 gap-2">
        <button 
          onClick={() => setModo("motorista")} 
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${modo === "motorista" ? "bg-background text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"}`}
        >
          Para Motorista
        </button>
        <button 
          onClick={() => setModo("passageiro")} 
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${modo === "passageiro" ? "bg-background text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"}`}
        >
          Para Passageiro
        </button>
      </div>

      <div className="p-6 md:p-8 flex-1">
        {modo === "motorista" ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Assentos ocupados (por viagem)</span>
                <span className="num text-lg font-bold text-primary">{n}/{vagas}</span>
              </div>
              <input type="range" min={1} max={vagas} value={n} onChange={(e) => setN(Number(e.target.value))} className="w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-primary h-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Dias letivos por mês</span>
                <span className="num text-lg font-bold text-primary">{dias} dias</span>
              </div>
              <input type="range" min={1} max={30} value={dias} onChange={(e) => setDias(Number(e.target.value))} className="w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-primary h-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="rounded-xl border border-border bg-background p-4 flex flex-col justify-center">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Valor Cobrado</div>
                <div className="num mt-2 text-xl font-semibold text-foreground">{formatBRL(d.porPassageiro)} <span className="text-[10px] font-normal text-muted-foreground">/viagem</span></div>
              </div>
              <div className="rounded-xl bg-primary text-primary-foreground p-4 flex flex-col justify-center shadow-lg transform transition-transform hover:scale-105">
                <div className="text-[11px] font-semibold uppercase tracking-wider opacity-90">Sua Renda Extra</div>
                <div className="num mt-2 text-2xl font-bold">{formatBRL(ganhoMensal)}</div>
                <div className="mt-1 text-[10px] opacity-80">No final do mês</div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <Leaf size={16} /> CO₂ Evitado na rota
              </div>
              <div className="num font-bold text-emerald-600 dark:text-emerald-400">{carbonoMotorista} kg</div>
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground bg-surface-2/50 py-2.5 rounded-lg border border-border/50">
              Simulação considerando 2 viagens/dia (Ida e Volta).
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Caronas por mês</span>
                <span className="num text-lg font-bold text-primary">{caronasMes}</span>
              </div>
              <input type="range" min={0} max={60} value={caronasMes} onChange={(e) => setCaronasMes(Number(e.target.value))} className="w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-primary h-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
              <div className="mt-2 flex justify-between text-[11px] font-medium text-muted-foreground">
                <span>0 viagens</span>
                <span>Até 60 viagens</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Gasto de Ônibus <span className="text-xs font-normal opacity-70">(R$ 6,50)</span></div>
                <div className="num font-semibold text-muted-foreground line-through decoration-red-500/50">{formatBRL(custoOnibus)}</div>
              </div>
              
              <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-bold text-primary"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Custo CarUni</div>
                <div className="num text-lg font-bold text-primary">{formatBRL(custoCaruni)}</div>
              </div>

              <div className="mt-5 flex flex-col items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-5 text-emerald-600 dark:text-emerald-400 transform transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Você Economiza</span>
                  {percentualEconomia > 0 && <span className="num rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">-{percentualEconomia}%</span>}
                </div>
                <span className="num mt-1 text-4xl font-black tracking-tight">{formatBRL(Math.max(0, economia))}</span>
                <span className="mt-1 text-[11px] font-medium opacity-80">E ainda viaja sentado e com ar-condicionado.</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <Leaf size={16} /> CO₂ Evitado
                </div>
                <div className="num font-bold text-emerald-600 dark:text-emerald-400">{carbonoPassageiro} kg</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BackgroundMap() {
  const r = rotas[0];
  return (
    <div className="absolute inset-0 z-0 opacity-[0.25] grayscale pointer-events-none brightness-110">
      <RouteMap path={r.caminho} origin={r.origem.coord} destination={r.destino.coord} interactive={false} fit={true} height="100%" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-primary/10 blur-3xl" />
      <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-2xl">
        {/* Header phone */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <BrandMark className="text-sm" />
          <span className="num text-[10px] text-muted-foreground">07:19</span>
        </div>
        {/* Mapa Real Mockup */}
        <div className="relative h-44 overflow-hidden border-b border-border">
          <RouteMap path={rotas[0].caminho} origin={rotas[0].origem.coord} destination={rotas[0].destino.coord} interactive={false} fit={true} height={176} />
          <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-background/85 px-2 py-1 text-[10px] backdrop-blur shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-ring" />
            <span className="num font-medium">12,4 km</span>
          </div>
        </div>
        {/* Card próxima */}
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-cockpit">Próxima carona</div>
              <div className="num mt-0.5 text-3xl font-semibold leading-none">07:42</div>
              <div className="mt-1 text-xs text-muted-foreground">em 23 min · Centro → UFSC Joinville</div>
            </div>
            <CnhBadge />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
            <Avatar name="Lucas Andrade" iniciais="LA" color="oklch(0.78 0.16 65)" size={36} />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium">Lucas A. <StarRating value={4.9} /></div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Car size={11} /> VW Polo · Prata · <span className="num">FXG-2A47</span>
              </div>
            </div>
            <span className="num rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">3/4</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2.5">
            <span className="label-cockpit">Você paga</span>
            <span className="num text-base font-semibold">R$ 6,30</span>
          </div>
        </div>
      </div>
    </div>
  );
}
