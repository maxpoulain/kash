import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCategories, createTransaction, getTransactions, getBudgetSummary, saveBudget, copyBudgetFrom } from "@/lib/api";

// Mock the Supabase client used by apiFetch
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({
        data: { session: { access_token: "fake-token", expires_at: 9999999999 } },
      }),
    },
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("getCategories", () => {
  it("returns categories on success", async () => {
    const categories = [
      { id: "00000000-0000-0000-0000-000000000001", name: "Loyer", icon: "🏠", household_id: null, is_default: true },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => categories,
    });

    const result = await getCategories();

    expect(result).toEqual(categories);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/categories"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer fake-token" }),
      })
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    await expect(getCategories()).rejects.toThrow("Failed to fetch categories");
  });
});

describe("getTransactions", () => {
  it("fetches all transactions without month filter", async () => {
    const transactions = [
      { id: "t1", amount: 50, type: "expense", date: "2026-04-15", category_id: null, note: null },
    ];
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => transactions });

    const result = await getTransactions();

    expect(result).toEqual(transactions);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/transactions"),
      expect.anything()
    );
  });

  it("appends month query param when provided", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    await getTransactions("2026-04");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/transactions?month=2026-04"),
      expect.anything()
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    await expect(getTransactions("2026-04")).rejects.toThrow("Failed to fetch transactions");
  });
});

describe("createTransaction", () => {
  it("sends correct body and returns transaction", async () => {
    const payload = {
      amount: 50,
      type: "expense" as const,
      category_id: "00000000-0000-0000-0000-000000000002",
      date: "2026-04-15",
    };
    const transaction = { id: "00000000-0000-0000-0000-000000000003", ...payload };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => transaction,
    });

    const result = await createTransaction(payload);

    expect(result).toEqual(transaction);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/transactions"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
        headers: expect.objectContaining({ Authorization: "Bearer fake-token" }),
      })
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    await expect(
      createTransaction({ amount: 10, type: "expense", category_id: "uuid", date: "2026-04-15" })
    ).rejects.toThrow("Failed to create transaction");
  });
});

describe("getBudgetSummary", () => {
  const summary = {
    month: "2026-04",
    income: 3000,
    total_allocated: 2500,
    total_spent: 1200,
    over_budget: false,
    categories: [
      { category_id: "cat-1", category_name: "Loyer", allocated: 1000, spent: 1000, remaining: 0 },
    ],
  };

  it("returns summary on success", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => summary });

    const result = await getBudgetSummary("2026-04");

    expect(result).toEqual(summary);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/budgets/2026/04/summary"),
      expect.anything()
    );
  });

  it("returns null on 404", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await getBudgetSummary("2026-04");

    expect(result).toBeNull();
  });

  it("throws on non-404 error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(getBudgetSummary("2026-04")).rejects.toThrow("Failed to fetch budget summary");
  });
});

describe("saveBudget", () => {
  const payload = { income: 3000, allocations: [{ category_id: "cat-1", amount: 1000 }] };
  const budget = { id: "b-1", household_id: "hh-1", month: "2026-04", income: 3000, over_budget: false, allocations: [], created_at: "", updated_at: "" };

  it("sends PUT request and returns budget", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => budget });

    const result = await saveBudget("2026-04", payload);

    expect(result).toEqual(budget);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/budgets/2026/04"),
      expect.objectContaining({ method: "PUT", body: JSON.stringify(payload) })
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });

    await expect(saveBudget("2026-04", payload)).rejects.toThrow("Failed to save budget");
  });
});

describe("copyBudgetFrom", () => {
  const budget = { id: "b-2", household_id: "hh-1", month: "2026-04", income: 2500, over_budget: false, allocations: [], created_at: "", updated_at: "" };

  it("sends POST to copy-from endpoint", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => budget });

    const result = await copyBudgetFrom("2026-04", "2026-03");

    expect(result).toEqual(budget);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/budgets/2026/04/copy-from/2026/03"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(copyBudgetFrom("2026-04", "2026-03")).rejects.toThrow("Failed to copy budget");
  });
});
