"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const Accordion = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
))
Accordion.displayName = "Accordion"

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string
    isOpen?: boolean
    onToggle?: () => void
}

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    AccordionItemProps
>(({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("border border-zinc-800 rounded-lg bg-zinc-900/50 overflow-hidden", className)} {...props}>
        {children}
    </div>
))
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isOpen?: boolean
}

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    AccordionTriggerProps
>(({ className, children, isOpen, ...props }, ref) => (
    <button
        ref={ref}
        className={cn(
            "flex flex-1 items-center justify-between py-4 px-6 font-medium transition-all hover:bg-zinc-900/50 w-full text-left [&[data-state=open]>svg]:rotate-180",
            className
        )}
        data-state={isOpen ? "open" : "closed"}
        {...props}
    >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-zinc-500" />
    </button>
))
AccordionTrigger.displayName = "AccordionTrigger"

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
    isOpen?: boolean
}

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    AccordionContentProps
>(({ className, children, isOpen, ...props }, ref) => (
    <AnimatePresence initial={false}>
        {isOpen && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
            >
                <div className={cn("pb-4 pt-0 px-6 text-sm text-zinc-400", className)}>{children}</div>
            </motion.div>
        )}
    </AnimatePresence>
))
AccordionContent.displayName = "AccordionContent"

// Wrapper to manage state for single-open behavior
const AccordionSingle = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const [openItem, setOpenItem] = React.useState<string | null>(null)

    const handleToggle = (value: string) => {
        setOpenItem(openItem === value ? null : value)
    }

    return (
        <div className={cn("space-y-4", className)}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    const childElement = child as React.ReactElement<any>
                    const value = childElement.props.value

                    return React.cloneElement(childElement, {
                        isOpen: openItem === value,
                        onToggle: () => handleToggle(value),
                        children: React.Children.map(childElement.props.children, (subChild) => {
                            if (React.isValidElement(subChild)) {
                                const subChildElement = subChild as React.ReactElement<any>
                                if (subChildElement.type === AccordionTrigger) {
                                    return React.cloneElement(subChildElement, {
                                        onClick: () => handleToggle(value),
                                        isOpen: openItem === value
                                    })
                                }
                                if (subChildElement.type === AccordionContent) {
                                    return React.cloneElement(subChildElement, {
                                        isOpen: openItem === value
                                    })
                                }
                            }
                            return subChild
                        })
                    })
                }
                return child
            })}
        </div>
    )
}

export { AccordionSingle as Accordion, AccordionItem, AccordionTrigger, AccordionContent }
