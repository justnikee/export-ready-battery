import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive/10 text-destructive border-destructive/20 [a&]:hover:bg-destructive/15 dark:bg-destructive/20",
        outline:
          "text-foreground border-border [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Brand — emerald identity marker
        brand:
          "border-[var(--brand-border)] bg-[var(--brand)]/10 text-[var(--brand)] dark:bg-[var(--brand)]/15",
        // Status badges
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-500 dark:text-amber-400",
        error:
          "border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400",
        info:
          "border-blue-500/20 bg-blue-500/10 text-blue-500 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
