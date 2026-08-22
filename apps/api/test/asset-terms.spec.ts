import { BadRequestException } from "@nestjs/common";
import { normalizeAssetCreateData } from "../src/modules/assets/asset-terms";

const fixedIncome = (
  overrides: Partial<Parameters<typeof normalizeAssetCreateData>[0]> = {},
) =>
  normalizeAssetCreateData({
    ticker: "CDB-2028",
    name: "CDB 2028",
    class: "fixed_income",
    currency: "BRL",
    fixedIncomeIndexer: "fixed",
    fixedIncomeRate: "15",
    ...overrides,
  });

describe("fixed-income asset terms", () => {
  it("normalizes a fixed annual rate", () => {
    expect(fixedIncome()).toEqual(
      expect.objectContaining({
        ticker: "CDB-2028",
        currency: "BRL",
        fixedIncomeIndexer: "fixed",
        fixedIncomeRate: expect.objectContaining({}),
      }),
    );
    expect(fixedIncome().fixedIncomeRate?.toString()).toBe("15");
  });

  it("accepts IPCA plus a zero or positive annual spread", () => {
    expect(
      fixedIncome({ fixedIncomeIndexer: "ipca", fixedIncomeRate: "0" })
        .fixedIncomeRate
        ?.toString(),
    ).toBe("0");
  });

  it("requires an indexer and rate for new fixed-income assets", () => {
    expect(() =>
      fixedIncome({ fixedIncomeIndexer: undefined, fixedIncomeRate: undefined }),
    ).toThrow(BadRequestException);
  });

  it("rejects CDI or IPCA terms for dollar-denominated fixed income", () => {
    expect(() =>
      fixedIncome({
        currency: "USD",
        fixedIncomeIndexer: "cdi",
        fixedIncomeRate: "100",
      }),
    ).toThrow("Dollar fixed income currently supports fixed rates only");
  });

  it("does not allow fixed-income terms on market-traded assets", () => {
    expect(() =>
      normalizeAssetCreateData({
        ticker: "HGLG11",
        name: "HGLG11",
        class: "fii",
        currency: "BRL",
        fixedIncomeIndexer: "fixed",
        fixedIncomeRate: "15",
      }),
    ).toThrow("Fixed-income terms can only be used with a fixed-income asset");
  });
});
