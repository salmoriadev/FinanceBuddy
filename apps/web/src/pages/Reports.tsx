import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { CategorySpending } from "@/types/finance";
import { useInvestments } from "@/hooks/useInvestments";
import { calculatePortfolioSummary } from "@/domain/investments/strategy";
import { useFormatter } from "@/hooks/useFormatter";
import { useI18n } from "@/hooks/useI18n";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { useReportAnalytics } from "@/hooks/useReports";

export default function Reports() {
  const { user, loading } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const parsedSelectedYear = Number(selectedYear);
  const selectedYearNumber = Number.isFinite(parsedSelectedYear)
    ? parsedSelectedYear
    : currentYear;
  const { analytics, isLoading: isReportsLoading } = useReportAnalytics(selectedYearNumber);
  const { investments } = useInvestments();
  const { formatCurrency, formatPercent, formatCompactCurrency, monthsShort } = useFormatter();
  const { t } = useI18n();
  const { labelFor } = useCategoryLabels();
  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
  } as const;

  const years = useMemo(
    () =>
      analytics?.availableYears?.length
        ? analytics.availableYears
        : [currentYear],
    [analytics?.availableYears, currentYear],
  );

  useEffect(() => {
    if (!years.includes(selectedYearNumber)) {
      setSelectedYear(years[0].toString());
    }
  }, [years, selectedYearNumber]);

  const monthlyData = useMemo(() => {
    const byMonth = new Map((analytics?.monthly ?? []).map((item) => [item.month, item]));
    return monthsShort.map((month, index) => {
      const monthItem = byMonth.get(index + 1);
      const income = monthItem?.income ?? 0;
      const expense = monthItem?.expense ?? 0;
      return {
        month,
        income,
        expense,
        balance: monthItem?.balance ?? income - expense,
      };
    });
  }, [analytics?.monthly, monthsShort]);

  const yearlyStats = analytics?.summary ?? {
    year: selectedYearNumber,
    income: 0,
    expense: 0,
    balance: 0,
    savingsRate: 0,
  };

  const categorySpending = useMemo((): CategorySpending[] => {
    return (analytics?.categories ?? []).map((item) => ({
      name: labelFor(item.name, item.type),
      value: item.value,
      color: item.color || "#6366f1",
    }));
  }, [analytics?.categories, labelFor]);

  const currentMonthStats = analytics?.currentMonthComparison ?? {
    currentExpense: 0,
    lastExpense: 0,
    variation: null,
    hasVariationBaseline: false,
  };

  const investmentStats = useMemo(
    () => calculatePortfolioSummary(investments),
    [investments],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-normal tracking-normal text-foreground">
              {t("reports.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("reports.subtitle")}
            </p>
          </div>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4 text-[#19c37d]" />
                {t("reports.income")} {selectedYear}
              </div>
              <p className="font-serif text-3xl font-normal tracking-normal text-[#19c37d]">
                {formatCurrency(yearlyStats.income)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingDown className="h-4 w-4 text-[#ef6f7c]" />
                {t("reports.expense")} {selectedYear}
              </div>
              <p className="font-serif text-3xl font-normal tracking-normal text-[#ef6f7c]">
                {formatCurrency(yearlyStats.expense)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">
                {t("reports.balance")} {selectedYear}
              </p>
              <p
                className={`font-serif text-3xl font-normal tracking-normal ${
                  yearlyStats.balance >= 0 ? "text-[#19c37d]" : "text-[#ef6f7c]"
                }`}
              >
                {formatCurrency(yearlyStats.balance)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">
                {t("reports.savingsRate")}
              </p>
              <p className="font-serif text-3xl font-normal tracking-normal">
                {formatPercent(yearlyStats.savingsRate, 1)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("reports.investments")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-md border border-border/70 bg-muted/35 p-4">
                <p className="text-sm text-muted-foreground">
                  {t("investments.totalInvested")}
                </p>
                <p className="font-serif text-2xl font-normal tracking-normal">
                  {formatCurrency(investmentStats.invested)}
                </p>
              </div>
              <div className="rounded-md border border-border/70 bg-muted/35 p-4">
                <p className="text-sm text-muted-foreground">
                  {t("investments.currentValue")}
                </p>
                <p className="font-serif text-2xl font-normal tracking-normal text-[#19c37d]">
                  {formatCurrency(investmentStats.current)}
                </p>
              </div>
              <div className="rounded-md border border-border/70 bg-muted/35 p-4">
                <p className="text-sm text-muted-foreground">
                  {t("investments.return")}
                </p>
                <p
                  className={`font-serif text-2xl font-normal tracking-normal ${
                    investmentStats.profit >= 0
                      ? "text-[#19c37d]"
                      : "text-[#ef6f7c]"
                  }`}
                >
                  {investmentStats.profit >= 0 ? "+" : ""}
                  {formatCurrency(investmentStats.profit)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPercent(investmentStats.roi, 1)} {t("common.accumulated")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("reports.compareTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="rounded-md border border-border/70 bg-muted/35 p-4">
                <p className="text-sm text-muted-foreground">
                  {t("reports.currentMonth")}
                </p>
                <p className="font-serif text-2xl font-normal tracking-normal">
                  {formatCurrency(currentMonthStats.currentExpense)}
                </p>
              </div>
              <div className="rounded-md border border-border/70 bg-muted/35 p-4">
                <p className="text-sm text-muted-foreground">
                  {t("reports.previousMonth")}
                </p>
                <p className="font-serif text-2xl font-normal tracking-normal">
                  {formatCurrency(currentMonthStats.lastExpense)}
                </p>
              </div>
              <div className="rounded-md border border-border/70 bg-muted/35 p-4">
                <p className="text-sm text-muted-foreground">
                  {t("reports.variation")}
                </p>
                <p
                  className={`font-serif text-2xl font-normal tracking-normal ${
                    !currentMonthStats.hasVariationBaseline
                      ? "text-muted-foreground"
                      : currentMonthStats.variation! < 0
                      ? "text-[#ef6f7c]"
                      : currentMonthStats.variation! > 0
                        ? "text-[#19c37d]"
                        : "text-muted-foreground"
                  }`}
                >
                  {currentMonthStats.hasVariationBaseline ? (
                    <>
                      {currentMonthStats.variation! > 0 ? "+" : ""}
                      {formatPercent(currentMonthStats.variation!, 1)}
                    </>
                  ) : (
                    <span className="text-sm font-medium">
                      {t("reports.noVariation")}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("reports.incomeVsExpense")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isReportsLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12,
                        }}
                      />
                      <YAxis
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12,
                        }}
                        tickFormatter={(value) =>
                          formatCompactCurrency(Number(value))
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value)]}
                        contentStyle={tooltipStyle}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        itemStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Legend />
                      <Bar
                        dataKey="income"
                        name={t("reports.income")}
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="expense"
                        name={t("reports.expense")}
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <ExpenseChart data={categorySpending} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("reports.balanceEvolution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    tickFormatter={(value) =>
                      formatCompactCurrency(Number(value))
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      t("reports.balance"),
                    ]}
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name={t("reports.balance")}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
