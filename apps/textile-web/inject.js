void (async () => {
  const fs = await import("node:fs");
  let c = fs.readFileSync(
    "d:/ExportReady-Battery/frontend/components/settings/battery-settings-page.tsx",
    "utf8",
  );

  c = c.replace(
    'import { DataAccessTokens } from "@/components/settings/data-access-tokens"',
    'import { DataAccessTokens } from "@/components/settings/data-access-tokens"\nimport { DataVisibility } from "@/components/settings/data-visibility"',
  );

  c = c.replace(
    'morth_factory_codes: "",\n        // EU',
    'morth_factory_codes: "",\n        data_visibility: {} as Record<string, string>,\n        // EU',
  );

  c = c.replace(
    'morth_factory_codes: user.morth_factory_codes || "",\n                eu_authorized',
    'morth_factory_codes: user.morth_factory_codes || "",\n                data_visibility: user.data_visibility || {},\n                eu_authorized',
  );

  c = c.replace(
    "{/* Data Access Tokens Card */}",
    "{/* Data Visibility Config */}\n                <DataVisibility dataVisibility={formData.data_visibility} onChange={(v) => setFormData({...formData, data_visibility: v})} />\n\n                {/* Data Access Tokens Card */}",
  );

  fs.writeFileSync(
    "d:/ExportReady-Battery/frontend/components/settings/battery-settings-page.tsx",
    c,
  );
})();
