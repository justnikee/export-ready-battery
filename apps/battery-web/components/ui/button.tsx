import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
 "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
 {
 variants: {
 variant: {
 // Default — dark authority, 8px radius
 default: "bg-primary text-primary-foreground rounded-md hover:bg-primary/90",
 destructive:
 "bg-destructive text-white rounded-md hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
 // Outline — borderless, fill-based surface
 outline:
 "bg-muted text-foreground rounded-md hover:bg-accent hover:text-accent-foreground",
 secondary:
 "bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80",
 ghost:
 "rounded-md hover:bg-accent hover:text-accent-foreground",
 // Link — brand color
 link: "text-[var(--brand-link)] underline-offset-4 hover:underline",
 // Accent — brand green CTA (use sparingly per design.md)
 accent:
 "bg-[var(--brand)] text-[var(--brand-foreground)] rounded-md hover:opacity-90",
 // Pill — primary CTA, borderless
 pill:
 "bg-primary text-primary-foreground rounded-full hover:bg-primary/90 dark:bg-[#0f0f0f] dark:text-[#fafafa]",
 // Pill muted — secondary pill CTA, borderless
 "pill-outline":
 "bg-primary text-primary-foreground rounded-full opacity-80 hover:opacity-100 dark:bg-[#0f0f0f] dark:text-[#fafafa]",
 // Pill brand — emerald pill
 "pill-brand":
 "bg-[var(--brand)] text-[var(--brand-foreground)] rounded-full hover:opacity-90",
 },
 size: {
 default: "h-9 px-4 py-2 has-[>svg]:px-3",
 sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
 lg: "h-10 px-8 has-[>svg]:px-6",
 xl: "h-12 px-10 text-base",
 // design.md pill: 8px 32px padding
 pill: "h-auto py-2 px-8",
 icon: "size-9",
 "icon-sm": "size-8",
 "icon-lg": "size-10",
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
 asChild = false,
 ...props
}: React.ComponentProps<"button"> &
 VariantProps<typeof buttonVariants> & {
 asChild?: boolean
 }) {
 const Comp = asChild ? Slot : "button"

 return (
 <Comp
 data-slot="button"
 data-variant={variant}
 data-size={size}
 className={cn(buttonVariants({ variant, size, className }))}
 {...props}
 />
 )
}

export { Button, buttonVariants }
