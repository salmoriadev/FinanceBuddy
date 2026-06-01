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
                "mt-2 font-serif text-3xl font-normal tracking-normal tabular-nums",
                variant === "success" && "text-[#19c37d]",
                variant === "danger" && "text-[#ef6f7c]",
              )}
            >
              {value}
            </p>
            {trend && (
              <p
                className={cn(
                  "text-xs mt-1",
                  trend.isPositive ? "text-[#19c37d]" : "text-[#ef6f7c]",
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}% {t("common.vsLastMonth")}
              </p>
            )}
          </div>
          <div
            className={cn(
              "h-12 w-12 rounded-md border flex items-center justify-center",
              variant === "success" &&
                "border-[#19c37d]/20 bg-[#19c37d]/10 text-[#19c37d]",
              variant === "danger" &&
                "border-[#ef6f7c]/20 bg-[#ef6f7c]/10 text-[#ef6f7c]",
              variant === "default" && "border-border bg-muted/45 text-foreground",
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
