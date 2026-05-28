import { calculatePosition } from "../src/modules/portfolios/portfolio-calculations";

describe("portfolio calculations", () => {
  it("calculates average price, partial sale and dividends from append-only events", () => {
    const result = calculatePosition([
      {
        id: "buy-1",
        type: "buy",
        quantity: "10",
        unitPrice: "10",
        totalAmount: "100",
        occurredAt: new Date("2026-01-01"),
      },
      {
        id: "buy-2",
        type: "buy",
        quantity: "10",
        unitPrice: "20",
        totalAmount: "200",
        occurredAt: new Date("2026-01-02"),
      },
      {
        id: "sell-1",
        type: "sell",
        quantity: "5",
        unitPrice: "30",
        totalAmount: "150",
        fees: "1",
        occurredAt: new Date("2026-01-03"),
      },
      {
        id: "dividend-1",
        type: "dividend",
        totalAmount: "12.50",
        occurredAt: new Date("2026-01-04"),
      },
    ]);

    expect(result.quantity.toString()).toBe("15");
    expect(result.costBasis.toString()).toBe("225");
    expect(result.averagePrice.toString()).toBe("15");
    expect(result.realizedGain.toString()).toBe("74");
    expect(result.dividends.toString()).toBe("12.5");
    expect(result.eventCount).toBe(4);
  });
});
