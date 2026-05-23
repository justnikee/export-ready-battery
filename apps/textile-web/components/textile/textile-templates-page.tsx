"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck,
  FileStack,
  Layers3,
  Settings,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { dashboardPathFromPathname } from "@/lib/routes";
import { textileStageLabel } from "@/lib/textile-profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateTextileTemplateDialog } from "@/components/textile/create-textile-template-dialog";
import { CreateTextileLotDialog } from "@/components/textile/create-textile-lot-dialog";

interface TextileTemplate {
  id: string;
  name: string;
  created_at: string;
  specs?: {
    manufacturer?: string;
    material_profile?: string;
    chemistry?: string;
    lot_size?: string;
    production_stage?: string;
    country_of_origin?: string;
    certifications?: string[];
  };
}

interface TemplatesResponse {
  templates?: TextileTemplate[];
}

export function TextileTemplatesPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [templates, setTemplates] = useState<TextileTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLotOpen, setCreateLotOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const lotsHref = dashboardPathFromPathname(pathname, "batches");
  const lifecycleHref = dashboardPathFromPathname(pathname, "lifecycle");
  const settingsHref = dashboardPathFromPathname(pathname, "settings");

  const fetchTemplates = useCallback(async () => {
    if (!user?.tenant_id) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.get<TemplatesResponse>(
        `/templates?tenant_id=${user.tenant_id}&product_type=TEXTILE`,
      );
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error("Failed to load textile templates:", error);
      toast.error("Failed to load textile templates");
    } finally {
      setLoading(false);
    }
  }, [user?.tenant_id]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (templates.length === 0) {
      setSelectedTemplateId(null);
      return;
    }

    if (
      !selectedTemplateId ||
      !templates.some((item) => item.id === selectedTemplateId)
    ) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [selectedTemplateId, templates]);

  const selectedTemplate = templates.find(
    (template) => template.id === selectedTemplateId,
  );
  const selectedSpecs = selectedTemplate?.specs;
  const requiredFields = [
    {
      label: "Material profile",
      value: selectedSpecs?.material_profile || selectedSpecs?.chemistry || "",
    },
    {
      label: "Manufacturer",
      value: selectedSpecs?.manufacturer || "",
    },
    {
      label: "Country of origin",
      value: selectedSpecs?.country_of_origin || "",
    },
  ];
  const recommendedFields = [
    {
      label: "Production stage",
      value: textileStageLabel(selectedSpecs?.production_stage),
      isSet: Boolean(selectedSpecs?.production_stage),
    },
    {
      label: "Lot size",
      value: selectedSpecs?.lot_size || "Not set",
      isSet: Boolean(selectedSpecs?.lot_size),
    },
    {
      label: "Certifications",
      value: selectedSpecs?.certifications?.length
        ? selectedSpecs.certifications.join(", ")
        : "Not set",
      isSet: Boolean(selectedSpecs?.certifications?.length),
    },
  ];
  const requiredReady =
    selectedTemplate != null &&
    requiredFields.every((field) => Boolean(field.value));
  const certificationsReady = Boolean(selectedSpecs?.certifications?.length);
  const stageReady = Boolean(selectedSpecs?.production_stage);
  const documentStatuses = [
    {
      label: "Passport preview",
      ready: requiredReady,
      note: requiredReady
        ? "Core textile passport fields are present for review."
        : "Complete the required textile passport fields first.",
    },
    {
      label: "Compliance handoff",
      ready: requiredReady && certificationsReady && stageReady,
      note:
        requiredReady && certificationsReady && stageReady
          ? "Template includes the minimum metadata for downstream compliance review."
          : "Add stage and certification context before handing off to compliance.",
    },
    {
      label: "Supplier dossier",
      ready: requiredReady && certificationsReady,
      note:
        requiredReady && certificationsReady
          ? "Origin, maker, and certification metadata are present for supplier packets."
          : "Origin, manufacturer, and certification data are still incomplete.",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto w-full space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_340px]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-600">
              Textile templates
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Reusable lot presets
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              This page separates textile template work from the battery
              template editor. Create reusable textile presets here without
              routing through the battery SKU builder.
            </p>
            <div className="mt-4">
              <Button onClick={() => setCreateOpen(true)}>
                Create textile template
              </Button>
            </div>
          </div>

          <div className="border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-600" />
              <h2 className="text-sm font-medium text-foreground">
                Working mode
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Use templates as reusable data presets for textile lots today. The
              builder below writes `TEXTILE` presets directly with
              textile-native fields so workspaces stay isolated from battery
              templates.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href={lotsHref}
            className="border border-border bg-card p-5 transition-colors hover:border-cyan-500/40"
          >
            <Layers3 className="h-5 w-5 text-cyan-600" />
            <h3 className="mt-3 text-sm font-medium text-foreground">
              Open lots
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Review textile production lots and current record counts.
            </p>
          </Link>
          <Link
            href={lifecycleHref}
            className="border border-border bg-card p-5 transition-colors hover:border-cyan-500/40"
          >
            <FileStack className="h-5 w-5 text-cyan-600" />
            <h3 className="mt-3 text-sm font-medium text-foreground">
              Supply chain
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep downstream operational flow separate from battery lifecycle
              actions.
            </p>
          </Link>
          <Link
            href={settingsHref}
            className="border border-border bg-card p-5 transition-colors hover:border-cyan-500/40"
          >
            <Settings className="h-5 w-5 text-cyan-600" />
            <h3 className="mt-3 text-sm font-medium text-foreground">
              Workspace defaults
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Align sharing and organizational settings before finalizing
              textile presets.
            </p>
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
          <div className="border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-medium text-foreground">
                  Current templates
                </h2>
                <p className="text-sm text-muted-foreground">
                  Shared template records, shown with textile terminology.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchTemplates}
                className="text-sm font-medium text-blue-500 hover:underline"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-muted-foreground">
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center">
                <FileStack className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-base font-medium text-foreground">
                  No textile presets yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create the first textile preset here and reuse it across lot
                  intake.
                </p>
                <div className="mt-4">
                  <Button onClick={() => setCreateOpen(true)}>
                    Create first template
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`border bg-background p-4 transition-colors ${
                      selectedTemplateId === template.id
                        ? "border-cyan-500/40"
                        : "border-border hover:border-cyan-500/30"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">
                      {template.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created{" "}
                      {format(new Date(template.created_at), "dd MMM yyyy")}
                    </p>
                    <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                      <p>
                        Manufacturer:{" "}
                        {template.specs?.manufacturer || "Not set"}
                      </p>
                      <p>
                        Material profile:{" "}
                        {template.specs?.material_profile ||
                          template.specs?.chemistry ||
                          "Not set"}
                      </p>
                      <p>Lot size: {template.specs?.lot_size || "Not set"}</p>
                      <p>
                        Stage:{" "}
                        {textileStageLabel(template.specs?.production_stage)}
                      </p>
                      <p>
                        Origin: {template.specs?.country_of_origin || "Not set"}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={
                          selectedTemplateId === template.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedTemplateId(template.id)}
                      >
                        {selectedTemplateId === template.id
                          ? "Previewing"
                          : "Preview"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplateId(template.id);
                          setCreateLotOpen(true);
                        }}
                      >
                        Use for lot
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-medium text-foreground">
                Preview & readiness
              </h2>
              <p className="text-sm text-muted-foreground">
                Review the selected template before pushing it into lot intake.
              </p>
            </div>

            {!selectedTemplate ? (
              <div className="p-6 text-sm text-muted-foreground">
                Select a textile template to review its passport preview,
                compliance checklist, and document readiness.
              </div>
            ) : (
              <div className="space-y-5 p-5">
                <div className="border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-600">
                        Textile passport preview
                      </p>
                      <h3 className="mt-2 text-lg font-medium text-foreground">
                        {selectedTemplate.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedSpecs?.material_profile ||
                          selectedSpecs?.chemistry ||
                          "Material profile not set"}
                      </p>
                    </div>
                    <Badge
                      className={
                        requiredReady
                          ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-500 border-amber-500/30"
                      }
                    >
                      {requiredReady
                        ? "Preview ready"
                        : "Needs required fields"}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
                    <p>
                      Manufacturer: {selectedSpecs?.manufacturer || "Not set"}
                    </p>
                    <p>
                      Origin: {selectedSpecs?.country_of_origin || "Not set"}
                    </p>
                    <p>
                      Stage:{" "}
                      {textileStageLabel(selectedSpecs?.production_stage)}
                    </p>
                    <p>Lot size: {selectedSpecs?.lot_size || "Not set"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Schema essentials
                  </div>
                  <div className="space-y-2">
                    {requiredFields.map((field) => {
                      const isSet = Boolean(field.value);

                      return (
                        <div
                          key={field.label}
                          className="flex items-start justify-between gap-3 border border-border bg-background px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {field.label}
                            </p>
                            <p className="text-muted-foreground">
                              {field.value || "Missing"}
                            </p>
                          </div>
                          <Badge
                            className={
                              isSet
                                ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                                : "bg-red-500/15 text-red-500 border-red-500/30"
                            }
                          >
                            {isSet ? "Ready" : "Missing"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <TriangleAlert className="h-4 w-4 text-amber-500" />
                    Compliance context
                  </div>
                  <div className="space-y-2">
                    {recommendedFields.map((field) => (
                      <div
                        key={field.label}
                        className="flex items-start justify-between gap-3 border border-border bg-background px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {field.label}
                          </p>
                          <p className="text-muted-foreground">{field.value}</p>
                        </div>
                        <Badge
                          className={
                            field.isSet
                              ? "bg-cyan-500/15 text-cyan-600 border-cyan-500/30"
                              : "bg-muted text-muted-foreground border-border"
                          }
                        >
                          {field.isSet ? "Captured" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileCheck className="h-4 w-4 text-cyan-600" />
                    Document readiness
                  </div>
                  <div className="space-y-2">
                    {documentStatuses.map((item) => (
                      <div
                        key={item.label}
                        className="border border-border bg-background px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {item.label}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.note}
                            </p>
                          </div>
                          <Badge
                            className={
                              item.ready
                                ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-500 border-amber-500/30"
                            }
                          >
                            {item.ready ? "Ready" : "Blocked"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => setCreateLotOpen(true)}
                    disabled={!selectedTemplate}
                  >
                    Use template for new lot
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button asChild variant="outline" type="button">
                    <Link href={lifecycleHref}>
                      Open supply-chain workspace
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <CreateTextileTemplateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onTemplateCreated={fetchTemplates}
        />
        <CreateTextileLotDialog
          open={createLotOpen}
          onOpenChange={setCreateLotOpen}
          onLotCreated={() => {
            setCreateLotOpen(false);
          }}
          template={selectedTemplate || null}
        />
      </div>
    </div>
  );
}
