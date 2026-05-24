/**
 * Public landing page for FinanceBuddy.
 */
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Goal,
  LineChart,
  LockKeyhole,
  PieChart,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ledgerLabel =
  "text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#8e8d96]";

const sectionTitle =
  "font-serif text-4xl font-normal leading-[1.02] tracking-normal text-[#f4f1ea] sm:text-5xl lg:text-6xl";

const trustItems = [
  { label: "API própria", icon: Database },
  { label: "Postgres gerenciado", icon: ShieldCheck },
  { label: "Sessão segura", icon: LockKeyhole },
  { label: "Sem planilha manual", icon: CheckCircle2 },
];

const productAreas = [
  {
    title: "Dashboard",
    description: "Saldo, entradas, saídas e taxa de poupança em uma leitura rápida.",
    icon: BarChart3,
  },
  {
    title: "Transações",
    description: "Histórico organizado por data, categoria e tipo de movimento.",
    icon: ReceiptText,
  },
  {
    title: "Orçamentos",
    description: "Limites por categoria para acompanhar o mês antes de estourar.",
    icon: PieChart,
  },
  {
    title: "Metas",
    description: "Objetivos de reserva com progresso claro e valor restante.",
    icon: Goal,
  },
  {
    title: "Relatórios",
    description: "Evolução mensal e distribuição dos gastos para decidir melhor.",
    icon: LineChart,
  },
  {
    title: "Investimentos",
    description: "Carteira registrada junto do restante da vida financeira.",
    icon: CircleDollarSign,
  },
];

const spending = [
  { label: "Moradia", value: "R$ 2.180", width: "82%", color: "bg-[#e8e6df]" },
  { label: "Mercado", value: "R$ 1.040", width: "58%", color: "bg-[#9b9aa3]" },
  { label: "Transporte", value: "R$ 520", width: "34%", color: "bg-[#5f636d]" },
];

const monthlyBars = [
  { label: "Jan", income: "64%", expense: "42%" },
  { label: "Fev", income: "70%", expense: "48%" },
  { label: "Mar", income: "76%", expense: "54%" },
  { label: "Abr", income: "72%", expense: "47%" },
  { label: "Mai", income: "84%", expense: "52%" },
];

const investments = [
  { label: "Renda fixa", value: "R$ 18.400" },
  { label: "Ações", value: "R$ 7.280" },
  { label: "Reserva", value: "R$ 12.900" },
];

const securityItems = [
  "Autenticação com JWT e renovação de sessão",
  "Cookies HttpOnly para reduzir exposição no navegador",
  "API intermediando o acesso ao banco de dados",
  "Validação de entradas antes de gravar informações",
];

function DashboardMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/[0.11] bg-[#070708]/95 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.55)]",
        className,
      )}
    >
      <div className="rounded-md border border-white/[0.08] bg-[#050506]">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-4">
          <div>
            <p className={ledgerLabel}>FinanceBuddy</p>
            <p className="mt-2 font-serif text-2xl text-[#f4f1ea]">
              Painel financeiro
            </p>
          </div>
          <div className="text-right">
            <p className={ledgerLabel}>N° 001</p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-[#c9c7cf]">
              <span className="h-2 w-2 rounded-full bg-[#19c37d]" />
              Maio 2026
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <MetricCard label="Saldo mensal" value="R$ 3.840" />
          <MetricCard label="Entradas" value="R$ 9.200" />
          <MetricCard label="Saídas" value="R$ 5.360" />
        </div>

        <div className="grid gap-3 px-5 pb-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={ledgerLabel}>Evolução</p>
                <p className="mt-2 font-serif text-2xl text-[#f4f1ea]">
                  Entradas e saídas
                </p>
              </div>
              <LineChart className="h-5 w-5 text-[#8e8d96]" />
            </div>
            <div className="mt-6 flex h-40 items-end justify-between gap-3">
              {monthlyBars.map((bar) => (
                <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-32 w-full items-end justify-center gap-1.5">
                    <div
                      className="w-3 rounded-t-sm bg-[#f4f1ea]"
                      style={{ height: bar.income }}
                    />
                    <div
                      className="w-3 rounded-t-sm bg-[#5f636d]"
                      style={{ height: bar.expense }}
                    />
                  </div>
                  <span className="text-[11px] text-[#8e8d96]">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className={ledgerLabel}>Categorias</p>
                  <p className="mt-2 font-serif text-2xl text-[#f4f1ea]">Gastos</p>
                </div>
                <PieChart className="h-5 w-5 text-[#8e8d96]" />
              </div>
              <div className="space-y-4">
                {spending.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="text-[#a5a3ad]">{item.label}</span>
                      <span className="font-medium text-[#f4f1ea]">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className={cn("h-full rounded-full", item.color)}
                        style={{ width: item.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={ledgerLabel}>Carteira</p>
                  <p className="mt-2 font-serif text-2xl text-[#f4f1ea]">Posição</p>
                </div>
                <span className="text-xs text-[#19c37d]">+2,4%</span>
              </div>
              <div className="space-y-2">
                {investments.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#8e8d96]">{item.label}</span>
                    <span className="font-medium text-[#f4f1ea]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
      <p className={ledgerLabel}>{label}</p>
      <p className="mt-3 font-serif text-3xl font-normal tracking-normal text-[#f4f1ea]">
        {value}
      </p>
    </div>
  );
}

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#050506] font-sans text-[#f4f1ea]">
      <section className="relative overflow-hidden border-b border-white/[0.09]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:96px_96px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_34%,rgba(255,255,255,0.08),transparent_32%),linear-gradient(180deg,rgba(5,5,6,0.72)_0%,#050506_86%)]" />

        <div className="relative mx-auto flex min-h-[92svh] max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3" aria-label="FinanceBuddy">
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 bg-[#f4f1ea] text-[#050506]">
                <Wallet className="h-5 w-5" />
              </span>
              <span className="text-base font-semibold tracking-normal text-[#f4f1ea]">
                FinanceBuddy <span className="ml-1 text-xs text-[#777680]">v0</span>
              </span>
            </Link>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-md border-white/15 bg-[#f4f1ea] px-5 text-[#050506] hover:bg-white hover:text-[#050506]"
            >
              <Link to="/auth">Entrar</Link>
            </Button>
          </header>

          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-8">
            <div className="max-w-3xl">
              <p className={cn(ledgerLabel, "mb-6")}>
                Volume 0 · Painel 01 · Finanças pessoais
              </p>
              <h1 className="max-w-4xl font-serif text-5xl font-normal leading-[0.95] tracking-normal text-[#f4f1ea] sm:text-7xl lg:text-8xl">
                Clareza financeira{" "}
                <span className="italic text-[#8e8d96]">sem planilha,</span>{" "}
                sem ruído.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#a5a3ad] sm:text-xl">
                FinanceBuddy reúne gastos, metas, orçamento e investimentos em uma
                visão única para você saber o que entrou, o que saiu e para onde seu
                dinheiro está indo.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-md bg-[#f4f1ea] px-6 text-[#050506] hover:bg-white"
                >
                  <Link to="/auth">
                    Entrar ou criar conta
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="h-12 rounded-md px-5 text-[#a5a3ad] hover:bg-white/[0.04] hover:text-[#f4f1ea]"
                >
                  <a href="#como-funciona">
                    Ver como funciona
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <DashboardMockup className="lg:translate-y-5" />
          </div>
        </div>
      </section>

      <section className="border-b border-white/[0.09] bg-[#08080a] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 md:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-3 text-sm text-[#a5a3ad]"
              >
                <Icon className="h-4 w-4 text-[#f4f1ea]/70" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section id="como-funciona" className="bg-[#050506] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.86fr_1.14fr]">
          <div>
            <p className={ledgerLabel}>O problema</p>
            <h2 className={cn(sectionTitle, "mt-4")}>
              Seu dinheiro fica espalhado entre banco, cartão, corretora e memória.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#a5a3ad]">
              Quando cada decisão depende de abrir vários aplicativos ou atualizar uma
              planilha, o controle chega tarde. O FinanceBuddy organiza o que você
              registra e transforma o mês em uma leitura simples.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {productAreas.map((area, index) => {
              const Icon = area.icon;
              return (
                <article
                  key={area.title}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-5"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <span className={ledgerLabel}>§{String(index + 1).padStart(2, "0")}</span>
                    <Icon className="h-5 w-5 text-[#8e8d96]" />
                  </div>
                  <h3 className="font-serif text-3xl font-normal text-[#f4f1ea]">
                    {area.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#a5a3ad]">{area.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.09] bg-[#111113] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className={ledgerLabel}>Preview do produto</p>
              <h2 className={cn(sectionTitle, "mt-4 max-w-4xl")}>
                Números importantes aparecem antes da ansiedade.
              </h2>
            </div>
            <p className="max-w-md text-base leading-7 text-[#a5a3ad]">
              Saldo mensal, gastos por categoria, evolução e carteira dividem o mesmo
              contexto para ajudar você a agir com menos ruído.
            </p>
          </div>
          <DashboardMockup />
        </div>
      </section>

      <section className="bg-[#050506] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className={ledgerLabel}>Segurança</p>
            <h2 className={cn(sectionTitle, "mt-4")}>
              Acesso protegido para dados que precisam de cuidado.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#a5a3ad]">
              A arquitetura usa uma API própria entre a interface e o banco, com
              validação e controles de sessão para manter o produto simples sem tratar
              segurança como detalhe.
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/[0.08] bg-[#050506]">
                <LockKeyhole className="h-5 w-5 text-[#f4f1ea]" />
              </div>
              <div>
                <p className={ledgerLabel}>Camadas</p>
                <h3 className="mt-2 font-serif text-3xl font-normal text-[#f4f1ea]">
                  Proteção de sessão
                </h3>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {securityItems.map((item) => (
                <div key={item} className="flex gap-3 rounded-md border border-white/[0.08] bg-black/20 p-4">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#19c37d]" />
                  <p className="text-sm leading-6 text-[#a5a3ad]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.09] bg-[#08080a] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 md:flex-row md:items-center">
          <div>
            <p className={ledgerLabel}>Comece agora</p>
            <h2 className="mt-4 font-serif text-4xl font-normal tracking-normal text-[#f4f1ea] sm:text-5xl">
              Comece pelo seu painel financeiro.
            </h2>
            <p className="mt-4 max-w-2xl text-[#a5a3ad]">
              Crie sua conta, registre seus dados e veja o mês ganhar forma em poucos
              minutos.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-12 rounded-md bg-[#f4f1ea] px-6 text-[#050506] hover:bg-white"
          >
            <Link to="/auth">
              Entrar ou criar conta
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
