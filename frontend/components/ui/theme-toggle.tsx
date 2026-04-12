"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "./button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="relative">
                <Sun className="h-[18px] w-[18px]" />
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative"
            aria-label="Toggle theme"
        >
            <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
        </Button>
    )
}
