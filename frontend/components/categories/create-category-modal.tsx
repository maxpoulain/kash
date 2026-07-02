"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@base-ui/react/dialog";
import { Minus, Plus, X, Tag } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ALLOWED_CATEGORY_ICONS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { createCategory } from "@/lib/api";
import type { Category, TransactionType } from "@/types/api";

const schema = z.object({
  name: z.string().min(1, "nameRequired").max(50, "nameTooLong"),
  icon: z.string().min(1, "iconRequired"),
  type: z.enum(["income", "expense"]),
});

type FormValues = z.infer<typeof schema>;

interface CreateCategoryFormProps {
  onSuccess: (category: Category) => void;
  onClose: () => void;
  variant?: "mobile" | "desktop";
}

function CreateCategoryForm({ onSuccess, onClose, variant = "mobile" }: CreateCategoryFormProps) {
  const t = useTranslations("categories.form");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "expense", icon: "Package" },
  });

  const selectedType = watch("type") as TransactionType;
  const selectedIcon = watch("icon");
  const isIncome = selectedType === "income";

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const category = await createCategory({
        name: values.name.trim(),
        icon: values.icon,
        type: values.type,
      });
      onSuccess(category);
    } catch (err) {
      if (err instanceof Error && err.message === "duplicate") {
        setSubmitError(t("duplicate"));
      } else {
        setSubmitError(t("submitError"));
      }
    }
  }

  const typeToggle = (
    <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted rounded-[12px]">
      {(["expense", "income"] as TransactionType[]).map((txType) => {
        const active = selectedType === txType;
        return (
          <button
            key={txType}
            type="button"
            onClick={() => setValue("type", txType)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-[8px] py-2.5 text-[13px] font-semibold transition-all",
              active ? "text-white" : "text-muted-foreground hover:text-foreground/70"
            )}
            style={active ? { background: txType === "expense" ? "var(--ink)" : "var(--accent)" } : {}}
          >
            {txType === "expense" ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {txType === "expense" ? t("expense") : t("income")}
          </button>
        );
      })}
    </div>
  );

  const iconPicker = (
    <div>
      <div className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase mb-2">
        {t("icon")}
      </div>
      {errors.icon && (
        <p className="text-destructive text-xs mb-2">{t(errors.icon.message as string)}</p>
      )}
      <div className="grid grid-cols-6 gap-1.5">
        {ALLOWED_CATEGORY_ICONS.map((item) => {
          const active = item.key === selectedIcon;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setValue("icon", item.key)}
              className={cn(
                "flex flex-col items-center gap-1 px-1 py-2 rounded-[10px] text-[10px] border transition-all cursor-pointer leading-tight text-center",
                active
                  ? "text-background border-foreground"
                  : "text-muted-foreground border-border hover:border-foreground/40"
              )}
              style={active ? { background: "var(--ink)" } : { background: "var(--bg-elev)" }}
              title={item.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </div>
  );

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
              <Tag size={20} />
            </div>
            <div className="font-display text-[20px] font-medium tracking-[-0.02em] leading-tight">
              {t("title")}
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
          {typeToggle}

          {/* name */}
          <div>
            <Label className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase mb-2 block">
              {t("name")}
            </Label>
            <Input
              {...register("name")}
              placeholder={t("namePlaceholder")}
              maxLength={50}
              className="text-[13px]"
            />
            {errors.name && (
              <p className="text-destructive text-xs mt-1">{t(errors.name.message as string)}</p>
            )}
          </div>

          {iconPicker}
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
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-40 py-2.5 rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-60"
              style={{
                background: isIncome ? "var(--accent)" : "var(--ink)",
                color: isIncome ? "var(--accent-foreground)" : "var(--bg)",
              }}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t("create")
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
            {t("title")}
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

        {typeToggle}

        {/* name */}
        <div>
          <div className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase mb-2">
            {t("name")}
          </div>
          <Input
            {...register("name")}
            placeholder={t("namePlaceholder")}
            maxLength={50}
            className="text-[13px]"
          />
          {errors.name && (
            <p className="text-destructive text-xs mt-1">{t(errors.name.message as string)}</p>
          )}
        </div>

        {iconPicker}

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
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "flex-[2] py-[15px] rounded-[14px] font-semibold text-[14px] flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-60"
            )}
            style={{
              background: isIncome ? "var(--accent)" : "var(--ink)",
              color: isIncome ? "var(--accent-foreground)" : "var(--bg)",
            }}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t("create")
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

interface CreateCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated: (category: Category) => void;
}

export function CreateCategoryModal({ open, onOpenChange, onCategoryCreated }: CreateCategoryModalProps) {
  const t = useTranslations("categories.form");
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function handleSuccess(category: Category) {
    onOpenChange(false);
    toast.success(t("success"));
    onCategoryCreated(category);
  }

  function handleClose() {
    onOpenChange(false);
  }

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" showCloseButton={false} className="max-h-[90dvh] overflow-y-auto rounded-t-2xl p-0">
            <SheetTitle className="sr-only">{t("title")}</SheetTitle>
            <CreateCategoryForm
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
              <Dialog.Title className="sr-only">{t("title")}</Dialog.Title>
              <CreateCategoryForm
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
