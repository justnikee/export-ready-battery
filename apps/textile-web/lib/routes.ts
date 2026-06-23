/**
 * Centralised route builder for textile-web (flattened routes).
 *
 * Auth redirects (login, logout, post-onboarding, dashboard) go through
 * here so that adding a new product only requires updating this file.
 *
 * Usage:
 *   import { productRoutes } from "@/lib/routes";
 *   const routes = productRoutes(user?.product_type);
 *   router.push(routes.dashboard);
 */

import { type ProductSlug, productTypeToSlug } from "@/lib/products";

function routePrefixFromSlug(_productSlug: ProductSlug): string {
  return "";
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
 * Derive routes from the current pathname.
 * Use this inside components that don't have user context available.
 * e.g. const routes = routesFromPathname(usePathname())
 */
export function routesFromPathname(_pathname: string) {
  return productRoutesFromSlug("textile");
}

export function stripProductPrefix(pathname: string) {
  return pathname;
}

export function prefixProductPath(_pathname: string, targetPath: string) {
  const normalizedTarget = targetPath.startsWith("/")
    ? targetPath
    : `/${targetPath}`;
  return normalizedTarget;
}

export function dashboardPathFromPathname(_pathname: string, subpath?: string) {
  const dashboardRoot = "/dashboard";

  if (!subpath) {
    return dashboardRoot;
  }

  return `${dashboardRoot}/${subpath.replace(/^\/+/, "")}`;
}
