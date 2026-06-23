"use client";

import { Suspense } from "react";
import SupplierLoginForm from "./supplier-login-form";

export default function SupplierLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SupplierLoginForm />
    </Suspense>
  );
}
