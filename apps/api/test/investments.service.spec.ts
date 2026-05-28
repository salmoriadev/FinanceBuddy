/**
 * Verifies investment service mapping behavior, especially safe partial updates
 * that must not overwrite optional fields when they are omitted by clients.
 */
import { NotFoundException } from "@nestjs/common";
import { InvestmentsService } from "../src/modules/investments/investments.service";
import { InvestmentsRepository } from "../src/modules/investments/investments.repository";
import { InvestmentMarketDataService } from "../src/modules/investments/investment-market-data.service";

describe("InvestmentsService", () => {
  const repository = {
    findAllByUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<InvestmentsRepository>;

  const marketData = {
    searchAssets: jest.fn(),
    getQuotes: jest.fn(),
  } as unknown as jest.Mocked<InvestmentMarketDataService>;

  const service = new InvestmentsService(repository, marketData);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps create payload with nullable fields", async () => {
    repository.create.mockResolvedValue({ id: "investment-1" } as never);

    await service.create("user-1", {
      name: "ETF",
      investedAmount: 1000,
      currentValue: 1200,
      category: undefined,
      startDate: undefined,
      notes: undefined,
    });

    expect(repository.create).toHaveBeenCalledWith("user-1", {
      name: "ETF",
      category: null,
      assetSymbol: null,
      quantity: null,
      averagePrice: null,
      investedAmount: 1000,
      currentValue: 1200,
      startDate: null,
      notes: null,
    });
  });

  it("keeps omitted optional fields untouched in partial update", async () => {
    repository.update.mockResolvedValue({ id: "investment-1" } as never);

    await service.update("user-1", "investment-1", {
      name: "Updated ETF",
      currentValue: 1300,
    });

    expect(repository.update).toHaveBeenCalledWith("user-1", "investment-1", {
      name: "Updated ETF",
      currentValue: 1300,
    });
  });

  it("allows explicitly clearing nullable fields in partial update", async () => {
    repository.update.mockResolvedValue({ id: "investment-1" } as never);

    await service.update("user-1", "investment-1", {
      category: null,
      startDate: null,
      notes: null,
    });

    expect(repository.update).toHaveBeenCalledWith("user-1", "investment-1", {
      category: null,
      startDate: null,
      notes: null,
    });
  });

  it("throws not found when update misses target resource", async () => {
    repository.update.mockResolvedValue(null as never);

    await expect(
      service.update("user-1", "missing", { name: "does-not-exist" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
