import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useInvestments } from "@/hooks/useInvestments";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDateInput, isValidDateInput, toIsoDate } from "@/lib/date";
import { parseCurrency } from "@/lib/number";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Investment } from "@/types/finance";
import {
  calculateInvestmentSummary,
  calculatePortfolioSummary,
} from "@/domain/investments/strategy";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error) return fallback;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
};

const investmentSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  category: z.string().optional(),
  invested_amount: z
    .string()
    .min(1, "Valor obrigatório")
    .refine(
      (value) => parseCurrency(value) > 0,
      "Valor deve ser maior que zero",
    ),
  current_value: z
    .string()
    .min(1, "Valor obrigatório")
    .refine((value) => parseCurrency(value) >= 0, "Valor inválido"),
  start_date: z
    .string()
    .optional()
    .refine((value) => !value || isValidDateInput(value), "Data inválida"),
  notes: z.string().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

const emptyFormValues: InvestmentFormData = {
  name: "",
  category: "",
  invested_amount: "",
  current_value: "",
  start_date: "",
  notes: "",
};

export default function Investments() {
  const { user, loading } = useAuth();
  const {
    investments,
    isLoading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
  } = useInvestments();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(
    null,
  );

  const addForm = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: emptyFormValues,
  });

  const editForm = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: emptyFormValues,
  });

  useEffect(() => {
    if (!editingInvestment) return;
    editForm.reset({
      name: editingInvestment.name,
      category: editingInvestment.category ?? "",
      invested_amount: editingInvestment.invested_amount.toString(),
      current_value: editingInvestment.current_value.toString(),
      start_date: editingInvestment.start_date
        ? formatDateInput(editingInvestment.start_date)
        : "",
      notes: editingInvestment.notes ?? "",
    });
  }, [editingInvestment, editForm]);

  const totals = useMemo(
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

  const handleAddInvestment = async (data: InvestmentFormData) => {
    try {
      await addInvestment.mutateAsync({
        name: data.name,
        category: data.category || null,
        invested_amount: parseCurrency(data.invested_amount),
        current_value: parseCurrency(data.current_value),
        start_date: data.start_date ? toIsoDate(data.start_date) : null,
        notes: data.notes || null,
      });
      setIsDialogOpen(false);
      addForm.reset();
      toast.success("Investimento adicionado!");
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao adicionar investimento"));
    }
  };

  const handleUpdateInvestment = async (data: InvestmentFormData) => {
    if (!editingInvestment) return;
    try {
      await updateInvestment.mutateAsync({
        id: editingInvestment.id,
        name: data.name,
        category: data.category || null,
        invested_amount: parseCurrency(data.invested_amount),
        current_value: parseCurrency(data.current_value),
        start_date: data.start_date ? toIsoDate(data.start_date) : null,
        notes: data.notes || null,
      });
      setEditingInvestment(null);
      toast.success("Investimento atualizado!");
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao atualizar investimento"));
    }
  };

  const handleDelete = (id: string) => {
    deleteInvestment.mutate(id, {
      onSuccess: () => toast.success("Investimento excluído"),
      onError: () => toast.error("Erro ao excluir"),
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Investimentos
            </h1>
            <p className="text-muted-foreground">
              Acompanhe aportes e rendimentos
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Investimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Investimento</DialogTitle>
              </DialogHeader>
              <Form {...addForm}>
                <form
                  onSubmit={addForm.handleSubmit(handleAddInvestment)}
                  className="space-y-4"
                >
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Ativo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Tesouro Selic" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Renda fixa" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="invested_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Investido (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="0,00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
                      name="current_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Atual (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="0,00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={addForm.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Primeiro Aporte</FormLabel>
                        <FormControl>
                          <DateInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: aporte mensal"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={addInvestment.isPending}
                  >
                    {addInvestment.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar Investimento
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Investido</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totals.invested)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Valor Atual</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totals.current)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Rendimento</p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  totals.profit >= 0 ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {totals.profit >= 0 ? "+" : ""}
                {formatCurrency(totals.profit)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPercent(totals.roi, 1)} acumulado
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Carteira</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : investments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhum investimento cadastrado
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {investments.map((investment) => {
                  const summary = calculateInvestmentSummary(investment);

                  return (
                    <div
                      key={investment.id}
                      className="border border-border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {investment.name}
                          </h3>
                          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                            {investment.category && (
                              <span className="px-2 py-0.5 rounded-full bg-muted">
                                {investment.category}
                              </span>
                            )}
                            {investment.start_date && (
                              <span>
                                Desde {formatDateInput(investment.start_date)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingInvestment(investment)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(investment.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Investido</p>
                          <p className="font-semibold">
                            {formatCurrency(Number(investment.invested_amount))}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Valor Atual</p>
                          <p className="font-semibold">
                            {formatCurrency(Number(investment.current_value))}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rendimento</p>
                          <p
                            className={cn(
                              "font-semibold",
                              summary.profit >= 0
                                ? "text-emerald-600"
                                : "text-rose-600",
                            )}
                          >
                            {summary.profit >= 0 ? "+" : ""}
                            {formatCurrency(summary.profit)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPercent(summary.roi, 1)}
                          </p>
                        </div>
                      </div>
                      {investment.notes && (
                        <p className="text-sm text-muted-foreground">
                          {investment.notes}
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

      <Dialog
        open={!!editingInvestment}
        onOpenChange={(open) => !open && setEditingInvestment(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Investimento</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleUpdateInvestment)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Ativo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Tesouro Selic" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Renda fixa" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="invested_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Investido (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="current_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Atual (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Primeiro Aporte</FormLabel>
                    <FormControl>
                      <DateInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: aporte mensal" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={updateInvestment.isPending}
              >
                {updateInvestment.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Alterações
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
