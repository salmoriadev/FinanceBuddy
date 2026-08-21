import { CategoriesRepository } from "../src/modules/categories/categories.repository";
import { CategoriesService } from "../src/modules/categories/categories.service";

describe("CategoriesService replica freshness", () => {
  it("re-reads normalized categories in two warmed service instances after update", async () => {
    const original = [
      {
        id: "category-1",
        name: "Alimentação",
        type: "expense" as const,
        color: "#f97316",
      },
      {
        id: "category-duplicate",
        name: "Alimentacao",
        type: "expense" as const,
        color: "#ef4444",
      },
    ];
    const updated = [
      {
        id: "category-1",
        name: "Mercado",
        type: "expense" as const,
        color: "#6366f1",
      },
    ];
    const repository = {
      findAllByUser: jest
        .fn()
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(updated)
        .mockResolvedValueOnce(updated),
      update: jest.fn().mockResolvedValue(updated[0]),
    } as unknown as jest.Mocked<CategoriesRepository>;
    const firstInstance = new CategoriesService(repository);
    const secondInstance = new CategoriesService(repository);

    const firstWarmRead = await firstInstance.findAll("user-1");
    const secondWarmRead = await secondInstance.findAll("user-1");

    expect(firstWarmRead).toEqual([original[0]]);
    expect(secondWarmRead).toEqual([original[0]]);

    await firstInstance.update("user-1", "category-1", {
      name: "Mercado",
      color: "#6366f1",
    });

    await expect(firstInstance.findAll("user-1")).resolves.toEqual(updated);
    await expect(secondInstance.findAll("user-1")).resolves.toEqual(updated);
    expect(repository.findAllByUser).toHaveBeenCalledTimes(4);
  });
});
