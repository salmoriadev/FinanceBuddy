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
import { isValidDateInput, toIsoDate } from "@/lib/date";
import { suggestCategory } from "@/domain/categories/matching";
import { useI18n } from "@/hooks/useI18n";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { normalizeCategoryKey } from "@/lib/category-labels";
import { format } from "date-fns";

const buildTransactionSchema = (t: (key: string) => string) =>
  z.object({
    description: z
      .string()
      .min(1, t("transactions.validation.descriptionRequired")),
    amount: z
      .string()
      .min(1, t("transactions.validation.amountRequired"))
      .refine(
        (value) => parseCurrency(value) > 0,
        t("transactions.validation.amountPositive"),
      ),
    type: z.enum(["income", "expense"]),
    category_id: z.string().optional(),
    date: z
      .string()
      .min(1, t("transactions.validation.dateRequired"))
      .refine(isValidDateInput, t("transactions.validation.dateInvalid")),
    is_recurring: z.boolean(),
  });

type TransactionFormData = z.infer<ReturnType<typeof buildTransactionSchema>>;

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
  const { t } = useI18n();
  const { labelForCategory } = useCategoryLabels();
  const schema = useMemo(() => buildTransactionSchema(t), [t]);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: "",
      amount: "",
      type: "expense",
      category_id: "",
      date: format(new Date(), "yyyy-MM-dd"),
      is_recurring: false,
    },
  });

  const selectedType = form.watch("type");
  const descriptionValue = form.watch("description");
  const categoryValue = form.watch("category_id");
  const filteredCategories = useMemo(() => {
    const unique = new Map<string, Category>();
    categories
      .filter((cat) => cat.type === selectedType)
      .forEach((cat) => {
        const key = `${cat.type}:${normalizeCategoryKey(cat.name)}`;
        if (!unique.has(key)) {
          unique.set(key, cat);
        }
      });
    return Array.from(unique.values());
  }, [categories, selectedType]);

  const suggestedCategory = useMemo(
    () =>
      descriptionValue
        ? suggestCategory(descriptionValue, filteredCategories)
        : null,
    [descriptionValue, filteredCategories],
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
    if (!suggestedCategory) return;
    if (suggestedCategory.id !== categoryValue) {
      form.setValue("category_id", suggestedCategory.id);
    }
  }, [categoryTouched, suggestedCategory, categoryValue, form]);

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
                <FormLabel>{t("transactions.form.type")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="expense">
                      {t("transactions.type.expense")}
                    </SelectItem>
                    <SelectItem value="income">
                      {t("transactions.type.income")}
                    </SelectItem>
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
                <FormLabel>{t("transactions.form.category")}</FormLabel>
                <Select
                  onValueChange={(value) => {
                    setCategoryTouched(true);
                    field.onChange(value);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("common.select")} />
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
                          {labelForCategory(cat)}
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
              <FormLabel>{t("transactions.form.description")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("transactions.form.descriptionPlaceholder")}
                  {...field}
                />
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
                <FormLabel>{t("transactions.form.amount")}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder={t("common.currencyPlaceholder")}
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
                <FormLabel>{t("transactions.form.date")}</FormLabel>
                <FormControl>
                  <DateInput
                    {...field}
                    placeholder={t("common.datePlaceholder")}
                  />
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
                  {t("transactions.form.recurring")}
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  {t("transactions.form.recurringHint")}
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
          {t("transactions.form.submit")}
        </Button>
      </form>
    </Form>
  );
}
