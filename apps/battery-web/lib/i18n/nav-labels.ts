// Maps the English nav group/item labels defined in lib/products.ts to their
// translation keys (STRAT-02). Kept separate from products.ts so the shared
// product-config shape (also used by textile) doesn't have to carry
// battery-specific i18n keys. Anything not in this map renders untranslated
// (falls through to the English literal already in products.ts), which is
// the safe default for nav items added without a translation yet.
export const NAV_GROUP_LABEL_KEYS: Record<string, string> = {
  Overview: "nav_group_overview",
  Production: "nav_group_production",
  Compliance: "nav_group_compliance",
  "Supply Chain": "nav_group_supply_chain",
  Account: "nav_group_account",
  Developer: "nav_group_developer",
  Admin: "nav_group_admin",
};

export const NAV_ITEM_LABEL_KEYS: Record<string, string> = {
  Dashboard: "nav_dashboard",
  Analytics: "nav_analytics",
  Batches: "nav_batches",
  Dispatch: "nav_dispatch",
  Lifecycle: "nav_lifecycle",
  Templates: "nav_templates",
  "Fleet Health": "nav_fleet_health",
  "BMS Telemetry": "nav_bms_telemetry",
  "India Compliance": "nav_india_compliance",
  "EU Compliance": "nav_eu_compliance",
  "Carbon Calculator": "nav_carbon_calculator",
  "Mass Balance": "nav_mass_balance",
  "DGFT Claims": "nav_dgft_claims",
  "Suppliers & DD": "nav_suppliers_dd",
  Regulatory: "nav_regulatory",
  Team: "nav_team",
  Partners: "nav_partners",
  Billing: "nav_billing",
  Settings: "nav_settings",
  "API Keys": "nav_api_keys",
  Downloads: "nav_downloads",
  Docs: "nav_docs",
  "Admin Panel": "nav_admin_panel",
};
