import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import {
  AlertCircle,
  Loader2,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { useSavingsGoals } from "@/hooks/useSavingsGoals";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { BudgetProgress } from "@/components/dashboard/BudgetProgress";
import { GoalsProgress } from "@/components/dashboard/GoalsProgress";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategorySpending, MonthlyData } from "@/types/finance";
import { useFormatter } from "@/hooks/useFormatter";
import { useI18n } from "@/hooks/useI18n";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { useReportAnalytics } from "@/hooks/useReports";

type DashboardAggregates = {
  stats: {
    income: number;
    expense: number;
    balance: number;
  };
  categorySpending: CategorySpending[];
  monthlyData: MonthlyData[];
  budgetsByCategoryCurrentMonth: Map<string, number>;
};

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const {
    transactions,
    isLoading: transLoading,
    isError: transactionsError,
    refetch: refetchTransactions,
    deleteTransaction,
  } = useTransactions();
  const { budgets } = useBudgets();
  const { goals } = useSavingsGoals();
  const { formatCurrency, formatPercent, monthsShort } = useFormatter();
  const { t: tText } = useI18n();
  const { labelFor } = useCategoryLabels();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const {
    analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useReportAnalytics(currentYear);

  const dashboardAggregates = useMemo((): DashboardAggregates | null => {
    if (!analytics) return null;
    const currentMonthTotals = analytics.monthly.find(
      (item) => item.month === currentMonth,
    );
    const budgetsByCategoryCurrentMonth = new Map<string, number>();
    for (const category of analytics.currentMonthCategories) {
      budgetsByCategoryCurrentMonth.set(category.categoryId, category.value);
    }

    return {
      stats: {
        income: currentMonthTotals?.income ?? 0,
        expense: currentMonthTotals?.expense ?? 0,
        balance: currentMonthTotals?.balance ?? 0,
      },
      categorySpending: analytics.currentMonthCategories.map((category) => ({
        name: labelFor(category.name, category.type),
        value: category.value,
        color: category.color || "#6366f1",
      })),
      monthlyData: analytics.monthly
        .map((item) => ({
          month: monthsShort[item.month - 1] ?? String(item.month),
          income: item.income,
          expense: item.expense,
        }))
        .filter((item) => item.income > 0 || item.expense > 0),
      budgetsByCategoryCurrentMonth,
    };
  }, [analytics, currentMonth, labelFor, monthsShort]);

  const budgetsWithSpent = useMemo(() => {
    if (!dashboardAggregates) return [];
    return budgets
      .filter((b) => b.month === currentMonth && b.year === currentYear)
      .map((budget) => {
        const spent = dashboardAggregates.budgetsByCategoryCurrentMonth.get(budget.category_id) ?? 0;

        return { ...budget, spent };
      });
  }, [budgets, currentMonth, currentYear, dashboardAggregates]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (analyticsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (analyticsError || !dashboardAggregates) {
    return (
      <AppLayout>
        <div
          className="flex min-h-64 flex-col items-center justify-center gap-4 text-center"
          role="alert"
        >
          <AlertCircle className="h-7 w-7 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {tText("dashboard.analyticsError")}
          </p>
          <Button type="button" variant="outline" onClick={() => void refetchAnalytics()}>
            {tText("transactions.retry")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const { stats, categorySpending, monthlyData } = dashboardAggregates;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-4xl font-normal tracking-normal text-foreground">
            {tText("dashboard.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tText("dashboard.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={tText("dashboard.balance")}
            value={formatCurrency(stats.balance)}
            icon={<Wallet className="h-6 w-6" />}
            variant={stats.balance >= 0 ? "success" : "danger"}
          />
          <StatCard
            title={tText("dashboard.income")}
            value={formatCurrency(stats.income)}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="success"
          />
          <StatCard
            title={tText("dashboard.expenses")}
            value={formatCurrency(stats.expense)}
            icon={<TrendingDown className="h-6 w-6" />}
            variant="danger"
          />
          <StatCard
            title={tText("dashboard.savings")}
            value={formatPercent(
              stats.income > 0 ? (stats.balance / stats.income) * 100 : 0,
            )}
            icon={<Scale className="h-6 w-6" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseChart data={categorySpending} />
          <MonthlyChart data={monthlyData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetProgress budgets={budgetsWithSpent} />
          <GoalsProgress goals={goals} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {tText("dashboard.recentTransactions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : transactionsError ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center" role="alert">
                <p className="text-sm text-muted-foreground">
                  {tText("transactions.loadError")}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void refetchTransactions()}
                >
                  {tText("transactions.retry")}
                </Button>
              </div>
            ) : (
              <TransactionList
                transactions={transactions.slice(0, 5)}
                onDelete={(id) => deleteTransaction.mutate(id)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
