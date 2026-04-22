"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@base-ui/react/dialog";
import { Package, Target, X } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getCategories, createGoal } from "@/lib/api";
import type { Category } from "@/types/api";

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICONS[name] ?? Package;
  return <Icon className={className} />;
}

const schema = z.object({
  category_id: z.string().uuid("Sélectionne une catégorie"),
  amount: z.number().positive("Le montant doit être supérieur à 0"),
});

type FormValues = z.infer<typeof schema>;

interface CreateGoalFormProps {
  month: string;
  usedCategoryIds: Set<string>;
  onSuccess: () => void;
  onClose: () => void;
  variant?: "mobile" | "desktop";
}

function CreateGoalForm({ month, usedCategoryIds, onSuccess, onClose, variant = "mobile" }: CreateGoalFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const selectedCategoryId = watch("category_id");
  const amount = watch("amount");

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const availableCategories = categories.filter((c) => !usedCategoryIds.has(c.id));

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await createGoal({ month, ...values });
      onSuccess();
    } catch {
      setSubmitError("Une erreur est survenue. Réessaie.");
    }
  }

  // -------------------------------------------------------------------------
  // DESKTOP
  // -------------------------------------------------------------------------
  if (variant === "desktop") {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
        className="bg-background"
      >
        {/* header */}
        <div className="px-[22px] py-3.5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: "var(--ink)", color: "var(--pig)" }}
            >
              <Target size={20} />
            </div>
            <div className="font-display text-[20px] font-medium tracking-[-0.02em] leading-tight">
              Nouvel objectif
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: "var(--bg-sunk)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body */}
        <div className="px-[22px] py-[18px] space-y-[18px]">
          {/* amount */}
          <div>
            <div className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase mb-2">
              Montant
            </div>
            <div
              className="flex items-baseline gap-2 rounded-[14px] px-4 py-3.5"
              style={{ background: "var(--bg-elev)", border: "1.5px solid var(--ink)" }}
            >
              <span className="font-display text-[22px] text-muted-foreground">€</span>
              <input
                {...register("amount", { valueAsNumber: true })}
                type="number"
                inputMode="decimal"
                placeholder="0"
                step="0.01"
                min="0.01"
                className="flex-1 bg-transparent border-none outline-none font-display text-[38px] font-medium tracking-[-0.03em] text-foreground min-w-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="font-mono text-[11px] text-muted-foreground tracking-[0.1em]">EUR</span>
            </div>
            {errors.amount && (
              <p className="text-destructive text-xs mt-1">{errors.amount.message}</p>
            )}
          </div>

          {/* category */}
          <div>
            <div className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase mb-2">
              Catégorie
            </div>
            {errors.category_id && (
              <p className="text-destructive text-xs mb-2">{errors.category_id.message}</p>
            )}
            {availableCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Toutes les catégories ont déjà un objectif ce mois-ci.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {availableCategories.map((c) => {
                  const active = c.id === selectedCategoryId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setValue("category_id", c.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 px-1.5 py-2.5 rounded-[10px] text-[10px] border transition-all cursor-pointer leading-tight text-center",
                        active
                          ? "text-background border-foreground"
                          : "text-muted-foreground border-border hover:border-foreground/40"
                      )}
                      style={active ? { background: "var(--ink)" } : { background: "var(--bg-elev)" }}
                    >
                      <CategoryIcon name={c.name} className="w-4 h-4" />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div
          className="px-[22px] py-3 border-t flex items-center justify-between"
          style={{ background: "var(--bg-elev)" }}
        >
          <div />
          <div className="flex items-center gap-2">
            {submitError && (
              <p role="alert" className="text-destructive text-xs mr-2">{submitError}</p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-28 py-2.5 rounded-[10px] text-muted-foreground font-medium text-[13px] hover:text-foreground transition-colors text-center"
              style={{ background: "var(--bg-sunk)" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableCategories.length === 0}
              className="w-40 py-2.5 rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-60"
              style={{ background: "var(--ink)", color: "var(--bg)" }}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Créer"
              )}
            </button>
          </div>
        </div>
      </form>
    );
  }

  // -------------------------------------------------------------------------
  // MOBILE (default)
  // -------------------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-background">
      {/* grabber */}
      <div className="flex justify-center pt-3.5 mb-1.5">
        <div className="w-11 h-[5px] rounded-full bg-border" />
      </div>

      <div className="px-5 pb-7 space-y-4">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="font-display text-[22px] font-medium tracking-[-0.02em]">
            Nouvel objectif
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground shrink-0"
            style={{ background: "var(--bg-sunk)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* amount */}
        <div className="text-center pt-3 pb-1">
          <div className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase mb-1.5">
            Montant · EUR
          </div>
          <div className="flex items-end justify-center">
            <span
              className="font-display font-medium text-muted-foreground"
              style={{ fontSize: 30, lineHeight: 1, marginBottom: 8, marginRight: 2 }}
            >
              €
            </span>
            <input
              {...register("amount", { valueAsNumber: true })}
              type="number"
              inputMode="decimal"
              placeholder="0"
              step="0.01"
              min="0.01"
              className="font-display font-medium tracking-[-0.035em] bg-transparent border-none outline-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              style={{ fontSize: 64, lineHeight: 1, width: 180, color: "var(--ink)" }}
            />
          </div>
          {errors.amount && (
            <p className="text-destructive text-xs mt-1">{errors.amount.message}</p>
          )}
        </div>

        {/* category chips */}
        <div>
          <div className="mb-2">
            <div className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase">
              Catégorie
            </div>
          </div>
          {errors.category_id && (
            <p className="text-destructive text-xs mb-1">{errors.category_id.message}</p>
          )}
          {availableCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Toutes les catégories ont déjà un objectif ce mois-ci.
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {availableCategories.map((c) => {
                const active = c.id === selectedCategoryId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setValue("category_id", c.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium whitespace-nowrap shrink-0 transition-all",
                      active
                        ? "border-[1.5px] border-foreground"
                        : "border border-border hover:border-foreground/40"
                    )}
                    style={{
                      background: active ? "var(--pig)" : "var(--bg-elev)",
                      color: "var(--ink)",
                    }}
                  >
                    <CategoryIcon name={c.name} className="w-3.5 h-3.5" />
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {submitError && (
          <p role="alert" className="text-destructive text-sm">{submitError}</p>
        )}

        {/* submit */}
        <div className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-[15px] rounded-[14px] font-semibold text-[14px] text-muted-foreground"
            style={{ background: "var(--bg-sunk)" }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || availableCategories.length === 0}
            className={cn(
              "flex-[2] py-[15px] rounded-[14px] font-semibold text-[14px] flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-60"
            )}
            style={{ background: "var(--ink)", color: "var(--bg)" }}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Créer"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Modal wrapper (Sheet/Dialog dual-mode)
// ---------------------------------------------------------------------------

interface CreateGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  usedCategoryIds: Set<string>;
  onGoalCreated: () => void;
}

export function CreateGoalModal({ open, onOpenChange, month, usedCategoryIds, onGoalCreated }: CreateGoalModalProps) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function handleSuccess() {
    onOpenChange(false);
    toast.success("Objectif créé !");
    onGoalCreated();
  }

  function handleClose() {
    onOpenChange(false);
  }

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" showCloseButton={false} className="max-h-[90dvh] overflow-y-auto rounded-t-2xl p-0">
            <SheetTitle className="sr-only">Nouvel objectif</SheetTitle>
            <CreateGoalForm
              month={month}
              usedCategoryIds={usedCategoryIds}
              onSuccess={handleSuccess}
              onClose={handleClose}
              variant="mobile"
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-200" />
            <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] overflow-hidden shadow-2xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-200">
              <Dialog.Title className="sr-only">Nouvel objectif</Dialog.Title>
              <CreateGoalForm
                month={month}
                usedCategoryIds={usedCategoryIds}
                onSuccess={handleSuccess}
                onClose={handleClose}
                variant="desktop"
              />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
}
