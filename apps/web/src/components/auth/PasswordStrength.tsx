/**
 * This file implements PasswordStrength behavior for the frontend component layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { getPasswordStrength } from "@/lib/password";
import { useI18n } from "@/hooks/useI18n";

interface PasswordStrengthProps {
  password: string;
}

const REQUIREMENTS = [
  { key: "length", labelKey: "password.requirement.length" },
  { key: "lower", labelKey: "password.requirement.lower" },
  { key: "upper", labelKey: "password.requirement.upper" },
  { key: "number", labelKey: "password.requirement.number" },
  { key: "symbol", labelKey: "password.requirement.symbol" },
] as const;

const STRENGTH_COLORS = [
  "bg-[#ef6f7c]",
  "bg-[#c8865b]",
  "bg-[#d7b56d]",
  "bg-[#7fa982]",
  "bg-[#19c37d]",
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { t } = useI18n();
  const { checks, score, strength } = getPasswordStrength(password);
  const filledBars = Math.min(score, STRENGTH_COLORS.length);
  const strengthLabel =
    strength === 0
      ? t("password.veryWeak")
      : strength === 1
        ? t("password.weak")
        : strength === 2
          ? t("password.medium")
          : strength === 3
            ? t("password.good")
            : t("password.strong");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("password.strength")}</span>
        <span className="font-medium text-foreground">{strengthLabel}</span>
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
          <div key={item.labelKey} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full border",
                checks[item.key]
                  ? "border-[#19c37d]/60 text-[#19c37d]"
                  : "border-muted-foreground/40 text-muted-foreground/60",
              )}
            >
              <Check className="h-3 w-3" />
            </span>
            <span
              className={cn(checks[item.key] ? "text-foreground" : undefined)}
            >
              {t(item.labelKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
