import { describe, it, expect } from "vitest";
import { buildFlowNodes, type FlowColors, type FlowLabels } from "@/lib/analyse-flow";
import type { AccountTransferFlow, SavingsDestination } from "@/types/api";

const COLORS: FlowColors = { incomeFlow: "green", savings: "gold", priorBalance: "gray", transfer: "ink" };
const LABELS: FlowLabels = {
  income: "Revenus",
  savings: "Épargne",
  remainedLiquid: "Resté liquide",
  priorBalance: "Solde antérieur",
  transferFrom: (name) => `Depuis ${name}`,
  transferTo: (name) => `Vers ${name}`,
};

function dest(account_id: string, amount: number, name: string | null = null): SavingsDestination {
  return { account_id, name, amount };
}

const build = (
  total_income: number,
  net: number,
  savings_destinations: SavingsDestination[],
  account_transfers: AccountTransferFlow[] = []
) => buildFlowNodes({ total_income, net, savings_destinations, account_transfers }, COLORS, LABELS);

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

  // ── Scoped single-account view: inter-account transfers as flows (T5c) ──

  it("renders incoming transfers as income sources and outgoing as outflows", () => {
    // Scoped account: net 300, +200 in from Perso, −100 out to Perso.
    const { income, savings } = build(500, 300, [], [
      { direction: "in", counterpart_name: "Perso", amount: 200 },
      { direction: "out", counterpart_name: "Perso", amount: 100 },
    ]);

    expect(income).toEqual([
      { id: "revenus", label: "Revenus", amount: 500, color: "green" },
      { id: "transfer-in-0", label: "Depuis Perso", amount: 200, color: "ink" },
    ]);
    // leftover = net + in − dest − out = 300 + 200 − 0 − 100 = 400 → "Resté liquide".
    expect(savings).toEqual([
      { id: "transfer-out-0", label: "Vers Perso", amount: 100, color: "ink" },
      { id: "liquid", label: "Resté liquide", amount: 400, color: "gold" },
    ]);
  });

  it("balances with a drawdown when outflows exceed net + inflows", () => {
    // net 100, no inflow, −500 out → leftover = 100 − 500 = −400 → "Solde antérieur".
    const { income, savings } = build(100, 100, [], [
      { direction: "out", counterpart_name: "Perso", amount: 500 },
    ]);

    expect(income).toContainEqual({ id: "prior-balance", label: "Solde antérieur", amount: 400, color: "gray" });
    expect(savings.some((n) => n.id === "liquid")).toBe(false);
    // Sides balance: income (100+400) = outflow (500).
    const left = income.reduce((s, n) => s + n.amount, 0);
    const right = savings.reduce((s, n) => s + n.amount, 0);
    expect(left).toBe(right);
  });

  it("combines destinations and transfers, labelling the remainder 'Resté liquide'", () => {
    const { savings } = build(1000, 1000, [dest("pea", 300, "PEA")], [
      { direction: "out", counterpart_name: "Perso", amount: 200 },
    ]);
    // leftover = 1000 − 300 − 200 = 500.
    expect(savings).toEqual([
      { id: "dest-pea", label: "Épargne PEA", amount: 300, color: "gold" },
      { id: "transfer-out-0", label: "Vers Perso", amount: 200, color: "ink" },
      { id: "liquid", label: "Resté liquide", amount: 500, color: "gold" },
    ]);
  });
});
