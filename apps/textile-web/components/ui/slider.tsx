"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value = [0], onValueChange, min = 0, max = 100, step = 1, className }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      onValueChange?.([val]);
    }
    return (
      <div ref={ref} className={cn("relative flex w-full touch-none select-none items-center", className)}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          className="w-full h-2 bg-input rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
