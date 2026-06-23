"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { productRoutes } from "@/lib/routes"
import { AlertTriangle, X, ShieldCheck } from "lucide-react"
import Link from "next/link"

interface CompletenessItem {
  label: string
  done: boolean
  market: "india" | "eu" | "global"
}

function getProfileCompleteness(user: NonNullable<ReturnType<typeof useAuth>["user"]>): {
  score: number
  items: CompletenessItem[]
  blockers: string[]
  requiredIncomplete: number
} {
  const items: CompletenessItem[] = []
  const blockers: string[] = []

  // Only require the compliance items that match the user's target market.
  // This mirrors the onboarding/settings flows, which hide EU fields for
  // India-only accounts (and India fields for EU-only accounts). Without this,
  // an India-only manufacturer is permanently stuck below 100% for an "EU
  // Representative" item they're never shown a field to complete.
  const market = user.data_visibility?.primary_market || "india"
  const includeIndia = market === "india" || market === "both"
  const includeEU = market === "eu" || market === "both"

  // India items
  if (includeIndia) {
    const hasEprNumber = !!user.epr_registration_number?.trim()
    const hasEprCert = user.epr_status === "PENDING" || user.epr_status === "VERIFIED"
    const hasBisNumber = !!user.bis_r_number?.trim()
    const hasBisCert = user.bis_status === "PENDING" || user.bis_status === "VERIFIED"
    const hasIec = !!user.iec_code?.trim()
    const hasMorth = !!user.morth_manufacturer_code?.trim() && user.morth_manufacturer_code !== "TBC"

    items.push({ label: "EPR Registration", done: hasEprNumber && hasEprCert, market: "india" })
    items.push({ label: "BIS Certification", done: hasBisNumber && hasBisCert, market: "india" })
    items.push({ label: "IEC Code", done: hasIec, market: "india" })
    items.push({ label: "MoRTH Code", done: hasMorth, market: "india" })

    if (hasEprNumber && !hasEprCert) blockers.push("EPR certificate required for India activation")
    if (hasBisNumber && !hasBisCert) blockers.push("BIS certificate required for India activation")
  }

  // EU items
  if (includeEU) {
    const hasEuRep = !!user.eu_authorized_representative_name?.trim()
    const hasEuEmail = !!user.eu_contact_email?.trim()
    const hasEuAddress = !!user.eu_authorized_representative_address?.trim()

    items.push({ label: "EU Representative", done: hasEuRep && hasEuEmail && hasEuAddress, market: "eu" })
  }

  // Core items
  items.push({ label: "Company Profile", done: !!user.company_name?.trim() && !!user.address?.trim(), market: "global" })

  const doneCount = items.filter((i) => i.done).length
  const requiredCount = items.filter((i) => i.market !== "global").length
  const requiredDone = items.filter((i) => i.market !== "global" && i.done).length
  const score = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 100

  return { score, items, blockers, requiredIncomplete: requiredCount - requiredDone }
}

const BANNER_DISMISS_KEY = "profile_banner_dismissed_at"
const BANNER_COOLDOWN_HOURS = 24

export function ProfileCompletenessBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const dismissedAt = localStorage.getItem(BANNER_DISMISS_KEY)
    if (!dismissedAt) return
    const hoursSince = (Date.now() - parseInt(dismissedAt)) / 3600000
    setDismissed(hoursSince < BANNER_COOLDOWN_HOURS)
  }, [])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(BANNER_DISMISS_KEY, String(Date.now()))
    setDismissed(true)
  }, [])

  if (!user) return null

  const { score, items, blockers, requiredIncomplete } = getProfileCompleteness(user)
  const hasBlockers = blockers.length > 0
  const needsAttention = hasBlockers || requiredIncomplete > 0

  // Nothing left to do — never show a "complete your profile" nag at 100%,
  // and don't let a stale dismiss-cooldown keep it hidden once it does need attention again.
  if (!needsAttention || dismissed) return null

  return (
    <div
      className={`px-4 py-3 border-b ${
        hasBlockers
          ? "bg-red-500/10 border-red-500/20"
          : score >= 80
            ? "bg-amber-500/10 border-amber-500/20"
            : "bg-red-500/10 border-red-500/20"
      }`}
    >
      <div className="flex items-start gap-3">
        {hasBlockers ? (
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-medium ${hasBlockers ? "text-red-300" : "text-amber-300"}`}>
              Profile {score}% complete
            </p>
            <span className="text-xs text-muted-foreground">
              ({items.filter((i) => i.done).length}/{items.length} items)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-1.5 mb-2 max-w-md">
            <div
              className={`h-1.5 rounded-full transition-all ${
                score === 100 ? "bg-emerald-500" : hasBlockers ? "bg-red-400" : "bg-amber-400"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>

          {hasBlockers ? (
            <div className="text-xs text-red-300">
              <p className="font-medium mb-0.5">Batch activation will be blocked:</p>
              <ul className="list-disc list-inside">
                {blockers.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <p className="mt-1.5">
                <Link href={`${productRoutes(user?.product_type).onboarding}?step=3`} className="underline hover:text-foreground">
                  Resume Onboarding
                </Link>{" "}
                or{" "}
                <Link href="/dashboard/settings?tab=compliance" className="underline hover:text-foreground">
                  Go to Settings
                </Link>
              </p>
            </div>
          ) : (
            <p className="text-xs text-amber-300">
              Complete your compliance profile to enable batch activation.{" "}
              <Link href="/onboarding?step=3" className="underline hover:text-foreground">
                Resume Onboarding
              </Link>{" "}
              or{" "}
              <Link href="/dashboard/settings?tab=compliance" className="underline hover:text-foreground">
                Go to Settings
              </Link>
            </p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
