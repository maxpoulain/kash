import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/20 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Ink pill — primary CTA per Kash design spec */
        default:
          "bg-foreground text-background hover:bg-foreground/90 shadow-sm",
        /* Piggy — money-moving actions (save, top-up, feed piggy) */
        piggy:
          "bg-primary text-primary-foreground shadow-[inset_0_-3px_0_var(--pig-shadow)] hover:opacity-90",
        outline:
          "border-foreground bg-transparent text-foreground hover:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "bg-muted text-foreground hover:bg-muted/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        link: "text-foreground underline-offset-4 hover:underline",
        accent:
          "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm",
      },
      size: {
        default:
          "h-10 gap-2 px-5",
        xs: "h-7 gap-1.5 rounded-full px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 rounded-full px-4 text-[0.8rem] [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 gap-2 rounded-full px-7 text-base",
        /* Icon buttons use a softer square radius */
        icon: "size-10 rounded-[10px]",
        "icon-xs": "size-7 rounded-[8px] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-[8px]",
        "icon-lg": "size-12 rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
