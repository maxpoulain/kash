import { createClient } from "@/lib/supabase/client";
import type { BudgetOut, BudgetSummary, BudgetUpsert, Category, CreateTransactionPayload, Transaction } from "@/types/api";

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

export async function getBudgetSummary(month: string): Promise<BudgetSummary | null> {
  const [year, m] = month.split("-");
  const res = await apiFetch(`/api/budgets/${year}/${m}/summary`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch budget summary");
  return res.json();
}

export async function saveBudget(month: string, payload: BudgetUpsert): Promise<BudgetOut> {
  const [year, m] = month.split("-");
  const res = await apiFetch(`/api/budgets/${year}/${m}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save budget");
  return res.json();
}

export async function copyBudgetFrom(targetMonth: string, sourceMonth: string): Promise<BudgetOut> {
  const [targetYear, targetM] = targetMonth.split("-");
  const [sourceYear, sourceM] = sourceMonth.split("-");
  const res = await apiFetch(
    `/api/budgets/${targetYear}/${targetM}/copy-from/${sourceYear}/${sourceM}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Failed to copy budget");
  return res.json();
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
