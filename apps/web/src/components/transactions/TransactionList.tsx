import { memo, useMemo } from "react";
import { Trash2, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/types/finance";
import { cn } from "@/lib/utils";
import { useFormatter } from "@/hooks/useFormatter";
import { useI18n } from "@/hooks/useI18n";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const TransactionRow = memo(function TransactionRow({
  transaction,
  onDelete,
}: {
  transaction: Transaction;
  onDelete: (id: string) => void;
}) {
  const { formatCurrency, formatShortDate } = useFormatter();
  const { t } = useI18n();
  const { labelForCategory } = useCategoryLabels();
  const formattedDate = useMemo(() => {
    const formatted = formatShortDate(transaction.date);
    return formatted || t("common.invalidDate");
  }, [transaction.date, formatShortDate, t]);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card/90 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            transaction.type === "income"
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
              : "bg-rose-100 dark:bg-rose-900/30 text-rose-600",
          )}
        >
          {transaction.type === "income" ? (
            <TrendingUp className="h-5 w-5" />
          ) : (
            <TrendingDown className="h-5 w-5" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">
              {transaction.description}
            </p>
            {transaction.is_recurring && (
              <RefreshCw className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            {transaction.category && (
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: transaction.category.color }}
                />
                <span className="leading-tight">
                  {labelForCategory(transaction.category)}
                </span>
              </div>
            )}
            {transaction.category && (
              <span className="hidden sm:inline">•</span>
            )}
            <span
              className={cn(
                "text-xs sm:text-sm",
                transaction.category ? "mt-1 sm:mt-0" : undefined,
              )}
            >
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <p
          className={cn(
            "font-semibold",
            transaction.type === "income"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400",
          )}
        >
          {transaction.type === "income" ? "+" : "-"}{" "}
          {formatCurrency(Number(transaction.amount))}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(transaction.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

export const TransactionList = memo(function TransactionList({
  transactions,
  onDelete,
}: TransactionListProps) {
  const { t } = useI18n();
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("transactions.none")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <TransactionRow
          key={transaction.id}
          transaction={transaction}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});
