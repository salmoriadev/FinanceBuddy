import { useMemo } from "react";
import { isValid } from "date-fns";
import { usePreferences } from "@/hooks/usePreferences";
import { parseDateInput } from "@/lib/date";

const MONTHS_SHORT_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTHS_LONG_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const MONTHS_LONG_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function useFormatter() {
  const { locale, currency } = usePreferences();
  const intlLocale = locale === "pt-BR" ? "pt-BR" : "en-GB";

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }),
    [intlLocale, currency],
  );

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(intlLocale),
    [intlLocale],
  );

  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(intlLocale, {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [intlLocale],
  );

  const compactCurrencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 0,
      }),
    [intlLocale, currency],
  );

  const shortDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        day: "2-digit",
        month: "short",
      }),
    [intlLocale],
  );

  const fullDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    [intlLocale],
  );

  const monthsShort = locale === "pt-BR" ? MONTHS_SHORT_PT : MONTHS_SHORT_EN;
  const monthsLong = locale === "pt-BR" ? MONTHS_LONG_PT : MONTHS_LONG_EN;

  return {
    formatCurrency: (value: number) => currencyFormatter.format(value),
    formatNumber: (value: number) => numberFormatter.format(value),
    formatPercent: (value: number, digits = 0) => {
      if (digits === 0) {
        return percentFormatter.format(value / 100);
      }
      const customPercent = new Intl.NumberFormat(intlLocale, {
        style: "percent",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
      return customPercent.format(value / 100);
    },
    formatCompactCurrency: (value: number) => compactCurrencyFormatter.format(value),
    formatShortDate: (value: Date | string) => {
      const date = typeof value === "string" ? parseDateInput(value) : value;
      return isValid(date) ? shortDateFormatter.format(date) : "";
    },
    formatDate: (value: Date | string) => {
      const date = typeof value === "string" ? parseDateInput(value) : value;
      return isValid(date) ? fullDateFormatter.format(date) : "";
    },
    monthsShort,
    monthsLong,
    locale,
    currency,
  };
}
