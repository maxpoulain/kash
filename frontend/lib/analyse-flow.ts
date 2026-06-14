// Builds the Sankey's income/savings nodes from a month summary (00058 T5a/T5c).
//
// The summary totals never count transfers, so the money flow reconciles `net`
// (= income − expense, undecomposed) with the flows that route money around:
//   • savings destinations  D  (Σ courant→epargne)            — right side
//   • transfers out         O  (Σ → another account, scoped)  — right side
//   • transfers in          I  (Σ from another account, scoped) — left side
//
// Leftover  = net + I − D − O. Positive → "Resté liquide" (right); negative →
// "Solde antérieur" (left, a drawdown from a prior balance). Each synthetic node
// appears only on the side where it is positive, so both sides stay balanced.
// In the combined view there are no transfers and the pre-T5a behaviour holds.

import type { SankeyItem } from "@/lib/sankey";
import type { AccountTransferFlow, SavingsDestination } from "@/types/api";

export interface FlowLabels {
  /** Real income source — "Revenus". Also the prefix for named destinations. */
  income: string;
  /** Undecomposed leftover when there is no savings/transfer activity — "Épargne". */
  savings: string;
  /** Leftover that stayed liquid — "Resté liquide". */
  remainedLiquid: string;
  /** Synthetic drawdown source — "Solde antérieur". */
  priorBalance: string;
  /** Incoming transfer label, e.g. name → "Depuis {name}". */
  transferFrom: (name: string | null) => string;
  /** Outgoing transfer label, e.g. name → "Vers {name}". */
  transferTo: (name: string | null) => string;
}

export interface FlowColors {
  incomeFlow: string;
  savings: string;
  priorBalance: string;
  /** Inter-account transfer flows (in/out) — internal movement, muted. */
  transfer: string;
}

export interface FlowSummary {
  total_income: number;
  net: number;
  savings_destinations: SavingsDestination[];
  account_transfers: AccountTransferFlow[];
}

/** Income and savings nodes for {@link computeSankeyLayout}, reconciled so both
 *  sides balance. Expense nodes are built separately by the caller. */
export function buildFlowNodes(
  summary: FlowSummary,
  colors: FlowColors,
  labels: FlowLabels
): { income: SankeyItem[]; savings: SankeyItem[] } {
  const { net, savings_destinations: destinations, account_transfers: transfers } = summary;
  const transfersIn = transfers.filter((t) => t.direction === "in");
  const transfersOut = transfers.filter((t) => t.direction === "out");

  const sum = (xs: { amount: number }[]) => xs.reduce((acc, x) => acc + x.amount, 0);
  const contributed = sum(destinations);
  const incoming = sum(transfersIn);
  const outgoing = sum(transfersOut);
  // Whatever isn't spent, saved, or transferred away stayed liquid (can go negative).
  const leftover = net + incoming - contributed - outgoing;
  const hasFlows = destinations.length > 0 || transfers.length > 0;

  // ── Income side: real income, then incoming transfers, then any drawdown. ──
  const income: SankeyItem[] =
    summary.total_income > 0
      ? [{ id: "revenus", label: labels.income, amount: summary.total_income, color: colors.incomeFlow }]
      : [];
  transfersIn.forEach((t, i) =>
    income.push({
      id: `transfer-in-${i}`,
      label: labels.transferFrom(t.counterpart_name),
      amount: t.amount,
      color: colors.transfer,
    })
  );
  if (leftover < 0) {
    income.push({ id: "prior-balance", label: labels.priorBalance, amount: -leftover, color: colors.priorBalance });
  }

  // ── Savings/outflow side: wealth destinations, outgoing transfers, leftover. ──
  const savings: SankeyItem[] = [];
  for (const dest of destinations) {
    savings.push({
      id: `dest-${dest.account_id}`,
      label: dest.name ? `${labels.savings} ${dest.name}` : labels.savings,
      amount: dest.amount,
      color: colors.savings,
    });
  }
  transfersOut.forEach((t, i) =>
    savings.push({
      id: `transfer-out-${i}`,
      label: labels.transferTo(t.counterpart_name),
      amount: t.amount,
      color: colors.transfer,
    })
  );
  if (leftover > 0) {
    // No savings/transfer activity at all ⇒ the whole net is undecomposed "Épargne"
    // (preserves the combined-view behaviour); otherwise it is the liquid remainder.
    savings.push({
      id: hasFlows ? "liquid" : "savings",
      label: hasFlows ? labels.remainedLiquid : labels.savings,
      amount: leftover,
      color: colors.savings,
    });
  }

  return { income, savings };
}
