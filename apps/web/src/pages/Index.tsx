import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Wallet, TrendingUp, TrendingDown, Scale, Loader2 } from "lucide-react";
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
import { CategorySpending, MonthlyData } from "@/types/finance";
import { parseDateInput } from "@/lib/date";
import { useFormatter } from "@/hooks/useFormatter";
import { useI18n } from "@/hooks/useI18n";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";

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
    deleteTransaction,
  } = useTransactions();
  const { budgets } = useBudgets();
  const { goals } = useSavingsGoals();
  const { formatCurrency, formatPercent, monthsShort } = useFormatter();
  const { t: tText } = useI18n();
  const { labelFor } = useCategoryLabels();

  const dashboardAggregates = useMemo((): DashboardAggregates => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyTotals = Array.from({ length: 12 }, () => ({
      income: 0,
      expense: 0,
    }));
    const currentMonthByCategory = new Map<string, CategorySpending>();
    const budgetsByCategoryCurrentMonth = new Map<string, number>();
    let currentMonthIncome = 0;
    let currentMonthExpense = 0;

    for (const transaction of transactions) {
      const date = parseDateInput(transaction.date);
      const txYear = date.getFullYear();
      if (txYear !== currentYear) continue;
      const txMonth = date.getMonth();
      const amount = Number(transaction.amount);

      if (transaction.type === "income") {
        monthlyTotals[txMonth].income += amount;
        if (txMonth === currentMonth) currentMonthIncome += amount;
        continue;
      }

      monthlyTotals[txMonth].expense += amount;
      if (txMonth === currentMonth) {
        currentMonthExpense += amount;
        if (transaction.category_id) {
          const previous = budgetsByCategoryCurrentMonth.get(transaction.category_id) ?? 0;
          budgetsByCategoryCurrentMonth.set(transaction.category_id, previous + amount);
        }

        const categoryName = transaction.category
          ? labelFor(transaction.category.name, transaction.category.type)
          : tText("common.none");
        const categoryColor = transaction.category?.color || "#6366f1";
        const currentCategory = currentMonthByCategory.get(categoryName);
        if (currentCategory) {
          currentCategory.value += amount;
        } else {
          currentMonthByCategory.set(categoryName, {
            name: categoryName,
            value: amount,
            color: categoryColor,
          });
        }
      }
    }

    return {
      stats: {
        income: currentMonthIncome,
        expense: currentMonthExpense,
        balance: currentMonthIncome - currentMonthExpense,
      },
      categorySpending: Array.from(currentMonthByCategory.values()).sort(
        (a, b) => b.value - a.value,
      ),
      monthlyData: monthsShort
        .map((month, index) => ({
          month,
          income: monthlyTotals[index].income,
          expense: monthlyTotals[index].expense,
        }))
        .filter((d) => d.income > 0 || d.expense > 0),
      budgetsByCategoryCurrentMonth,
    };
  }, [transactions, tText, labelFor, monthsShort]);

  const { stats, categorySpending, monthlyData } = dashboardAggregates;

  const budgetsWithSpent = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    return budgets
      .filter((b) => b.month === currentMonth && b.year === currentYear)
      .map((budget) => {
        const spent = dashboardAggregates.budgetsByCategoryCurrentMonth.get(budget.category_id) ?? 0;

        return { ...budget, spent };
      });
  }, [budgets, dashboardAggregates.budgetsByCategoryCurrentMonth]);

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

  if (transLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

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
            <TransactionList
              transactions={transactions.slice(0, 5)}
              onDelete={(id) => deleteTransaction.mutate(id)}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
