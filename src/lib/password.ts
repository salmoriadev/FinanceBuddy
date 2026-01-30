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
  const strength = score === 0 ? 0 : score <= 2 ? 1 : score <= 4 ? 2 : 3;
  const label =
    strength === 0
      ? "Muito fraca"
      : strength === 1
        ? "Fraca"
        : strength === 2
          ? "Boa"
          : "Forte";
  return { checks, score, strength, label };
};
