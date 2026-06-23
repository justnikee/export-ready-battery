"use client";

import { createExportJob } from "@/lib/api/exports";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  createCertificateAnchor,
  getCertificateAnchors,
  computeFileHash,
} from "@/lib/api/anchors";
import {
  getBatchRegistryVerifications,
  verifyBatchRegistry,
  autoVerifyBatch,
} from "@/lib/api/registry";
import { useAuth } from "@/context/auth-context";
import { getApiErrorMessage, toApiError } from "@/lib/utils";
import { toast } from "sonner";
import { dashboardPathFromPathname } from "@/lib/routes";
import type {
  Batch,
  Passport,
  CertificateAnchor,
  ComplianceGap,
  RegistryVerification,
} from "@/lib/types";
import type {
  BatchResponse,
  PassportsResponse,
  PaginationInfo,
  ActivationBlockers,
  MarketRegion,
  CertExpiryResult,
  CertExpiryStatus,
} from "../types";

export function useBatchDetail(batchId: string, pathname: string) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // Data state
  const [batch, setBatch] = useState<Batch | null>(null);
  const [passports, setPassports] = useState<Passport[]>([]);
  const [passportCount, setPassportCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  // UI state
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCert, setConfirmCert] = useState<{
    key: string;
    cert: string;
  } | null>(null);

  // Compliance state
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [complianceGaps, setComplianceGaps] = useState<ComplianceGap[]>([]);
  const [complianceLoading, setComplianceLoading] = useState(false);

  // Anchors state
  const [anchors, setAnchors] = useState<CertificateAnchor[]>([]);
  const [anchorsLoading, setAnchorsLoading] = useState(false);

  // Registry verification state
  const [verifications, setVerifications] = useState<RegistryVerification[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);

  // Mutation state
  const [activating, setActivating] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [patchingKey, setPatchingKey] = useState<string | null>(null);
  const [anchoringCert, setAnchoringCert] = useState<string | null>(null);

  // Scroll target for cross-tab navigation
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  // Derived routes
  const exportsHref = dashboardPathFromPathname(pathname, "exports");
  const settingsHref = dashboardPathFromPathname(pathname, "settings");
  const settingsComplianceHref = dashboardPathFromPathname(
    pathname,
    "settings?tab=compliance",
  );
  const billingHref = dashboardPathFromPathname(pathname, "billing");
  const batchesHref = dashboardPathFromPathname(pathname, "batches");

  // ───────────────────────────────────────────────────────────────
  // Data fetching
  // ───────────────────────────────────────────────────────────────

  const fetchBatch = useCallback(async () => {
    try {
      const response = await api.get<BatchResponse>(`/batches/${batchId}`);
      setBatch(response.data.batch);
      setPassportCount(response.data.passport_count || 0);
    } catch {
      toast.error("Failed to load batch details");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  const fetchPassports = useCallback(
    async (page = 1, limit = 50) => {
      try {
        const response = await api.get<PassportsResponse>(
          `/batches/${batchId}/passports?page=${page}&limit=${limit}`,
        );
        setPassports(response.data.passports || []);
        setPagination({
          page: response.data.page || 1,
          limit: response.data.limit || 50,
          total: response.data.total || 0,
          totalPages: response.data.total_pages || 0,
          hasMore: response.data.has_more || false,
        });
      } catch {
        toast.error("Failed to load passports");
      }
    },
    [batchId],
  );

  const fetchAnchors = useCallback(async () => {
    if (!batchId) return;
    setAnchorsLoading(true);
    try {
      const data = await getCertificateAnchors(batchId);
      setAnchors(data);
    } catch {
      toast.error("Failed to load certificate anchors");
    } finally {
      setAnchorsLoading(false);
    }
  }, [batchId]);

  const fetchCompliance = useCallback(async () => {
    setComplianceLoading(true);
    try {
      const res = await api.get(`/batches/${batchId}/compliance`);
      setComplianceScore(res.data.compliance_score ?? null);
      setComplianceGaps(res.data.compliance_gaps ?? []);
    } catch {
      toast.error("Failed to load compliance data");
    } finally {
      setComplianceLoading(false);
    }
  }, [batchId]);

  const fetchVerifications = useCallback(async () => {
    setVerificationsLoading(true);
    try {
      const data = await getBatchRegistryVerifications(batchId);
      setVerifications(data.verifications || []);
    } catch {
      // Registry verifications may not exist yet — silently fail
    } finally {
      setVerificationsLoading(false);
    }
  }, [batchId]);

  // Eager-load data needed by Overview + header on mount.
  // Registry verifications are lazy-loaded by the Registry tab.
  useEffect(() => {
    fetchBatch();
    fetchPassports(1, 50);
    fetchAnchors();
    fetchCompliance();
  }, [fetchBatch, fetchPassports, fetchAnchors, fetchCompliance]);

  // Scroll to target after render
  useEffect(() => {
    if (!scrollTarget) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(scrollTarget);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setScrollTarget(null);
    }, 100);
    return () => clearTimeout(timer);
  }, [scrollTarget]);

  // ───────────────────────────────────────────────────────────────
  // Passport handlers
  // ───────────────────────────────────────────────────────────────

  const handleUploadComplete = useCallback(() => {
    fetchBatch();
    fetchPassports(1, 50);
  }, [fetchBatch, fetchPassports]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      fetchPassports(newPage, pagination.limit);
    },
    [fetchPassports, pagination.limit],
  );

  // ───────────────────────────────────────────────────────────────
  // Export / Download handlers
  // ───────────────────────────────────────────────────────────────

  const handleDownloadQR = useCallback(async () => {
    if (!batch) return;
    const MAX_DIRECT_DOWNLOAD = 500;

    if (passportCount > MAX_DIRECT_DOWNLOAD) {
      try {
        toast.loading(
          "Creating export job... This may take a few minutes for large batches.",
          { id: "qr-export" },
        );
        const job = await createExportJob({
          batch_id: batchId,
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
        toast.error(
          apiError.response?.data?.error || "Failed to create export job",
          { id: "qr-export" },
        );
      }
    } else {
      try {
        toast.loading("Generating QR codes...", { id: "qr-download" });
        const response = await api.get(`/batches/${batchId}/download`, {
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${batch.batch_name}_qrcodes.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success("QR codes downloaded successfully!", {
          id: "qr-download",
        });
      } catch (error: unknown) {
        const msg = await getApiErrorMessage(error, "Failed to download QR codes");
        toast.error(msg, { id: "qr-download" });
      }
    }
  }, [batch, batchId, passportCount, router, exportsHref]);

  const handleDownloadLabels = useCallback(async () => {
    if (!batch) return;
    const MAX_DIRECT_DOWNLOAD = 500;

    if (passportCount > MAX_DIRECT_DOWNLOAD) {
      try {
        toast.loading(
          "Creating export job... This may take a few minutes for large batches.",
          { id: "labels-export" },
        );
        const job = await createExportJob({
          batch_id: batchId,
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
        toast.error(
          apiError.response?.data?.error || "Failed to create export job",
          { id: "labels-export" },
        );
      }
    } else {
      try {
        toast.loading("Generating PDF labels...", { id: "labels-download" });
        const response = await api.get(`/batches/${batchId}/labels`, {
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${batch.batch_name}_labels.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Labels downloaded successfully!", {
          id: "labels-download",
        });
      } catch (error: unknown) {
        const apiError = error as { response?: { status?: number; data?: unknown } };
        if (apiError.response?.status === 403) {
          toast.error(
            "You must activate this batch before downloading labels.",
            {
              id: "labels-download",
              description: "Click 'Activate Batch' to unlock downloads.",
              duration: 5000,
            },
          );
        } else {
          const msg = await getApiErrorMessage(error, "Failed to download labels");
          toast.error(msg, { id: "labels-download" });
        }
      }
    }
  }, [batch, batchId, passportCount, router, exportsHref]);

  const handleExportCSV = useCallback(async () => {
    if (!batch) return;
    try {
      toast.loading("Generating CSV export...", { id: "csv-export" });
      const response = await api.get(`/batches/${batchId}/export`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${batch.batch_name}_serial_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV export downloaded successfully!", { id: "csv-export" });
    } catch (error: unknown) {
      const msg = await getApiErrorMessage(error, "Failed to export CSV");
      toast.error(msg, { id: "csv-export" });
    }
  }, [batch, batchId]);

  const handleExportAuditCSV = useCallback(async () => {
    if (!batch) return;
    try {
      toast.loading("Generating audit export...", { id: "audit-export" });
      const response = await api.get(`/batches/${batchId}/audit-export`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${batch.batch_name}_audit_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Audit export downloaded", { id: "audit-export" });
    } catch (error: unknown) {
      const msg = await getApiErrorMessage(error, "Failed to download audit export");
      toast.error(msg, { id: "audit-export" });
    }
  }, [batch, batchId]);

  const handleExportDueDiligence = useCallback(async () => {
    if (!batch) return;
    try {
      toast.loading("Generating Due Diligence Report...", {
        id: "dd-download",
      });
      const response = await api.get(
        `/batches/${batchId}/due-diligence-report`,
        { responseType: "blob" },
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
      toast.success("Due Diligence Report downloaded!", { id: "dd-download" });
    } catch (error: unknown) {
      const apiError = error as { response?: { status?: number; data?: unknown } };
      if (apiError.response?.status === 403) {
        toast.error(
          "Batch must be activated before generating the Due Diligence Report.",
          { id: "dd-download" },
        );
      } else {
        const msg = await getApiErrorMessage(error, "Failed to download Due Diligence Report");
        toast.error(msg, { id: "dd-download" });
      }
    }
  }, [batch, batchId]);

  const handleExportComplianceDeclaration = useCallback(async () => {
    if (!batch) return;
    try {
      toast.loading("Generating Carbon Declaration...", {
        id: "cd-download",
      });
      const response = await api.get(
        `/batches/${batchId}/compliance-declaration`,
        { responseType: "blob" },
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
      toast.success("Carbon Declaration downloaded!", { id: "cd-download" });
    } catch (error: unknown) {
      const apiError = error as { response?: { status?: number; data?: unknown } };
      if (apiError.response?.status === 400) {
        toast.error(
          "No carbon footprint data available. Run the Carbon Calculator first.",
          { id: "cd-download" },
        );
      } else {
        const msg = await getApiErrorMessage(error, "Failed to download Compliance Declaration");
        toast.error(msg, { id: "cd-download" });
      }
    }
  }, [batch, batchId]);

  const handleDownloadComplianceReport = useCallback(async () => {
    if (!batch) return;
    try {
      toast.loading("Generating Compliance Report...", { id: "cr-download" });
      const response = await api.get(`/batches/${batchId}/compliance-report`, {
        responseType: "blob",
      });
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
      const msg = await getApiErrorMessage(error, "Failed to download Compliance Report");
      toast.error(msg, { id: "cr-download" });
    }
  }, [batch, batchId]);

  // ───────────────────────────────────────────────────────────────
  // Batch mutation handlers
  // ───────────────────────────────────────────────────────────────

  const handleActivateBatch = useCallback(async () => {
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
      await api.post(`/batches/${batchId}/activate`);
      toast.success("Batch activated successfully!");
      await fetchBatch();
      await refreshUser();
    } catch (error: unknown) {
      const apiError = toApiError(error);
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
            data?.error || "Compliance requirements not met. Activation blocked.",
          );
        }
      } else {
        toast.error(
          apiError.response?.data?.error || "Failed to activate batch",
        );
      }
    } finally {
      setActivating(false);
    }
  }, [batch, batchId, user, refreshUser, router, billingHref, fetchBatch]);

  const handleArchiveBatch = useCallback(async () => {
    if (!batch) return;
    setConfirmArchive(false);
    setArchiving(true);
    try {
      await api.post(`/batches/${batchId}/archive`);
      toast.success("Batch archived successfully");
      await fetchBatch();
    } catch (error: unknown) {
      const apiError = toApiError(error);
      toast.error(apiError.response?.data?.error || "Failed to archive batch");
    } finally {
      setArchiving(false);
    }
  }, [batch, batchId, fetchBatch]);

  const handleDeleteDraft = useCallback(async () => {
    if (!batch) return;
    setConfirmDelete(false);
    setDeletingDraft(true);
    try {
      await api.delete(`/batches/${batchId}/draft`);
      toast.success("Draft batch deleted successfully");
      router.push(batchesHref);
    } catch (error: unknown) {
      const apiError = toApiError(error);
      toast.error(
        apiError.response?.data?.error || "Failed to delete draft batch",
      );
    } finally {
      setDeletingDraft(false);
    }
  }, [batch, batchId, router, batchesHref]);

  const handlePatchSpec = useCallback(
    async (key: string, specsFragment: Record<string, unknown>) => {
      if (!batch) return;
      setPatchingKey(key);
      try {
        await api.patch(`/batches/${batchId}`, { specs: specsFragment });
        await fetchBatch();
        toast.success("Batch updated");
      } catch (error: unknown) {
        const apiError = toApiError(error);
        toast.error(
          apiError.response?.data?.error || "Failed to update batch",
        );
      } finally {
        setPatchingKey(null);
      }
    },
    [batch, batchId, fetchBatch],
  );

  const handleAnchorCertificate = useCallback(
    async (certType: string, fileUrl: string) => {
      if (!batch) return;
      setAnchoringCert(certType);
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch certificate file");
        }
        const blob = await response.blob();
        const fileHash = await computeFileHash(blob);
        await createCertificateAnchor(batch.id, {
          cert_type: certType,
          file_url: fileUrl,
          file_hash: fileHash,
        });
        toast.success(
          `${certType} certificate submitted for blockchain anchoring. Check back shortly for the proof.`,
        );
        await fetchAnchors();
      } catch (error: unknown) {
        const apiError = toApiError(error);
        toast.error(
          apiError.response?.data?.error ||
            `Failed to anchor ${certType} certificate`,
        );
      } finally {
        setAnchoringCert(null);
      }
    },
    [batch, fetchAnchors],
  );

  // ───────────────────────────────────────────────────────────────
  // Certificate helpers
  // ───────────────────────────────────────────────────────────────

  const getCertificateExpiry = useCallback(
    (dateStr: string | undefined, validityMonths: number): CertExpiryResult => {
      if (!dateStr)
        return { status: "unset", expiryDate: null, daysRemaining: null };
      const issueDate = new Date(dateStr);
      if (isNaN(issueDate.getTime()))
        return { status: "unset", expiryDate: null, daysRemaining: null };
      const expiryDate = new Date(issueDate);
      expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
      const now = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / msPerDay,
      );
      if (daysRemaining < 0)
        return {
          status: "expired",
          expiryDate: expiryDate.toISOString().split("T")[0],
          daysRemaining,
        };
      if (daysRemaining <= 90)
        return {
          status: "warning",
          expiryDate: expiryDate.toISOString().split("T")[0],
          daysRemaining,
        };
      return {
        status: "valid",
        expiryDate: expiryDate.toISOString().split("T")[0],
        daysRemaining,
      };
    },
    [],
  );

  const getAnchorForCertType = useCallback(
    (certType: string): CertificateAnchor | undefined =>
      anchors.find((a) => a.cert_type === certType),
    [anchors],
  );

  // ───────────────────────────────────────────────────────────────
  // Activation blockers logic
  // ───────────────────────────────────────────────────────────────

  const getActivationBlockers = useCallback(
    (batchRecord: Batch, currentUser: typeof user): ActivationBlockers => {
      const blocking: string[] = [];
      const warnings: string[] = [];
      const region = batchRecord.market_region as MarketRegion;

      // Shared requirements
      if (!batchRecord.model_name?.trim()) blocking.push("model_name");
      if (!batchRecord.manufacturing_start_date)
        blocking.push("manufacturing_start_date");
      if (!batchRecord.manufacturing_end_date)
        blocking.push("manufacturing_end_date");

      // Battery-specific requirements
      if (!batchRecord.specs?.chemistry?.trim())
        blocking.push("specs.chemistry");
      if (!batchRecord.specs?.capacity?.trim())
        blocking.push("specs.capacity");

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
        if (!currentUser?.iec_code?.trim())
          blocking.push("tenant.iec_code");
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
        const validCategories = ["EV", "LMT", "INDUSTRIAL", "PORTABLE", "SLI"];
        if (
          !batchRecord.specs?.battery_category ||
          !validCategories.includes(batchRecord.specs.battery_category)
        ) {
          blocking.push("specs.battery_category");
        }

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
            typeof value === "number" ? value > 0 : parseFloat(String(value)) > 0,
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
                String(
                  (materialComposition as Record<string, unknown>)[key],
                ),
              ) || 0;
            if (baseVal > 0 && recycledVal === 0) {
              warnings.push(
                `Recycled ${baseKey} content not declared (required from Aug 2028)`,
              );
            }
          }
        }
      }

      return { blocking, warnings };
    },
    [],
  );

  // ───────────────────────────────────────────────────────────────
  // Computed values
  // ───────────────────────────────────────────────────────────────

  const isDraft = batch?.status !== "ACTIVE" && batch?.status !== "ARCHIVED";
  const activationResult =
    batch && isDraft
      ? getActivationBlockers(batch, user)
      : { blocking: [], warnings: [] };

  const region = (batch?.market_region || "GLOBAL") as MarketRegion;
  const isIndia = region === "INDIA";
  const isEU = region === "EU";
  const isGlobal = region === "GLOBAL";

  return {
    // Data
    batch,
    passports,
    passportCount,
    loading,
    pagination,

    // UI state
    labelsDialogOpen,
    setLabelsDialogOpen,
    confirmArchive,
    setConfirmArchive,
    confirmDelete,
    setConfirmDelete,
    confirmCert,
    setConfirmCert,

    // Compliance
    complianceScore,
    complianceGaps,
    complianceLoading,

    // Anchors
    anchors,
    anchorsLoading,

    // Registry verifications
    verifications,
    verificationsLoading,
    fetchVerifications,

    // Mutation state
    activating,
    archiving,
    deletingDraft,
    patchingKey,
    anchoringCert,

    // Navigation
    scrollTarget,
    setScrollTarget,
    batchesHref,
    settingsHref,
    settingsComplianceHref,
    billingHref,
    exportsHref,

    // Computed
    isDraft,
    activationResult,
    region,
    isIndia,
    isEU,
    isGlobal,

    // Handlers
    fetchBatch,
    fetchPassports,
    fetchAnchors,
    fetchCompliance,
    handleUploadComplete,
    handlePageChange,
    handleDownloadQR,
    handleDownloadLabels,
    handleExportCSV,
    handleExportAuditCSV,
    handleExportDueDiligence,
    handleExportComplianceDeclaration,
    handleDownloadComplianceReport,
    handleActivateBatch,
    handleArchiveBatch,
    handleDeleteDraft,
    handlePatchSpec,
    handleAnchorCertificate,

    // Helpers
    getCertificateExpiry,
    getAnchorForCertType,
    getActivationBlockers,
  };
}

// ───────────────────────────────────────────────────────────────
// Static helpers
// ───────────────────────────────────────────────────────────────

export function formatBlockerLabel(key: string): string {
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
    "tenant.morth_manufacturer_code":
      "MoRTH code (Settings -> Compliance)",
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
    carbon_footprint_result:
      "Carbon footprint (use Carbon Calculator tab)",
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
}

export function normalizeGapField(field: string): string {
  return field
    .replace(/^batch\./, "")
    .replace(/^specs\./, "specs.")
    .replace(/\[(.*?)\]/, ": $1");
}
