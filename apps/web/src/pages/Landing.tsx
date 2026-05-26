/**
 * Public landing page for FinanceBuddy.
 */
import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeftRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Goal,
  LayoutDashboard,
  LineChart,
  LockKeyhole,
  PieChart,
  PiggyBank,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ledgerLabel =
  "text-[0.62rem] font-semibold uppercase tracking-normal text-[#8e8d96] sm:text-[0.68rem]";

const sectionTitle =
  "font-serif text-3xl font-normal leading-[1.05] tracking-normal text-[#f4f1ea] sm:text-5xl lg:text-6xl";

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

const navPreviewItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Transações", icon: ArrowLeftRight },
  { label: "Orçamentos", icon: PiggyBank },
  { label: "Metas", icon: Goal },
  { label: "Relatórios", icon: BarChart3 },
  { label: "Investimentos", icon: LineChart },
  { label: "Configurações", icon: Settings },
];

const recentTransactions = [
  { description: "Salário", category: "Renda", amount: "+R$ 9.200", tone: "income" },
  { description: "Aluguel", category: "Moradia", amount: "-R$ 2.180", tone: "expense" },
  { description: "Mercado", category: "Alimentação", amount: "-R$ 640", tone: "expense" },
  { description: "Tesouro Selic", category: "Investimento", amount: "-R$ 1.200", tone: "neutral" },
];

const budgetRows = [
  { label: "Moradia", value: "R$ 2.180 / R$ 2.400", width: "91%" },
  { label: "Mercado", value: "R$ 1.040 / R$ 1.350", width: "77%" },
  { label: "Transporte", value: "R$ 520 / R$ 800", width: "65%" },
];

