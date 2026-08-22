import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Currency, DEFAULT_CURRENCY, DEFAULT_LOCALE, Locale } from "@/lib/i18n";

export const normalizeLocale = (_value?: string): Locale => "pt-BR";

const normalizeCurrency = (value?: string): Currency => {
  if (value === "USD") return "USD";
  return "BRL";
};

export function usePreferences() {
  const { user } = useAuth();

  const locale = useMemo(
    () => normalizeLocale(user?.locale ?? DEFAULT_LOCALE),
    [user?.locale],
  );

  const currency = useMemo(
    () => normalizeCurrency(user?.currency ?? DEFAULT_CURRENCY),
    [user?.currency],
  );

  return {
    locale,
    currency,
  };
}
