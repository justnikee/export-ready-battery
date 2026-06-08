"use client"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { CheckCircle2, AlertCircle, Circle } from "lucide-react"

interface FormFieldProps {
  label: string
  description?: string
  error?: string
  touched?: boolean
  valid?: boolean
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  description,
  error,
  touched,
  valid,
  required,
  children,
  className,
}: FormFieldProps) {
  const hasError = !!error
  const isValid = valid && touched && !hasError
  const isUntouched = !touched && !hasError

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <Label
          className={cn(
            "text-xs font-medium uppercase tracking-wider flex items-center gap-1.5",
            hasError && "text-red-500",
            isValid && "text-emerald-600",
          )}
        >
          {label}
          {required && <span className="text-red-500">*</span>}
          {isUntouched && (
            <Circle className="h-3 w-3 text-muted-foreground/50" />
          )}
          {isValid && (
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          )}
          {hasError && (
            <AlertCircle className="h-3 w-3 text-red-500" />
          )}
        </Label>
      </div>

      {description && (
        <p className="text-[11px] text-muted-foreground leading-snug">
          {description}
        </p>
      )}

      <div className="relative">
        {children}
      </div>

      {hasError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
