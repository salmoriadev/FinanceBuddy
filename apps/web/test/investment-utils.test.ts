import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  assetMatchesClassOption,
  classOptionForAsset,
  currencyForAssetClass,
  currentMonth,
  parseDecimal,
  today,
  toPersistedAssetClass,
} from "@/features/investments/utils";
import {
  ASSET_CLASS_OPTIONS,
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
  it("exposes ETF, crypto and all fixed-income choices", () => {
    expect(ASSET_CLASS_OPTIONS).toEqual(
      expect.arrayContaining([
        "etf",
        "crypto",
        "fixed_income",
        "fixed_income_brl",
        "fixed_income_usd",
      ]),
    );
    expect(assetClassOptionMeta.fixed_income.label).toBe("Renda fixa");
    expect(assetClassOptionMeta.fixed_income_brl.label).toBe("Renda fixa em real");
    expect(assetClassOptionMeta.fixed_income_usd.label).toBe("Renda fixa em dólar");
  });

  it("sets the currency implied by fixed-income classes", () => {
    expect(currencyForAssetClass("fixed_income_brl", "USD")).toBe("BRL");
    expect(currencyForAssetClass("fixed_income_usd", "BRL")).toBe("USD");
    expect(currencyForAssetClass("etf", "USD")).toBe("USD");
    expect(toPersistedAssetClass("fixed_income_brl")).toBe("fixed_income");
    expect(toPersistedAssetClass("fixed_income_usd")).toBe("fixed_income");
  });

  it("filters fixed income by its persisted currency", () => {
    const brlAsset = { class: "fixed_income" as const, currency: "BRL" };
    const usdAsset = { class: "fixed_income" as const, currency: "usd" };

    expect(assetMatchesClassOption(brlAsset, "fixed_income_brl")).toBe(true);
    expect(assetMatchesClassOption(brlAsset, "fixed_income_usd")).toBe(false);
    expect(assetMatchesClassOption(usdAsset, "fixed_income_usd")).toBe(true);
    expect(assetMatchesClassOption(usdAsset, "fixed_income")).toBe(true);
    expect(classOptionForAsset(brlAsset)).toBe("fixed_income_brl");
    expect(classOptionForAsset(usdAsset)).toBe("fixed_income_usd");
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
