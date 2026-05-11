"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Zap, Globe } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  type: "login" | "register";
}

const features = [
  {
    icon: Shield,
    title: "India (PLI/EPR) & EU Regulation Ready",
    description: "Full compliance with 2026 Draft Rules & EU 2027",
  },
  {
    icon: Globe,
    title: "Secure Traceability from Cell to Pack",
    description: "End-to-end battery passport tracking",
  },
  {
    icon: Zap,
    title: "Industrial-Scale Label Generation",
    description: "Generate thousands of QR labels in seconds",
  },
];

export function AuthLayout({
  children,
  title,
  subtitle,
  type,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-900">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-[var(--brand)]/5" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(62, 207, 142, 0.6) 1px, transparent 1px),
 linear-gradient(90deg, rgba(62, 207, 142, 0.6) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Brand */}
          <Link href="/" className="flex items-center text-white group w-fit">
            <span className="text-xl tracking-tight">ANVAYALABS</span>
          </Link>

          {/* Hero Copy + Features */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl text-white leading-tight">
                Compliance Infrastructure
                <br />
                <span className="text-[var(--brand)]">
                  for Battery Manufacturers
                </span>
              </h2>
            </div>

            <div className="space-y-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                >
                  <div className="p-2 rounded-lg bg-[var(--brand)]/10 shrink-0">
                    <feature.icon className="h-5 w-5 text-[var(--brand)]" />
                  </div>
                  <div>
                    <h3 className="text-white text-sm">{feature.title}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom tagline */}
          <p className="text-zinc-500 text-sm">
            Powering compliance for battery manufacturers across India & Europe
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden p-6 border-b border-border">
          <Link href="/" className="flex items-center">
            <span className="text-lg tracking-tight text-foreground">
              ANVAYALABS
            </span>
          </Link>
        </div>

        {/* Back link */}
        <div className="p-6 lg:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Title */}
            <div className="mb-8">
              <h1 className="text-3xl text-foreground mb-2">{title}</h1>
              <p className="text-muted-foreground">{subtitle}</p>
            </div>

            {/* Form slot */}
            {children}

            {/* Footer link */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                {type === "login" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/register"
                      className="text-[var(--brand)] hover:underline font-medium transition-colors"
                    >
                      Create account
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-[var(--brand)] hover:underline font-medium transition-colors"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-xs text-muted-foreground">
          &copy; 2026 AnvayaLabs. All rights reserved.
        </div>
      </div>
    </div>
  );
}
