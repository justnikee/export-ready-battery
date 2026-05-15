/**
 * Centralised product-aware route builder.
 *
 * All auth redirects (login, logout, post-onboarding, dashboard) go through
 * here so that adding a new product only requires updating this file.
 *
 * Usage:
 *   import { productRoutes } from "@/lib/routes";
 *   const routes = productRoutes(user?.product_type);
 *   router.push(routes.dashboard);
 */

import { type ProductSlug, productTypeToSlug } from "@/lib/products";

function routePrefixFromSlug(productSlug: ProductSlug): string {
  return `/${productSlug}`;
}

export function productRoutes(productType?: string | null) {
  return productRoutesFromSlug(productTypeToSlug(productType));
}

export function productRoutesFromSlug(productSlug: ProductSlug) {
  const p = routePrefixFromSlug(productSlug);
  return {
    login: `${p}/login`,
    register: `${p}/register`,
    forgotPassword: `${p}/forgot-password`,
    resetPassword: `${p}/reset-password`,
    verifyEmail: `${p}/verify-email`,
    acceptInvite: `${p}/accept-invite`,
    dashboard: `${p}/dashboard`,
    onboarding: `${p}/onboarding`,
    batches: `${p}/dashboard/batches`,
  };
}

/**
 * Derive product type from the current pathname.
 * Use this inside components that don't have user context available.
 * e.g. const routes = routesFromPathname(usePathname())
 */
export function routesFromPathname(pathname: string) {
  return productRoutesFromSlug(
    productTypeToSlug(pathname.startsWith("/textile") ? "TEXTILE" : "BATTERY"),
  );
}

export function stripProductPrefix(pathname: string) {
  const stripped = pathname.replace(/^\/(battery|textile)(?=\/|$)/, "");
  return stripped || "/";
}

export function prefixProductPath(pathname: string, targetPath: string) {
  if (/^\/(battery|textile)(\/|$)/.test(targetPath)) {
    return targetPath;
  }

  const normalizedTarget = targetPath.startsWith("/")
    ? targetPath
    : `/${targetPath}`;

  return `${routePrefixFromSlug(
    pathname.startsWith("/textile") ? "textile" : "battery",
  )}${normalizedTarget}`;
}

export function dashboardPathFromPathname(pathname: string, subpath?: string) {
  const dashboardRoot = routesFromPathname(pathname).dashboard;

  if (!subpath) {
    return dashboardRoot;
  }

  return `${dashboardRoot}/${subpath.replace(/^\/+/, "")}`;
}
