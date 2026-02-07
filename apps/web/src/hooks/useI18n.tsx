/**
 * This file implements UseI18n behavior for the frontend hooks layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { useEffect, useMemo } from "react";
import { translate } from "@/lib/i18n";
import { usePreferences } from "@/hooks/usePreferences";

export function useI18n() {
  const { locale } = usePreferences();

  const t = useMemo(
    () => (key: string) => translate(locale, key),
    [locale],
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return { t, locale };
}
