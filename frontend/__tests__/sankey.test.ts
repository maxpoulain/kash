import { describe, it, expect } from "vitest";
import { computeSankeyLayout, type SankeyInput } from "@/lib/sankey";

function baseInput(overrides: Partial<SankeyInput> = {}): SankeyInput {
  return {
    income: [
      { id: "salary", label: "Salary", amount: 2000, color: "var(--accent)" },
      { id: "misc", label: "Misc", amount: 500, color: "var(--gold)" },
    ],
    expense: [
      { id: "rent", label: "Rent", amount: 1200, color: "var(--pig)" },
      { id: "food", label: "Food", amount: 300, color: "var(--warn)" },
    ],
    savings: 1000,
    savingsColor: "var(--accent)",
    width: 600,
    height: 240,
    ...overrides,
  };
}

describe("computeSankeyLayout", () => {
  it("creates a node per income and per right-side item, plus a pool", () => {
    const { nodes } = computeSankeyLayout(baseInput());
    const income = nodes.filter((n) => n.side === "income");
    const expense = nodes.filter((n) => n.side === "expense");
    const savings = nodes.filter((n) => n.side === "savings");
    const pool = nodes.filter((n) => n.side === "pool");

    expect(income).toHaveLength(2);
    expect(expense).toHaveLength(2);
    expect(savings).toHaveLength(1);
    expect(pool).toHaveLength(1);
  });

  it("makes node heights proportional to amounts within a side", () => {
    const { nodes } = computeSankeyLayout(baseInput());
    const salary = nodes.find((n) => n.id === "salary")!;
    const misc = nodes.find((n) => n.id === "misc")!;
    // 2000 vs 500 → 4:1 ratio.
    expect(salary.h / misc.h).toBeCloseTo(4, 1);
  });

  it("emits one link per income and per right-side item", () => {
    const { links } = computeSankeyLayout(baseInput());
    // 2 income inflows + (2 expense + 1 savings) outflows.
    expect(links).toHaveLength(5);
    expect(links.every((l) => l.d.startsWith("M"))).toBe(true);
  });

  it("omits the savings node when there is no surplus", () => {
    const { nodes } = computeSankeyLayout(baseInput({ savings: 0 }));
    expect(nodes.some((n) => n.side === "savings")).toBe(false);
  });

  it("handles an empty month without throwing", () => {
    const { nodes, links } = computeSankeyLayout(
      baseInput({ income: [], expense: [], savings: 0 })
    );
    expect(nodes).toHaveLength(0);
    expect(links).toHaveLength(0);
  });
});
