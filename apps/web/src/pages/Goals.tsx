import { useMemo, useState } from "react";
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
import { useFormatter } from "@/hooks/useFormatter";
import { useI18n } from "@/hooks/useI18n";

const buildGoalSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("goals.validation.nameRequired")),
    target_amount: z
      .string()
      .min(1, t("goals.validation.amountRequired"))
      .refine(
        (value) => parseCurrency(value) > 0,
        t("goals.validation.amountPositive"),
      ),
    current_amount: z
      .string()
      .optional()
      .refine(
        (value) => !value || parseCurrency(value) >= 0,
        t("goals.validation.amountInvalid"),
      ),
    target_date: z
      .string()
      .optional()
      .refine(
        (value) => !value || isValidDateInput(value),
        t("goals.validation.dateInvalid"),
      ),
    color: z.string().optional(),
  });

type GoalFormData = z.infer<ReturnType<typeof buildGoalSchema>>;

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
  const { formatCurrency, formatPercent, formatDate } = useFormatter();
  const { t } = useI18n();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  const schema = useMemo(() => buildGoalSchema(t), [t]);
  const form = useForm<GoalFormData>({
    resolver: zodResolver(schema),
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
      toast.success(t("goals.toast.addSuccess"));
    } catch {
      toast.error(t("goals.toast.addError"));
    }
  };

  const handleDeposit = async (goalId: string, currentAmount: number) => {
    const amount = parseCurrency(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t("goals.toast.invalidAmount"));
      return;
    }

    try {
      await updateGoal.mutateAsync({
        id: goalId,
        current_amount: currentAmount + amount,
      });
      setEditingGoal(null);
      setDepositAmount("");
      toast.success(t("goals.toast.depositSuccess"));
    } catch {
      toast.error(t("goals.toast.depositError"));
    }
  };

  const handleDelete = (id: string) => {
    deleteGoal.mutate(id, {
      onSuccess: () => toast.success(t("goals.toast.deleteSuccess")),
      onError: () => toast.error(t("goals.toast.deleteError")),
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
  const overallProgress =
    totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {t("goals.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("goals.subtitle")}
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("goals.new")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("goals.form.title")}</DialogTitle>
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
                        <FormLabel>{t("goals.form.nameLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("goals.form.namePlaceholder")}
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
                        <FormLabel>{t("goals.form.targetAmountLabel")}</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="current_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("goals.form.initialAmountLabel")}</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="target_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("goals.form.targetDateLabel")}</FormLabel>
                        <FormControl>
                          <DateInput
                            {...field}
                            placeholder={t("common.datePlaceholder")}
                          />
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
                        <FormLabel>{t("goals.form.colorLabel")}</FormLabel>
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
                    {t("goals.form.submit")}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{t("goals.total")}</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalTarget)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{t("goals.saved")}</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalSaved)}
              </p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("goals.progressSummary")}
              </span>
              <span className="font-medium">
                {formatPercent(overallProgress, 0)}
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(totalSaved)}</span>
              <span>
                {totalTarget > 0
                  ? `${t("goals.targetLabel")} ${formatCurrency(totalTarget)}`
                  : t("goals.defineGoal")}
              </span>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">{t("goals.none")}</p>
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
                        {t("goals.targetLabel")}: {formatCurrency(Number(goal.target_amount))}
                        {!isComplete &&
                          ` (${t("goals.remaining")} ${formatCurrency(remaining)})`}
                      </p>
                      {goal.target_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("goals.deadline")}: {formatDate(goal.target_date)}
                        </p>
                      )}
                    </div>

                    {editingGoal === goal.id ? (
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder={t("goals.depositPlaceholder")}
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
                            t("goals.depositAction")
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
                          ? t("goals.complete")
                          : t("goals.addDeposit")}
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
