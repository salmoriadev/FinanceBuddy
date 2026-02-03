import { Category } from "@/types/finance";

export interface CategoryMatcher {
  match: (description: string, categories: Category[]) => Category | null;
}

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  alimentacao: [
    "mercado",
    "supermercado",
    "restaurante",
    "ifood",
    "lanche",
    "padaria",
    "delivery",
    "refeicao",
  ],
  transporte: [
    "uber",
    "99",
    "taxi",
    "onibus",
    "metro",
    "gasolina",
    "combustivel",
    "posto",
    "estacionamento",
    "pedagio",
  ],
  moradia: [
    "aluguel",
    "condominio",
    "energia",
    "luz",
    "agua",
    "internet",
    "gas",
  ],
  lazer: [
    "cinema",
    "netflix",
    "spotify",
    "bar",
    "show",
    "viagem",
    "hotel",
    "jogo",
  ],
  saude: ["farmacia", "medico", "hospital", "clinica", "plano", "consulta"],
  educacao: [
    "curso",
    "faculdade",
    "livro",
    "escola",
    "mensalidade",
    "treinamento",
  ],
  salario: ["salario", "pagamento", "holerite"],
  freelance: ["freela", "freelance", "projeto", "job"],
  investimentos: [
    "investimento",
    "dividendo",
    "juros",
    "rendimento",
    "tesouro",
    "cdb",
  ],
  food: [
    "grocery",
    "supermarket",
    "restaurant",
    "delivery",
    "meal",
    "snack",
    "ifood",
    "ubereats",
    "doordash",
  ],
  transport: [
    "uber",
    "lyft",
    "taxi",
    "bus",
    "metro",
    "gas",
    "fuel",
    "parking",
    "toll",
  ],
  housing: [
    "rent",
    "mortgage",
    "condo",
    "electricity",
    "power",
    "water",
    "internet",
    "gas",
    "utilities",
  ],
  entertainment: [
    "netflix",
    "spotify",
    "movie",
    "cinema",
    "bar",
    "concert",
    "travel",
    "hotel",
    "game",
  ],
  health: [
    "pharmacy",
    "doctor",
    "hospital",
    "clinic",
    "insurance",
    "medical",
    "appointment",
  ],
  education: [
    "course",
    "college",
    "school",
    "tuition",
    "book",
    "training",
  ],
  salary: ["salary", "payroll", "paycheck", "wage", "payment"],
  freelance: ["freelance", "contract", "project", "client", "gig", "job"],
  investments: [
    "investment",
    "dividend",
    "interest",
    "yield",
    "bond",
    "treasury",
    "cdb",
    "etf",
  ],
};

const getKeywordsForCategory = (name: string) => {
  const normalized = normalizeText(name);
  return [normalized, ...(CATEGORY_KEYWORDS[normalized] ?? [])];
};

export class KeywordCategoryMatcher implements CategoryMatcher {
  match(description: string, categories: Category[]) {
    const normalizedDescription = normalizeText(description);
    if (!normalizedDescription) return null;

    const candidates = categories.map((category) => ({
      category,
      keywords: getKeywordsForCategory(category.name),
    }));

    const matched = candidates.find(({ keywords }) =>
      keywords.some(
        (keyword) => keyword && normalizedDescription.includes(keyword),
      ),
    );

    return matched?.category ?? null;
  }
}

export const defaultCategoryMatcher = new KeywordCategoryMatcher();

export const suggestCategory = (
  description: string,
  categories: Category[],
  matcher: CategoryMatcher = defaultCategoryMatcher,
) => matcher.match(description, categories);
