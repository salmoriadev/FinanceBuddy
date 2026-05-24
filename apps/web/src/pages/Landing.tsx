/**
 * Public product landing page for FinanceBuddy.
 */
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  LineChart,
  LockKeyhole,
  PieChart,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Dashboard financeiro",
    description: "Saldo mensal, receitas, despesas, metas e orcamentos em uma tela objetiva.",
    icon: BarChart3,
  },
  {
    title: "Controle por categoria",
    description: "Organize gastos recorrentes, limites mensais e historico por tipo de despesa.",
    icon: PieChart,
  },
  {
    title: "Investimentos no contexto",
    description: "Acompanhe aportes, valor atual e rentabilidade junto do resto da vida financeira.",
    icon: LineChart,
  },
  {
    title: "Base segura",
    description: "API propria, autenticacao JWT, cookies HttpOnly e banco Postgres gerenciado.",
    icon: ShieldCheck,
  },
];

const metrics = [
  { label: "Saldo do mes", value: "R$ 4.820", tone: "text-emerald-600" },
  { label: "Economia", value: "31%", tone: "text-sky-600" },
  { label: "Investimentos", value: "R$ 82,4k", tone: "text-foreground" },
];

const rows = [
  ["Aluguel", "Moradia", "-R$ 2.400"],
  ["Salario", "Receita", "+R$ 12.500"],
  ["Tesouro Selic", "Investimento", "+R$ 1.200"],
  ["Mercado", "Alimentacao", "-R$ 482"],
];

export default function Landing() {
  const { user } = useAuth();
  const primaryHref = user ? "/dashboard" : "/auth";
  const primaryLabel = user ? "Abrir dashboard" : "Entrar agora";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              FinanceBuddy
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Recursos
            </a>
            <a href="#security" className="hover:text-foreground">
              Seguranca
            </a>
            <a href="#preview" className="hover:text-foreground">
              Preview
            </a>
          </nav>
          <Button asChild size="sm">
            <Link to={primaryHref}>{primaryLabel}</Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:py-18 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Planejamento pessoal com cara de produto serio
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl lg:text-6xl">
              FinanceBuddy
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Um painel financeiro pessoal para enxergar gastos, metas,
              orcamentos e investimentos sem planilhas soltas ou informacao
              espalhada.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#preview">Ver produto</a>
              </Button>
            </div>
          </div>

          <section
            id="preview"
            className="rounded-lg border border-border bg-card shadow-xl"
            aria-label="FinanceBuddy product preview"
          >
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Maio de 2026</p>
                  <h2 className="text-lg font-semibold">Resumo financeiro</h2>
                </div>
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  Saudavel
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className={cn("mt-2 text-2xl font-semibold", metric.tone)}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 p-4 pt-0 lg:grid-cols-[1fr_0.85fr]">
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium">Fluxo mensal</h3>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex h-48 items-end gap-3">
                  {[46, 72, 54, 84, 62, 93, 70].map((height, index) => (
                    <div key={height} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-md bg-primary/85"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium">Ultimos movimentos</h3>
                  <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  {rows.map(([name, category, value]) => (
                    <div key={name} className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">{category}</p>
                      </div>
                      <p
                        className={cn(
                          "font-semibold",
                          value.startsWith("+") ? "text-emerald-600" : "text-rose-600",
                        )}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            Recursos
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal">
            O essencial para controlar dinheiro com rapidez
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="security" className="border-y border-border/60 bg-card/60">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">
              Seguranca
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">
              Dados financeiros pedem uma arquitetura sem atalhos.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Autenticacao com access token e refresh token",
              "Cookies HttpOnly para sessoes persistentes",
              "Validacao de entrada no frontend e na API",
              "Postgres gerenciado e API propria entre app e banco",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-sm leading-6 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>FinanceBuddy</p>
        <Link to={primaryHref} className="font-medium text-foreground hover:underline">
          {primaryLabel}
        </Link>
      </footer>
    </main>
  );
}
