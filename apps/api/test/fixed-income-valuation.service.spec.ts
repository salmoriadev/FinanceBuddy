import { Prisma } from "@prisma/client";
import { FixedIncomeValuationService } from "../src/modules/assets/fixed-income-valuation.service";

const rate = (value: string | number) => new Prisma.Decimal(value);

describe("FixedIncomeValuationService", () => {
  let service: FixedIncomeValuationService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new FixedIncomeValuationService();
    fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response) as unknown as jest.Mock;
  });

  afterEach(() => jest.restoreAllMocks());

  it("compounds a fixed annual rate over an ACT/365 year", async () => {
    const factor = await service.factorAt(
      {
        indexer: "fixed",
        rate: rate(15),
        baseDate: new Date("2026-01-01T00:00:00.000Z"),
      },
      new Date("2027-01-01T00:00:00.000Z"),
    );

    expect(factor.toDecimalPlaces(8).toString()).toBe("1.15");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("follows daily CDI observations and the configured CDI percentage", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { data: "02/01/2026", valor: "0.100000" },
        { data: "05/01/2026", valor: "0.100000" },
      ],
    } as Response);

    const factor = await service.factorAt(
      {
        indexer: "cdi",
        rate: rate(100),
        baseDate: new Date("2026-01-01T00:00:00.000Z"),
      },
      new Date("2026-01-05T00:00:00.000Z"),
    );

    expect(factor.toDecimalPlaces(8).toString()).toBe("1.002001");
    expect(fetchMock.mock.calls[0][0]).toContain("bcdata.sgs.12");
  });

  it("combines monthly IPCA with the configured annual spread", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { data: "01/01/2026", valor: "0.50" },
        { data: "01/02/2026", valor: "1.00" },
      ],
    } as Response);

    const factor = await service.factorAt(
      {
        indexer: "ipca",
        rate: rate(0),
        baseDate: new Date("2026-01-15T00:00:00.000Z"),
      },
      new Date("2026-02-15T00:00:00.000Z"),
    );

    expect(factor.toDecimalPlaces(8).toString()).toBe("1.01");
    expect(fetchMock.mock.calls[0][0]).toContain("bcdata.sgs.433");
  });
});
