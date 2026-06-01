import { describe, expect, it } from "vitest";
import {
  calculateInvestmentSummary,
  calculatePortfolioSummary,
  inferInvestmentType,
} from "@/domain/investments/strategy";
import { Investment } from "@/types/finance";

describe("investment strategy", () => {
  it("infers fixed income strategy from name/category", () => {
    const type = inferInvestmentType("Tesouro Selic", "Renda fixa");
    expect(type).toBe("fixed");
  });

  it("infers crypto strategy from name", () => {
    const type = inferInvestmentType("BTC", "Cripto");
    expect(type).toBe("crypto");
  });

  it("calculates summary values", () => {
    const investment: Investment = {
      id: "inv-1",
      user_id: "user-1",
      name: "CDB",
      category: "Renda fixa",
      invested_amount: 1000,
      current_value: 1100,
      start_date: null,
      notes: null,
      created_at: "",
    };
    const summary = calculateInvestmentSummary(investment);
    expect(summary.profit).toBe(100);
    expect(summary.roi).toBeCloseTo(10, 2);
    expect(summary.type).toBe("fixed");
  });

  it("calculates portfolio summary", () => {
    const investments: Investment[] = [
      {
        id: "inv-1",
        user_id: "user-1",
        name: "CDB",
        category: "Renda fixa",
        invested_amount: 1000,
        current_value: 1100,
        start_date: null,
        notes: null,
        created_at: "",
      },
      {
        id: "inv-2",
        user_id: "user-1",
        name: "BTC",
        category: "Cripto",
        invested_amount: 500,
        current_value: 450,
        start_date: null,
        notes: null,
        created_at: "",
      },
    ];
    const summary = calculatePortfolioSummary(investments);
    expect(summary.invested).toBe(1500);
    expect(summary.current).toBe(1550);
    expect(summary.profit).toBe(50);
  });
});
