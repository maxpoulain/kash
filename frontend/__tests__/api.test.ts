import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCategories,
  createCategory,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
  getSummary,
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  updateTransfer,
} from "@/lib/api";

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
      { id: "00000000-0000-0000-0000-000000000001", name: "Loyer", icon: "🏠", household_id: null, type: "expense" },
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

describe("createCategory", () => {
  const payload = { name: "Courses Bio", icon: "ShoppingCart", type: "expense" as const };

  it("POSTs the JSON payload and returns the created category", async () => {
    const created = { id: "cat-1", household_id: "hh-1", ...payload };
    mockFetch.mockResolvedValueOnce({ ok: true, status: 201, json: async () => created });

    const result = await createCategory(payload);

    expect(result).toEqual(created);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/categories"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
        headers: expect.objectContaining({ Authorization: "Bearer fake-token" }),
      })
    );
  });

  it("propagates 'duplicate' on a 409 conflict", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 409 });

    await expect(createCategory(payload)).rejects.toThrow("duplicate");
  });

  it("throws a generic error on other failures", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(createCategory(payload)).rejects.toThrow("Failed to create category");
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

describe("updateTransaction", () => {
  it("PUTs the partial payload by id", async () => {
    const payload = { account_id: "00000000-0000-0000-0000-0000000000a9", amount: 75 };
    const updated = { id: "tx-1", ...payload };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => updated });

    const result = await updateTransaction("tx-1", payload);

    expect(result).toEqual(updated);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/transactions/tx-1"),
      expect.objectContaining({ method: "PUT", body: JSON.stringify(payload) })
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(updateTransaction("tx-1", { amount: 5 })).rejects.toThrow(
      "Failed to update transaction"
    );
  });
});

describe("deleteTransaction", () => {
  it("DELETEs the transaction by id", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await deleteTransaction("tx-1");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/transactions/tx-1"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(deleteTransaction("tx-1")).rejects.toThrow("Failed to delete transaction");
  });
});

describe("updateTransfer", () => {
  it("PATCHes the transfer by id", async () => {
    const payload = { amount: 250, date: "2026-06-13" };
    const updated = { id: "tr-1", ...payload };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => updated });

    const result = await updateTransfer("tr-1", payload);

    expect(result).toEqual(updated);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/transfers/tr-1"),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify(payload) })
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(updateTransfer("tr-1", { amount: 5 })).rejects.toThrow(
      "Failed to update transfer"
    );
  });
});

describe("getSummary", () => {
  it("requests the summary for the given month", async () => {
    const summary = {
      month: "2026-06",
      total_income: 2500,
      total_expense: 400,
      net: 2100,
      savings_rate: 0.84,
      income_by_category: [],
      expense_by_category: [],
    };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => summary });

    const result = await getSummary("2026-06");

    expect(result).toEqual(summary);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/summary?month=2026-06"),
      expect.anything()
    );
  });

  it("omits the month query param when not provided", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await getSummary();

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/summary");
    expect(url).not.toContain("month=");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(getSummary("2026-06")).rejects.toThrow("Failed to fetch summary");
  });
});

describe("getRecurringTransactions", () => {
  it("fetches recurring rules", async () => {
    const rules = [{ id: "r1", amount: 1200, type: "expense", frequency: "monthly" }];
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => rules });

    const result = await getRecurringTransactions();

    expect(result).toEqual(rules);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/recurring-transactions"),
      expect.anything()
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(getRecurringTransactions()).rejects.toThrow("Failed to fetch recurring transactions");
  });
});

describe("createRecurringTransaction", () => {
  it("POSTs the payload", async () => {
    const payload = {
      amount: 1200,
      type: "expense" as const,
      frequency: "monthly" as const,
      start_date: "2026-06-05",
    };
    const created = { id: "r1", ...payload };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => created });

    const result = await createRecurringTransaction(payload);

    expect(result).toEqual(created);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/recurring-transactions"),
      expect.objectContaining({ method: "POST", body: JSON.stringify(payload) })
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(
      createRecurringTransaction({ amount: 1, type: "expense", frequency: "weekly", start_date: "2026-06-01" })
    ).rejects.toThrow("Failed to create recurring transaction");
  });
});

describe("updateRecurringTransaction", () => {
  it("PATCHes the rule by id", async () => {
    const updated = { id: "r1", active: false };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => updated });

    const result = await updateRecurringTransaction("r1", { active: false });

    expect(result).toEqual(updated);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/recurring-transactions/r1"),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ active: false }) })
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(updateRecurringTransaction("r1", { amount: 5 })).rejects.toThrow(
      "Failed to update recurring transaction"
    );
  });
});

describe("deleteRecurringTransaction", () => {
  it("DELETEs the rule by id", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await deleteRecurringTransaction("r1");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/recurring-transactions/r1"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(deleteRecurringTransaction("r1")).rejects.toThrow("Failed to delete recurring transaction");
  });
});
