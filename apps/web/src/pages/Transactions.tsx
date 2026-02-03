import { useMemo, useState, useDeferredValue, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Filter, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { Transaction, TransactionType } from "@/types/finance";
import { parseDateInput } from "@/lib/date";
import { isValid } from "date-fns";
import { useI18n } from "@/hooks/useI18n";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";

export default function Transactions() {
  const { user, loading } = useAuth();
  const {
    transactions,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();
  const { categories } = useCategories();
  const { t } = useI18n();
  const { labelForCategory } = useCategoryLabels();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);

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

  const resolveTransactionDate = useCallback((transaction: Transaction) => {
    const parsed = parseDateInput(transaction.date);
    if (isValid(parsed)) return parsed;
    if (transaction.created_at) {
      const fallback = parseDateInput(transaction.created_at);
      if (isValid(fallback)) return fallback;
    }
    return null;
  }, []);

  const fromTime = useMemo(() => {
    if (!filterFrom) return null;
    const parsed = parseDateInput(filterFrom);
    return isValid(parsed) ? parsed.getTime() : null;
  }, [filterFrom]);
  const toTime = useMemo(() => {
    if (!filterTo) return null;
    const parsed = parseDateInput(filterTo);
    return isValid(parsed) ? parsed.getTime() : null;
  }, [filterTo]);
  const normalizedSearch = useMemo(
    () => deferredSearch.trim().toLowerCase(),
    [deferredSearch],
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategory !== "all" && t.category_id !== filterCategory)
        return false;
      if (normalizedSearch) {
        const descriptionMatch = t.description
          .toLowerCase()
          .includes(normalizedSearch);
        const categoryMatch = t.category
          ? labelForCategory(t.category).toLowerCase().includes(normalizedSearch)
          : false;
        if (!descriptionMatch && !categoryMatch) return false;
      }
      if (fromTime !== null || toTime !== null) {
        const date = resolveTransactionDate(t);
        if (!date) return false;
        const transactionTime = date.getTime();
        if (fromTime !== null && transactionTime < fromTime) return false;
        if (toTime !== null && transactionTime > toTime) return false;
      }
      return true;
    });
  }, [
    transactions,
    filterType,
    filterCategory,
    normalizedSearch,
    fromTime,
    toTime,
    resolveTransactionDate,
    labelForCategory,
  ]);

  const handleAddTransaction = async (
    data: Parameters<typeof addTransaction.mutateAsync>[0],
  ) => {
    try {
      await addTransaction.mutateAsync(data);
      setIsDialogOpen(false);
      toast.success(t("transactions.toast.addSuccess"));
    } catch {
      toast.error(t("transactions.toast.addError"));
    }
  };

  const handleUpdateTransaction = async (
    data: Parameters<typeof addTransaction.mutateAsync>[0],
  ) => {
    if (!editingTransaction) return;
    try {
      await updateTransaction.mutateAsync({
        id: editingTransaction.id,
        description: data.description,
        amount: data.amount,
        type: data.type,
        category_id: data.category_id ?? null,
        date: data.date,
        is_recurring: data.is_recurring,
      });
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      toast.success(t("transactions.toast.updateSuccess"));
    } catch {
      toast.error(t("transactions.toast.updateError"));
    }
  };

  const handleDeleteTransaction = useCallback((id: string) => {
    deleteTransaction.mutate(id, {
      onSuccess: () => toast.success(t("transactions.toast.deleteSuccess")),
      onError: () => toast.error(t("transactions.toast.deleteError")),
    });
  }, [deleteTransaction, t]);

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {t("transactions.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("transactions.subtitle")}
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("transactions.new")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("transactions.form.title")}</DialogTitle>
              </DialogHeader>
              <TransactionForm
                categories={categories}
                onSubmit={handleAddTransaction}
                isLoading={addTransaction.isPending}
              />
            </DialogContent>
          </Dialog>

          <Dialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) setEditingTransaction(null);
            }}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("transactions.form.editTitle")}</DialogTitle>
              </DialogHeader>
              {editingTransaction && (
                <TransactionForm
                  categories={categories}
                  onSubmit={handleUpdateTransaction}
                  isLoading={updateTransaction.isPending}
                  submitLabel={t("transactions.form.update")}
                  initialValues={{
                    description: editingTransaction.description,
                    amount: Number(editingTransaction.amount),
                    type: editingTransaction.type,
                    category_id: editingTransaction.category_id,
                    date: editingTransaction.date,
                    is_recurring: editingTransaction.is_recurring,
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t("transactions.filters")}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={filterType}
                  onValueChange={(v) =>
                    setFilterType(v as "all" | TransactionType)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={t("transactions.filter.typePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("transactions.typeAll")}</SelectItem>
                    <SelectItem value="income">{t("transactions.type.income")}</SelectItem>
                    <SelectItem value="expense">{t("transactions.type.expense")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={t("transactions.filter.categoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("transactions.categoryAll")}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {labelForCategory(cat)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-3">
              <Input
                placeholder={t("transactions.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="lg:max-w-sm"
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    {t("transactions.dateFrom")}
                  </span>
                  <DateInput
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    placeholder={t("common.datePlaceholder")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    {t("transactions.dateTo")}
                  </span>
                  <DateInput
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                    placeholder={t("common.datePlaceholder")}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <TransactionList
                transactions={filteredTransactions}
                onDelete={handleDeleteTransaction}
                onEdit={handleEditTransaction}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
