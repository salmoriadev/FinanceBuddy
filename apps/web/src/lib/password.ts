/**
 * This file implements Password behavior for the frontend utility layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
export const passwordRules = {
  minLength: 8,
  upper: /[A-Z]/,
  lower: /[a-z]/,
  number: /[0-9]/,
  symbol: /[^A-Za-z0-9]/,
};

export const getPasswordChecks = (value: string) => ({
  length: value.length >= passwordRules.minLength,
  upper: passwordRules.upper.test(value),
  lower: passwordRules.lower.test(value),
  number: passwordRules.number.test(value),
  symbol: passwordRules.symbol.test(value),
});

export const getPasswordStrength = (value: string) => {
  const checks = getPasswordChecks(value);
  const score = Object.values(checks).filter(Boolean).length;
  const strength =
    score === 0 ? 0 : score <= 2 ? 1 : score === 3 ? 2 : score === 4 ? 3 : 4;
  return { checks, score, strength };
};
