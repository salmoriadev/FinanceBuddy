import { Locale } from "@/lib/i18n";
import { TransactionType } from "@/types/finance";

type DefaultCategory = {
  type: TransactionType;
  en: string;
  pt: string;
};

const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { type: "expense", en: "Food", pt: "Alimentação" },
  { type: "expense", en: "Transport", pt: "Transporte" },
  { type: "expense", en: "Housing", pt: "Moradia" },
  { type: "expense", en: "Entertainment", pt: "Lazer" },
  { type: "expense", en: "Health", pt: "Saúde" },
  { type: "expense", en: "Education", pt: "Educação" },
  { type: "income", en: "Salary", pt: "Salário" },
  { type: "income", en: "Freelance", pt: "Freelance" },
  { type: "income", en: "Investments", pt: "Investimentos" },
];

export const normalizeCategoryKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .trim();

const CATEGORY_LOOKUP = new Map<string, DefaultCategory>();
const CATEGORY_LOOKUP_ANY = new Map<string, DefaultCategory>();

DEFAULT_CATEGORIES.forEach((category) => {
  const normalizedEn = normalizeCategoryKey(category.en);
  const normalizedPt = normalizeCategoryKey(category.pt);
  CATEGORY_LOOKUP.set(`${category.type}:${normalizedEn}`, category);
  CATEGORY_LOOKUP.set(`${category.type}:${normalizedPt}`, category);
  CATEGORY_LOOKUP_ANY.set(normalizedEn, category);
  CATEGORY_LOOKUP_ANY.set(normalizedPt, category);
});

export const getCategoryLabel = (
  name: string,
  type: TransactionType | undefined,
  locale: Locale,
) => {
  if (!name) return name;
  const normalized = normalizeCategoryKey(name);
  const entry = type
    ? CATEGORY_LOOKUP.get(`${type}:${normalized}`) ??
      CATEGORY_LOOKUP_ANY.get(normalized)
    : CATEGORY_LOOKUP_ANY.get(normalized);

  if (!entry) return name;
  return locale === "pt-BR" ? entry.pt : entry.en;
};
