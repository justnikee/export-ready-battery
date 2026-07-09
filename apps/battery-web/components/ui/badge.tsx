import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
 "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] overflow-hidden",
 {
 variants: {
 variant: {
 default:
 "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
 secondary:
 "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
 destructive:
 "bg-destructive/10 text-destructive [a&]:hover:bg-destructive/15 dark:bg-destructive/20",
 outline:
 "bg-muted text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
 // Brand — emerald identity marker
 brand:
 "bg-[var(--brand)]/10 text-[var(--brand)] dark:bg-[var(--brand)]/15",
 // Status badges
 success:
 "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
 warning:
 "bg-amber-500/10 text-amber-500 dark:text-amber-400",
 error:
 "bg-red-500/10 text-red-500 dark:text-red-400",
 info:
 "bg-blue-500/10 text-blue-500 dark:text-blue-400",
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
