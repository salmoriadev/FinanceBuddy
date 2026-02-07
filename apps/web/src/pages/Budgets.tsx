/**
 * This file implements Budgets behavior for the frontend page layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { useMemo, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Loader2, Trash2, Edit2 } from "lucide-react";
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
import { useFormatter } from "@/hooks/useFormatter";
import { useI18n } from "@/hooks/useI18n";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { Budget } from "@/types/finance";

const buildBudgetSchema = (t: (key: string) => string) =>
  z.object({
    category_id: z.string().min(1, t("budgets.validation.categoryRequired")),
    amount: z
      .string()
      .min(1, t("budgets.validation.amountRequired"))
      .refine(
        (value) => parseCurrency(value) > 0,
        t("budgets.validation.amountPositive"),
      ),
  });

type BudgetFormData = z.infer<ReturnType<typeof buildBudgetSchema>>;

export default function Budgets() {
  const { user, loading } = useAuth();
  const { budgets, isLoading, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { categories } = useCategories();
  const { transactions } = useTransactions();
  const { formatCurrency, monthsLong, locale } = useFormatter();
  const { t } = useI18n();
  const { labelForCategory } = useCategoryLabels();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const schema = useMemo(() => buildBudgetSchema(t), [t]);
  const form = useForm<BudgetFormData>({
    resolver: zodResolver(schema),
    defaultValues: { category_id: "", amount: "" },
  });
  const editForm = useForm<BudgetFormData>({
    resolver: zodResolver(schema),
    defaultValues: { category_id: "", amount: "" },
  });

  useEffect(() => {
    if (!editingBudget) return;
    editForm.reset({
      category_id: editingBudget.category_id,
      amount: String(editingBudget.amount ?? ""),
    });
  }, [editingBudget, editForm]);

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
  const editAvailableCategories = useMemo(() => {
    if (!editingBudget) return expenseCategories;
    const blockedIds = new Set(
      currentBudgets.filter((b) => b.id !== editingBudget.id).map((b) => b.category_id),
    );
    return expenseCategories.filter((c) => !blockedIds.has(c.id));
  }, [editingBudget, expenseCategories, currentBudgets]);

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
      toast.success(t("budgets.toast.addSuccess"));
    } catch {
      toast.error(t("budgets.toast.addError"));
    }
  };

  const handleUpdateBudget = async (data: BudgetFormData) => {
    if (!editingBudget) return;
    try {
      await updateBudget.mutateAsync({
        id: editingBudget.id,
        category_id: data.category_id,
        amount: parseCurrency(data.amount),
        month: editingBudget.month,
        year: editingBudget.year,
      });
      setIsEditDialogOpen(false);
      setEditingBudget(null);
      toast.success(t("budgets.toast.updateSuccess"));
    } catch {
      toast.error(t("budgets.toast.updateError"));
    }
  };

  const handleDelete = (id: string) => {
    deleteBudget.mutate(id, {
      onSuccess: () => toast.success(t("budgets.toast.deleteSuccess")),
      onError: () => toast.error(t("budgets.toast.deleteError")),
    });
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsEditDialogOpen(true);
  };

  const monthName = monthsLong[currentMonth - 1] ?? "";
  const monthLabel =
    locale === "pt-BR"
      ? `${monthName} de ${currentYear}`
      : `${monthName} ${currentYear}`;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {t("budgets.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {monthLabel}
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={availableCategories.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                {t("budgets.new")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("budgets.form.title")}</DialogTitle>
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
                        <FormLabel>{t("budgets.form.categoryLabel")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("budgets.form.categoryPlaceholder")} />
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
                                {labelForCategory(cat)}
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
                        <FormLabel>{t("budgets.form.amountLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder={t("common.currencyPlaceholder")}
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
                    {t("budgets.form.submit")}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) setEditingBudget(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("budgets.form.editTitle")}</DialogTitle>
              </DialogHeader>
              {editingBudget && (
                <Form {...editForm}>
                  <form
                    onSubmit={editForm.handleSubmit(handleUpdateBudget)}
                    className="space-y-4"
                  >
                    <FormField
                      control={editForm.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("budgets.form.categoryLabel")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("budgets.form.categoryPlaceholder")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {editAvailableCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  <span className="flex items-center gap-2">
                                    <span
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: cat.color }}
                                    />
                                    {labelForCategory(cat)}
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
                      control={editForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("budgets.form.amountLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder={t("common.currencyPlaceholder")}
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
                      disabled={updateBudget.isPending}
                    >
                      {updateBudget.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("budgets.form.update")}
                    </Button>
                  </form>
                </Form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{t("budgets.total")}</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalBudget)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{t("budgets.spent")}</p>
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
            <CardTitle>{t("budgets.byCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : budgetsWithSpent.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {t("budgets.none")}
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
                    ? t("budgets.exceeded")
                    : isNearLimit
                      ? t("budgets.nearLimit")
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
                            {budget.category ? labelForCategory(budget.category) : null}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditBudget(budget)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(budget.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Progress
                        value={percentage}
                        className={cn(
                          "h-3",
                          isOverBudget && "[&>div]:bg-rose-500",
                          isNearLimit && "[&>div]:bg-amber-500",
                        )}
                        style={{
                          ["--progress-color" as string]:
                            budget.category?.color || "#6366f1",
                        }}
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
                            ? `${t("budgets.exceeded")} ${formatCurrency(Math.abs(remaining))}`
                            : `${t("budgets.remaining")} ${formatCurrency(remaining)}`}
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
