import { describe, it, expect } from "vitest";
import { buildFlowNodes, type FlowColors, type FlowLabels } from "@/lib/analyse-flow";
import type { SavingsDestination } from "@/types/api";

const COLORS: FlowColors = { incomeFlow: "green", savings: "gold", priorBalance: "gray" };
const LABELS: FlowLabels = {
  income: "Revenus",
  savings: "Épargne",
  remainedLiquid: "Resté liquide",
  priorBalance: "Solde antérieur",
};

function dest(account_id: string, amount: number, name: string | null = null): SavingsDestination {
  return { account_id, name, amount };
}

const build = (
  total_income: number,
  net: number,
  savings_destinations: SavingsDestination[]
) => buildFlowNodes({ total_income, net, savings_destinations }, COLORS, LABELS);

describe("buildFlowNodes", () => {
  it("names each destination and adds 'Resté liquide' when net exceeds contributions", () => {
    const { income, savings } = build(2000, 1000, [dest("pea", 600, "PEA")]);

    expect(income).toEqual([{ id: "revenus", label: "Revenus", amount: 2000, color: "green" }]);
    expect(savings).toEqual([
      { id: "dest-pea", label: "Épargne PEA", amount: 600, color: "gold" },
      { id: "liquid", label: "Resté liquide", amount: 400, color: "gold" },
    ]);
  });

  it("adds a synthetic 'Solde antérieur' income when contributions exceed net", () => {
    const { income, savings } = build(1000, 200, [dest("pea", 500, "PEA")]);

    expect(income).toEqual([
      { id: "revenus", label: "Revenus", amount: 1000, color: "green" },
      { id: "prior-balance", label: "Solde antérieur", amount: 300, color: "gray" },
    ]);
    // No 'Resté liquide' — everything (and more) went to wealth.
    expect(savings).toEqual([{ id: "dest-pea", label: "Épargne PEA", amount: 500, color: "gold" }]);
  });

  it("keeps the diagram balanced when contributions equal net exactly", () => {
    const { income, savings } = build(1000, 500, [dest("pea", 500, "PEA")]);

    expect(income.some((n) => n.id === "prior-balance")).toBe(false);
    expect(savings.some((n) => n.id === "liquid")).toBe(false);
    expect(savings).toHaveLength(1);
  });

  it("falls back to a single 'Épargne' node when there are no contributions", () => {
    const { savings } = build(800, 300, []);
    expect(savings).toEqual([{ id: "savings", label: "Épargne", amount: 300, color: "gold" }]);
  });

  it("emits no savings node when there is no surplus and no contributions", () => {
    const { savings } = build(500, -50, []);
    expect(savings).toEqual([]);
  });

  it("emits no income node when there is no income", () => {
    const { income } = build(0, 0, []);
    expect(income).toEqual([]);
  });

  it("uses the generic savings label when a destination has no name", () => {
    const { savings } = build(1000, 1000, [dest("x", 200, null)]);
    expect(savings[0].label).toBe("Épargne");
  });
});
