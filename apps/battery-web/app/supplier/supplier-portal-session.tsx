"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { prepareSupplierCache } from "@/lib/supplier-cache";
import { clearSupplierSession, getSupplierSessionChannel } from "@/lib/supplier-session";

function isProtectedSupplierPage() {
  return /^\/supplier\/(dashboard|upload)\/?$/.test(window.location.pathname);
}

export default function SupplierPortalSession({ children }: { children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Protected reads also await this cleanup and can retry after a failure.
    void prepareSupplierCache().catch(() => {});

    function hideContent() {
      if (content.current) content.current.hidden = true;
    }
    function refreshSession() {
      clearSupplierSession();
      if (isProtectedSupplierPage()) {
        hideContent();
        window.location.reload();
      }
    }
    function onPageHide(event: PageTransitionEvent) {
      if (event.persisted && isProtectedSupplierPage()) hideContent();
    }
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted && isProtectedSupplierPage()) refreshSession();
    }

    const channel = getSupplierSessionChannel();
    channel?.addEventListener("message", refreshSession);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      channel?.removeEventListener("message", refreshSession);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return <div ref={content}>{children}</div>;
}
