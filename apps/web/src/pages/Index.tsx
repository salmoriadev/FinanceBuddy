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
import { formatCurrency, formatPercent, MONTHS_SHORT } from "@/lib/format";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const {
    transactions,
    isLoading: transLoading,
    deleteTransaction,
  } = useTransactions();
  const { budgets } = useBudgets();
  const { goals } = useSavingsGoals();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.filter((t) => {
      const date = parseDateInput(t.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    const income = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = income - expense;

    return { income, expense, balance };
  }, [transactions]);

  const categorySpending = useMemo((): CategorySpending[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const expenses = transactions.filter((t) => {
      const date = parseDateInput(t.date);
      return (
        t.type === "expense" &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        t.category
      );
    });

    const byCategory = expenses.reduce(
      (acc, t) => {
        const catName = t.category?.name || "Outros";
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
  }, [transactions]);

  const monthlyData = useMemo((): MonthlyData[] => {
    const currentYear = new Date().getFullYear();

    return MONTHS_SHORT.map((month, index) => {
      const monthTransactions = transactions.filter((t) => {
        const date = parseDateInput(t.date);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return { month, income, expense };
    }).filter((d) => d.income > 0 || d.expense > 0);
  }, [transactions]);

  const budgetsWithSpent = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    return budgets
      .filter((b) => b.month === currentMonth && b.year === currentYear)
      .map((budget) => {
        const spent = transactions
          .filter((t) => {
            const date = parseDateInput(t.date);
            return (
              t.type === "expense" &&
              t.category_id === budget.category_id &&
              date.getMonth() + 1 === currentMonth &&
              date.getFullYear() === currentYear
            );
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return { ...budget, spent };
      });
  }, [budgets, transactions]);

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
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão geral das suas finanças
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Saldo do Mês"
            value={formatCurrency(stats.balance)}
            icon={<Wallet className="h-6 w-6" />}
            variant={stats.balance >= 0 ? "success" : "danger"}
          />
          <StatCard
            title="Receitas"
            value={formatCurrency(stats.income)}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="success"
          />
          <StatCard
            title="Despesas"
            value={formatCurrency(stats.expense)}
            icon={<TrendingDown className="h-6 w-6" />}
            variant="danger"
          />
          <StatCard
            title="Economia"
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
            <CardTitle className="text-lg">Transações Recentes</CardTitle>
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
