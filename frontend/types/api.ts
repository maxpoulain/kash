export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  household_id: string | null;
  name: string;
  icon: string | null;
  type: TransactionType;
}

export interface CreateTransactionPayload {
  amount: number;
  type: TransactionType;
  category_id: string;
  account_id?: string; // defaults to the household's principal account
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


// Financial summary (Analyse page)

export interface CategoryAmount {
  category_id: string | null;
  name: string | null;
  icon: string | null;
  amount: number;
}

export interface Summary {
  month: string;
  total_income: number;
  total_expense: number;
  net: number;
  savings_rate: number | null;
  income_by_category: CategoryAmount[];
  expense_by_category: CategoryAmount[];
}

// Accounts (cash-flow containers, calculated balance) — 00058 comptes multiples
// Distinct from SavingsAccount (patrimoine, manual balance).

export type AccountKind = "checking" | "savings" | "cash";

export interface Account {
  id: string;
  household_id: string;
  owner_id: string | null;
  name: string;
  type: string; // AccountKind
  visibility: string; // shared | private
  initial_balance: number;
  institution: string | null;
  balance: number; // calculated: initial_balance + Σ income − Σ expense
  archived_at: string | null;
}

export interface AccountCreate {
  name: string;
  type?: string;
  initial_balance?: number;
  institution?: string;
}

export interface AccountUpdate {
  name?: string;
  type?: string;
  initial_balance?: number;
  institution?: string;
  archived?: boolean;
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

// Net worth history
export interface NetWorthHistoryPoint {
  date: string; // YYYY-MM-DD
  total: number;
}

// Spending Goals

export interface SpendingGoal {
  id: string;
  category_id: string;
  category_name: string;
  category_icon: string | null;
  goal_amount: number;
  spent_amount: number;
  progress_percent: number;
  remaining: number;
  status: "on_track" | "under_pace" | "over_budget";
}

export interface CreateGoalPayload {
  month: string;
  category_id: string;
  amount: number;
}

export interface SpendingGoalsResponse {
  month: string;
  total_goal: number;
  total_spent: number;
  total_remaining: number;
  goals: SpendingGoal[];
}

// Recurring Transactions

export type Frequency = "weekly" | "monthly";

export interface RecurringTransaction {
  id: string;
  household_id: string;
  created_by: string;
  category_id: string | null;
  amount: number;
  type: TransactionType;
  note: string | null;
  frequency: Frequency;
  anchor_day: number;
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  next_run_date: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransactionCreate {
  amount: number;
  type: TransactionType;
  category_id?: string | null;
  note?: string | null;
  frequency: Frequency;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null;
}

export interface RecurringTransactionUpdate {
  amount?: number;
  type?: TransactionType;
  category_id?: string | null;
  note?: string | null;
  frequency?: Frequency;
  start_date?: string;
  end_date?: string | null;
  active?: boolean;
}
