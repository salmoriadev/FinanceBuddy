/**
 * This file implements Skeleton behavior for the frontend component layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export { Skeleton };
