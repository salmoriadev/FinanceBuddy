import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { getPasswordStrength } from "@/lib/password";

interface PasswordStrengthProps {
  password: string;
}

const REQUIREMENTS = [
  { key: "length", label: "8+ caracteres" },
  { key: "lower", label: "Minúscula" },
  { key: "upper", label: "Maiúscula" },
  { key: "number", label: "Número" },
  { key: "symbol", label: "Símbolo" },
] as const;

const STRENGTH_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-400",
  "bg-lime-500",
  "bg-emerald-500",
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { checks, score, label } = getPasswordStrength(password);
  const filledBars = Math.min(score, STRENGTH_COLORS.length);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Força da senha</span>
        <span className="font-medium text-foreground">{label}</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {STRENGTH_COLORS.map((color, index) => (
          <div
            key={color}
            className={cn(
              "h-1.5 rounded-full transition-colors",
              index < filledBars ? color : "bg-muted/60",
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {REQUIREMENTS.map((item) => (
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
