import { format, isValid, parse, parseISO } from "date-fns";

const BR_DATE_FORMAT = "dd/MM/yyyy";
const BR_DATE_FORMAT_FLEX = "d/M/yyyy";

export function parseDateInput(value: string) {
  if (!value) return new Date("");
  const trimmed = value.trim();
  const isoParsed = parseISO(trimmed);
  if (isValid(isoParsed)) return isoParsed;
  const brParsed = parse(trimmed, BR_DATE_FORMAT, new Date());
  if (isValid(brParsed)) return brParsed;
  const brParsedFlex = parse(trimmed, BR_DATE_FORMAT_FLEX, new Date());
  if (isValid(brParsedFlex)) return brParsedFlex;
  return new Date(trimmed);
}

export const maskDateInput = (value: string) => {
  const sanitized = value.replace(/[^\d/]/g, "");
  if (sanitized.includes("/")) {
    const [rawDay = "", rawMonth = "", rawYear = ""] = sanitized.split("/");
    const day = rawDay.replace(/\D/g, "").slice(0, 2);
    const month = rawMonth.replace(/\D/g, "").slice(0, 2);
    const year = rawYear.replace(/\D/g, "").slice(0, 4);
    let result = day;
    if (month) result += `/${month}`;
    if (year) result += `/${year}`;
    return result;
  }
  const digits = sanitized.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  if (!month) return day;
  if (!year) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
};

export const isValidDateInput = (value: string) =>
  Boolean(value) && isValid(parseDateInput(value));

export const formatDateInput = (value: Date | string) => {
  const date = typeof value === "string" ? parseDateInput(value) : value;
  return isValid(date) ? format(date, BR_DATE_FORMAT) : "";
};

export const toIsoDate = (value: string) => {
  if (!value) return "";
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return value;
  const parsed = parse(value, BR_DATE_FORMAT, new Date());
  if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");
  const parsedFlex = parse(value, BR_DATE_FORMAT_FLEX, new Date());
  return isValid(parsedFlex) ? format(parsedFlex, "yyyy-MM-dd") : value;
};
