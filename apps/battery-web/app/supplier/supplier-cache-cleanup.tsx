"use client";

import { useEffect } from "react";
import { prepareSupplierCache } from "@/lib/supplier-cache";

export default function SupplierCacheCleanup() {
  useEffect(() => {
    // Protected reads also await this cleanup and can retry after a failure.
    void prepareSupplierCache().catch(() => {});
  }, []);
  return null;
}
