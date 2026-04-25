import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Repeat, Users, MessageCircle, Zap, Wallet, Car, Phone, BadgeCheck } from "lucide-react";
import { BrandLogo, BrandMark, CnhBadge, Avatar, PresenceBar, StarRating } from "@/components/Brand";
import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";
import { ganhosMes, formatBRL, calcDivisao, rotas } from "@/data/mock";

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
            <Link to="/app" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
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
              87 rotas ativas agora em Joinville · SC
            </div>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              A carona que <span className="italic">já era sua</span>,<br />
              agora <span className="text-primary">confiável</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              CarUni transforma o caos do grupo de WhatsApp em assinatura de deslocamento: rota fixa, débito automático, motorista verificado e substituição garantida quando alguém cancela.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/app" className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Quero pegar carona
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/app" className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground hover:bg-surface-2">
                Quero oferecer carona
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-3 border-t border-border pt-6 text-sm">
              <div>
                <dt className="label-cockpit">Universitários</dt>
                <dd className="num mt-1 text-2xl font-semibold"><Counter to={1842} /></dd>
              </div>
              <div>
                <dt className="label-cockpit">Rotas ativas</dt>
                <dd className="num mt-1 text-2xl font-semibold"><Counter to={312} /></dd>
              </div>
              <div>
                <dt className="label-cockpit">Presença média</dt>
                <dd className="num mt-1 text-2xl font-semibold"><Counter to={94} suffix="%" /></dd>
              </div>
            </dl>
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

      {/* MOTORISTA */}
      <section id="motorista" className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col justify-center">
            <div className="label-cockpit mb-2 text-primary">Pra motoristas</div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Cancele o custo<br />
              do seu combustível.
            </h2>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Um carro com lugares vazios todo dia é dinheiro jogado fora. O passageiro paga um valor fixo e justo. Quanto mais cheio seu carro, mais seu lucro multiplica.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5"><ShieldCheck size={14} className="text-primary"/> CNH Verificada</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5"><Wallet size={14} className="text-primary"/> Sem inadimplência</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5"><Repeat size={14} className="text-primary"/> Assinatura mensal</span>
            </div>
          </div>
          <CalculadoraDivisao vagas={r.vagas} />
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
      <section id="comparativo" className="border-b border-border bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="mb-10 max-w-2xl">
            <div className="label-cockpit mb-2">Comparativo honesto</div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">WhatsApp vs CarUni</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground"></th>
                  <th className="px-5 py-3 text-left font-medium">Grupo de WhatsApp</th>
                  <th className="px-5 py-3 text-left font-medium text-primary">CarUni</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Confirmar quem vai", "Mensagem perdida", "Inscrição fixa na rota"],
                  ["Pagamento", "Pix toda hora, calote", "Débito automático"],
                  ["Motorista cancelou", "Você se vira", "Substituto automático"],
                  ["Saber se a pessoa é confiável", "Boato no grupo", "CNH verificada + presença %"],
                  ["Histórico de viagens", "Some no chat", "Extrato mensal"],
                  ["Falta sem avisar", "Brigada no grupo", "Penalização proporcional"],
                ].map(([k, w, c]) => (
                  <tr key={k} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 text-muted-foreground">{k}</td>
                    <td className="px-5 py-3.5">{w}</td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Sua rota de amanhã <br className="hidden md:inline" />já tem alguém indo no mesmo horário.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Entre no app demo e veja como fica organizado. Tudo navegável, sem cadastro.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/app" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
              Abrir CarUni <ArrowRight size={16} />
            </Link>
          </div>
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

function CalculadoraDivisao({ vagas }: { vagas: number }) {
  const [n, setN] = React.useState(vagas);
  const r = { vagas } as any;
  const d = calcDivisao(r, n);
  
  // Simulando ida e volta, 22 dias uteis por mês
  const ganhoMensal = d.ganhoMotorista * 2 * 22;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="label-cockpit text-primary">Calculadora de Ganhos</div>
          <div className="mt-1 text-base font-medium text-foreground">Assentos ocupados</div>
        </div>
        <div className="flex items-baseline gap-1 text-primary">
          <span className="num text-4xl font-bold">{n}</span>
          <span className="text-sm font-medium text-muted-foreground">/{vagas}</span>
        </div>
      </div>
      
      <input
        type="range"
        min={1}
        max={vagas}
        value={n}
        onChange={(e) => setN(Number(e.target.value))}
        className="mt-6 mb-8 h-3 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-primary outline-none focus:ring-4 focus:ring-primary/20 transition-all"
      />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-background p-4 flex flex-col justify-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Passageiro paga</div>
          <div className="num mt-2 text-2xl font-semibold text-foreground">{formatBRL(d.porPassageiro)}</div>
          <div className="mt-1 text-[10px] text-muted-foreground">Fixo. Mais barato que ônibus.</div>
        </div>
        <div className="rounded-xl bg-primary text-primary-foreground p-4 flex flex-col justify-center shadow-lg transform transition-transform duration-300 hover:scale-105">
          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-90">Motorista ganha</div>
          <div className="num mt-2 text-3xl font-bold">{formatBRL(ganhoMensal)}</div>
          <div className="mt-1 text-[10px] opacity-80">Por mês (Ida e Volta)</div>
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-muted-foreground bg-surface-2/50 py-2 rounded-lg border border-border/50">
        Simulação baseada em 2 viagens por dia útil (22 dias/mês).
      </div>
    </div>
  );
}

function BackgroundMap() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
      viewBox="0 0 1200 600"
      fill="none"
      aria-hidden
    >
      <defs>
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0H0V48" stroke="currentColor" strokeWidth="0.5" className="text-foreground" />
        </pattern>
      </defs>
      <rect width="1200" height="600" fill="url(#grid)" />
      <path d="M50 480 C 250 380, 400 420, 550 320 S 850 180, 1150 120" stroke="oklch(var(--primary))" strokeWidth="2" fill="none" strokeDasharray="6 4" />
      <circle cx="50" cy="480" r="6" fill="oklch(var(--primary))" />
      <circle cx="1150" cy="120" r="6" fill="oklch(var(--accent))" />
    </svg>
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
        {/* Mini "mapa" */}
        <div className="relative h-44 bg-surface-2">
          <svg viewBox="0 0 360 180" className="absolute inset-0 h-full w-full">
            <defs>
              <pattern id="pgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" stroke="currentColor" strokeWidth="0.4" className="text-foreground/20" />
              </pattern>
            </defs>
            <rect width="360" height="180" fill="url(#pgrid)" />
            <path d="M30 150 C 90 110, 150 130, 210 80 S 300 30, 340 25" stroke="oklch(var(--primary))" strokeWidth="3" fill="none" strokeLinecap="round" className="route-anim" />
            <circle cx="30" cy="150" r="6" fill="oklch(var(--primary))" stroke="oklch(var(--background))" strokeWidth="2" />
            <circle cx="340" cy="25" r="6" fill="oklch(var(--accent))" stroke="oklch(var(--background))" strokeWidth="2" />
          </svg>
          <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-background/85 px-2 py-1 text-[10px] backdrop-blur">
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
              <div className="mt-1 text-xs text-muted-foreground">em 23 min · Centro → UNICAMP</div>
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
