import { useMemo, useState } from "react";
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
import { useTransactions } from "@/hooks/useTransactions";
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
import { parseDateInput } from "@/lib/date";
import { useInvestments } from "@/hooks/useInvestments";
import { calculatePortfolioSummary } from "@/domain/investments/strategy";
import { useFormatter } from "@/hooks/useFormatter";
import { useI18n } from "@/hooks/useI18n";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";

export default function Reports() {
  const { user, loading } = useAuth();
  const { transactions, isLoading } = useTransactions();
  const { investments } = useInvestments();
  const { formatCurrency, formatPercent, formatCompactCurrency, monthsShort } = useFormatter();
  const { t } = useI18n();
  const { labelFor } = useCategoryLabels();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const years = useMemo(() => {
    const uniqueYears = new Set(
      transactions.map((t) => parseDateInput(t.date).getFullYear()),
    );
    uniqueYears.add(currentYear);
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  const monthlyData = useMemo(() => {
    const year = parseInt(selectedYear);

    return monthsShort.map((month, index) => {
      const monthTransactions = transactions.filter((t) => {
        const date = parseDateInput(t.date);
        return date.getMonth() === index && date.getFullYear() === year;
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return { month, income, expense, balance: income - expense };
    });
  }, [transactions, selectedYear, monthsShort]);

  const yearlyStats = useMemo(() => {
    const year = parseInt(selectedYear);
    const yearTransactions = transactions.filter(
      (t) => parseDateInput(t.date).getFullYear() === year,
    );

    const income = yearTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = yearTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      income,
      expense,
      balance: income - expense,
      savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
    };
  }, [transactions, selectedYear]);

  const categorySpending = useMemo((): CategorySpending[] => {
    const year = parseInt(selectedYear);
    const expenses = transactions.filter((t) => {
      const date = parseDateInput(t.date);
      return t.type === "expense" && date.getFullYear() === year && t.category;
    });

    const byCategory = expenses.reduce(
      (acc, t) => {
        const catName = t.category
          ? labelFor(t.category.name, t.category.type)
          : t("common.other");
        const catColor = t.category?.color || "#6366f1";
        if (!acc[catName]) {
          acc[catName] = { name: catName, value: 0, color: catColor };
        }
        acc[catName].value += Number(t.amount);
        return acc;
      },
      {} as Record<string, CategorySpending>,
    );

    return Object.values(byCategory).sort((a, b) => b.value - a.value);
  }, [transactions, selectedYear, t]);

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTransactions = transactions.filter((t) => {
      const date = parseDateInput(t.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    const lastMonthTransactions = transactions.filter((t) => {
      const date = parseDateInput(t.date);
      return (
        date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      );
    });

    const currentExpense = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const lastExpense = lastMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const variation =
      lastExpense > 0
        ? ((currentExpense - lastExpense) / lastExpense) * 100
        : 0;

    return { currentExpense, lastExpense, variation };
  }, [transactions, currentYear]);

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
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
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
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                {t("reports.income")} {selectedYear}
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(yearlyStats.income)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingDown className="h-4 w-4 text-rose-600" />
                {t("reports.expense")} {selectedYear}
              </div>
              <p className="text-2xl font-bold text-rose-600">
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
                className={`text-2xl font-bold ${
                  yearlyStats.balance >= 0 ? "text-emerald-600" : "text-rose-600"
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
              <p className="text-2xl font-bold">
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
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t("investments.totalInvested")}
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(investmentStats.invested)}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t("investments.currentValue")}
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(investmentStats.current)}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t("investments.return")}
                </p>
                <p
                  className={`text-xl font-bold ${
                    investmentStats.profit >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
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
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t("reports.currentMonth")}
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(currentMonthStats.currentExpense)}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t("reports.previousMonth")}
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(currentMonthStats.lastExpense)}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t("reports.variation")}
                </p>
                <p
                  className={`text-xl font-bold ${
                    currentMonthStats.variation <= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {currentMonthStats.variation > 0 ? "+" : ""}
                  {formatPercent(currentMonthStats.variation, 1)}
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
              {isLoading ? (
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
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
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
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
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
