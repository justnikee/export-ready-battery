"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductConfig, type ProductSlug } from "@/lib/products";
import { productRoutesFromSlug } from "@/lib/routes";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  type: "login" | "register";
  productSlug: ProductSlug;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  type,
  productSlug,
}: AuthLayoutProps) {
  const product = getProductConfig(productSlug);
  if (!product) {
    return null;
  }

  const routes = productRoutesFromSlug(productSlug);

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-900">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-zinc-900 via-zinc-900 to-(--brand)/5" />

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
                {product.auth.heroTitle}
                <br />
                <span className="text-(--brand)">
                  {product.auth.heroHighlight}
                </span>
              </h2>
            </div>

            <div className="space-y-4">
              {product.auth.features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 rounded-xl border border-white/8 bg-white/4 p-4"
                >
                  <div className="shrink-0 rounded-lg bg-(--brand)/10 p-2">
                    <feature.icon className="h-5 w-5 text-(--brand)" />
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
          <p className="text-zinc-500 text-sm">{product.auth.footerTagline}</p>
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
                      href={routes.register}
                      className="text-(--brand) font-medium transition-colors hover:underline"
                    >
                      Create account
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Link
                      href={routes.login}
                      className="text-(--brand) font-medium transition-colors hover:underline"
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
