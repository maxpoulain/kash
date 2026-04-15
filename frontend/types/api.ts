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
