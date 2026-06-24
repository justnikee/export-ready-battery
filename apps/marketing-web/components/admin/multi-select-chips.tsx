"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  label: string;
}

export function MultiSelectChips({
  name,
  options,
  defaultSelected = [],
  emptyMessage = "None yet — add some first.",
}: {
  name: string;
  options: Option[];
  defaultSelected?: string[];
  emptyMessage?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.length === 0 && (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
      {options.map((option) => {
        const isSelected = selected.has(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => toggle(option.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {option.label}
          </button>
        );
      })}
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
