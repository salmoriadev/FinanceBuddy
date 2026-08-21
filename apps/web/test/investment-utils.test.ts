import { describe, expect, it } from "vitest";
import { parseDecimal } from "@/features/investments/utils";

describe("investment decimal parsing", () => {
  it.each([
    ["38.42", 38.42],
    ["38,42", 38.42],
    ["1.234,56", 1234.56],
    ["1,234.56", 1234.56],
    ["0.12345678", 0.12345678],
  ])("parses %s without changing its magnitude", (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });

  it("keeps a canonical market quote intact through transaction calculation", () => {
    const marketPrice = 38.42;
    const quoteFieldValue = String(marketPrice);
    const quantityFieldValue = "2,5";
    const totalFieldValue = String(
      Number(
        (
          parseDecimal(quantityFieldValue) * parseDecimal(quoteFieldValue)
        ).toFixed(8),
      ),
    );

    expect(parseDecimal(quoteFieldValue)).toBe(marketPrice);
    expect(parseDecimal(totalFieldValue)).toBe(96.05);
  });

  it.each(["", "not-a-number", "1.2.3x", "NaN", "Infinity"])(
    "rejects malformed value %j",
    (input) => {
      expect(parseDecimal(input)).toBe(0);
    },
  );
});
