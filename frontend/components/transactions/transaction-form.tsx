"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarIcon,
  Package,
} from "lucide-react";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";

import { getCategories, createTransaction } from "@/lib/api";
import type { Category, TransactionType } from "@/types/api";

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICONS[name] ?? Package;
  return <Icon className={className} />;
}

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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "expense", date: today() },
  });

  const selectedType = watch("type") as TransactionType;
  const selectedCategoryId = watch("category_id");
  const selectedDate = watch("date");

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  const INCOME_CATEGORIES = new Set(["Salaire", "Investissement", "Cadeau reçu", "Autre revenu"]);

  const filteredCategories = categories.filter((c) => {
    if (selectedType === "income") return INCOME_CATEGORIES.has(c.name) || !c.is_default;
    return !INCOME_CATEGORIES.has(c.name);
  });

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const isExpense = selectedType === "expense";

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
    <div className="bg-background">
      {/* Gradient header */}
      <CardHeader
        className={cn(
          "pb-6 pt-5 md:pb-4 md:pt-4 transition-colors duration-500",
          isExpense
            ? "bg-gradient-to-br from-primary/90 to-primary"
            : "bg-gradient-to-br from-success/90 to-success"
        )}
      >
        <CardTitle className="text-primary-foreground font-display text-xl mb-3 md:mb-2">
          Nouvelle transaction
        </CardTitle>

        {/* Type toggle */}
        <div className="flex gap-2 p-1.5 bg-white/20 backdrop-blur-sm rounded-2xl">
          {(["expense", "income"] as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValue("type", t)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all",
                selectedType === t
                  ? "bg-white shadow-lg " + (t === "expense" ? "text-primary" : "text-success")
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              {t === "expense"
                ? <ArrowDownRight className="w-5 h-5" />
                : <ArrowUpRight className="w-5 h-5" />}
              <span>{t === "expense" ? "Dépense" : "Revenu"}</span>
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-6 md:p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 md:space-y-3">
          <FieldGroup>
            {/* Amount */}
            <Field>
              <FieldLabel htmlFor="amount">Montant</FieldLabel>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                  €
                </span>
                <Input
                  {...register("amount", { valueAsNumber: true })}
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  placeholder="0,00"
                  step="0.01"
                  min="0.01"
                  className="pl-14 h-16 md:h-11 text-3xl md:text-xl font-mono font-bold rounded-full border focus:border-primary"
                  aria-invalid={!!errors.amount}
                />
              </div>
              <FieldError errors={[errors.amount]} />
            </Field>

            {/* Category */}
            <Field>
              <FieldLabel htmlFor="category">Catégorie</FieldLabel>
              <Select
                value={selectedCategoryId ?? ""}
                onValueChange={(v) => setValue("category_id", v)}
                disabled={loadingCategories}
              >
                <SelectTrigger
                  id="category"
                  className="h-14 md:h-10 w-full rounded-full border focus:border-primary px-5"
                  aria-invalid={!!errors.category_id}
                >
                  <SelectValue placeholder={loadingCategories ? "Chargement…" : "Choisir une catégorie"}>
                    {selectedCategory && (
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center",
                          isExpense ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                        )}>
                          <CategoryIcon name={selectedCategory.name} className="w-4 h-4" />
                        </div>
                        <span>{selectedCategory.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="rounded-xl py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center",
                          isExpense ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                        )}>
                          <CategoryIcon name={c.name} className="w-4 h-4" />
                        </div>
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.category_id]} />
            </Field>

            {/* Date */}
            <Field>
              <FieldLabel>Date</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 md:h-10 justify-start text-left font-normal rounded-full border hover:border-primary px-5"
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                    {selectedDate
                      ? format(parseISO(selectedDate), "PPP", { locale: fr })
                      : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? parseISO(selectedDate) : undefined}
                    onSelect={(d) => d && setValue("date", format(d, "yyyy-MM-dd"))}
                    disabled={{ after: new Date() }}
                    endMonth={new Date()}
                    locale={fr}
                  />
                  <div className="border-t p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setValue("date", today())}
                    >
                      {"Aujourd'hui"}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <FieldError errors={[errors.date]} />
            </Field>

            {/* Note */}
            <Field>
              <FieldLabel htmlFor="note">
                Notes <span className="text-muted-foreground font-normal">(optionnel)</span>
              </FieldLabel>
              <Textarea
                {...register("note")}
                id="note"
                placeholder="Ajouter une description..."
                className="min-h-[100px] md:min-h-[70px] rounded-2xl border focus:border-primary resize-none"
              />
            </Field>
          </FieldGroup>

          {submitError && (
            <p role="alert" className="text-destructive text-sm">{submitError}</p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full h-14 md:h-11 rounded-full text-lg md:text-base font-semibold transition-all border-0",
              isExpense
                ? "bg-primary hover:bg-primary/90"
                : "bg-success hover:bg-success/90 text-white"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Enregistrement…</span>
              </div>
            ) : (
              "Enregistrer la transaction"
            )}
          </Button>
        </form>
      </CardContent>
    </div>
  );
}
