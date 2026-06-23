"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Building2,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { dashboardPathFromPathname } from "@/lib/routes";
import { useAuth } from "@/context/auth-context";
import { DataAccessTokens } from "@/components/settings/data-access-tokens";
import { DataVisibility } from "@/components/settings/data-visibility";
import {
  mapPrimaryMarketToList,
  mapPrimaryMarketsToSelection,
  normalizeTextileArray,
  TEXTILE_CERTIFICATION_OPTIONS,
  TEXTILE_FACILITY_TYPE_OPTIONS,
  TEXTILE_FIBER_TYPE_OPTIONS,
  TEXTILE_PRIMARY_MARKET_OPTIONS,
  TEXTILE_SUPPLY_CHAIN_TIER_OPTIONS,
} from "@/lib/textile-profile";

type TextileSettingsTab = "profile" | "privacy" | "tokens";

const TEXTILE_VISIBILITY_FIELDS = [
  {
    key: "material_composition",
    label: "Material Composition & Blend",
    desc: "Fiber mix, trims, and composition claims",
  },
  {
    key: "supply_chain",
    label: "Supply Chain & Origin Data",
    desc: "Facility mappings, sourcing origins, and manufacturing stages",
  },
  {
    key: "compliance_docs",
    label: "Compliance & Certificate Documents",
    desc: "Audit records, restricted substance declarations, and certificates",
  },
  {
    key: "care_lifecycle",
    label: "Care, Repair & End-of-Life Guidance",
    desc: "Consumer care guidance and circularity instructions",
  },
] as const;

