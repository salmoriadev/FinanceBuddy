import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useBudgets } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseDateInput } from "@/lib/date";
import { parseCurrency } from "@/lib/number";
import { formatCurrency, MONTHS_LONG } from "@/lib/format";

const budgetSchema = z.object({
  category_id: z.string().min(1, "Selecione uma categoria"),
  amount: z
    .string()
    .min(1, "Valor obrigatório")
    .refine(
      (value) => parseCurrency(value) > 0,
      "Valor deve ser maior que zero",
    ),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export default function Budgets() {
  const { user, loading } = useAuth();
  const { budgets, isLoading, addBudget, deleteBudget } = useBudgets();
  const { categories } = useCategories();
  const { transactions } = useTransactions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { category_id: "", amount: "" },
  });

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

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const currentBudgets = budgets.filter(
    (b) => b.month === currentMonth && b.year === currentYear,
  );
  const existingCategoryIds = currentBudgets.map((b) => b.category_id);
  const availableCategories = expenseCategories.filter(
    (c) => !existingCategoryIds.includes(c.id),
  );

  const budgetsWithSpent = currentBudgets.map((budget) => {
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

  const totalBudget = budgetsWithSpent.reduce(
    (sum, b) => sum + Number(b.amount),
    0,
  );
  const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0);

  const handleAddBudget = async (data: BudgetFormData) => {
    try {
      await addBudget.mutateAsync({
        category_id: data.category_id,
        amount: parseCurrency(data.amount),
        month: currentMonth,
        year: currentYear,
      });
      setIsDialogOpen(false);
      form.reset();
      toast.success("Orçamento adicionado!");
    } catch {
      toast.error("Erro ao adicionar orçamento");
    }
  };

  const handleDelete = (id: string) => {
    deleteBudget.mutate(id, {
      onSuccess: () => toast.success("Orçamento excluído"),
      onError: () => toast.error("Erro ao excluir"),
    });
  };

  const monthNames = MONTHS_LONG;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold font-serif tracking-tight text-foreground">
              Orçamentos
            </h1>
            <p className="text-muted-foreground">
              {monthNames[currentMonth - 1]} de {currentYear}
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={availableCategories.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Orçamento</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleAddBudget)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                <span className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                  />
                                  {cat.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={addBudget.isPending}
                  >
                    {addBudget.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Criar Orçamento
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Orçamento Total</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalBudget)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Gasto Atual</p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  totalSpent > totalBudget
                    ? "text-rose-600"
                    : "text-emerald-600",
                )}
              >
                {formatCurrency(totalSpent)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Orçamentos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : budgetsWithSpent.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhum orçamento definido para este mês
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {budgetsWithSpent.map((budget) => {
                  const percentage = Math.min(
                    (budget.spent / Number(budget.amount)) * 100,
                    100,
                  );
                  const isOverBudget = budget.spent > Number(budget.amount);
                  const isNearLimit = percentage >= 80 && !isOverBudget;
                  const remaining = Number(budget.amount) - budget.spent;
                  const statusLabel = isOverBudget
                    ? "Limite excedido"
                    : isNearLimit
                      ? "Atenção: perto do limite"
                      : null;

                  return (
                    <div
                      key={budget.id}
                      className="space-y-3 p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor:
                                budget.category?.color || "#6366f1",
                            }}
                          />
                          <span className="font-medium">
                            {budget.category?.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(budget.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <Progress
                        value={percentage}
                        className={cn(
                          "h-3",
                          isOverBudget && "[&>div]:bg-rose-500",
                          isNearLimit && "[&>div]:bg-amber-500",
                        )}
                      />

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(budget.spent)} de{" "}
                          {formatCurrency(Number(budget.amount))}
                        </span>
                        <span
                          className={cn(
                            isOverBudget
                              ? "text-rose-600 font-medium"
                              : "text-muted-foreground",
                          )}
                        >
                          {isOverBudget
                            ? `Excedido ${formatCurrency(Math.abs(remaining))}`
                            : `Restam ${formatCurrency(remaining)}`}
                        </span>
                      </div>
                      {statusLabel && (
                        <p
                          className={cn(
                            "text-xs",
                            isOverBudget ? "text-rose-600" : "text-amber-600",
                          )}
                        >
                          {statusLabel}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
