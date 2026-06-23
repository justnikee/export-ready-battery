"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { productRoutes } from "@/lib/routes";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      // Authenticated → send to dashboard (or onboarding if incomplete)
      const dest = user.onboarding_completed
        ? productRoutes(user.product_type).dashboard
        : productRoutes(user.product_type).onboarding;
      router.replace(dest);
    } else {
      // Not authenticated → send to login
      router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  );
}
