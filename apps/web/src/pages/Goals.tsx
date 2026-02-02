import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Loader2, Trash2, Edit2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useSavingsGoals } from "@/hooks/useSavingsGoals";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { formatDateInput, isValidDateInput, toIsoDate } from "@/lib/date";
import { parseCurrency } from "@/lib/number";
import { formatCurrency, formatPercent } from "@/lib/format";

const goalSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  target_amount: z
    .string()
    .min(1, "Valor obrigatório")
    .refine(
      (value) => parseCurrency(value) > 0,
      "Valor deve ser maior que zero",
    ),
  current_amount: z
    .string()
    .optional()
    .refine((value) => !value || parseCurrency(value) >= 0, "Valor inválido"),
  target_date: z
    .string()
    .optional()
    .refine((value) => !value || isValidDateInput(value), "Data inválida"),
  color: z.string().optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

const colors = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
];

export default function Goals() {
  const { user, loading } = useAuth();
  const { goals, isLoading, addGoal, updateGoal, deleteGoal } =
    useSavingsGoals();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      target_amount: "",
      current_amount: "0",
      target_date: "",
      color: colors[0],
    },
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

  const handleAddGoal = async (data: GoalFormData) => {
    try {
      await addGoal.mutateAsync({
        name: data.name,
        target_amount: parseCurrency(data.target_amount),
        current_amount: parseCurrency(data.current_amount || "0"),
        target_date: data.target_date ? toIsoDate(data.target_date) : undefined,
        color: data.color || colors[0],
      });
      setIsDialogOpen(false);
      form.reset();
      toast.success("Meta criada com sucesso!");
    } catch {
      toast.error("Erro ao criar meta");
    }
  };

  const handleDeposit = async (goalId: string, currentAmount: number) => {
    const amount = parseCurrency(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor inválido");
      return;
    }

    try {
      await updateGoal.mutateAsync({
        id: goalId,
        current_amount: currentAmount + amount,
      });
      setEditingGoal(null);
      setDepositAmount("");
      toast.success("Depósito realizado!");
    } catch {
      toast.error("Erro ao depositar");
    }
  };

  const handleDelete = (id: string) => {
    deleteGoal.mutate(id, {
      onSuccess: () => toast.success("Meta excluída"),
      onError: () => toast.error("Erro ao excluir"),
    });
  };

  const totalTarget = goals.reduce(
    (sum, g) => sum + Number(g.target_amount),
    0,
  );
  const totalSaved = goals.reduce(
    (sum, g) => sum + Number(g.current_amount),
    0,
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Metas de Economia
            </h1>
            <p className="text-muted-foreground">
              Acompanhe seus objetivos financeiros
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Meta</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleAddGoal)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Meta</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Viagem de férias"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="target_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Alvo (R$)</FormLabel>
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
                    control={form.control}
                    name="current_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Inicial (R$)</FormLabel>
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
                    control={form.control}
                    name="target_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Limite (opcional)</FormLabel>
                        <FormControl>
                          <DateInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <div className="flex gap-2">
                          {colors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => field.onChange(color)}
                              className={`w-8 h-8 rounded-full transition-transform ${
                                field.value === color
                                  ? "ring-2 ring-offset-2 ring-primary scale-110"
                                  : ""
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={addGoal.isPending}
                  >
                    {addGoal.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Criar Meta
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total das Metas</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalTarget)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Economizado</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalSaved)}
              </p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Nenhuma meta criada ainda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const percentage = Math.min(
                (Number(goal.current_amount) / Number(goal.target_amount)) *
                  100,
                100,
              );
              const remaining =
                Number(goal.target_amount) - Number(goal.current_amount);
              const isComplete = percentage >= 100;

              return (
                <Card key={goal.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: goal.color }}
                        />
                        {goal.name}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(goal.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          {formatCurrency(Number(goal.current_amount))}
                        </span>
                        <span className="font-medium">
                          {formatPercent(percentage, 0)}
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-3"
                        style={{
                          ["--progress-color" as string]: goal.color,
                        }}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Meta: {formatCurrency(Number(goal.target_amount))}
                        {!isComplete &&
                          ` (faltam ${formatCurrency(remaining)})`}
                      </p>
                      {goal.target_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Prazo: {formatDateInput(goal.target_date)}
                        </p>
                      )}
                    </div>

                    {editingGoal === goal.id ? (
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="Valor do depósito"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                        <Button
                          onClick={() =>
                            handleDeposit(goal.id, Number(goal.current_amount))
                          }
                          disabled={updateGoal.isPending}
                        >
                          {updateGoal.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Depositar"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setEditingGoal(goal.id)}
                        disabled={isComplete}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        {isComplete
                          ? "Meta Completa! 🎉"
                          : "Adicionar Depósito"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
