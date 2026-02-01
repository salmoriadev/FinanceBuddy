import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Category, TransactionType } from "@/types/finance";
import { Loader2 } from "lucide-react";
import { parseCurrency } from "@/lib/number";
import { formatDateInput, isValidDateInput, toIsoDate } from "@/lib/date";

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const categoryKeywords: Record<string, string[]> = {
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
};

const getKeywordsForCategory = (name: string) => {
  const normalized = normalizeText(name);
  return [normalized, ...(categoryKeywords[normalized] ?? [])];
};

const transactionSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z
    .string()
    .min(1, "Valor obrigatório")
    .refine(
      (value) => parseCurrency(value) > 0,
      "Valor deve ser maior que zero",
    ),
  type: z.enum(["income", "expense"]),
  category_id: z.string().optional(),
  date: z
    .string()
    .min(1, "Data obrigatória")
    .refine(isValidDateInput, "Data inválida"),
  is_recurring: z.boolean(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  categories: Category[];
  onSubmit: (data: {
    description: string;
    amount: number;
    type: TransactionType;
    category_id: string | null;
    date: string;
    is_recurring: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function TransactionForm({
  categories,
  onSubmit,
  isLoading,
}: TransactionFormProps) {
  const [categoryTouched, setCategoryTouched] = useState(false);
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: "",
      amount: "",
      type: "expense",
      category_id: "",
      date: formatDateInput(new Date()),
      is_recurring: false,
    },
  });

  const selectedType = form.watch("type");
  const descriptionValue = form.watch("description");
  const categoryValue = form.watch("category_id");
  const filteredCategories = categories.filter(
    (cat) => cat.type === selectedType,
  );

  const normalizedDescription = useMemo(
    () => normalizeText(descriptionValue || ""),
    [descriptionValue],
  );

  const categoryKeywordsList = useMemo(
    () =>
      filteredCategories.map((cat) => ({
        id: cat.id,
        keywords: getKeywordsForCategory(cat.name),
      })),
    [filteredCategories],
  );

  useEffect(() => {
    if (
      categoryValue &&
      !filteredCategories.some((cat) => cat.id === categoryValue)
    ) {
      form.setValue("category_id", "");
      setCategoryTouched(false);
    }
  }, [categoryValue, filteredCategories, form]);

  useEffect(() => {
    if (categoryTouched) return;
    if (!normalizedDescription) return;
    const match = categoryKeywordsList.find(({ keywords }) =>
      keywords.some(
        (keyword) => keyword && normalizedDescription.includes(keyword),
      ),
    );
    if (match && match.id !== categoryValue) {
      form.setValue("category_id", match.id);
    }
  }, [
    categoryTouched,
    normalizedDescription,
    categoryKeywordsList,
    categoryValue,
    form,
  ]);

  const handleSubmit = async (data: TransactionFormData) => {
    await onSubmit({
      description: data.description,
      amount: parseCurrency(data.amount),
      type: data.type,
      category_id: data.category_id || null,
      date: toIsoDate(data.date),
      is_recurring: data.is_recurring,
    });
    form.reset();
    setCategoryTouched(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select
                  onValueChange={(value) => {
                    setCategoryTouched(true);
                    field.onChange(value);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Supermercado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <DateInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_recurring"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <FormLabel className="text-base">
                  Transação Recorrente
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Marque se esta transação se repete mensalmente
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Adicionar Transação
        </Button>
      </form>
    </Form>
  );
}
