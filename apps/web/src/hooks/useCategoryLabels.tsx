/**
 * This file implements UseCategoryLabels behavior for the frontend hooks layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { useMemo } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { getCategoryLabel } from "@/lib/category-labels";
import { Category, TransactionType } from "@/types/finance";

export function useCategoryLabels() {
  const { locale } = usePreferences();

  const labelFor = useMemo(
    () => (name: string, type?: TransactionType) =>
      getCategoryLabel(name, type, locale),
    [locale],
  );

  const labelForCategory = useMemo(
    () => (category?: Category | null) =>
      category ? getCategoryLabel(category.name, category.type, locale) : "",
    [locale],
  );

  return { labelFor, labelForCategory, locale };
}
