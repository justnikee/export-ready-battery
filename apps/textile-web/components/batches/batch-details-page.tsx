// TODO: big-bang split - battery branches were hardcoded to true; dead code should be removed in follow-up
"use client";

import { useCallback, useEffect, useState } from "react";
import type React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import { createExportJob } from "@/lib/api/exports";
import { useAuth } from "@/context/auth-context";
import { toApiError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadCSV } from "@/components/batches/upload-csv";
import { CarbonCalculator } from "@/components/batches/carbon-calculator";
import {
  ArrowLeft,
  QrCode,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Globe,
  AlertTriangle,
  CheckCircle,
  Printer,
  Factory,
  Scale,
  Atom,
  Battery,
  FileText,
  Lock,
  Unlock,
  Clock,
  Shield,
  FileCheck,
  Archive,
  Trash2,
  ExternalLink,
  Shirt,
  Droplets,
  Users,
  Beaker,
  Recycle,
} from "lucide-react";
import { PassportList } from "@/components/batches/passport-list";
import { DownloadLabelsDialog } from "@/components/batches/DownloadLabelsDialog";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Batch, Passport } from "@/lib/types";
import { BatchDetailSkeleton } from "@/components/batches/BatchDetailSkeleton";
import { clsx } from "clsx";
import { dashboardPathFromPathname } from "@/lib/routes";

type MarketRegion = "INDIA" | "EU" | "GLOBAL";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface BatchResponse {
  batch: Batch;
  passport_count?: number;
}

interface PassportsResponse {
  passports: Passport[];
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  has_more?: boolean;
}

