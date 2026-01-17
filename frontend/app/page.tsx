"use client"

import { PublicHeader } from "@/components/layout/public-header"
import { HeroSection } from "@/components/landing/HeroSection"
import { TrustBar } from "@/components/landing/TrustBar"
import { FeatureGrid } from "@/components/landing/FeatureGrid"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { CTAFooter } from "@/components/landing/CTAFooter"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black font-sans">
      <PublicHeader />
      <HeroSection />
      <TrustBar />
      <FeatureGrid />
      <HowItWorks />
      <CTAFooter />
    </div>
  )
}
