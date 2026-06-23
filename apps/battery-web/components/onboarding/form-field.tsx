"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface FormFieldProps {
  label: ReactNode;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  multiline?: boolean;
  error?: string;
}

export function FormField({
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  helperText,
  multiline,
  error,
}: FormFieldProps) {
  const inputClasses =
    "w-full rounded-md border bg-secondary px-4 pl-11 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] transition-all";
  const normalClasses = "border-border focus:ring-emerald-500/30 focus:border-emerald-500";
  const errorClasses = "border-destructive/50 focus:ring-destructive/20 focus:border-destructive";

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        {multiline ? (
          <textarea
            required={required}
            className={`${inputClasses} min-h-[100px] py-3 resize-none ${error ? errorClasses : normalClasses}`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            type={type}
            required={required}
            className={`${inputClasses} h-12 ${error ? errorClasses : normalClasses}`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
      {helperText && !error && <p className="text-xs text-muted-foreground">{helperText}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
