/**
 * Shared RBAC helpers for frontend role checks.
 *
 * These mirror the backend's canonical role set (OWNER / ADMIN / MEMBER / VIEWER).
 * All role comparisons should go through these helpers instead of inline
 * `user.role === "OWNER" || user.role === "ADMIN"` checks, so there is one
 * place to update if the role vocabulary changes.
 *
 * UX-only for disabling buttons/menus. The real gate is server-side:
 * `middleware.RequireWrite` (OWNER|ADMIN|MEMBER) on mutating routes (S-02).
 * VIEWER calls to write APIs receive 403 even if the UI is bypassed.
 */

/** Canonical role constants (UPPERCASE, matching backend). */
export const ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Returns true if the role is OWNER or ADMIN — the two roles that can manage
 * team members, see admin panels, and perform privileged write operations.
 */
export function isAdminRole(role?: string | null): boolean {
  return role === ROLES.OWNER || role === ROLES.ADMIN;
}

/**
 * Returns true if the role is OWNER — the only role that can do billing,
 * delete org, and transfer ownership.
 */
export function isOwnerRole(role?: string | null): boolean {
  return role === ROLES.OWNER;
}

/**
 * Returns true if the role allows write operations (OWNER, ADMIN, MEMBER).
 * VIEWERs cannot write.
 */
export function canWrite(role?: string | null): boolean {
  return role === ROLES.OWNER || role === ROLES.ADMIN || role === ROLES.MEMBER;
}
