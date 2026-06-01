import { describe, expect, it } from "vitest";
import { getSafeChartStyleRules } from "@/components/ui/chart-style";

describe("chart style security", () => {
  it("keeps safe chart color declarations", () => {
    const css = getSafeChartStyleRules("chart-safe", [
      ["income", { color: "#22c55e" }],
      ["expense", { color: "hsl(var(--foreground))" }],
    ]);

    expect(css).toContain("--color-income: #22c55e;");
    expect(css).toContain("--color-expense: hsl(var(--foreground));");
  });

  it("drops unsafe keys and CSS values before style injection", () => {
    const css = getSafeChartStyleRules("chart-safe", [
      ["ok", { color: "var(--chart-1)" }],
      ["bad;key", { color: "#22c55e" }],
      ["evil", { color: "red; background-image: url(javascript:alert(1))" }],
    ]);

    expect(css).toContain("--color-ok: var(--chart-1);");
    expect(css).not.toContain("bad;key");
    expect(css).not.toContain("javascript:");
    expect(css).not.toContain("background-image");
  });
});
