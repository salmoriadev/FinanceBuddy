import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/types/finance";
import { cn } from "@/lib/utils";
import { parseDateInput } from "@/lib/date";
import { formatCurrency } from "@/lib/format";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export function TransactionList({
  transactions,
  onDelete,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhuma transação encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card/80 hover:bg-muted/40 transition-colors"
        >
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {transaction.category && (
                  <>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: transaction.category.color }}
                    />
                    <span>{transaction.category.name}</span>
                    <span>•</span>
                  </>
                )}
                <span>
                  {format(parseDateInput(transaction.date), "d 'de' MMM", {
                    locale: ptBR,
                  })}
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
      ))}
    </div>
  );
}
