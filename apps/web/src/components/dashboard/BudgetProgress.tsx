import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Budget } from "@/types/finance";
import { cn } from "@/lib/utils";
import { useFormatter } from "@/hooks/useFormatter";
import { useI18n } from "@/hooks/useI18n";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";

interface BudgetProgressProps {
  budgets: (Budget & { spent: number })[];
}

export function BudgetProgress({ budgets }: BudgetProgressProps) {
  const { formatCurrency } = useFormatter();
  const { t } = useI18n();
  const { labelForCategory } = useCategoryLabels();

  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("budgets.subtitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">
            {t("budgets.none")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("budgets.subtitle")}</CardTitle>
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
            ? t("budgets.exceeded")
            : isNearLimit
              ? t("budgets.nearLimit")
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
                  {budget.category
                    ? labelForCategory(budget.category)
                    : t("transactions.form.category")}
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
                style={{
                  ["--progress-color" as string]:
                    budget.category?.color || "#6366f1",
                }}
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
