/**
 * This file implements Date behavior for the frontend utility layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { format, isValid, parse, parseISO } from "date-fns";

const BR_DATE_FORMAT = "dd/MM/yyyy";
const BR_DATE_FORMAT_FLEX = "d/M/yyyy";

export const normalizeDateInput = (value: string) => {
  if (!value) return value;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const masked = maskDateInput(trimmed);
  if (/^\d{1,2}\/\d{1,2}$/.test(masked)) {
    const year = new Date().getFullYear();
    return `${masked}/${year}`;
  }
  return masked;
};

export function parseDateInput(value: string) {
  if (!value) return new Date("");
  const raw = value.trim();
  if (!raw) return new Date("");

  if (/^\d{10,}$/.test(raw)) {
    const timestamp = Number(raw);
    const timestampDate = new Date(timestamp);
    if (isValid(timestampDate)) return timestampDate;
  }

  const rawIso = parseISO(raw);
  if (isValid(rawIso)) return rawIso;

  if (raw.includes(" ")) {
    const normalizedIso = raw.replace(" ", "T");
    const normalizedDate = parseISO(normalizedIso);
    if (isValid(normalizedDate)) return normalizedDate;
  }

  const trimmed = normalizeDateInput(raw);
  const isoParsed = parseISO(trimmed);
  if (isValid(isoParsed)) return isoParsed;

  const brParsed = parse(trimmed, BR_DATE_FORMAT, new Date());
  if (isValid(brParsed)) return brParsed;

  const brParsedFlex = parse(trimmed, BR_DATE_FORMAT_FLEX, new Date());
  if (isValid(brParsedFlex)) return brParsedFlex;

  const fallbackDate = new Date(raw);
  return isValid(fallbackDate) ? fallbackDate : new Date("");
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
  const raw = value.trim();
  const rawIso = parseISO(raw);
  if (isValid(rawIso)) return format(rawIso, "yyyy-MM-dd");
  const normalized = normalizeDateInput(raw);
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(normalized)) return normalized;
  const parsed = parse(normalized, BR_DATE_FORMAT, new Date());
  if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");
  const parsedFlex = parse(normalized, BR_DATE_FORMAT_FLEX, new Date());
  return isValid(parsedFlex) ? format(parsedFlex, "yyyy-MM-dd") : value;
};
