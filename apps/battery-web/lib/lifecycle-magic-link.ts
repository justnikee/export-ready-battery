/**
 * Partner magic-link actions. Must stay aligned with:
 *   BatteryTransitionMap.AllowedFrom
 *   BatteryAllowedRolesByAction
 *   IsValidPartnerRole (LOGISTICS | TECHNICIAN | RECYCLER)
 * ADMIN-only actions (RECALL, ACTIVATE) are not issued as partner links.
 */

export type PartnerRole = "LOGISTICS" | "TECHNICIAN" | "RECYCLER";

export interface MagicLinkActionDef {
  action: string;
  labelKey: string;
  fallbackLabel: string;
  roles: PartnerRole[];
  allowedFrom: string[];
}

export const MAGIC_LINK_ACTIONS: MagicLinkActionDef[] = [
  {
    action: "SHIP",
    labelKey: "modal_action_ship",
    fallbackLabel: "I'm shipping this battery",
    roles: ["LOGISTICS"],
    allowedFrom: ["ACTIVE"],
  },
  {
    action: "INSTALL",
    labelKey: "modal_action_install",
    fallbackLabel: "I'm installing this battery",
    roles: ["TECHNICIAN"],
    allowedFrom: ["SHIPPED"],
  },
  {
    action: "RECYCLE",
    labelKey: "modal_action_recycle",
    fallbackLabel: "I'm recycling this battery",
    roles: ["RECYCLER"],
    allowedFrom: ["IN_SERVICE", "RECALLED"],
  },
  {
    action: "REMANUFACTURE",
    labelKey: "modal_action_remanufacture",
    fallbackLabel: "I'm remanufacturing this battery",
    roles: ["RECYCLER", "TECHNICIAN"],
    allowedFrom: ["IN_SERVICE", "RECALLED"],
  },
  {
    action: "REUSE",
    labelKey: "modal_action_reuse",
    fallbackLabel: "I'm sending this battery for reuse",
    roles: ["RECYCLER", "LOGISTICS"],
    allowedFrom: ["IN_SERVICE", "RECALLED"],
  },
  {
    action: "REPURPOSE",
    labelKey: "modal_action_repurpose",
    fallbackLabel: "I'm repurposing this battery",
    roles: ["RECYCLER", "TECHNICIAN"],
    allowedFrom: ["IN_SERVICE", "RECALLED"],
  },
  {
    action: "CLOSE",
    labelKey: "modal_action_close",
    fallbackLabel: "I'm finalizing disposal (End of Life)",
    roles: ["RECYCLER"],
    allowedFrom: ["RECYCLED", "RECALLED", "REMANUFACTURED", "REUSED", "REPURPOSED"],
  },
];

/** Actions a partner may request from this passport status. */
export function magicLinkActionsForStatus(status?: string): MagicLinkActionDef[] {
  if (!status) {
    return MAGIC_LINK_ACTIONS;
  }
  return MAGIC_LINK_ACTIONS.filter((def) => def.allowedFrom.includes(status));
}

export function defaultRoleForAction(action: string): PartnerRole {
  const def = MAGIC_LINK_ACTIONS.find((a) => a.action === action);
  return def?.roles[0] ?? "RECYCLER";
}
