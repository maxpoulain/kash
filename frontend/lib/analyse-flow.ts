// Builds the Sankey's income/savings nodes from a month summary (00058 T5a).
//
// The summary totals never count transfers, so the money flow has to reconcile
// two facts: `net` (= income − expense, undecomposed) and the named savings
// contributions `D` (Σ courant→epargne transfers). Decision (feature 00058):
//
//   savings side  = one node per wealth destination + "Resté liquide" (net − D)
//   income side   = revenus + "Solde antérieur" (D − net) when contributions
//                   exceed net (the drawdown is financed from a prior balance)
//
// Either synthetic node only appears on the side where its amount is positive,
// which keeps both sides of the diagram balanced (see the plan's proof).

import type { SankeyItem } from "@/lib/sankey";
import type { SavingsDestination } from "@/types/api";

export interface FlowLabels {
  /** Real income source — "Revenus". Also the prefix for named destinations. */
  income: string;
  /** Undecomposed leftover when there are no contributions — "Épargne". */
  savings: string;
  /** Leftover that stayed liquid when net exceeds contributions — "Resté liquide". */
  remainedLiquid: string;
  /** Synthetic drawdown source when contributions exceed net — "Solde antérieur". */
  priorBalance: string;
}

export interface FlowColors {
  incomeFlow: string;
  savings: string;
  priorBalance: string;
}

export interface FlowSummary {
  total_income: number;
  net: number;
  savings_destinations: SavingsDestination[];
}

/** Income and savings nodes for {@link computeSankeyLayout}, reconciled so both
 *  sides balance. Expense nodes are built separately by the caller. */
export function buildFlowNodes(
  summary: FlowSummary,
  colors: FlowColors,
  labels: FlowLabels
): { income: SankeyItem[]; savings: SankeyItem[] } {
  const { net, savings_destinations: destinations } = summary;
  const contributed = destinations.reduce((sum, d) => sum + d.amount, 0);

  const income: SankeyItem[] =
    summary.total_income > 0
      ? [{ id: "revenus", label: labels.income, amount: summary.total_income, color: colors.incomeFlow }]
      : [];

  // Drawdown: contributions financed beyond this month's net come from a prior balance.
  const priorBalance = contributed - net;
  if (priorBalance > 0) {
    income.push({
      id: "prior-balance",
      label: labels.priorBalance,
      amount: priorBalance,
      color: colors.priorBalance,
    });
  }

  const savings: SankeyItem[] = [];
  if (destinations.length === 0) {
    // No contributions: the whole positive net is undecomposed savings (the
    // pre-T5a behaviour — a single "Épargne" node).
    if (net > 0) {
      savings.push({ id: "savings", label: labels.savings, amount: net, color: colors.savings });
    }
  } else {
    for (const dest of destinations) {
      savings.push({
        id: `dest-${dest.account_id}`,
        label: dest.name ? `${labels.savings} ${dest.name}` : labels.savings,
        amount: dest.amount,
        color: colors.savings,
      });
    }
    // The slice of net that wasn't routed to a wealth account stayed liquid.
    const liquid = net - contributed;
    if (liquid > 0) {
      savings.push({ id: "liquid", label: labels.remainedLiquid, amount: liquid, color: colors.savings });
    }
  }

  return { income, savings };
}
