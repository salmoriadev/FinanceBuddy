import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "danger";
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const { t } = useI18n();
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p
              className={cn(
                "text-2xl font-semibold mt-1 tracking-tight tabular-nums",
                variant === "success" &&
                  "text-emerald-600 dark:text-emerald-400",
                variant === "danger" && "text-rose-600 dark:text-rose-400",
              )}
            >
              {value}
            </p>
            {trend && (
              <p
                className={cn(
                  "text-xs mt-1",
                  trend.isPositive ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}% {t("common.vsLastMonth")}
              </p>
            )}
          </div>
          <div
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center",
              variant === "success" &&
                "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
              variant === "danger" &&
                "bg-rose-100 dark:bg-rose-900/30 text-rose-600",
              variant === "default" && "bg-primary/10 text-primary",
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
