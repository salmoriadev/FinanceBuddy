import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  currentMonth,
  parseDecimal,
  today,
} from "@/features/investments/utils";

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
