import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SavingsGoal } from "@/types/finance";
import { Target } from "lucide-react";
import { useFormatter } from "@/hooks/useFormatter";
import { useI18n } from "@/hooks/useI18n";

interface GoalsProgressProps {
  goals: SavingsGoal[];
}

export function GoalsProgress({ goals }: GoalsProgressProps) {
  const { formatCurrency, formatPercent } = useFormatter();
  const { t } = useI18n();

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t("goals.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">{t("goals.none")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t("goals.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.slice(0, 3).map((goal) => {
          const percentage = Math.min(
            (goal.current_amount / goal.target_amount) * 100,
            100,
          );
          const remaining = goal.target_amount - goal.current_amount;

          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{goal.name}</span>
                <span className="text-muted-foreground">
                  {formatPercent(percentage, 0)}
                </span>
              </div>
              <Progress
                value={percentage}
                className="h-2"
                style={{
                  ["--progress-color" as string]: goal.color,
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(goal.current_amount)}</span>
                <span>
                  {t("goals.remaining")} {formatCurrency(remaining)}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
