import { productTypeToSlug } from "@/lib/products";

const PRODUCT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const PRODUCT_COOKIE_NAME = "product_slug";
export const TENANT_PRODUCT_COOKIE_NAME = "tenant_product";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${PRODUCT_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function syncProductCookies(productType?: string | null) {
  const productSlug = productTypeToSlug(productType);
  setCookie(PRODUCT_COOKIE_NAME, productSlug);
  setCookie(TENANT_PRODUCT_COOKIE_NAME, productSlug);
}

export function clearProductCookies() {
  clearCookie(PRODUCT_COOKIE_NAME);
  clearCookie(TENANT_PRODUCT_COOKIE_NAME);
}
