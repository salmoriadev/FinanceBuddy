import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategorySpending } from "@/types/finance";
import { useFormatter } from "@/hooks/useFormatter";
import { useI18n } from "@/hooks/useI18n";

interface ExpenseChartProps {
  data: CategorySpending[];
}

const FALLBACK_COLORS = [
  "#22d3ee",
  "#38bdf8",
  "#34d399",
  "#f59e0b",
  "#f97316",
  "#f43f5e",
  "#a78bfa",
];

export function ExpenseChart({ data }: ExpenseChartProps) {
  const { formatCurrency } = useFormatter();
  const { t } = useI18n();

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("dashboard.spendingByCategory")}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {t("dashboard.noExpenses")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  }));
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const entry = payload[0].payload as CategorySpending & { color?: string };
    const percent = total > 0 ? (entry.value / total) * 100 : 0;

    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-lg">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-medium">{entry.name}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {formatCurrency(entry.value)} · {percent.toFixed(0)}%
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("dashboard.spendingByCategory")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <div className="w-full">
            <div className="mx-auto h-[240px] w-full max-w-[320px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={false}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip />}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="w-full">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              {chartData.map((item) => {
                const percent = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-muted-foreground"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="max-w-[140px] truncate">{item.name}</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
