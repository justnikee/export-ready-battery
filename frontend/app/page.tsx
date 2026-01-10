"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Battery, ShieldCheck, Zap, ArrowRight, Database } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Battery className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">ExportReady</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          <Link href="#docs" className="hover:text-primary transition-colors">Docs</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center bg-linear-to-b from-white to-slate-50">
        <div className="bg-primary/5 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6 inline-flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          EU Battery Regulation Compliant
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mb-6">
          The Digital Passport for <span className="text-primary">Next-Gen Batteries</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mb-10">
          Ensure compliance, track lifecycle, and show transparency with our secure, scalable Digital Battery Passport platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 text-lg">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
              View Live Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need for compliance</h2>
            <p className="text-slate-500 text-lg">Powerful features built for manufacturers and recyclers.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-lg hover:border-primary/20">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Batch Management</h3>
              <p className="text-slate-500">Organize production into batches. Define shared specs like chemistry, voltage, and capacity once.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-lg hover:border-primary/20">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">High-Speed Creation</h3>
              <p className="text-slate-500">Upload CSVs with thousands of serial numbers. Generate secure passports and QR codes in seconds.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-lg hover:border-primary/20">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Public Verification</h3>
              <p className="text-slate-500">Each passport gets a unique public page. Consumers can scan QR codes to verify authenticity instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-slate-900 text-slate-400 text-sm mb-0">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center bg-slate-900 text-slate-400">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Battery className="h-5 w-5" />
            <span className="font-semibold text-slate-200">ExportReady</span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white">Privacy</Link>
            <Link href="#" className="hover:text-white">Terms</Link>
            <Link href="#" className="hover:text-white">Contact</Link>
          </div>
          <div className="mt-4 md:mt-0">
            © 2024 Battery Passport Inc.
          </div>
        </div>
      </footer>
    </div>
  )
}
