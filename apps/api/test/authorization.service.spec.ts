import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { AssetsRepository } from "../src/modules/assets/assets.repository";
import { AssetsService } from "../src/modules/assets/assets.service";
import { InvestmentMarketDataService } from "../src/modules/investments/investment-market-data.service";
import { BudgetsRepository } from "../src/modules/budgets/budgets.repository";
import { BudgetsService } from "../src/modules/budgets/budgets.service";
import { GoalsRepository } from "../src/modules/goals/goals.repository";
import { GoalsService } from "../src/modules/goals/goals.service";
import { PortfoliosRepository } from "../src/modules/portfolios/portfolios.repository";
import { PortfoliosService } from "../src/modules/portfolios/portfolios.service";
import { TransactionsRepository } from "../src/modules/transactions/transactions.repository";
import { TransactionsService } from "../src/modules/transactions/transactions.service";
import { RecurringTransactionsService } from "../src/modules/transactions/recurring.service";

describe("financial resource authorization", () => {
  describe("transactions", () => {
    const repository = {
      findCategoryForUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<TransactionsRepository>;
    const recurring = {
      ensureRecurringTransactions: jest.fn(),
    } as unknown as jest.Mocked<RecurringTransactionsService>;
    const service = new TransactionsService(repository, recurring);

    beforeEach(() => jest.clearAllMocks());

    it("rejects creating a transaction with another user's category", async () => {
      repository.findCategoryForUser.mockResolvedValue(null);

      await expect(
        service.create("user-A", {
          description: "Market",
          amount: 100,
          type: "expense",
          date: "2026-05-31",
          categoryId: "user-B-category",
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.findCategoryForUser).toHaveBeenCalledWith(
        "user-A",
        "user-B-category",
      );
    });

    it("does not update another user's transaction", async () => {
      repository.update.mockResolvedValue(null as never);

      await expect(
        service.update("user-A", "user-B-transaction", { amount: 200 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.update).toHaveBeenCalledWith(
        "user-A",
        "user-B-transaction",
        { amount: 200 },
      );
    });

    it("does not delete another user's transaction", async () => {
      repository.delete.mockResolvedValue({ count: 0 } as never);

      await expect(
        service.delete("user-A", "user-B-transaction"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.delete).toHaveBeenCalledWith(
        "user-A",
        "user-B-transaction",
      );
    });
  });

  describe("budgets", () => {
    const repository = {
      findCategoryForUser: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<BudgetsRepository>;
    const service = new BudgetsService(repository);

    beforeEach(() => jest.clearAllMocks());

    it("rejects creating a budget with another user's category", async () => {
      repository.findCategoryForUser.mockResolvedValue(null);

      await expect(
        service.create("user-A", {
          categoryId: "user-B-category",
          amount: 500,
          month: 5,
          year: 2026,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it("does not update another user's budget", async () => {
      repository.update.mockResolvedValue(null as never);

      await expect(
        service.update("user-A", "user-B-budget", { amount: 600 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.update).toHaveBeenCalledWith(
        "user-A",
        "user-B-budget",
        { amount: 600, categoryId: undefined, month: undefined, year: undefined },
      );
    });

    it("does not delete another user's budget", async () => {
      repository.delete.mockResolvedValue({ count: 0 } as never);

      await expect(
        service.delete("user-A", "user-B-budget"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.delete).toHaveBeenCalledWith("user-A", "user-B-budget");
    });
  });

  describe("goals", () => {
    const repository = {
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<GoalsRepository>;
    const service = new GoalsService(repository);

    beforeEach(() => jest.clearAllMocks());

    it("does not update another user's savings goal", async () => {
      repository.update.mockResolvedValue(null as never);

      await expect(
        service.update("user-A", "user-B-goal", { currentAmount: 100 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.update).toHaveBeenCalledWith(
        "user-A",
        "user-B-goal",
        { currentAmount: 100 },
      );
    });

    it("does not delete another user's savings goal", async () => {
      repository.delete.mockResolvedValue({ count: 0 } as never);

      await expect(
        service.delete("user-A", "user-B-goal"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.delete).toHaveBeenCalledWith("user-A", "user-B-goal");
    });
  });

  describe("assets", () => {
    const repository = {
      findByTicker: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<AssetsRepository>;
    const marketData = {} as unknown as jest.Mocked<InvestmentMarketDataService>;
    const service = new AssetsService(repository, marketData);

    beforeEach(() => jest.clearAllMocks());

    it("does not disclose another user's asset by ticker", async () => {
      repository.findByTicker.mockResolvedValue(null as never);

      await expect(
        service.findByTicker("user-A", "PETR4"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findByTicker).toHaveBeenCalledWith("user-A", "PETR4");
    });

    it("does not add quotes to another user's asset", async () => {
      repository.findById.mockResolvedValue(null as never);

      await expect(
        service.addManualQuote("user-A", "user-B-asset", { price: "42" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith("user-A", "user-B-asset");
    });
  });

  describe("portfolios", () => {
    const repository = {
      findById: jest.fn(),
      findAsset: jest.fn(),
      findDividendReceipt: jest.fn(),
    } as unknown as jest.Mocked<PortfoliosRepository>;
    const assetsService = {} as jest.Mocked<AssetsService>;
    const service = new PortfoliosService(repository, assetsService);

    beforeEach(() => jest.clearAllMocks());

    it("does not register events in another user's portfolio", async () => {
      repository.findById.mockResolvedValue(null as never);

      await expect(
        service.addTransaction("user-A", "user-B-portfolio", {
          assetId: "asset-1",
          type: "buy",
          quantity: "1",
          unitPrice: "10",
          occurredAt: "2026-05-31",
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith(
        "user-A",
        "user-B-portfolio",
      );
      expect(repository.findAsset).not.toHaveBeenCalled();
    });

    it("does not read monthly reports from another user's portfolio", async () => {
      repository.findById.mockResolvedValue(null as never);

      await expect(
        service.getMonthlyReport("user-A", "user-B-portfolio", "2026-05"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith(
        "user-A",
        "user-B-portfolio",
      );
    });
  });
});
