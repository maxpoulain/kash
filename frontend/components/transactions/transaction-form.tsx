"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategories, createTransaction } from "@/lib/api";
import type { Category, TransactionType } from "@/types/api";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Le montant doit être positif"),
  category_id: z.string().uuid("Sélectionne une catégorie"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  note: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

interface TransactionFormProps {
  onSuccess: () => void;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "expense", date: today() },
  });

  const selectedType = useWatch({ control, name: "type" }) as TransactionType;
  const selectedCategoryId = useWatch({ control, name: "category_id" });

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  const filteredCategories = categories.filter((c) => {
    // Income categories: Salaire + custom; expense: everything else
    if (selectedType === "income") return c.name === "Salaire" || !c.is_default;
    return c.name !== "Salaire";
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await createTransaction(values);
      onSuccess();
    } catch {
      setSubmitError("Une erreur est survenue. Réessaie.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
      {/* Type toggle */}
      <div className="flex rounded-lg border overflow-hidden">
        {(["expense", "income"] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setValue("type", t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              selectedType === t
                ? t === "expense"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground"
                : "bg-background text-muted-foreground"
            }`}
          >
            {t === "expense" ? "Dépense" : "Revenu"}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div>
        <Input
          {...register("amount", { valueAsNumber: true })}
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          step="0.01"
          min="0.01"
          className="text-2xl h-14 text-center"
        />
        {errors.amount && (
          <p className="text-destructive text-sm mt-1">{errors.amount.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <Select
          onValueChange={(v) => setValue("category_id", v as string)}
          disabled={loadingCategories}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingCategories ? "Chargement…" : "Catégorie"}>
              {selectedCategoryId
                ? (() => {
                    const cat = categories.find((c) => c.id === selectedCategoryId);
                    return cat ? `${cat.icon ? cat.icon + " " : ""}${cat.name}` : null;
                  })()
                : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}{c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && (
          <p className="text-destructive text-sm mt-1">{errors.category_id.message}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <Input {...register("date")} type="date" />
        {errors.date && (
          <p className="text-destructive text-sm mt-1">{errors.date.message}</p>
        )}
      </div>

      {/* Note */}
      <Textarea
        {...register("note")}
        placeholder="Note (optionnelle)"
        rows={2}
      />

      {submitError && (
        <p className="text-destructive text-sm">{submitError}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full h-12">
        {isSubmitting ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
