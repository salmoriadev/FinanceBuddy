import { Prisma } from "@prisma/client";

export type QuoteProviderResult = {
  price: Prisma.Decimal;
  currency: string;
  source: string;
  sourceType: "manual" | "mock";
  status: "manual" | "estimated";
  quotedAt: Date;
};

export class ManualQuoteProvider {
  quote(input: {
    price: string;
    currency: string;
    source?: string | null;
    quotedAt?: string | null;
  }): QuoteProviderResult {
    return {
      price: new Prisma.Decimal(input.price),
      currency: input.currency,
      source: input.source?.trim() || "manual",
      sourceType: "manual",
      status: "manual",
      quotedAt: input.quotedAt ? new Date(input.quotedAt) : new Date(),
    };
  }
}

export class MockQuoteProvider {
  quote(ticker: string, currency = "BRL"): QuoteProviderResult {
    const seed = ticker
      .split("")
      .reduce((total, char) => total + char.charCodeAt(0), 0);
    const price = (seed % 200) + 10 + (seed % 17) / 100;

    return {
      price: new Prisma.Decimal(price.toFixed(2)),
      currency,
      source: "mock",
      sourceType: "mock",
      status: "estimated",
      quotedAt: new Date(),
    };
  }
}
