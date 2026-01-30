import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { getPasswordStrength } from "@/lib/password";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { checks, strength, label } = getPasswordStrength(password);
  const strengthColor =
    strength <= 1
      ? "bg-rose-500"
      : strength === 2
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Força da senha</span>
        <span className="font-medium text-foreground">{label}</span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 rounded-full transition-colors",
              index < strength ? strengthColor : "bg-muted/60",
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {[
          { met: checks.length, label: "8+ caracteres" },
          { met: checks.upper, label: "Maiúscula" },
          { met: checks.lower, label: "Minúscula" },
          { met: checks.number, label: "Número" },
          { met: checks.symbol, label: "Símbolo" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full border",
                item.met
                  ? "border-emerald-500/60 text-emerald-500"
                  : "border-muted-foreground/40 text-muted-foreground/60",
              )}
            >
              <Check className="h-3 w-3" />
            </span>
            <span className={cn(item.met ? "text-foreground" : undefined)}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
