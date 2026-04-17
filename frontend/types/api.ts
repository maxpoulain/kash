export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  household_id: string | null;
  name: string;
  icon: string | null;
  is_default: boolean;
}

export interface CreateTransactionPayload {
  amount: number;
  type: TransactionType;
  category_id: string;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface Transaction {
  id: string;
  household_id: string;
  created_by: string;
  category_id: string | null;
  amount: number;
  type: TransactionType;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Allocation {
  id: string;
  category_id: string;
  amount: number;
}

export interface BudgetOut {
  id: string;
  household_id: string;
  month: string;
  income: number;
  over_budget: boolean;
  allocations: Allocation[];
  created_at: string;
  updated_at: string;
}

export interface CategorySummary {
  category_id: string | null;
  category_name: string;
  allocated: number;
  spent: number;
  remaining: number;
}

export interface BudgetSummary {
  month: string;
  income: number;
  total_allocated: number;
  total_spent: number;
  over_budget: boolean;
  categories: CategorySummary[];
}

export interface BudgetUpsert {
  income: number;
  allocations: Array<{ category_id: string; amount: number }>;
}
