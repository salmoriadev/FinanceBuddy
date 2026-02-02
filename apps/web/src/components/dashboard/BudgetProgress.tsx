import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Budget } from "@/types/finance";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface BudgetProgressProps {
  budgets: (Budget & { spent: number })[];
}

export function BudgetProgress({ budgets }: BudgetProgressProps) {
  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Orçamentos do Mês</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">
            Nenhum orçamento definido
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Orçamentos do Mês</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.slice(0, 5).map((budget) => {
          const percentage = Math.min(
            (budget.spent / budget.amount) * 100,
            100,
          );
          const isOverBudget = budget.spent > budget.amount;
          const isNearLimit = percentage >= 80 && !isOverBudget;
          const statusLabel = isOverBudget
            ? "Excedido"
            : isNearLimit
              ? "Perto do limite"
              : null;

          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: budget.category?.color || "#6366f1",
                    }}
                  />
                  {budget.category?.name || "Categoria"}
                </span>
                <span
                  className={cn(
                    "text-muted-foreground",
                    isOverBudget && "text-rose-600 font-medium",
                    isNearLimit && "text-amber-600",
                  )}
                >
                  {formatCurrency(budget.spent)} /{" "}
                  {formatCurrency(budget.amount)}
                </span>
              </div>
              <Progress
                value={percentage}
                className={cn(
                  "h-2",
                  isOverBudget && "[&>div]:bg-rose-500",
                  isNearLimit && "[&>div]:bg-amber-500",
                )}
              />
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
      </CardContent>
    </Card>
  );
}
