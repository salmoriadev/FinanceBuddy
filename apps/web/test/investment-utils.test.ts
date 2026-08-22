import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  assetMatchesClassOption,
  classOptionForAsset,
  currentMonth,
  parseDecimal,
  today,
  toPersistedAssetClass,
} from "@/features/investments/utils";
import {
  ASSET_CLASS_OPTIONS,
  FIXED_INCOME_CURRENCIES,
  assetClassOptionMeta,
} from "@/features/investments/constants";
import { toPlainDecimalString } from "@/lib/number";

describe("investment decimal parsing", () => {
  it.each([
    ["38.42", 38.42],
    ["38,42", 38.42],
    ["1.234,56", 1234.56],
    ["1,234.56", 1234.56],
    ["0.12345678", 0.12345678],
    ["1e-8", 1e-8],
    ["-2.5E+4", -2.5e4],
  ])("parses %s without changing its magnitude", (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });

  it.each([
    [38.42, "2,5", 96.05, "38.42"],
    [1e-8, "1", 1e-8, "0.00000001"],
  ])(
    "keeps canonical market quote %s intact through transaction submission",
    (marketPrice, quantityFieldValue, expectedTotal, serializedPrice) => {
      const quoteFieldValue = String(marketPrice);
      const totalFieldValue = String(
        Number(
          (
            parseDecimal(quantityFieldValue) * parseDecimal(quoteFieldValue)
          ).toFixed(8),
        ),
      );

      const submittedPayload = {
        quantity: parseDecimal(quantityFieldValue),
        unitPrice: parseDecimal(quoteFieldValue),
        totalAmount: parseDecimal(totalFieldValue),
      };

      expect(submittedPayload).toEqual({
        quantity: parseDecimal(quantityFieldValue),
        unitPrice: marketPrice,
        totalAmount: expectedTotal,
      });
      expect(toPlainDecimalString(submittedPayload.unitPrice)).toBe(
        serializedPrice,
      );
      expect(toPlainDecimalString(submittedPayload.totalAmount)).not.toMatch(
        /[eE]/,
      );
    },
  );

  it.each(["", "not-a-number", "1.2.3x", "1e", "1e999", "NaN", "Infinity"])(
    "rejects malformed value %j",
    (input) => {
      expect(parseDecimal(input)).toBe(0);
    },
  );
});

describe("investment asset classes", () => {
  it("exposes ETF, crypto and a single fixed-income choice", () => {
    expect(ASSET_CLASS_OPTIONS).toEqual(
      expect.arrayContaining(["etf", "crypto", "fixed_income"]),
    );
    expect(ASSET_CLASS_OPTIONS.filter((value) => value === "fixed_income")).toHaveLength(1);
    expect(assetClassOptionMeta.fixed_income.label).toBe("Renda fixa");
    expect(FIXED_INCOME_CURRENCIES).toEqual([
      { value: "BRL", label: "Real brasileiro (BRL)" },
      { value: "USD", label: "Dólar americano (USD)" },
      { value: "EUR", label: "Euro (EUR)" },
    ]);
  });

  it("persists fixed income as its canonical class", () => {
    expect(toPersistedAssetClass("fixed_income")).toBe("fixed_income");
  });

  it("keeps all fixed-income currencies under the same class", () => {
    const brlAsset = { class: "fixed_income" as const, currency: "BRL" };
    const usdAsset = { class: "fixed_income" as const, currency: "usd" };
    const eurAsset = { class: "fixed_income" as const, currency: "EUR" };

    expect(assetMatchesClassOption(brlAsset, "fixed_income")).toBe(true);
    expect(assetMatchesClassOption(usdAsset, "fixed_income")).toBe(true);
    expect(assetMatchesClassOption(eurAsset, "fixed_income")).toBe(true);
    expect(classOptionForAsset(brlAsset)).toBe("fixed_income");
    expect(classOptionForAsset(usdAsset)).toBe("fixed_income");
    expect(classOptionForAsset(eurAsset)).toBe("fixed_income");
  });
});

describe("investment local calendar defaults", () => {
  const originalTimezone = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = "America/Sao_Paulo";
  });

  afterAll(() => {
    if (originalTimezone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTimezone;
    }
  });

  it("keeps the final evening of a month in the Sao Paulo calendar day", () => {
    const finalEvening = new Date("2026-02-01T02:30:00.000Z");

    expect(today(finalEvening)).toBe("2026-01-31");
    expect(currentMonth(finalEvening)).toBe("2026-01");
  });

  it("pads local month and day values for date inputs", () => {
    const morning = new Date(2026, 3, 5, 9, 0, 0);

    expect(today(morning)).toBe("2026-04-05");
    expect(currentMonth(morning)).toBe("2026-04");
  });
});
