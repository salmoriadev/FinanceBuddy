import { ReportsCacheInvalidationService } from "../src/common/cache/reports-cache-invalidation.service";
import { CategoriesRepository } from "../src/modules/categories/categories.repository";
import { CategoriesService } from "../src/modules/categories/categories.service";
import { RecurringTransactionsService } from "../src/modules/transactions/recurring.service";
import { TransactionsRepository } from "../src/modules/transactions/transactions.repository";
import { TransactionsService } from "../src/modules/transactions/transactions.service";

describe("report cache invalidation", () => {
  it("keeps a stable version until the user's reports are invalidated", () => {
    const service = new ReportsCacheInvalidationService();

    const initialVersion = service.getVersion("user-1");

    expect(service.getVersion("user-1")).toBe(initialVersion);
    expect(service.invalidate("user-1")).not.toBe(initialVersion);
    expect(service.getVersion("user-2")).not.toBe(
      service.getVersion("user-1"),
    );
  });

  it("invalidates reports only after a category mutation succeeds", async () => {
    const repository = {
      findByName: jest.fn().mockResolvedValue(null),
      findAllByUser: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: "category-new" }),
      update: jest.fn().mockResolvedValue({ id: "category-updated" }),
      delete: jest.fn().mockResolvedValue({ count: 1 }),
    } as unknown as jest.Mocked<CategoriesRepository>;
    const reportsCache = {
      invalidate: jest.fn(),
    } as unknown as jest.Mocked<ReportsCacheInvalidationService>;
    const service = new CategoriesService(repository, reportsCache);

    await service.create("user-1", {
      name: "Food",
      type: "expense",
      color: "#f97316",
      icon: "utensils",
    });
    await service.update("user-1", "category-updated", {
      color: "#6366f1",
    });
    await service.delete("user-1", "category-updated");

    expect(reportsCache.invalidate).toHaveBeenCalledTimes(3);
    expect(reportsCache.invalidate).toHaveBeenNthCalledWith(1, "user-1");
    expect(reportsCache.invalidate).toHaveBeenNthCalledWith(2, "user-1");
    expect(reportsCache.invalidate).toHaveBeenNthCalledWith(3, "user-1");
  });

  it("invalidates reports after each successful transaction mutation", async () => {
    const repository = {
      create: jest.fn().mockResolvedValue({ id: "transaction-1" }),
      update: jest.fn().mockResolvedValue({ id: "transaction-1" }),
      delete: jest.fn().mockResolvedValue({ count: 1 }),
    } as unknown as jest.Mocked<TransactionsRepository>;
    const recurring = {
      ensureRecurringTransactions: jest.fn(),
    } as unknown as jest.Mocked<RecurringTransactionsService>;
    const reportsCache = {
      invalidate: jest.fn(),
    } as unknown as jest.Mocked<ReportsCacheInvalidationService>;
    const service = new TransactionsService(
      repository,
      recurring,
      reportsCache,
    );

    await service.create("user-1", {
      description: "Groceries",
      amount: 75,
      type: "expense",
      date: "2026-08-21",
    });
    await service.update("user-1", "transaction-1", { amount: 80 });
    await service.delete("user-1", "transaction-1");

    expect(reportsCache.invalidate).toHaveBeenCalledTimes(3);
    expect(reportsCache.invalidate).toHaveBeenNthCalledWith(1, "user-1");
    expect(reportsCache.invalidate).toHaveBeenNthCalledWith(2, "user-1");
    expect(reportsCache.invalidate).toHaveBeenNthCalledWith(3, "user-1");
  });

  it("does not invalidate reports for a deduplicated category create", async () => {
    const existing = {
      id: "category-existing",
      name: "Food",
      type: "expense",
      color: "#f97316",
    };
    const repository = {
      findByName: jest.fn().mockResolvedValue(existing),
    } as unknown as jest.Mocked<CategoriesRepository>;
    const reportsCache = {
      invalidate: jest.fn(),
    } as unknown as jest.Mocked<ReportsCacheInvalidationService>;
    const service = new CategoriesService(repository, reportsCache);

    await expect(
      service.create("user-1", {
        name: "Food",
        type: "expense",
        color: "#f97316",
        icon: "utensils",
      }),
    ).resolves.toBe(existing);
    expect(reportsCache.invalidate).not.toHaveBeenCalled();
  });
});
