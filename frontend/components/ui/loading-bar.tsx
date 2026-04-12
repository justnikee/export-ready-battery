"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import NProgress from "nprogress"

// Configure NProgress
NProgress.configure({
 minimum: 0.1,
 easing: 'ease',
 speed: 400,
 showSpinner: false,
 trickleSpeed: 200,
})

export function LoadingBar() {
 const pathname = usePathname()
 const searchParams = useSearchParams()

 useEffect(() => {
 NProgress.done()
 }, [pathname, searchParams])

 return null
}

// Hook to manually control loading bar
export function useLoadingBar() {
 return {
 start: () => NProgress.start(),
 done: () => NProgress.done(),
 inc: () => NProgress.inc(),
 }
}
