import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyData } from "@/types/finance";
import { useFormatter } from "@/hooks/useFormatter";
import { useI18n } from "@/hooks/useI18n";

interface MonthlyChartProps {
  data: MonthlyData[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const { formatCurrency, formatCompactCurrency } = useFormatter();
  const { t } = useI18n();
  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
  } as const;

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("dashboard.monthlyEvolution")}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {t("dashboard.noData")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("dashboard.monthlyEvolution")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#19c37d" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#19c37d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef6f7c" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef6f7c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value) => formatCompactCurrency(Number(value))}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value)]}
                contentStyle={tooltipStyle}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                name={t("dashboard.income")}
                stroke="#19c37d"
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                name={t("dashboard.expenses")}
                stroke="#ef6f7c"
                fillOpacity={1}
                fill="url(#colorExpense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
