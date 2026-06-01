import { registerDecorator, ValidationOptions } from "class-validator";

export const MAX_MONEY_VALUE = 999_999_999_999.99;
export const MAX_QUANTITY_VALUE = 999_999_999.99999999;

const toDecimalNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }
  return Number.NaN;
};

const isFiniteDecimalInRange = (
  value: unknown,
  min: number,
  max: number,
  allowZero: boolean,
) => {
  const parsed = toDecimalNumber(value);
  if (!Number.isFinite(parsed)) return false;
  if (parsed > max) return false;
  return allowZero ? parsed >= min : parsed > min;
};

export const IsFinancialDecimal = (
  options: {
    max?: number;
    min?: number;
    allowZero?: boolean;
  } = {},
  validationOptions?: ValidationOptions,
) => {
  const min = options.min ?? 0;
  const max = options.max ?? MAX_MONEY_VALUE;
  const allowZero = options.allowZero ?? false;

  return (object: object, propertyName: string) => {
    registerDecorator({
      name: "isFinancialDecimal",
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid positive decimal within FinanceBuddy limits`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          return isFiniteDecimalInRange(value, min, max, allowZero);
        },
      },
    });
  };
};
