import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { TransferForm } from "@/components/transactions/transfer-form";
import type { Account, SavingsAccountAPI } from "@/types/api";

// next-intl: return the key so we can query by label key.
vi.mock("next-intl", () => ({
  useTranslations: () => (k: string) => k,
  useLocale: () => "en",
}));

const createTransfer = vi.fn();
vi.mock("@/lib/api", () => ({
  createTransfer: (...args: unknown[]) => createTransfer(...args),
}));

const COURANT = { id: "c1", name: "Courant" } as unknown as Account;
const PEA = { id: "e1", name: "PEA" } as unknown as SavingsAccountAPI;
const CRYPTO = { id: "e2", name: "Crypto" } as unknown as SavingsAccountAPI;

function renderForm(comptes: Account[], epargnes: SavingsAccountAPI[]) {
  return render(
    <TransferForm
      variant="desktop"
      toggle={<div data-testid="toggle" />}
      comptes={comptes}
      epargnes={epargnes}
      onSuccess={vi.fn()}
      onClose={vi.fn()}
    />,
  );
}

beforeEach(() => createTransfer.mockReset());

// Each LegPicker renders <div><div>{label}</div><div>{buttons}</div></div>.
function picker(labelKey: string) {
  return within(screen.getByText(labelKey).parentElement as HTMLElement);
}

describe("TransferForm", () => {
  it("creates a courant → epargne transfer with the right leg kinds", async () => {
    const { container } = renderForm([COURANT], [PEA]);

    fireEvent.click(picker("transferFrom").getByText("Courant"));
    fireEvent.click(picker("transferTo").getByText("PEA"));
    fireEvent.change(container.querySelector("input[type=number]")!, { target: { value: "150" } });

    fireEvent.click(screen.getByText("transferSubmit"));

    await waitFor(() => expect(createTransfer).toHaveBeenCalledTimes(1));
    expect(createTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        from_kind: "courant", from_id: "c1",
        to_kind: "epargne", to_id: "e1",
        amount: 150,
      }),
    );
  });

  it("does not submit an epargne → epargne transfer (needs ≥1 courant)", () => {
    const { container } = renderForm([], [PEA, CRYPTO]);

    fireEvent.click(picker("transferFrom").getByText("PEA"));
    fireEvent.click(picker("transferTo").getByText("Crypto"));
    fireEvent.change(container.querySelector("input[type=number]")!, { target: { value: "150" } });

    fireEvent.click(screen.getByText("transferSubmit"));

    expect(createTransfer).not.toHaveBeenCalled();
  });
});