function ProductWindow({
  children,
  className,
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full max-w-full min-w-0 overflow-hidden rounded-md border border-white/[0.11] bg-[#060607] shadow-[0_24px_90px_rgba(0,0,0,0.42)] sm:rounded-lg",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5 border-b border-white/[0.08] bg-[#101013] px-3 py-2.5 sm:gap-2 sm:px-4 sm:py-3">
        <span className="h-2 w-2 rounded-full bg-[#ef6f7c] sm:h-2.5 sm:w-2.5" />
        <span className="h-2 w-2 rounded-full bg-[#e7c869] sm:h-2.5 sm:w-2.5" />
        <span className="h-2 w-2 rounded-full bg-[#19c37d] sm:h-2.5 sm:w-2.5" />
        <span className="ml-2 min-w-0 truncate rounded-sm border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] text-[#a5a3ad] sm:ml-3 sm:px-3 sm:text-[11px]">
          financebuddy.app/dashboard
        </span>
      </div>
      <div className="min-w-0 bg-[#f7f3ec] text-[#141416]">
        <div
          className={cn(
            "grid min-w-0",
            compact
              ? "grid-cols-1 sm:grid-cols-[150px_1fr]"
              : "grid-cols-1 sm:grid-cols-[190px_1fr]",
          )}
        >
          <aside className="hidden border-r border-[#ded8ce] bg-white p-4 sm:block">
            <div className="mb-6">
              <p className="font-serif text-xl tracking-normal text-[#141416]">
                FinanceBuddy
              </p>
              <p className="mt-1 text-[11px] text-[#706d66]">Organize seu dinheiro</p>
            </div>
            <nav className="space-y-1">
              {navPreviewItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-2 text-[12px]",
                      item.active
                        ? "border border-[#d8d0c4] bg-[#eee7dc] text-[#151514]"
                        : "text-[#6d6961]",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                );
              })}
            </nav>
          </aside>
          <div className={cn("min-w-0", compact ? "p-3 sm:p-4" : "p-3 sm:p-5")}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function PlatformDashboardScreen({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-end justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-serif text-2xl tracking-normal text-[#151514] sm:text-3xl">
            Dashboard
          </h2>
          <p className="mt-1 text-xs text-[#706d66]">Resumo do mês atual</p>
        </div>
        <div
          className={cn(
            "rounded-md border border-[#ded8ce] bg-white px-3 py-2 text-xs text-[#706d66]",
            compact && "hidden min-[520px]:block",
          )}
        >
          Maio 2026
        </div>
      </div>

      <div
        className={cn(
          "grid gap-3",
          compact
            ? "grid-cols-2"
            : "grid-cols-2 lg:grid-cols-4",
        )}
      >
        <PreviewMetric label="Saldo" value="R$ 3.840" icon={Scale} tone="default" />
        <PreviewMetric label="Entradas" value="R$ 9.200" icon={TrendingUp} tone="good" />
        <PreviewMetric label="Saídas" value="R$ 5.360" icon={TrendingDown} tone="bad" />
        <PreviewMetric label="Poupança" value="41,7%" icon={Wallet} tone="default" />
      </div>

      <div
        className={cn(
          "grid gap-4",
          compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[1fr_0.9fr]",
        )}
      >
        <div className="rounded-md border border-[#ded8ce] bg-white p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#151514]">Evolução mensal</p>
              <p className="text-xs text-[#706d66]">Entradas e saídas por mês</p>
            </div>
            <LineChart className="h-4 w-4 text-[#706d66]" />
          </div>
          <div
            className={cn(
              "mt-5 flex items-end justify-between gap-3",
              compact ? "h-24 sm:h-28" : "h-28 sm:h-36",
            )}
          >
            {monthlyBars.map((bar) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex w-full items-end justify-center gap-1.5",
                    compact ? "h-16 sm:h-20" : "h-20 sm:h-28",
                  )}
                >
                  <div className="w-3 rounded-t-sm bg-[#19c37d]" style={{ height: bar.income }} />
                  <div className="w-3 rounded-t-sm bg-[#ef6f7c]" style={{ height: bar.expense }} />
                </div>
                <span className="text-[11px] text-[#706d66]">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {!compact && (
          <div className="rounded-md border border-[#ded8ce] bg-white p-3 sm:p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#151514]">Gastos por categoria</p>
                <p className="text-xs text-[#706d66]">Maiores saídas do mês</p>
              </div>
              <PieChart className="h-4 w-4 text-[#706d66]" />
            </div>
            <div className="space-y-4">
              {spending.map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#706d66]">{item.label}</span>
                    <span className="font-medium text-[#151514]">{item.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#ece7df]">
                    <div
                      className={cn("h-full rounded-full", item.color)}
                      style={{ width: item.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewMetric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone: "default" | "good" | "bad";
}) {
  return (
    <div className="rounded-md border border-[#ded8ce] bg-white p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[#706d66]">{label}</p>
          <p
            className={cn(
              "mt-2 font-serif text-xl tracking-normal sm:text-2xl",
              tone === "good" && "text-[#108f5c]",
              tone === "bad" && "text-[#c94c5c]",
              tone === "default" && "text-[#151514]",
            )}
          >
            {value}
          </p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#ded8ce] bg-[#f7f3ec] sm:h-9 sm:w-9">
          <Icon className="h-4 w-4 text-[#706d66]" />
        </div>
      </div>
    </div>
  );
}

function TransactionsScreen() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div>
          <h2 className="font-serif text-2xl tracking-normal text-[#151514] sm:text-3xl">
            Transações
          </h2>
          <p className="mt-1 text-xs text-[#706d66]">Entradas e saídas organizadas</p>
        </div>
        <button className="w-full rounded-md bg-[#151514] px-3 py-2 text-xs text-white sm:w-auto">
          Nova transação
        </button>
      </div>
      <div className="rounded-md border border-[#ded8ce] bg-white p-3 sm:p-4">
        <div className="mb-3 grid gap-2 sm:mb-4 sm:flex sm:flex-wrap sm:items-center">
          <div className="flex min-w-0 items-center gap-2 rounded-md border border-[#ded8ce] px-3 py-2 text-xs text-[#706d66] sm:min-w-52">
            <Search className="h-3.5 w-3.5" />
            Buscar por descrição
          </div>
          <div className="rounded-md border border-[#ded8ce] px-3 py-2 text-xs text-[#706d66]">
            Todos os tipos
          </div>
          <div className="rounded-md border border-[#ded8ce] px-3 py-2 text-xs text-[#706d66]">
            Todas as categorias
          </div>
        </div>
        <div className="divide-y divide-[#eee7dc]">
          {recentTransactions.map((item) => (
            <div key={item.description} className="grid grid-cols-[1fr_auto] gap-3 py-3 sm:gap-4">
              <div>
                <p className="text-sm font-medium text-[#151514]">{item.description}</p>
                <p className="text-xs text-[#706d66]">{item.category}</p>
              </div>
              <p
                className={cn(
                  "whitespace-nowrap text-sm font-semibold",
                  item.tone === "income" && "text-[#108f5c]",
                  item.tone === "expense" && "text-[#c94c5c]",
                  item.tone === "neutral" && "text-[#151514]",
                )}
              >
                {item.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanningScreen() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h2 className="font-serif text-2xl tracking-normal text-[#151514] sm:text-3xl">
          Orçamentos e metas
        </h2>
        <p className="mt-1 text-xs text-[#706d66]">
          Limites do mês conectados aos objetivos
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-md border border-[#ded8ce] bg-white p-3 sm:p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-[#151514]">Orçamento de maio</p>
            <PiggyBank className="h-4 w-4 text-[#706d66]" />
          </div>
          <div className="space-y-4">
            {budgetRows.map((item) => (
              <div key={item.label}>
                <div className="mb-1.5 flex flex-col gap-1 text-xs min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between min-[420px]:gap-3">
                  <span className="text-[#706d66]">{item.label}</span>
                  <span className="font-medium text-[#151514]">{item.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#ece7df]">
                  <div className="h-full rounded-full bg-[#151514]" style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-[#ded8ce] bg-white p-3 sm:p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-[#151514]">Reserva de emergência</p>
            <Goal className="h-4 w-4 text-[#706d66]" />
          </div>
          <p className="font-serif text-3xl tracking-normal text-[#151514] sm:text-4xl">R$ 12.900</p>
          <p className="mt-1 text-xs text-[#706d66]">de R$ 18.000 planejados</p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#ece7df]">
            <div className="h-full w-[72%] rounded-full bg-[#19c37d]" />
          </div>
          <div className="mt-5 space-y-2 text-xs text-[#706d66]">
            {investments.map((item) => (
              <div key={item.label} className="flex justify-between gap-3">
                <span>{item.label}</span>
                <span className="font-medium text-[#151514]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050506] font-sans text-[#f4f1ea]">
      <section className="relative overflow-hidden border-b border-white/[0.09]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:96px_96px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_34%,rgba(255,255,255,0.08),transparent_32%),linear-gradient(180deg,rgba(5,5,6,0.72)_0%,#050506_86%)]" />

        <div className="relative mx-auto flex min-h-[92svh] max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3" aria-label="FinanceBuddy">
              <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-[#f4f1ea] text-[#050506] sm:h-10 sm:w-10">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <span className="text-sm font-semibold tracking-normal text-[#f4f1ea] sm:text-base">
                FinanceBuddy <span className="ml-1 text-xs text-[#777680]">v0</span>
              </span>
            </Link>
            <Button
              asChild
              variant="outline"
              className="hidden h-10 rounded-md !border-white/20 !bg-[#f4f1ea] px-5 !text-[#050506] hover:!bg-white hover:!text-[#050506] sm:inline-flex"
            >
              <Link to="/auth">Entrar</Link>
            </Button>
          </header>

          <div className="grid w-full min-w-0 flex-1 items-center gap-8 py-8 sm:gap-10 sm:py-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-8">
            <div className="w-full min-w-0 max-w-[calc(100vw-2rem)] lg:max-w-3xl">
              <p className={cn(ledgerLabel, "mb-4 sm:mb-6")}>
                Volume 0 · Painel 01 · Finanças pessoais
              </p>
              <h1 className="max-w-4xl font-serif text-[2.55rem] font-normal leading-[0.98] tracking-normal text-[#f4f1ea] min-[420px]:text-5xl sm:text-7xl sm:leading-[0.95] lg:text-8xl">
                <span className="block">Clareza financeira</span>
                <span className="block italic text-[#8e8d96]">sem planilha,</span>
                <span className="block">sem ruído.</span>
              </h1>
              <p className="mt-5 max-w-[32ch] text-base leading-7 text-[#a5a3ad] sm:mt-7 sm:max-w-2xl sm:text-xl sm:leading-8">
                FinanceBuddy reúne gastos, metas, orçamento e investimentos em uma
                visão única para você saber o que entrou, o que saiu e para onde seu
                dinheiro está indo.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full rounded-md bg-[#f4f1ea] px-6 text-[#050506] hover:bg-white sm:w-auto"
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
                  className="h-12 w-full rounded-md px-5 text-[#a5a3ad] hover:bg-white/[0.04] hover:text-[#f4f1ea] sm:w-auto"
                >
                  <a href="#como-funciona">
                    Ver como funciona
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <ProductWindow className="max-w-[calc(100vw-2rem)] lg:max-w-full lg:translate-y-5">
              <PlatformDashboardScreen compact />
            </ProductWindow>
          </div>
        </div>
      </section>

      <section className="border-b border-white/[0.09] bg-[#08080a] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-2 min-[420px]:grid-cols-2 md:grid-cols-4">
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

      <section id="como-funciona" className="bg-[#050506] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-7 sm:space-y-10">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_0.75fr] lg:items-end">
            <div>
              <p className={ledgerLabel}>O problema</p>
              <h2 className={cn(sectionTitle, "mt-4 max-w-5xl")}>
                Seu dinheiro fica espalhado entre banco, cartão, corretora e memória.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#a5a3ad] sm:text-lg sm:leading-8 lg:justify-self-end">
              Quando cada decisão depende de abrir vários aplicativos ou atualizar uma
              planilha, o controle chega tarde. O FinanceBuddy organiza o que você
              registra e transforma o mês em uma leitura simples.
            </p>
          </div>

          <ProductWindow compact>
            <TransactionsScreen />
          </ProductWindow>

          <div>
            <p className={ledgerLabel}>Áreas do produto</p>
            <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 lg:grid-cols-3">
              {productAreas.map((area, index) => {
                const Icon = area.icon;
                return (
                  <article
                    key={area.title}
                    className="rounded-md border border-white/[0.08] bg-white/[0.02] p-4 sm:rounded-lg sm:p-5"
                  >
                    <div className="mb-5 flex items-center justify-between sm:mb-8">
                      <span className={ledgerLabel}>§{String(index + 1).padStart(2, "0")}</span>
                      <Icon className="h-5 w-5 text-[#8e8d96]" />
                    </div>
                    <h3 className="font-serif text-2xl font-normal text-[#f4f1ea] sm:text-3xl">
                      {area.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#a5a3ad]">{area.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.09] bg-[#111113] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col justify-between gap-5 sm:mb-10 md:flex-row md:items-end">
            <div>
              <p className={ledgerLabel}>Preview do produto</p>
              <h2 className={cn(sectionTitle, "mt-4 max-w-4xl")}>
                Números importantes aparecem antes da ansiedade.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#a5a3ad] sm:text-base sm:leading-7">
              Saldo mensal, gastos por categoria, evolução e carteira dividem o mesmo
              contexto para ajudar você a agir com menos ruído.
            </p>
          </div>
          <ProductWindow>
            <PlatformDashboardScreen />
          </ProductWindow>
        </div>
      </section>

      <section className="bg-[#050506] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className={ledgerLabel}>Segurança</p>
            <h2 className={cn(sectionTitle, "mt-4")}>
              Acesso protegido para dados que precisam de cuidado.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#a5a3ad] sm:mt-6 sm:text-lg sm:leading-8">
              A arquitetura usa uma API própria entre a interface e o banco, com
              validação e controles de sessão para manter o produto simples sem tratar
              segurança como detalhe.
            </p>
          </div>
          <div className="space-y-4">
            <ProductWindow compact>
              <PlanningScreen />
            </ProductWindow>
            <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-4 sm:rounded-lg sm:p-5">
              <div className="mb-5 flex items-center gap-3 sm:mb-6 sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-[#050506] sm:h-12 sm:w-12">
                  <LockKeyhole className="h-5 w-5 text-[#f4f1ea]" />
                </div>
                <div>
                  <p className={ledgerLabel}>Camadas</p>
                  <h3 className="mt-1 font-serif text-2xl font-normal text-[#f4f1ea] sm:mt-2 sm:text-3xl">
                    Proteção de sessão
                  </h3>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {securityItems.map((item) => (
                  <div key={item} className="flex gap-3 rounded-md border border-white/[0.08] bg-black/20 p-3 sm:p-4">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#19c37d]" />
                    <p className="text-sm leading-6 text-[#a5a3ad]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.09] bg-[#08080a] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 md:flex-row md:items-center">
          <div>
            <p className={ledgerLabel}>Comece agora</p>
            <h2 className="mt-4 font-serif text-3xl font-normal tracking-normal text-[#f4f1ea] sm:text-5xl">
              Comece pelo seu painel financeiro.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#a5a3ad] sm:text-base">
              Crie sua conta, registre seus dados e veja o mês ganhar forma em poucos
              minutos.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-12 w-full rounded-md bg-[#f4f1ea] px-6 text-[#050506] hover:bg-white sm:w-auto"
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