export function TextileSettingsPage() {
  const { user, refreshUser } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TextileSettingsTab>(
    (searchParams.get("tab") as TextileSettingsTab) || "profile",
  );
  const [formData, setFormData] = useState({
    company_name: "",
    address: "",
    support_email: "",
    website: "",
    data_visibility: {} as Record<string, string>,
    textile_primary_market: "both",
    textile_facility_type: "manufacturer",
    textile_supply_chain_tier: "multi_tier",
    textile_default_fiber_types: [] as string[],
    textile_certifications: [] as string[],
    textile_publish_scope: "internal",
  });

  const teamHref = dashboardPathFromPathname(pathname, "team");
  const batchesHref = dashboardPathFromPathname(pathname, "batches");
  const complianceHref = dashboardPathFromPathname(pathname, "compliance");

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData({
      company_name: user.company_name || "",
      address: user.address || "",
      support_email: user.support_email || "",
      website: user.website || "",
      data_visibility: user.data_visibility || {},
      textile_primary_market: mapPrimaryMarketsToSelection(
        user.textile_primary_markets,
      ),
      textile_facility_type:
        user.textile_facility_type === "mill" ||
        user.textile_facility_type === "brand" ||
        user.textile_facility_type === "integrated"
          ? user.textile_facility_type
          : "manufacturer",
      textile_supply_chain_tier:
        user.textile_supply_chain_tier === "tier_1" ||
        user.textile_supply_chain_tier === "tier_2"
          ? user.textile_supply_chain_tier
          : "multi_tier",
      textile_default_fiber_types: normalizeTextileArray(
        user.textile_default_fiber_types,
      ),
      textile_certifications: normalizeTextileArray(
        user.textile_certifications,
      ),
      textile_publish_scope:
        user.textile_compliance_defaults?.publish_scope === "partner" ||
        user.textile_compliance_defaults?.publish_scope === "public"
          ? user.textile_compliance_defaults.publish_scope
          : "internal",
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put("/auth/profile", {
        company_name: formData.company_name,
        address: formData.address,
        support_email: formData.support_email,
        website: formData.website,
        data_visibility: formData.data_visibility,
        textile_facility_type: formData.textile_facility_type,
        textile_supply_chain_tier: formData.textile_supply_chain_tier,
        textile_primary_markets: mapPrimaryMarketToList(
          formData.textile_primary_market as "domestic" | "export" | "both",
        ),
        textile_default_fiber_types: formData.textile_default_fiber_types,
        textile_certifications: formData.textile_certifications,
        textile_compliance_defaults: {
          publish_scope: formData.textile_publish_scope,
        },
      });
      await refreshUser();
      toast.success("Textile workspace settings updated");
    } catch (error) {
      console.error("Failed to update textile settings:", error);
      toast.error("Failed to update textile settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl text-foreground tracking-tight">
            Textile Workspace Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your organization profile, sharing defaults, and partner
            access for textile traceability workflows.
          </p>
        </div>

        <div className="flex gap-1 bg-muted p-1">
          {[
            { id: "profile" as const, label: "Profile" },
            { id: "privacy" as const, label: "Data Sharing" },
            { id: "tokens" as const, label: "Access Tokens" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <div className="space-y-6">
                <div className="border border-border bg-card p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-lg border border-blue-200 bg-blue-500/10 p-2">
                      <Building2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-base font-medium text-foreground">
                        Organization Profile
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Basic information shown across textile dashboards and
                        future product passports.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">
                        Company Name
                      </span>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={formData.company_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              company_name: e.target.value,
                            })
                          }
                          className="w-full border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="AnvayaLabs Textile"
                        />
                      </div>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">
                        Support Email
                      </span>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                          type="email"
                          value={formData.support_email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              support_email: e.target.value,
                            })
                          }
                          className="w-full border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="support@anvayalabs.in"
                        />
                      </div>
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-foreground">
                        Address
                      </span>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                          className="w-full border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Registered office or primary operations address"
                        />
                      </div>
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-foreground">
                        Website
                      </span>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              website: e.target.value,
                            })
                          }
                          className="w-full border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="https://example.com"
                        />
                      </div>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">
                        Primary market
                      </span>
                      <select
                        value={formData.textile_primary_market}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            textile_primary_market: e.target.value,
                          })
                        }
                        className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {TEXTILE_PRIMARY_MARKET_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">
                        Facility type
                      </span>
                      <select
                        value={formData.textile_facility_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            textile_facility_type: e.target.value,
                          })
                        }
                        className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {TEXTILE_FACILITY_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">
                        Supply-chain tier
                      </span>
                      <select
                        value={formData.textile_supply_chain_tier}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            textile_supply_chain_tier: e.target.value,
                          })
                        }
                        className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {TEXTILE_SUPPLY_CHAIN_TIER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">
                        Publish readiness
                      </span>
                      <select
                        value={formData.textile_publish_scope}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            textile_publish_scope: e.target.value,
                          })
                        }
                        className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {[
                          { value: "internal", label: "Internal first" },
                          { value: "partner", label: "Partner-ready" },
                          { value: "public", label: "Public-ready" },
                        ].map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-foreground">
                        Default fiber types
                      </span>
                      <div className="grid gap-3 md:grid-cols-2">
                        {TEXTILE_FIBER_TYPE_OPTIONS.map((option) => {
                          const selected =
                            formData.textile_default_fiber_types.includes(
                              option.value,
                            );

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  textile_default_fiber_types: selected
                                    ? formData.textile_default_fiber_types.filter(
                                        (item) => item !== option.value,
                                      )
                                    : [
                                        ...formData.textile_default_fiber_types,
                                        option.value,
                                      ],
                                })
                              }
                              className={`border px-3 py-2 text-left text-sm transition-colors ${
                                selected
                                  ? "border-cyan-500 bg-cyan-500/10 text-foreground"
                                  : "border-border bg-background text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-foreground">
                        Certifications in scope
                      </span>
                      <div className="grid gap-3 md:grid-cols-2">
                        {TEXTILE_CERTIFICATION_OPTIONS.map((option) => {
                          const selected =
                            formData.textile_certifications.includes(
                              option.value,
                            );

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  textile_certifications: selected
                                    ? formData.textile_certifications.filter(
                                        (item) => item !== option.value,
                                      )
                                    : [
                                        ...formData.textile_certifications,
                                        option.value,
                                      ],
                                })
                              }
                              className={`border px-3 py-2 text-left text-sm transition-colors ${
                                selected
                                  ? "border-cyan-500 bg-cyan-500/10 text-foreground"
                                  : "border-border bg-background text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end border-t border-border pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Settings className="h-4 w-4" />
                      )}
                      Save Workspace Settings
                    </button>
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="border border-border bg-card p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-medium text-foreground">
                      Textile Separation
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Battery-specific EPR, BIS, and PLI workflows stay on the
                    battery product. Textile-specific compliance and
                    traceability modules live in this product area.
                  </p>
                  <Link
                    href={complianceHref}
                    className="mt-4 inline-flex text-sm font-medium text-blue-500 hover:underline"
                  >
                    Open Textile Compliance →
                  </Link>
                </div>

                <div className="border border-border bg-card p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-medium text-foreground">
                      Workspace Readiness
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Invite internal operators and external partners.</li>
                    <li>
                      Set sharing defaults before publishing traceability data.
                    </li>
                    <li>Create production lots once profile basics are set.</li>
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <Link
                      href={teamHref}
                      className="text-blue-500 hover:underline"
                    >
                      Manage Team
                    </Link>
                    <Link
                      href={batchesHref}
                      className="text-blue-500 hover:underline"
                    >
                      Open Lots
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </form>
        )}

        {activeTab === "privacy" && (
          <DataVisibility
            dataVisibility={formData.data_visibility}
            onChange={(nextVisibility) =>
              setFormData({ ...formData, data_visibility: nextVisibility })
            }
            title="Traceability Visibility Configuration"
            description="Control which textile traceability categories are visible to partners, regulators, and the public."
            note="Public data is visible to anyone scanning a textile product record. Partner data requires a valid Data Access Token."
            fields={[...TEXTILE_VISIBILITY_FIELDS]}
          />
        )}

        {activeTab === "tokens" && (
          <DataAccessTokens
            description="Manage API tokens for mills, brands, auditors, and regulators to access textile traceability records."
            tokenAccessDescription="This token grants direct access to your textile traceability records."
            emptyStateDescription="Generate tokens to grant secure, role-based access to your textile traceability records."
          />
        )}
      </div>
    </div>
  );
}
