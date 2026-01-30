import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { getPasswordStrength } from "@/lib/password";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { checks, strength, label } = getPasswordStrength(password);
  const requirements = [
    { key: "length", label: "8+ caracteres", color: "bg-rose-500" },
    { key: "upper", label: "Maiúscula", color: "bg-orange-500" },
    { key: "lower", label: "Minúscula", color: "bg-amber-500" },
    { key: "number", label: "Número", color: "bg-lime-500" },
    { key: "symbol", label: "Símbolo", color: "bg-emerald-500" },
  ] as const;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Força da senha</span>
        <span className="font-medium text-foreground">{label}</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {requirements.map((item) => (
          <div
            key={item.key}
            className={cn(
              "h-1.5 rounded-full transition-colors",
              checks[item.key] ? item.color : "bg-muted/60",
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {requirements.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full border",
                checks[item.key]
                  ? "border-emerald-500/60 text-emerald-500"
                  : "border-muted-foreground/40 text-muted-foreground/60",
              )}
            >
              <Check className="h-3 w-3" />
            </span>
            <span
              className={cn(checks[item.key] ? "text-foreground" : undefined)}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
