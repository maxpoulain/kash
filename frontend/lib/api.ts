import { createClient } from "@/lib/supabase/client";
import type { Category, CreateGoalPayload, CreateTransactionPayload, NetWorthHistoryPoint, RecurringTransaction, RecurringTransactionCreate, RecurringTransactionUpdate, SavingsAccountAPI, SavingsAccountCreate, SavingsAccountUpdate, SpendingGoal, SpendingGoalsResponse, Summary, Transaction } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return {};

  // Refresh if token is close to expiry (< 60s remaining)
  const expiresAt = session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt - now < 60) {
    const { data: { session: refreshed } } = await supabase.auth.refreshSession();
    if (refreshed) {
      return { Authorization: `Bearer ${refreshed.access_token}` };
    }
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiFetch("/api/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function getTransactions(month?: string): Promise<Transaction[]> {
  const url = month ? `/api/transactions?month=${month}` : "/api/transactions";
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  const res = await apiFetch("/api/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create transaction");
  return res.json();
}


export async function getSummary(month?: string): Promise<Summary> {
  const url = month ? `/api/summary?month=${month}` : "/api/summary";
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function getSpendingGoals(month: string): Promise<SpendingGoalsResponse> {
  const res = await apiFetch(`/api/spending-goals?month=${month}`);
  if (!res.ok) throw new Error("Failed to fetch spending goals");
  return res.json();
}

export async function createGoal(payload: CreateGoalPayload): Promise<SpendingGoal> {
  const res = await apiFetch("/api/spending-goals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create spending goal");
  return res.json();
}

export async function getSavingsAccounts(): Promise<SavingsAccountAPI[]> {
  const res = await apiFetch("/api/savings-accounts");
  if (!res.ok) throw new Error("Failed to fetch savings accounts");
  return res.json();
}

export async function createSavingsAccount(payload: SavingsAccountCreate): Promise<SavingsAccountAPI> {
  const res = await apiFetch("/api/savings-accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create savings account");
  return res.json();
}

export async function updateSavingsAccount(id: string, payload: SavingsAccountUpdate): Promise<SavingsAccountAPI> {
  const res = await apiFetch(`/api/savings-accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update savings account");
  return res.json();
}

export async function deleteSavingsAccount(id: string): Promise<void> {
  const res = await apiFetch(`/api/savings-accounts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete savings account");
}

export async function getNetWorthHistory(): Promise<NetWorthHistoryPoint[]> {
  const res = await apiFetch("/api/savings-accounts/history");
  if (!res.ok) throw new Error("Failed to fetch net worth history");
  return res.json();
}

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const res = await apiFetch("/api/recurring-transactions");
  if (!res.ok) throw new Error("Failed to fetch recurring transactions");
  return res.json();
}

export async function createRecurringTransaction(payload: RecurringTransactionCreate): Promise<RecurringTransaction> {
  const res = await apiFetch("/api/recurring-transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create recurring transaction");
  return res.json();
}

export async function updateRecurringTransaction(id: string, payload: RecurringTransactionUpdate): Promise<RecurringTransaction> {
  const res = await apiFetch(`/api/recurring-transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update recurring transaction");
  return res.json();
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  const res = await apiFetch(`/api/recurring-transactions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete recurring transaction");
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...init?.headers,
    },
  });
}
