import { describe, it, expect } from "vitest";
import { transferError, type LegOption } from "@/components/transactions/transfer-form";

const courant: LegOption = { id: "c1", name: "Courant", kind: "courant" };
const perso: LegOption = { id: "c2", name: "Perso", kind: "courant" };
const pea: LegOption = { id: "e1", name: "PEA", kind: "epargne" };
const crypto: LegOption = { id: "e2", name: "Crypto", kind: "epargne" };

describe("transferError", () => {
  it("accepts courant → épargne", () => {
    expect(transferError(courant, pea, 150)).toBeNull();
  });

  it("accepts courant → courant (symmetric)", () => {
    expect(transferError(courant, perso, 50)).toBeNull();
  });

  it("rejects épargne → épargne (needs ≥1 courant)", () => {
    expect(transferError(pea, crypto, 150)).toBe("transferNeedsCourant");
  });

  it("rejects the same account on both legs", () => {
    expect(transferError(courant, courant, 150)).toBe("transferDifferent");
  });

  it("rejects missing legs or a non-positive amount", () => {
    expect(transferError(undefined, pea, 150)).toBe("invalid");
    expect(transferError(courant, undefined, 150)).toBe("invalid");
    expect(transferError(courant, pea, 0)).toBe("invalid");
    expect(transferError(courant, pea, NaN)).toBe("invalid");
  });
});
