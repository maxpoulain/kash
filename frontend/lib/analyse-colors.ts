// Color palettes for the Analyse page.
//
// Semantics matter on the flow diagram: income/savings read as green, while
// expense categories use a warm palette so they never clash with the green.

// Warm palette for expense categories. Green is reserved for income and gold
// for savings, so neither appears here.
const EXPENSE_PALETTE = [
  "var(--pig)",
  "var(--warn)",
  "var(--pig-deep)",
  "var(--pig-shadow)",
  "var(--ink-2)",
] as const;

// Green-leaning palette for income categories (donut only).
const INCOME_PALETTE = [
  "var(--accent)",
  "var(--accent-ink)",
  "var(--pig-deep)",
  "var(--ink-2)",
  "var(--pig)",
] as const;

/** Stable warm color for the expense category at position `index`. */
export function expenseColor(index: number): string {
  return EXPENSE_PALETTE[index % EXPENSE_PALETTE.length];
}

/** Stable green-leaning color for the income category at position `index`. */
export function incomeColor(index: number): string {
  return INCOME_PALETTE[index % INCOME_PALETTE.length];
}

/** Single income source on the flow diagram (green). */
export const INCOME_FLOW_COLOR = "var(--accent)";
/** Savings outflow on the flow diagram (gold). */
export const SAVINGS_COLOR = "var(--gold)";