export default function BatchDetailsPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [activating, setActivating] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [passportCount, setPassportCount] = useState<number>(0);
  const [passports, setPassports] = useState<Passport[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [complianceGaps, setComplianceGaps] = useState<
    import("@/lib/types").ComplianceGap[]
  >([]);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "passports" | "upload" | "compliance" | "reports"
  >("overview");
  const [patchingKey, setPatchingKey] = useState<string | null>(null);
  const [confirmCert, setConfirmCert] = useState<{
    key: string;
    cert: string;
  } | null>(null);
  const exportsHref = dashboardPathFromPathname(pathname, "exports");
  const settingsHref = dashboardPathFromPathname(pathname, "settings");
  const settingsComplianceHref = dashboardPathFromPathname(
    pathname,
    "settings?tab=compliance",
  );
  const billingHref = dashboardPathFromPathname(pathname, "billing");
  const batchesHref = dashboardPathFromPathname(pathname, "batches");

  const fetchBatch = useCallback(async () => {
    try {
      const response = await api.get<BatchResponse>(`/batches/${params.id}`);
      setBatch(response.data.batch);
      setPassportCount(response.data.passport_count || 0);
    } catch (error: unknown) {
      console.error("Failed to fetch batch:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchPassports = useCallback(
    async (page = 1, limit = 50) => {
      try {
        const response = await api.get<PassportsResponse>(
          `/batches/${params.id}/passports?page=${page}&limit=${limit}`,
        );
        setPassports(response.data.passports || []);
        setPagination({
          page: response.data.page || 1,
          limit: response.data.limit || 50,
          total: response.data.total || 0,
          totalPages: response.data.total_pages || 0,
          hasMore: response.data.has_more || false,
        });
      } catch (error: unknown) {
        console.error("Failed to fetch passports:", error);
      }
    },
    [params.id],
  );

  useEffect(() => {
    fetchBatch();
    fetchPassports(1, 50);
    const fetchCompliance = async () => {
      setComplianceLoading(true);
      try {
        const res = await api.get(`/batches/${params.id}/compliance`);
        setComplianceScore(res.data.compliance_score ?? null);
        setComplianceGaps(res.data.compliance_gaps ?? []);
      } catch {
        // Compliance data may not exist for draft batches.
      } finally {
        setComplianceLoading(false);
      }
    };
    fetchCompliance();
  }, [fetchBatch, fetchPassports, params.id]);

  const handleUploadComplete = () => {
    fetchBatch();
    fetchPassports(1, 50);
  };

  const handlePageChange = (newPage: number) => {
    fetchPassports(newPage, pagination.limit);
  };

  const handleDownloadQR = async () => {
    if (!batch) return;
    const MAX_DIRECT_DOWNLOAD = 500;

    if (passportCount > MAX_DIRECT_DOWNLOAD) {
      try {
        toast.loading(
          "Creating export job... This may take a few minutes for large batches.",
          { id: "qr-export" },
        );
        const job = await createExportJob({
          batch_id: params.id as string,
          job_type: "QR_ZIP",
        });
        toast.success(
          "Export job created! Go to Exports page to download when ready.",
          {
            id: "qr-export",
            description: `Job ID: ${job.id}`,
            duration: 10000,
            action: {
              label: "View Exports",
              onClick: () => router.push(exportsHref),
            },
          },
        );
      } catch (error: unknown) {
        const apiError = toApiError(error);
        console.error("Failed to create export job", error);
        toast.error(
          apiError.response?.data?.error || "Failed to create export job",
          { id: "qr-export" },
        );
      }
    } else {
      try {
        toast.loading("Generating QR codes...", { id: "qr-download" });
        const response = await api.get(`/batches/${params.id}/download`, {
          responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${batch.batch_name}_qrcodes.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("QR codes downloaded successfully!", {
          id: "qr-download",
        });
      } catch (error: unknown) {
        const apiError = toApiError(error);
        console.error("Failed to download QR codes", error);
        toast.error(
          apiError.response?.data?.error || "Failed to download QR codes",
          { id: "qr-download" },
        );
      }
    }
  };

  const handleDownloadLabels = async () => {
    if (!batch) return;
    const MAX_DIRECT_DOWNLOAD = 500;

    if (passportCount > MAX_DIRECT_DOWNLOAD) {
      try {
        toast.loading(
          "Creating export job... This may take a few minutes for large batches.",
          { id: "labels-export" },
        );
        const job = await createExportJob({
          batch_id: params.id as string,
          job_type: "LABELS_PDF",
        });
        toast.success(
          "Export job created! Go to Exports page to download when ready.",
          {
            id: "labels-export",
            description: `Job ID: ${job.id}`,
            duration: 10000,
            action: {
              label: "View Exports",
              onClick: () => router.push(exportsHref),
            },
          },
        );
      } catch (error: unknown) {
        const apiError = toApiError(error);
        console.error("Failed to create export job", error);
        toast.error(
          apiError.response?.data?.error || "Failed to create export job",
          { id: "labels-export" },
        );
      }
    } else {
      try {
        toast.loading("Generating PDF labels...", { id: "labels-download" });
        const response = await api.get(`/batches/${params.id}/labels`, {
          responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${batch.batch_name}_labels.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("Labels downloaded successfully!", {
          id: "labels-download",
        });
      } catch (error: unknown) {
        const apiError = toApiError(error);
        console.error("Failed to download labels", error);
        if (apiError.response?.status === 403) {
          const noun = true ? "Lot" : "Batch";
          toast.error(
            `You must activate this ${noun.toLowerCase()} before downloading labels.`,
            {
              id: "labels-download",
              description: `Click 'Activate ${noun}' to unlock downloads.`,
              duration: 5000,
            },
          );
        } else {
          toast.error(
            apiError.response?.data?.error || "Failed to download labels",
            { id: "labels-download" },
          );
        }
      }
    }
  };

  const handleExportCSV = async () => {
    if (!batch) return;
    try {
      const response = await api.get(`/batches/${params.id}/export`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${batch.batch_name}_serial_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export CSV", error);
      alert("Failed to export CSV");
    }
  };

  const handleExportAuditCSV = async () => {
    try {
      toast.loading("Queuing audit log export...");
      await api.post(`/batches/${params.id}/exports`, {
        format: "csv",
        type: "AUDIT_CSV",
      });
      toast.dismiss();
      toast.success("Audit export queued! Check the Export Jobs page.");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to queue audit export");
      console.error("Export error:", error);
    }
  };

  const handleExportDueDiligence = async () => {
    if (!batch) return;
    try {
      toast.loading(
        isTextile
          ? "Generating Textile Due Diligence Report..."
          : "Generating Due Diligence Report...",
        {
          id: "dd-download",
        },
      );
      const response = await api.get(
        `/batches/${params.id}/due-diligence-report`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${batch.batch_name}_due_diligence_report.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(
        isTextile
          ? "Textile Due Diligence Report downloaded!"
          : "Due Diligence Report downloaded!",
        { id: "dd-download" },
      );
    } catch (error: unknown) {
      const apiError = toApiError(error);
      console.error("Failed to download due diligence report", error);
      if (apiError.response?.status === 403) {
        toast.error(
          isTextile
            ? "Lot must be activated before generating the textile due diligence report."
            : "Batch must be activated before generating the Due Diligence Report.",
          { id: "dd-download" },
        );
      } else {
        toast.error(
          apiError.response?.data?.error ||
            (isTextile
              ? "Failed to download textile due diligence report"
              : "Failed to download Due Diligence Report"),
          { id: "dd-download" },
        );
      }
    }
  };

  const handleExportComplianceDeclaration = async () => {
    if (!batch) return;
    try {
      toast.loading(`Generating ${complianceDeclarationTitle}...`, {
        id: "cd-download",
      });
      const response = await api.get(
        `/batches/${params.id}/compliance-declaration`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${batch.batch_name}_compliance_declaration.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${complianceDeclarationTitle} downloaded!`, {
        id: "cd-download",
      });
    } catch (error: unknown) {
      const apiError = toApiError(error);
      console.error("Failed to download compliance declaration", error);
      if (apiError.response?.status === 400) {
        toast.error(complianceDeclarationMissingDataMessage, {
          id: "cd-download",
        });
      } else {
        toast.error(
          apiError.response?.data?.error ||
            "Failed to download Compliance Declaration",
          { id: "cd-download" },
        );
      }
    }
  };

  const handleDownloadComplianceReport = async () => {
    if (!batch) return;
    try {
      toast.loading("Generating Compliance Report...", { id: "cr-download" });
      const response = await api.get(
        `/batches/${params.id}/compliance-report`,
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${batch.batch_name}_compliance_report.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Compliance Report downloaded!", { id: "cr-download" });
    } catch (error: unknown) {
      const apiError = toApiError(error);
      toast.error(
        apiError.response?.data?.error ||
          "Failed to download Compliance Report",
        { id: "cr-download" },
      );
    }
  };

  const getComplianceBadge = () => {
    const region = batch?.market_region as MarketRegion;

    if (region === "INDIA") {
      return (
        <Badge className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30 text-sm px-3 py-1">
          India Market
        </Badge>
      );
    }

    if (region === "EU") {
      return (
        <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30 text-sm px-3 py-1">
          EU Market
        </Badge>
      );
    }

    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30 text-sm px-3 py-1">
        <Globe className="h-3 w-3 mr-1" /> Global
      </Badge>
    );
  };

  const getStatusBadge = () => {
    const status = batch?.status || "DRAFT";
    if (status === "ACTIVE") {
      return (
        <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30 text-sm px-3 py-1">
          <Unlock className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    if (status === "ARCHIVED") {
      return (
        <Badge className="bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30 border-border/30 text-sm px-3 py-1">
          Archived
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30 text-sm px-3 py-1">
        <Lock className="h-3 w-3 mr-1" />
        Draft
      </Badge>
    );
  };

  const formatBlockerLabel = (key: string): string => {
    const map: Record<string, string> = {
      model_name: "Model name",
      "specs.chemistry": "Battery chemistry",
      "specs.capacity": "Rated capacity",
      "specs.manufacturer": "Manufacturer",
      "specs.country_of_origin": "Country of origin",
      manufacturing_start_date: "Manufacturing start date",
      manufacturing_end_date: "Manufacturing end date",
      cell_source: "Cell source (IMPORTED/DOMESTIC)",
      "specs.certifications: AIS-156": "AIS-156 certification",
      "specs.certifications: AIS-038": "AIS-038 certification",
      "tenant.epr_registration_number":
        "EPR registration (Settings -> Compliance)",
      "tenant.bis_r_number": "BIS R-number (Settings -> Compliance)",
      "tenant.iec_code": "IEC code (Settings -> Compliance)",
      "tenant.morth_manufacturer_code": "MoRTH code (Settings -> Compliance)",
      bill_of_entry_no: "Bill of entry number",
      country_of_origin: "Cell country of origin",
      customs_date: "Import date",
      domestic_value_add: "Domestic value-add percentage",
      "specs.battery_category": "EU battery category",
      "tenant.company_name": "Company name (Settings -> Profile)",
      "tenant.address": "Company address (Settings -> Profile)",
      "tenant.eu_authorized_representative_name":
        "EU representative name (Settings -> Compliance)",
      "tenant.eu_authorized_representative_address":
        "EU representative address (Settings -> Compliance)",
      "tenant.eu_contact_email": "EU contact email (Settings -> Compliance)",
      carbon_footprint_result: "Carbon footprint (use Carbon Calculator tab)",
      "specs.material_composition":
        "Material composition (at least one non-zero %)",
      "specs.hazardous_substances.declaration":
        "Hazardous substances declaration",
      "specs.expected_lifetime_cycles": "Expected lifetime cycles",
      "specs.warranty_months": "Warranty months",
    };
    return (
      map[key] ||
      key
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
  };

  const handlePatchSpec = async (
    key: string,
    specsFragment: Record<string, unknown>,
  ) => {
    if (!batch) return;
    setPatchingKey(key);
    try {
      await api.patch(`/batches/${params.id}`, { specs: specsFragment });
      await fetchBatch();
      const noun = true ? "Lot" : "Batch";
      toast.success(`${noun} updated`);
    } catch (error: unknown) {
      const apiError = toApiError(error);
      const noun = true ? "Lot" : "Batch";
      toast.error(
        apiError.response?.data?.error ||
          `Failed to update ${noun.toLowerCase()}`,
      );
    } finally {
      setPatchingKey(null);
    }
  };

  const getBlockerAction = (
    key: string,
  ): {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    loading: boolean;
  } | null => {
    const settingsComplianceKeys = [
      "tenant.epr_registration_number",
      "tenant.bis_r_number",
      "tenant.iec_code",
      "tenant.morth_manufacturer_code",
    ];
    const settingsProfileKeys = [
      "tenant.company_name",
      "tenant.address",
      "tenant.eu_authorized_representative_name",
      "tenant.eu_authorized_representative_address",
      "tenant.eu_contact_email",
    ];

    if (settingsComplianceKeys.includes(key)) {
      return {
        label: "Fix in Settings",
        icon: <ExternalLink className="h-3 w-3" />,
        loading: false,
        onClick: () => router.push(settingsComplianceHref),
      };
    }
    if (settingsProfileKeys.includes(key)) {
      return {
        label: "Fix in Settings",
        icon: <ExternalLink className="h-3 w-3" />,
        loading: false,
        onClick: () => router.push(settingsHref),
      };
    }
    if (key === "carbon_footprint_result") {
      return {
        label: "Carbon Calculator",
        icon: <Leaf className="h-3 w-3" />,
        loading: false,
        onClick: () => setActiveTab("upload"),
      };
    }
    if (
      key === "specs.material_composition" ||
      key === "specs.hazardous_substances.declaration" ||
      key === "specs.expected_lifetime_cycles" ||
      key === "specs.warranty_months" ||
      key === "specs.battery_category"
    ) {
      return {
        label: "Go to Compliance",
        icon: <Shield className="h-3 w-3" />,
        loading: false,
        onClick: () => setActiveTab("compliance"),
      };
    }
    if (key === "specs.certifications: AIS-156") {
      const currentCerts: string[] = batch?.specs?.certifications || [];
      if (currentCerts.includes("AIS-156")) return null;
      return {
        label: "Declare AIS-156",
        icon: <CheckCircle className="h-3 w-3" />,
        loading: patchingKey === key,
        onClick: () => setConfirmCert({ key, cert: "AIS-156" }),
      };
    }
    if (key === "specs.certifications: AIS-038") {
      const currentCerts: string[] = batch?.specs?.certifications || [];
      if (currentCerts.includes("AIS-038")) return null;
      return {
        label: "Declare AIS-038",
        icon: <CheckCircle className="h-3 w-3" />,
        loading: patchingKey === key,
        onClick: () => setConfirmCert({ key, cert: "AIS-038" }),
      };
    }
    return null;
  };

  const getActivationBlockers = (
    batchRecord: Batch,
    currentUser: typeof user,
  ): { blocking: string[]; warnings: string[] } => {
    const blocking: string[] = [];
    const warnings: string[] = [];
    const region = batchRecord.market_region as MarketRegion;
    const isTextileBatch = true;

    // Shared requirements
    if (!batchRecord.model_name?.trim()) blocking.push("model_name");
    if (!batchRecord.manufacturing_start_date)
      blocking.push("manufacturing_start_date");
    if (!batchRecord.manufacturing_end_date)
      blocking.push("manufacturing_end_date");

    if (isTextileBatch) {
      // Textile-specific requirements
      if (!batchRecord.specs?.manufacturer?.trim())
        blocking.push("specs.manufacturer");
      if (!batchRecord.specs?.country_of_origin?.trim())
        blocking.push("specs.country_of_origin");
    } else {
      // Battery-specific requirements
      if (!batchRecord.specs?.chemistry?.trim())
        blocking.push("specs.chemistry");
      if (!batchRecord.specs?.capacity?.trim()) blocking.push("specs.capacity");

      if (region === "INDIA" || region === "GLOBAL") {
        if (!batchRecord.specs.cell_source) blocking.push("cell_source");

        const certs = batchRecord.specs?.certifications || [];
        if (!certs.includes("AIS-156"))
          blocking.push("specs.certifications: AIS-156");
        if (!certs.includes("AIS-038"))
          blocking.push("specs.certifications: AIS-038");

        if (!currentUser?.epr_registration_number?.trim())
          blocking.push("tenant.epr_registration_number");
        if (!currentUser?.bis_r_number?.trim())
          blocking.push("tenant.bis_r_number");
        if (!currentUser?.iec_code?.trim()) blocking.push("tenant.iec_code");
        if (!currentUser?.morth_manufacturer_code?.trim())
          blocking.push("tenant.morth_manufacturer_code");

        if (batchRecord.specs.cell_source === "IMPORTED") {
          if (!batchRecord.specs.bill_of_entry_no?.trim())
            blocking.push("bill_of_entry_no");
          if (!batchRecord.specs.country_of_origin?.trim())
            blocking.push("country_of_origin");
          if (!batchRecord.specs.customs_date) blocking.push("customs_date");
        }

        if (
          batchRecord.specs.cell_source === "DOMESTIC" &&
          (batchRecord.domestic_value_add ?? 0) <= 0
        ) {
          blocking.push("domestic_value_add");
        }

        if (
          batchRecord.pli_compliant &&
          (batchRecord.domestic_value_add ?? 0) < 50
        ) {
          warnings.push(
            `PLI requires >=50% DVA (current: ${batchRecord.domestic_value_add ?? 0}%)`,
          );
        }
      }

      if (region === "EU" || region === "GLOBAL") {
        if (!currentUser?.company_name?.trim())
          blocking.push("tenant.company_name");
        if (!currentUser?.address?.trim()) blocking.push("tenant.address");
        if (!currentUser?.eu_authorized_representative_name?.trim()) {
          blocking.push("tenant.eu_authorized_representative_name");
        }
        if (!currentUser?.eu_authorized_representative_address?.trim()) {
          blocking.push("tenant.eu_authorized_representative_address");
        }
        if (!currentUser?.eu_contact_email?.trim()) {
          blocking.push("tenant.eu_contact_email");
        }

        if (
          !batchRecord.carbon_footprint_result ||
          Object.keys(batchRecord.carbon_footprint_result).length === 0
        ) {
          blocking.push("carbon_footprint_result");
        }

        const materialComposition = batchRecord.specs?.material_composition;
        if (
          !materialComposition ||
          !Object.values(materialComposition).some((value) =>
            typeof value === "number"
              ? value > 0
              : parseFloat(String(value)) > 0,
          )
        ) {
          blocking.push("specs.material_composition");
        }

        if (!batchRecord.specs?.hazardous_substances?.declaration?.trim()) {
          blocking.push("specs.hazardous_substances.declaration");
        }

        if (
          !batchRecord.specs?.expected_lifetime_cycles ||
          batchRecord.specs.expected_lifetime_cycles <= 0
        ) {
          blocking.push("specs.expected_lifetime_cycles");
        }

        if (
          !batchRecord.specs?.warranty_months ||
          batchRecord.specs.warranty_months <= 0
        ) {
          blocking.push("specs.warranty_months");
        }

        const recycledKeys = [
          "recycled_cobalt",
          "recycled_lithium",
          "recycled_nickel",
          "recycled_lead",
        ] as const;
        for (const key of recycledKeys) {
          const baseKey = key.replace(
            "recycled_",
            "",
          ) as keyof typeof materialComposition;
          if (
            materialComposition &&
            typeof materialComposition === "object" &&
            baseKey in materialComposition
          ) {
            const baseVal =
              parseFloat(
                String(
                  (materialComposition as Record<string, unknown>)[baseKey],
                ),
              ) || 0;
            const recycledVal =
              parseFloat(
                String((materialComposition as Record<string, unknown>)[key]),
              ) || 0;
            if (baseVal > 0 && recycledVal === 0) {
              warnings.push(
                `Recycled ${baseKey} content not declared (required from Aug 2028)`,
              );
            }
          }
        }
      }
    }

    return { blocking, warnings };
  };

  const handleActivateBatch = async () => {
    if (!batch) return;

    const preflight = getActivationBlockers(batch, user);
    if (preflight.blocking.length > 0) {
      toast.error(
        <div className="space-y-2">
          <p>
            Cannot activate - {preflight.blocking.length} requirement
            {preflight.blocking.length > 1 ? "s" : ""} missing:
          </p>
          <ul className="list-disc pl-4 text-sm space-y-0.5">
            {preflight.blocking.slice(0, 8).map((blocker, index) => (
              <li key={index}>{formatBlockerLabel(blocker)}</li>
            ))}
            {preflight.blocking.length > 8 && (
              <li>...and {preflight.blocking.length - 8} more</li>
            )}
          </ul>
          {preflight.warnings.length > 0 && (
            <p className="text-amber-500 text-xs mt-1">
              + {preflight.warnings.length} warning
              {preflight.warnings.length > 1 ? "s" : ""}
            </p>
          )}
        </div>,
        { duration: 12000 },
      );
      return;
    }

    setActivating(true);
    try {
      await api.post(`/batches/${params.id}/activate`);
      const noun = true ? "Lot" : "Batch";
      toast.success(`${noun} activated successfully!`);
      await fetchBatch();
      await refreshUser();
    } catch (error: unknown) {
      const apiError = toApiError(error);
      console.error("Failed to activate batch:", error);
      if (apiError.response?.status === 402) {
        toast.error("Insufficient quota. Please purchase more quota units.");
        router.push(billingHref);
      } else if (apiError.response?.status === 403) {
        const data = apiError.response?.data as
          | { error?: string; missing?: string[]; errors?: string[] }
          | undefined;
        const missing = data?.missing || [];
        const errors = data?.errors || [];
        if (missing.length > 0 || errors.length > 0) {
          toast.error(
            <div className="space-y-2">
              <p>Activation blocked by server compliance check:</p>
              {missing.length > 0 && (
                <ul className="list-disc pl-4 text-sm space-y-0.5">
                  {missing.map((value, index) => (
                    <li key={index} className="text-red-500">
                      {formatBlockerLabel(value)}
                    </li>
                  ))}
                </ul>
              )}
              {errors.length > 0 && (
                <ul className="list-disc pl-4 text-sm space-y-0.5 text-amber-500">
                  {errors.map((value, index) => (
                    <li key={index}>{value}</li>
                  ))}
                </ul>
              )}
            </div>,
            { duration: 12000 },
          );
        } else {
          toast.error(
            data?.error ||
              "Compliance requirements not met. Activation blocked.",
          );
        }
      } else {
        const noun = true ? "Lot" : "Batch";
        toast.error(
          apiError.response?.data?.error ||
            `Failed to activate ${noun.toLowerCase()}`,
        );
      }
    } finally {
      setActivating(false);
    }
  };

  const handleArchiveBatch = async () => {
    if (!batch) return;
    setConfirmArchive(false);

    setArchiving(true);
    try {
      await api.post(`/batches/${params.id}/archive`);
      const noun = true ? "Lot" : "Batch";
      toast.success(`${noun} archived successfully`);
      await fetchBatch();
    } catch (error: unknown) {
      const apiError = toApiError(error);
      console.error("Failed to archive batch:", error);
      toast.error(apiError.response?.data?.error || "Failed to archive batch");
    } finally {
      setArchiving(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!batch) return;
    setConfirmDelete(false);

    setDeletingDraft(true);
    try {
      await api.delete(`/batches/${params.id}/draft`);
      const noun = true ? "Lot" : "Batch";
      toast.success(`Draft ${noun.toLowerCase()} deleted successfully`);
      router.push(batchesHref);
    } catch (error: unknown) {
      const apiError = toApiError(error);
      console.error("Failed to delete draft batch:", error);
      const noun = true ? "Lot" : "Batch";
      toast.error(
        apiError.response?.data?.error ||
          `Failed to delete draft ${noun.toLowerCase()}`,
      );
    } finally {
      setDeletingDraft(false);
    }
  };

  const isDraft = batch?.status !== "ACTIVE" && batch?.status !== "ARCHIVED";
  const activationResult =
    batch && isDraft
      ? getActivationBlockers(batch, user)
      : { blocking: [], warnings: [] };

  if (loading) return <BatchDetailSkeleton />;
  if (!batch) {
    return (
      <div className="p-8 text-muted-foreground">
        {pathname?.includes("/textile/") ? "Lot not found" : "Batch not found"}
      </div>
    );
  }

  const region = batch.market_region as MarketRegion;
  const isIndia = region === "INDIA";
  const isEU = region === "EU";
  const isGlobal = region === "GLOBAL";
  const isTextile = true;
  const complianceDeclarationTitle = isTextile
    ? "Compliance Declaration"
    : "Carbon Declaration";
  const complianceDeclarationDescription = isTextile
    ? "Generate the textile compliance declaration for this lot."
    : "Generate the carbon footprint compliance declaration.";
  const complianceDeclarationMissingDataMessage = isTextile
    ? "Textile declaration data is incomplete. Update the lot and tenant compliance fields first."
    : "No carbon footprint data available. Run the Carbon Calculator first.";

  const hasWarrantyMonths =
    batch.specs.warranty_months !== null &&
    batch.specs.warranty_months !== undefined;
  const expectedLifetimeCycles = batch.specs.expected_lifetime_cycles ?? null;
  const hasExpectedLifetime = expectedLifetimeCycles !== null;
  const hasRecycledContent =
    batch.specs.recycled_content_pct !== null &&
    batch.specs.recycled_content_pct !== undefined;
  const certifications = batch.specs.certifications ?? [];
  const materialComposition = batch.specs.material_composition;

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <div className="w-full mx-auto space-y-8">
        <div className="relative overflow-visible border border-border bg-transparent p-6">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(batchesHref)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl text-foreground tracking-tight">
                    {batch.batch_name}
                  </h1>
                  {getStatusBadge()}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {getComplianceBadge()}
                  <span className="text-muted-foreground text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created {new Date(batch.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {isDraft && (
                <>
                  <Button
                    onClick={handleActivateBatch}
                    className={
                      activationResult.blocking.length > 0
                        ? "bg-muted-foreground text-white cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-500/100 text-white shadow-none shadow-emerald-500/20"
                    }
                    disabled={
                      activating || activationResult.blocking.length > 0
                    }
                    title={
                      activationResult.blocking.length > 0
                        ? `${activationResult.blocking.length} requirement(s) missing - see blockers below`
                        : `Activate this ${"lot"}`
                    }
                  >
                    {activating ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Activating...
                      </>
                    ) : (
                      <>
                        <Unlock className="mr-2 h-4 w-4" />
                        Activate {"Lot"}
                      </>
                    )}
                  </Button>
                  {batch.total_passports === 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setConfirmDelete(true)}
                      className="border-red-200 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                      disabled={deletingDraft}
                    >
                      {deletingDraft ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Draft
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}

              {batch.status === "ACTIVE" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setLabelsDialogOpen(true)}
                    className="border-border text-foreground hover:bg-background hover:text-foreground"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Labels
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmArchive(true)}
                    className="border-amber-200 text-amber-500 hover:bg-amber-500/10 hover:text-amber-800"
                    disabled={archiving}
                  >
                    {archiving ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"></div>
                        Archiving...
                      </>
                    ) : (
                      <>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive {"Lot"}
                      </>
                    )}
                  </Button>
                </>
              )}

              {batch.status === "ARCHIVED" && (
                <Button
                  variant="outline"
                  disabled
                  className="border-border text-muted-foreground cursor-not-allowed"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Archived (Read Only)
                </Button>
              )}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>

        {isDraft &&
          (activationResult.blocking.length > 0 ||
            activationResult.warnings.length > 0) && (
            <div className="border border-border overflow-hidden">
              {activationResult.blocking.length > 0 && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
                  <div className="flex items-center gap-2 text-red-500 text-sm mb-3">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      {activationResult.blocking.length} Blocking Issue
                      {activationResult.blocking.length > 1 ? "s" : ""} - Must
                      Fix Before Activation
                    </span>
                  </div>
                  <div className="space-y-2">
                    {activationResult.blocking.map((key, index) => {
                      const action = getBlockerAction(key);
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-3 py-1.5 px-2 rounded bg-red-500/5 border border-red-500/10"
                        >
                          <div className="flex items-center gap-2 text-sm text-red-400 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            <span className="truncate">
                              {formatBlockerLabel(key)}
                            </span>
                          </div>
                          {action && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={action.loading}
                              onClick={action.onClick}
                              className="shrink-0 h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1"
                            >
                              {action.loading ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                              ) : (
                                action.icon
                              )}
                              {action.label}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {activationResult.warnings.length > 0 && (
                <div className="bg-amber-500/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-amber-500 text-sm mb-2">
                    <Shield className="h-4 w-4" />
                    {activationResult.warnings.length} Warning
                    {activationResult.warnings.length > 1 ? "s" : ""}
                    (non-blocking)
                  </div>
                  <ul className="space-y-1 pl-6">
                    {activationResult.warnings.map((warning, index) => (
                      <li
                        key={index}
                        className="text-sm text-amber-500 list-disc"
                      >
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        <div className="relative bg-transparent border border-border">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
          <div className="flex border-b border-border px-4">
            {[
              { id: "overview", label: "Overview" },
              { id: "passports", label: `Passports (${passportCount})` },
              { id: "upload", label: "Upload & Generate" },
              { id: "compliance", label: "Compliance" },
              { id: "reports", label: "Reports" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={clsx(
                  "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activeTab === tab.id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {isTextile && (
                  <Card className="bg-transparent border-border border-l-4 border-l-cyan-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <div className="p-2 bg-cyan-500/10">
                          <Shirt className="h-5 w-5 text-cyan-500" />
                        </div>
                        Textile Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        {batch.specs.fiber_composition && (
                          <div className="col-span-2 p-4 bg-background border border-border">
                            <dt className="text-muted-foreground mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                              <Shirt className="h-3.5 w-3.5 text-cyan-400" />
                              Fiber Composition
                            </dt>
                            <dd className="space-y-2">
                              {Object.entries(batch.specs.fiber_composition)
                                .filter(
                                  ([, v]) => typeof v === "number" && v > 0,
                                )
                                .map(([key, value]) => (
                                  <div key={key}>
                                    <div className="flex justify-between text-xs mb-0.5">
                                      <span className="text-muted-foreground">
                                        {key
                                          .replace("_pct", "")
                                          .replace(/^\w/, (c) =>
                                            c.toUpperCase(),
                                          )}
                                      </span>
                                      <span className="text-foreground font-medium">
                                        {value}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-muted h-1.5">
                                      <div
                                        className="h-1.5 bg-cyan-500"
                                        style={{
                                          width: `${Math.min(Number(value), 100)}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                            </dd>
                          </div>
                        )}

                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                            GSM
                          </dt>
                          <dd className="text-foreground">
                            {batch.specs.gsm ?? "N/A"}
                          </dd>
                        </div>
                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                            Color
                          </dt>
                          <dd className="text-foreground">
                            {batch.specs.color || "N/A"}
                          </dd>
                        </div>
                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                            Dimensions
                          </dt>
                          <dd className="text-foreground">
                            {batch.specs.dimensions || "N/A"}
                          </dd>
                        </div>
                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                            Finish Type
                          </dt>
                          <dd className="text-foreground">
                            {batch.specs.finish_type?.join(", ") || "N/A"}
                          </dd>
                        </div>
                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                            Dye Process
                          </dt>
                          <dd className="text-foreground">
                            {batch.specs.dye_process
                              ? batch.specs.dye_process
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())
                              : "N/A"}
                          </dd>
                        </div>

                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Droplets className="h-3.5 w-3.5 text-blue-400" />
                            Water Usage
                          </dt>
                          <dd className="text-foreground">
                            {batch.specs.water_usage_liters
                              ? `${batch.specs.water_usage_liters} L`
                              : "N/A"}
                          </dd>
                        </div>
                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                            Energy Usage
                          </dt>
                          <dd className="text-foreground">
                            {batch.specs.energy_usage_kwh
                              ? `${batch.specs.energy_usage_kwh} kWh`
                              : "N/A"}
                          </dd>
                        </div>

                        {batch.specs.supplier_tier && (
                          <div className="col-span-2 p-4 bg-background border border-border">
                            <dt className="text-muted-foreground mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                              <Factory className="h-3.5 w-3.5 text-cyan-400" />
                              Supplier Tier
                            </dt>
                            <dd className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                              {Object.entries(batch.specs.supplier_tier)
                                .filter(
                                  ([, v]) => typeof v === "string" && v.trim(),
                                )
                                .map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex justify-between items-center p-2 bg-muted rounded"
                                  >
                                    <span className="text-muted-foreground">
                                      {key
                                        .replace(/_/g, " ")
                                        .replace(/\b\w/g, (l) =>
                                          l.toUpperCase(),
                                        )}
                                    </span>
                                    <span className="text-foreground">
                                      {value}
                                    </span>
                                  </div>
                                ))}
                            </dd>
                          </div>
                        )}

                        {batch.specs.labor_compliance && (
                          <div className="col-span-2 p-4 bg-background border border-border">
                            <dt className="text-muted-foreground mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-cyan-400" />
                              Labor Compliance
                            </dt>
                            <dd className="flex flex-wrap gap-2">
                              {batch.specs.labor_compliance
                                .sa8000_certified && (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                  SA8000
                                </Badge>
                              )}
                              {batch.specs.labor_compliance.bsci_audited && (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                  BSCI
                                </Badge>
                              )}
                              {batch.specs.labor_compliance.sedex_member && (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                  SEDEX
                                </Badge>
                              )}
                              {batch.specs.labor_compliance
                                .fair_trade_certified && (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                  Fair Trade
                                </Badge>
                              )}
                              {!batch.specs.labor_compliance.sa8000_certified &&
                                !batch.specs.labor_compliance.bsci_audited &&
                                !batch.specs.labor_compliance.sedex_member &&
                                !batch.specs.labor_compliance
                                  .fair_trade_certified && (
                                  <span className="text-xs text-muted-foreground">
                                    No certifications declared
                                  </span>
                                )}
                            </dd>
                          </div>
                        )}

                        {batch.specs.chemical_compliance_zdhc && (
                          <div className="col-span-2 p-4 bg-background border border-border">
                            <dt className="text-muted-foreground mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                              <Beaker className="h-3.5 w-3.5 text-cyan-400" />
                              Chemical Compliance
                            </dt>
                            <dd className="flex flex-wrap gap-2 items-center">
                              <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20">
                                ZDHC Level{" "}
                                {batch.specs.chemical_compliance_zdhc
                                  .zdhc_level || "N/A"}
                              </Badge>
                              {batch.specs.chemical_compliance_zdhc
                                .mrsl_tested && (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                  MRSL Tested
                                </Badge>
                              )}
                            </dd>
                          </div>
                        )}

                        <div className="col-span-2 p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Recycle className="h-3.5 w-3.5 text-emerald-400" />
                            Sustainability
                          </dt>
                          <dd className="grid grid-cols-3 gap-3 text-xs">
                            <div className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="text-muted-foreground">
                                Biodegradable
                              </span>
                              <span className="text-foreground">
                                {batch.specs.biodegradable_pct ?? "N/A"}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="text-muted-foreground">
                                Expected Lifetime
                              </span>
                              <span className="text-foreground">
                                {batch.specs.expected_lifetime_washes
                                  ? `${batch.specs.expected_lifetime_washes} washes`
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="text-muted-foreground">
                                Recycled Content
                              </span>
                              <span className="text-foreground">
                                {batch.specs.recycled_content_pct ?? "N/A"}%
                              </span>
                            </div>
                          </dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                )}
                {!isTextile && (
                  <Card className="bg-transparent border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <div className="p-2 bg-blue-500/10">
                          <Battery className="h-5 w-5 text-blue-500" />
                        </div>
                        Core Specifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
                        <div className="p-3 bg-background border border-border">
                          <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                            Manufacturer
                          </dt>
                          <dd className="text-foreground">
                            {batch.specs.manufacturer || "N/A"}
                          </dd>
                        </div>
                        <div className="p-3 bg-background border border-border">
                          <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                            Chemistry
                          </dt>
                          <dd className="text-foreground">
                            {batch.specs.chemistry || "N/A"}
                          </dd>
                        </div>
                        <div className="p-3 bg-background border border-border">
                          <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                            Capacity
                          </dt>
                          <dd className="text-emerald-400">
                            {batch.specs.capacity || "N/A"}
                          </dd>
                        </div>
                        <div className="p-3 bg-background border border-border">
                          <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                            Voltage
                          </dt>
                          <dd className="text-foreground">
                            {batch.specs.voltage || "N/A"}
                          </dd>
                        </div>
                        <div className="p-3 bg-background border border-border">
                          <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                            Weight
                          </dt>
                          <dd className="text-foreground">
                            {batch.specs.weight || "N/A"}
                          </dd>
                        </div>
                        <div className="p-3 bg-background border border-border">
                          <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                            Country of Origin
                          </dt>
                          <dd className="text-foreground">
                            {batch.specs.country_of_origin || "N/A"}
                          </dd>
                        </div>
                        {batch.specs.manufacturer_address && (
                          <div className="p-3 bg-background border border-border col-span-2">
                            <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                              Manufacturer Address
                            </dt>
                            <dd className="text-foreground text-sm">
                              {batch.specs.manufacturer_address}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </CardContent>
                  </Card>
                )}

                {!isTextile && isIndia && (
                  <Card className="bg-transparent border-border border-l-4 border-l-orange-500">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-foreground">
                        <span>India Compliance</span>
                        <span className="text-xs font-normal text-muted-foreground bg-orange-500/10 px-2 py-1 rounded">
                          Battery Aadhaar
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Scale className="h-3.5 w-3.5 text-orange-400" />
                            Domestic Value Add
                          </dt>
                          <dd className="text-2xl text-orange-400 flex items-center gap-2">
                            {batch.domestic_value_add
                              ? `${batch.domestic_value_add.toFixed(1)}%`
                              : "N/A"}
                            {batch.specs.dva_source === "AUDITED" ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-2">
                                <Shield className="h-3 w-3 mr-1" /> CA Verified
                              </Badge>
                            ) : batch.specs.dva_source === "ESTIMATED" ? (
                              <Badge
                                variant="outline"
                                className="text-muted-foreground text-[10px] px-2"
                              >
                                Estimated
                              </Badge>
                            ) : null}
                          </dd>
                          {batch.domestic_value_add >= 50 && (
                            <span className="text-xs text-emerald-400 mt-1 block">
                              PLI Eligible
                            </span>
                          )}
                          {batch.specs.dva_source === "AUDITED" &&
                            batch.specs.pli_certificate_url && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <a
                                  href={batch.specs.pli_certificate_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  <FileCheck className="h-3.5 w-3.5" />
                                  View Auditor Certificate
                                </a>
                              </div>
                            )}
                        </div>
                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Factory className="h-3.5 w-3.5 text-orange-400" />
                            Cell Source
                          </dt>
                          <dd className="text-foreground">
                            {batch.specs.cell_source === "DOMESTIC" ? (
                              <span className="inline-flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                                <span className="text-emerald-400">
                                  Domestic
                                </span>
                              </span>
                            ) : batch.specs.cell_source === "IMPORTED" ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="text-amber-400">Imported</span>
                              </span>
                            ) : (
                              "Not specified"
                            )}
                          </dd>
                        </div>
                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                            HSN Code
                          </dt>
                          <dd className="font-mono text-lg text-foreground">
                            {batch.specs.hsn_code || "N/A"}
                          </dd>
                        </div>
                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                            PLI Subsidy Eligible
                          </dt>
                          <dd>
                            {batch.pli_compliant ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                Yes
                              </Badge>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground">
                                No
                              </Badge>
                            )}
                          </dd>
                        </div>
                        {(batch.specs?.sale_price_inr ||
                          batch.specs?.import_cost_inr) && (
                          <>
                            <div className="p-4 bg-background border border-border">
                              <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                                Sale Price
                              </dt>
                              <dd className="text-foreground">
                                INR{" "}
                                {batch.specs.sale_price_inr?.toLocaleString(
                                  "en-IN",
                                ) || "0"}
                              </dd>
                            </div>
                            <div className="p-4 bg-background border border-border">
                              <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                                Import Material Cost
                              </dt>
                              <dd className="text-foreground">
                                INR{" "}
                                {batch.specs.import_cost_inr?.toLocaleString(
                                  "en-IN",
                                ) || "0"}
                              </dd>
                            </div>
                          </>
                        )}
                        <div className="col-span-2 p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                            Serial Format (BPAN)
                          </dt>
                          <dd className="font-mono text-sm bg-orange-500/10 text-orange-400 px-3 py-2 border border-orange-500/20 inline-block">
                            IN-
                            {user?.morth_manufacturer_code?.trim() &&
                            user.morth_manufacturer_code.trim() !== "TBC"
                              ? user.morth_manufacturer_code.trim()
                              : "XXX"}
                            -{batch.specs?.chemistry || "LFP"}-2026-XXXXX
                          </dd>
                        </div>
                      </dl>

                      {batch.specs.cell_source === "IMPORTED" &&
                        batch.specs.bill_of_entry_no && (
                          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-center gap-2 mb-3">
                              <FileText className="h-4 w-4 text-amber-400" />
                              <span className="text-sm font-medium text-amber-400">
                                Customs Declaration
                              </span>
                            </div>
                            <dl className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <dt className="text-muted-foreground mb-1 text-xs">
                                  Bill of Entry
                                </dt>
                                <dd className="font-mono text-foreground">
                                  {batch.specs.bill_of_entry_no}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-muted-foreground mb-1 text-xs">
                                  Cell Country of Origin
                                </dt>
                                <dd className="text-foreground">
                                  {batch.specs.country_of_origin || "N/A"}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-muted-foreground mb-1 text-xs">
                                  Customs Clearance Date
                                </dt>
                                <dd className="text-foreground">
                                  {batch.specs.customs_date
                                    ? new Date(
                                        batch.specs.customs_date,
                                      ).toLocaleDateString(undefined, {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })
                                    : "N/A"}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                )}

                {!isTextile && isEU && (
                  <Card className="bg-transparent border-border border-l-4 border-l-blue-500">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-foreground">
                        <span>EU Compliance</span>
                        <span className="text-xs font-normal text-muted-foreground bg-blue-500/10 px-2 py-1 rounded">
                          Battery Passport
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                            Carbon Footprint
                          </dt>
                          <dd className="text-foreground flex items-center gap-2">
                            <span className="text-xl text-emerald-400">
                              {batch.specs.carbon_footprint || "N/A"}
                            </span>
                            {batch.specs.carbon_footprint && (
                              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
                                CO2e Certified
                              </span>
                            )}
                          </dd>
                        </div>
                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                            Recycled Content
                          </dt>
                          <dd className="text-foreground">
                            {hasRecycledContent
                              ? `${batch.specs.recycled_content_pct}%`
                              : "Not declared"}
                          </dd>
                        </div>
                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                            Certifications
                          </dt>
                          <dd className="flex gap-2 flex-wrap">
                            {certifications.length > 0 ? (
                              certifications.map((certification: string) => (
                                <Badge
                                  key={certification}
                                  className="bg-blue-500/20 text-blue-400 border-blue-500/30"
                                >
                                  {certification}
                                </Badge>
                              ))
                            ) : (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                CE
                              </Badge>
                            )}
                          </dd>
                        </div>
                        {batch.specs.chemistry && (
                          <div className="p-4 bg-background border border-border">
                            <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                              Fiber Type
                            </dt>
                            <dd className="text-foreground">
                              {batch.specs.chemistry}
                            </dd>
                          </div>
                        )}
                        <div className="p-4 bg-background border border-border">
                          <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Atom className="h-3.5 w-3.5 text-teal-400" />
                            Material Data
                          </dt>
                          <dd>
                            {materialComposition ? (
                              <span className="text-emerald-400">
                                Available
                              </span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1.5">
                                <AlertTriangle className="h-4 w-4" />
                                Pending
                              </span>
                            )}
                          </dd>
                        </div>
                        {batch.specs.eu_representative && (
                          <div className="p-4 bg-background border border-border">
                            <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                              EU Representative
                            </dt>
                            <dd className="text-foreground">
                              {batch.specs.eu_representative}
                            </dd>
                            {batch.specs.eu_representative_email && (
                              <dd className="text-xs text-blue-400 mt-1">
                                <a
                                  href={`mailto:${batch.specs.eu_representative_email}`}
                                  className="hover:underline"
                                >
                                  {batch.specs.eu_representative_email}
                                </a>
                              </dd>
                            )}
                          </div>
                        )}
                        {(hasWarrantyMonths || hasExpectedLifetime) && (
                          <>
                            {hasWarrantyMonths && (
                              <div className="p-4 bg-background border border-border">
                                <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                                  Warranty Period
                                </dt>
                                <dd className="text-foreground">
                                  {batch.specs.warranty_months} months
                                </dd>
                              </div>
                            )}
                            {hasExpectedLifetime && (
                              <div className="p-4 bg-background border border-border">
                                <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                                  Expected Lifetime
                                </dt>
                                <dd className="text-foreground">
                                  {expectedLifetimeCycles?.toLocaleString()}{" "}
                                  cycles
                                </dd>
                              </div>
                            )}
                          </>
                        )}
                        {hasRecycledContent && (
                          <div className="p-4 bg-background border border-border">
                            <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                              Recycled Content
                            </dt>
                            <dd className="text-emerald-400">
                              {batch.specs.recycled_content_pct}%
                            </dd>
                          </div>
                        )}
                        {materialComposition && (
                          <div className="col-span-2 p-4 bg-background border border-border">
                            <dt className="text-muted-foreground mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                              <Atom className="h-3.5 w-3.5 text-teal-400" />
                              Material Composition
                            </dt>
                            <dd className="grid grid-cols-3 gap-3 text-xs">
                              {(materialComposition.cobalt_pct ?? 0) > 0 && (
                                <div className="flex justify-between items-center p-2 bg-muted rounded">
                                  <span className="text-muted-foreground">
                                    Cobalt
                                  </span>
                                  <span className="text-foreground">
                                    {materialComposition.cobalt_pct}%
                                  </span>
                                </div>
                              )}
                              {(materialComposition.lithium_pct ?? 0) > 0 && (
                                <div className="flex justify-between items-center p-2 bg-muted rounded">
                                  <span className="text-muted-foreground">
                                    Lithium
                                  </span>
                                  <span className="text-foreground">
                                    {materialComposition.lithium_pct}%
                                  </span>
                                </div>
                              )}
                              {(materialComposition.nickel_pct ?? 0) > 0 && (
                                <div className="flex justify-between items-center p-2 bg-muted rounded">
                                  <span className="text-muted-foreground">
                                    Nickel
                                  </span>
                                  <span className="text-foreground">
                                    {materialComposition.nickel_pct}%
                                  </span>
                                </div>
                              )}
                              {(materialComposition.manganese_pct ?? 0) > 0 && (
                                <div className="flex justify-between items-center p-2 bg-muted rounded">
                                  <span className="text-muted-foreground">
                                    Manganese
                                  </span>
                                  <span className="text-foreground">
                                    {materialComposition.manganese_pct}%
                                  </span>
                                </div>
                              )}
                              {(materialComposition.graphite_pct ?? 0) > 0 && (
                                <div className="flex justify-between items-center p-2 bg-muted rounded">
                                  <span className="text-muted-foreground">
                                    Graphite
                                  </span>
                                  <span className="text-foreground">
                                    {materialComposition.graphite_pct}%
                                  </span>
                                </div>
                              )}
                              {(materialComposition.lead_pct ?? 0) > 0 && (
                                <div className="flex justify-between items-center p-2 bg-muted rounded">
                                  <span className="text-muted-foreground">
                                    Lead
                                  </span>
                                  <span className="text-foreground">
                                    {materialComposition.lead_pct}%
                                  </span>
                                </div>
                              )}
                            </dd>
                          </div>
                        )}
                        {batch.specs.hazardous_substances && (
                          <div className="col-span-2 p-4 bg-amber-500/10 border border-amber-500/20">
                            <dt className="text-muted-foreground mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                              Hazardous Substances Declaration
                            </dt>
                            <dd className="space-y-2">
                              <div className="flex flex-wrap gap-2 mb-2">
                                {batch.specs.hazardous_substances
                                  .lead_present && (
                                  <Badge
                                    variant="outline"
                                    className="text-amber-400 border-amber-500/30"
                                  >
                                    Lead
                                  </Badge>
                                )}
                                {batch.specs.hazardous_substances
                                  .mercury_present && (
                                  <Badge
                                    variant="outline"
                                    className="text-amber-400 border-amber-500/30"
                                  >
                                    Mercury
                                  </Badge>
                                )}
                                {batch.specs.hazardous_substances
                                  .cadmium_present && (
                                  <Badge
                                    variant="outline"
                                    className="text-amber-400 border-amber-500/30"
                                  >
                                    Cadmium
                                  </Badge>
                                )}
                                {!batch.specs.hazardous_substances
                                  .lead_present &&
                                  !batch.specs.hazardous_substances
                                    .mercury_present &&
                                  !batch.specs.hazardous_substances
                                    .cadmium_present && (
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                      No hazardous substances detected
                                    </Badge>
                                  )}
                              </div>
                              {batch.specs.hazardous_substances.declaration && (
                                <p className="text-xs text-muted-foreground italic">
                                  {batch.specs.hazardous_substances.declaration}
                                </p>
                              )}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  <Card
                    className={`bg-transparent border-border ${
                      isTextile
                        ? "border-l-4 border-l-cyan-500"
                        : isIndia
                          ? "border-l-4 border-l-orange-500"
                          : isEU
                            ? "border-l-4 border-l-blue-500"
                            : "border-l-4 border-l-emerald-500"
                    }`}
                  >
                    <CardHeader>
                      <CardTitle className="text-foreground">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-4xl ${
                          isTextile
                            ? "text-cyan-400"
                            : isIndia
                              ? "text-orange-400"
                              : isEU
                                ? "text-blue-400"
                                : "text-emerald-400"
                        }`}
                      >
                        {passportCount.toLocaleString()}
                      </div>
                      <p className="text-sm mt-1 text-muted-foreground">
                        {isTextile
                          ? "Textile Passports"
                          : isIndia
                            ? "Battery Aadhaar IDs"
                            : isEU
                              ? "EU Passports"
                              : "Total Passports"}{" "}
                        Generated
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-transparent border-border">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-xl text-foreground">
                          {isTextile
                            ? "Textile Passport"
                            : isIndia
                              ? "India Market"
                              : isEU
                                ? "EU Export"
                                : "Global"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isTextile
                            ? "Digital Product Passport Ready"
                            : isIndia
                              ? "Battery Aadhaar Compliant"
                              : isEU
                                ? "EU Battery Regulation"
                                : "Multi-Market Ready"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "passports" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl tracking-tight text-foreground">
                    Generated Passports
                  </h2>
                  {pagination.total > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total,
                      )}{" "}
                      of {pagination.total.toLocaleString()}
                    </p>
                  )}
                </div>

                <PassportList passports={passports} />

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="border-border text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, index) => {
                          let pageNum: number;
                          if (pagination.totalPages <= 5) {
                            pageNum = index + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = index + 1;
                          } else if (
                            pagination.page >=
                            pagination.totalPages - 2
                          ) {
                            pageNum = pagination.totalPages - 4 + index;
                          } else {
                            pageNum = pagination.page - 2 + index;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                pageNum === pagination.page
                                  ? "default"
                                  : "ghost"
                              }
                              size="sm"
                              className={`w-8 h-8 p-0 ${pageNum === pagination.page ? "" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        },
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasMore}
                      className="border-border text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "upload" && (
              <div className="space-y-6">
                <Card className="bg-transparent border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <div className="p-2 bg-teal-50">
                        <FileSpreadsheet className="h-5 w-5 text-teal-600" />
                      </div>
                      Upload Data
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Upload a CSV file containing passport data for this{" "}
                      {"lot"}.
                      {isIndia && (
                        <span className="block mt-2 text-orange-400 font-medium">
                          Auto-generates BPAN format: IN-
                          {user?.morth_manufacturer_code?.trim() &&
                          user?.morth_manufacturer_code.trim() !== "TBC"
                            ? user.morth_manufacturer_code.trim()
                            : "XXX"}
                          -{batch.specs.chemistry}-2026-00001 to ...
                          {passportCount || "N"}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UploadCSV
                      batchId={batch.id}
                      marketRegion={region}
                      fiber_type={batch.specs?.chemistry}
                      morthCode={user?.morth_manufacturer_code}
                      isDraft={isDraft}
                      onUploadComplete={handleUploadComplete}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "compliance" && (
              <div className="space-y-6">
                {batch.status === "ACTIVE" && (
                  <Card className="bg-transparent border-border border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-foreground">
                        <div className="p-2 bg-emerald-500/10">
                          <Shield className="h-5 w-5 text-emerald-500" />
                        </div>
                        <span>Compliance Score</span>
                        {complianceScore !== null &&
                          (() => {
                            const hasErrors = complianceGaps.some(
                              (gap) => gap.severity === "ERROR",
                            );
                            const hasWarnings = complianceGaps.some(
                              (gap) => gap.severity === "WARNING",
                            );
                            const badgeColor =
                              complianceScore >= 80
                                ? hasErrors
                                  ? "bg-red-500/10 text-red-500 border-red-200"
                                  : hasWarnings
                                    ? "bg-amber-500/10 text-amber-500 border-amber-200"
                                    : "bg-emerald-500/10 text-emerald-500 border-emerald-200"
                                : complianceScore >= 50
                                  ? "bg-amber-500/10 text-amber-500 border-amber-200"
                                  : "bg-red-500/10 text-red-500 border-red-200";
                            const badgeLabel =
                              complianceScore >= 80
                                ? hasErrors
                                  ? "Issues Found"
                                  : hasWarnings
                                    ? "Passed with Warnings"
                                    : "Passed"
                                : complianceScore >= 50
                                  ? "Partial"
                                  : "Failing";
                            return (
                              <Badge className={`ml-auto ${badgeColor}`}>
                                {badgeLabel}
                              </Badge>
                            );
                          })()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {complianceLoading ? (
                        <div className="h-16 bg-muted rounded animate-pulse" />
                      ) : complianceScore !== null ? (
                        <div className="space-y-4">
                          <div className="flex items-end gap-3">
                            <span
                              className={`text-4xl ${
                                complianceScore >= 80
                                  ? "text-emerald-500"
                                  : complianceScore >= 50
                                    ? "text-amber-500"
                                    : "text-red-500"
                              }`}
                            >
                              {complianceScore}%
                            </span>
                            <span className="text-sm text-muted-foreground mb-1">
                              compliance score
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                complianceScore >= 80
                                  ? "bg-emerald-500/100"
                                  : complianceScore >= 50
                                    ? "bg-amber-500/100"
                                    : "bg-red-500/100"
                              }`}
                              style={{ width: `${complianceScore}%` }}
                            />
                          </div>

                          {complianceGaps.filter(
                            (gap) => gap.severity === "ERROR",
                          ).length > 0 && (
                            <div className="mt-4 space-y-2">
                              <h4 className="text-xs font-medium text-red-500 uppercase tracking-wider">
                                Compliance Issues (
                                {
                                  complianceGaps.filter(
                                    (gap) => gap.severity === "ERROR",
                                  ).length
                                }
                                )
                              </h4>
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {complianceGaps
                                  .filter((gap) => gap.severity === "ERROR")
                                  .map((gap, index) => (
                                    <div
                                      key={index}
                                      className="flex items-start gap-2 text-sm p-2 bg-red-500/10"
                                    >
                                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-red-500" />
                                      <div>
                                        <span className="font-medium text-foreground">
                                          {gap.field}
                                        </span>
                                        <span className="text-muted-foreground ml-1">
                                          - {gap.message}
                                        </span>
                                        <span className="block text-xs text-muted-foreground mt-0.5">
                                          {gap.regulation}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {complianceGaps.filter(
                            (gap) => gap.severity === "WARNING",
                          ).length > 0 && (
                            <div className="mt-4 space-y-2">
                              <h4 className="text-xs font-medium text-amber-500 uppercase tracking-wider">
                                Advisory Warnings (
                                {
                                  complianceGaps.filter(
                                    (gap) => gap.severity === "WARNING",
                                  ).length
                                }
                                ) - recommended, not blocking
                              </h4>
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {complianceGaps
                                  .filter((gap) => gap.severity === "WARNING")
                                  .map((gap, index) => (
                                    <div
                                      key={index}
                                      className="flex items-start gap-2 text-sm p-2 bg-amber-500/10"
                                    >
                                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                                      <div>
                                        <span className="font-medium text-foreground">
                                          {gap.field}
                                        </span>
                                        <span className="text-muted-foreground ml-1">
                                          - {gap.message}
                                        </span>
                                        <span className="block text-xs text-muted-foreground mt-0.5">
                                          {gap.regulation}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {complianceGaps.length === 0 && (
                            <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 p-3">
                              <CheckCircle className="h-4 w-4" />
                              All compliance checks passed
                            </div>
                          )}

                          <Button
                            variant="outline"
                            className="w-full mt-2 border-emerald-200 text-emerald-500 hover:bg-emerald-500/10"
                            onClick={handleDownloadComplianceReport}
                          >
                            <FileCheck className="mr-2 h-4 w-4" />
                            Download Compliance Report (PDF)
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Compliance score will be calculated when the {"lot"}{" "}
                          is activated.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {(isEU || batch.market_region === "GLOBAL") && (
                  <CarbonCalculator
                    batchId={batch.id}
                    chemistry={batch.specs.chemistry}
                    capacity={batch.specs.capacity}
                    weight={batch.specs.weight}
                    existingResult={batch.carbon_footprint_result as null}
                    onResultSaved={fetchBatch}
                  />
                )}
              </div>
            )}

            {activeTab === "reports" && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-transparent border-border hover:border-blue-300 transition-colors">
                  <CardContent className="pt-6">
                    <Button
                      className="w-full bg-muted hover:bg-blue-500/10 hover:border-blue-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                      onClick={() => setLabelsDialogOpen(true)}
                      disabled={isDraft}
                    >
                      <Printer className="mr-2 h-4 w-4 text-blue-500" />
                      Download PDF Labels
                      {isDraft && (
                        <Lock className="ml-auto h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Generate printable labels for all passports in this{" "}
                      {"lot"}.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-transparent border-border hover:border-emerald-300 transition-colors">
                  <CardContent className="pt-6">
                    <Button
                      className="w-full bg-muted hover:bg-emerald-500/10 hover:border-emerald-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                      onClick={handleDownloadQR}
                      disabled={isDraft}
                    >
                      <QrCode className="mr-2 h-4 w-4 text-emerald-500" />
                      Download QR Codes (ZIP)
                      {isDraft && (
                        <Lock className="ml-auto h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Download all QR codes as a ZIP archive.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-transparent border-border hover:border-teal-300 transition-colors">
                  <CardContent className="pt-6">
                    <Button
                      className="w-full bg-muted hover:bg-teal-50 hover:border-teal-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                      onClick={handleExportCSV}
                      disabled={isDraft}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4 text-teal-500" />
                      Export Serial List (CSV)
                      {isDraft && (
                        <Lock className="ml-auto h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Export all serial numbers and passport data as CSV.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-transparent border-border hover:border-amber-300 transition-colors">
                  <CardContent className="pt-6">
                    <Button
                      className="w-full bg-muted hover:bg-amber-500/10 hover:border-amber-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                      onClick={handleExportAuditCSV}
                    >
                      <FileText className="mr-2 h-4 w-4 text-amber-500" />
                      Export Audit Log (CSV)
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Download the full audit trail for this {"lot"}.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-transparent border-border hover:border-emerald-300 transition-colors">
                  <CardContent className="pt-6">
                    <Button
                      className="w-full bg-muted hover:bg-emerald-500/10 hover:border-emerald-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                      onClick={handleDownloadComplianceReport}
                      disabled={isDraft}
                    >
                      <FileCheck className="mr-2 h-4 w-4 text-emerald-500" />
                      Compliance Report (PDF)
                      {isDraft && (
                        <Lock className="ml-auto h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Download the full compliance assessment report.
                    </p>
                  </CardContent>
                </Card>

                {(isEU || isGlobal) && (
                  <Card className="bg-transparent border-border hover:border-emerald-300 transition-colors">
                    <CardContent className="pt-6">
                      <Button
                        className="w-full bg-muted hover:bg-emerald-500/10 hover:border-emerald-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                        onClick={handleExportComplianceDeclaration}
                        disabled={isDraft}
                      >
                        <Leaf className="mr-2 h-4 w-4 text-emerald-500" />
                        {complianceDeclarationTitle} (PDF)
                        {isDraft && (
                          <Lock className="ml-auto h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {complianceDeclarationDescription}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {(isEU || isGlobal) && (
                  <Card className="bg-transparent border-border hover:border-indigo-300 transition-colors">
                    <CardContent className="pt-6">
                      <Button
                        className="w-full bg-muted hover:bg-indigo-500/10 hover:border-indigo-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                        onClick={handleExportDueDiligence}
                        disabled={isDraft}
                      >
                        <Shield className="mr-2 h-4 w-4 text-indigo-500" />
                        {isTextile
                          ? "Textile Due Diligence Report (PDF)"
                          : "Due Diligence Report (PDF)"}
                        {isDraft && (
                          <Lock className="ml-auto h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {isTextile
                          ? "Generate the textile supply chain due diligence report."
                          : "Generate the supply chain due diligence report."}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>

        <DownloadLabelsDialog
          open={labelsDialogOpen}
          onOpenChange={setLabelsDialogOpen}
          batchName={batch?.batch_name || ""}
          passportCount={passportCount}
          onDownload={handleDownloadLabels}
        />

        <ConfirmDialog
          open={!!confirmCert}
          onOpenChange={(open) => {
            if (!open) setConfirmCert(null);
          }}
          title={`Declare ${confirmCert?.cert} Certification?`}
          description={`By confirming, you self-declare that this ${"lot"} has passed ${confirmCert?.cert} testing and you hold the relevant certificate. You remain legally responsible for compliance accuracy.`}
          confirmText={`Yes, I hold ${confirmCert?.cert}`}
          variant="default"
          onConfirm={() => {
            if (!confirmCert || !batch) return;
            const currentCerts: string[] = batch.specs?.certifications || [];
            handlePatchSpec(confirmCert.key, {
              certifications: [...currentCerts, confirmCert.cert],
            });
            setConfirmCert(null);
          }}
        />
        <ConfirmDialog
          open={confirmArchive}
          onOpenChange={setConfirmArchive}
          title={`Archive this ${"lot"}?`}
          description={`This is permanent and cannot be undone. Archived ${"lots"} remain available for audit and compliance purposes but can no longer generate new passports or be reactivated.`}
          confirmText={`Archive ${"Lot"}`}
          variant="default"
          onConfirm={handleArchiveBatch}
        />
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete this draft ${"lot"}?`}
          description={`This action cannot be undone. Only draft ${"lots"} with no passports can be deleted.`}
          confirmText="Delete Draft"
          variant="destructive"
          onConfirm={handleDeleteDraft}
        />
      </div>
    </div>
  );
}
