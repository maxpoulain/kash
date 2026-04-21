"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export const ACCOUNT_TYPES = [
  "Livret A",
  "LEP",
  "LDDS",
  "Livret Jeune",
  "PEL",
  "CEL",
  "PER",
  "Assurance vie",
  "PEA",
  "Compte titres",
  "Crypto",
  "Diversification",
  "Autre",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface SavingsAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  institution?: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

type FormValues = {
  name: string;
  type: AccountType;
  institution: string;
  balance: number;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AccountFormProps {
  account?: SavingsAccount;
  onSave: (data: Omit<SavingsAccount, "id">) => void;
  onDelete?: () => void;
  onClose: () => void;
  variant?: "mobile" | "desktop";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AccountForm({ account, onSave, onDelete, onClose, variant = "desktop" }: AccountFormProps) {
  const isEdit = !!account;

  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? "Livret A",
      institution: account?.institution ?? "",
      balance: account?.balance ?? 0,
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (account) {
      setValue("name", account.name);
      setValue("type", account.type);
      setValue("institution", account.institution ?? "");
      setValue("balance", account.balance);
    }
  }, [account, setValue]);

  function onSubmit(values: FormValues) {
    if (!values.name.trim()) return;
    const balance = Number(values.balance);
    if (isNaN(balance) || balance < 0) return;
    onSave({
      name: values.name.trim(),
      type: values.type,
      institution: values.institution.trim() || undefined,
      balance,
    });
  }

  return (
    <div className={cn("flex flex-col", variant === "mobile" ? "p-5 pb-8" : "p-6")}>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium tracking-tight">
          {isEdit ? "Modifier le compte" : "Ajouter un compte"}
        </h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-foreground/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Nom</label>
          <Input
            placeholder="ex. Livret A Caisse d'Épargne"
            {...register("name")}
          />
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Type</label>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue("type", t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  selectedType === t
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-muted text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Institution */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Établissement <span className="text-muted-foreground font-normal">(optionnel)</span>
          </label>
          <Input
            placeholder="ex. Boursorama, BNP Paribas…"
            {...register("institution")}
          />
        </div>

        {/* Balance */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Solde actuel</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="pl-7"
              {...register("balance")}
            />
          </div>
        </div>

        {/* Actions */}
        <div className={cn("mt-2 flex gap-3", isEdit ? "justify-between" : "justify-end")}>
          {isEdit && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {isEdit ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
