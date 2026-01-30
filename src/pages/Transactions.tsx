import { useState } from "react";
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
import { TransactionType } from "@/types/finance";
import { parseDateInput } from "@/lib/date";

export default function Transactions() {
  const { user, loading } = useAuth();
  const { transactions, isLoading, addTransaction, deleteTransaction } =
    useTransactions();
  const { categories } = useCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

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

  const fromTime = filterFrom ? parseDateInput(filterFrom).getTime() : null;
  const toTime = filterTo ? parseDateInput(filterTo).getTime() : null;
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterCategory !== "all" && t.category_id !== filterCategory)
      return false;
    if (normalizedSearch) {
      const descriptionMatch = t.description
        .toLowerCase()
        .includes(normalizedSearch);
      const categoryMatch = t.category?.name
        ?.toLowerCase()
        .includes(normalizedSearch);
      if (!descriptionMatch && !categoryMatch) return false;
    }
    if (fromTime !== null || toTime !== null) {
      const transactionTime = parseDateInput(t.date).getTime();
      if (fromTime !== null && transactionTime < fromTime) return false;
      if (toTime !== null && transactionTime > toTime) return false;
    }
    return true;
  });

  const handleAddTransaction = async (
    data: Parameters<typeof addTransaction.mutateAsync>[0],
  ) => {
    try {
      await addTransaction.mutateAsync(data);
      setIsDialogOpen(false);
      toast.success("Transação adicionada com sucesso!");
    } catch {
      toast.error("Erro ao adicionar transação");
    }
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction.mutate(id, {
      onSuccess: () => toast.success("Transação excluída"),
      onError: () => toast.error("Erro ao excluir transação"),
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold font-serif tracking-tight text-foreground">
              Transações
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas receitas e despesas
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <TransactionForm
                categories={categories}
                onSubmit={handleAddTransaction}
                isLoading={addTransaction.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={filterType}
                  onValueChange={(v) =>
                    setFilterType(v as "all" | TransactionType)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-2">
              <Input
                placeholder="Buscar por descrição ou categoria"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="lg:max-w-sm"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <DateInput
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                />
                <DateInput
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                />
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
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
