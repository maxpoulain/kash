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


// Savings Accounts

export interface SavingsAccountAPI {
  id: string;
  name: string;
  type: string;
  balance: number;
  institution: string | null;
}

export interface SavingsAccountCreate {
  name: string;
  type: string;
  balance: number;
  institution?: string;
}

export interface SavingsAccountUpdate {
  name?: string;
  type?: string;
  balance?: number;
  institution?: string | null;
}

// Spending Goals
export interface SpendingGoal {
  category_id: string;
  category_name: string;
  category_icon: string | null;
  goal_amount: number;
  spent_amount: number;
  progress_percent: number;
  remaining: number;
  status: "on_track" | "under_pace" | "over_budget";
}

export interface SpendingGoalsResponse {
  month: string;
  total_goal: number;
  total_spent: number;
  total_remaining: number;
  goals: SpendingGoal[];
}
