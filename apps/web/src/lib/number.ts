/**
 * This file implements Number behavior for the frontend utility layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
export const parseCurrency = (value: string) => {
  const trimmed = value.replace(/\s/g, "");
  if (!trimmed) return 0;
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
