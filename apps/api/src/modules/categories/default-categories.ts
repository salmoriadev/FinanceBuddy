/**
 * This file implements Default Categories behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
export const DEFAULT_CATEGORIES_EN = [
  {
    name: "Food",
    color: "#ef4444",
    icon: "utensils",
    type: "expense" as const,
  },
  {
    name: "Transport",
    color: "#3b82f6",
    icon: "car",
    type: "expense" as const,
  },
  {
    name: "Housing",
    color: "#8b5cf6",
    icon: "home",
    type: "expense" as const,
  },
  {
    name: "Entertainment",
    color: "#f59e0b",
    icon: "gamepad-2",
    type: "expense" as const,
  },
  {
    name: "Health",
    color: "#10b981",
    icon: "heart-pulse",
    type: "expense" as const,
  },
  {
    name: "Education",
    color: "#06b6d4",
    icon: "graduation-cap",
    type: "expense" as const,
  },
  {
    name: "Salary",
    color: "#22c55e",
    icon: "wallet",
    type: "income" as const,
  },
  {
    name: "Freelance",
    color: "#84cc16",
    icon: "laptop",
    type: "income" as const,
  },
  {
    name: "Investments",
    color: "#eab308",
    icon: "trending-up",
    type: "income" as const,
  },
];

export const DEFAULT_CATEGORIES_PT = [
  {
    name: "Alimentação",
    color: "#ef4444",
    icon: "utensils",
    type: "expense" as const,
  },
  {
    name: "Transporte",
    color: "#3b82f6",
    icon: "car",
    type: "expense" as const,
  },
  {
    name: "Moradia",
    color: "#8b5cf6",
    icon: "home",
    type: "expense" as const,
  },
  {
    name: "Lazer",
    color: "#f59e0b",
    icon: "gamepad-2",
    type: "expense" as const,
  },
  {
    name: "Saúde",
    color: "#10b981",
    icon: "heart-pulse",
    type: "expense" as const,
  },
  {
    name: "Educação",
    color: "#06b6d4",
    icon: "graduation-cap",
    type: "expense" as const,
  },
  {
    name: "Salário",
    color: "#22c55e",
    icon: "wallet",
    type: "income" as const,
  },
  {
    name: "Freelance",
    color: "#84cc16",
    icon: "laptop",
    type: "income" as const,
  },
  {
    name: "Investimentos",
    color: "#eab308",
    icon: "trending-up",
    type: "income" as const,
  },
];

export const getDefaultCategories = (locale?: string) =>
  locale === "pt-BR" ? DEFAULT_CATEGORIES_PT : DEFAULT_CATEGORIES_EN;
