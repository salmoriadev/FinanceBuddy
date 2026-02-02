import { describe, expect, it } from "vitest";
import { suggestCategory } from "@/domain/categories/matching";
import { Category } from "@/types/finance";

const baseCategory = {
  id: "cat-1",
  user_id: "user-1",
  color: "#000000",
  icon: "circle",
  type: "expense" as const,
  created_at: "",
};

describe("category matching", () => {
  it("matches description to education category", () => {
    const categories: Category[] = [
      { ...baseCategory, id: "cat-edu", name: "Educacao" },
      { ...baseCategory, id: "cat-food", name: "Alimentacao" },
    ];

    const match = suggestCategory("Mensalidade escola", categories);
    expect(match?.id).toBe("cat-edu");
  });

  it("returns null when no match is found", () => {
    const categories: Category[] = [
      { ...baseCategory, id: "cat-edu", name: "Educacao" },
    ];

    const match = suggestCategory("Cinema", categories);
    expect(match).toBeNull();
  });
});
