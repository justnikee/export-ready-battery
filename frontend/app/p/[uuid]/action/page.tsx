"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
 Loader2,
 CheckCircle,
 AlertCircle,
 ArrowRight,
 Truck,
 Wrench,
 Recycle,
 Shield,
 User,
 Building2,
 Trophy,
 type LucideIcon,
} from "lucide-react";

interface PassportInfo {
 passport: {
 uuid: string;
 serial_number: string;
 status: string;
 };
 actor: {
 email: string;
 role: string;
 };
 allowed_actions: string[];
}

const ACTION_CONFIG: Record<
 string,
 { label: string; icon: LucideIcon; color: string; description: string }
> = {
 ACTIVATE: {
 label: "Activate Passport",
 icon: Shield,
 color: "emerald",
 description: "Manufacturing completed and legally valid",
 },
 SHIP: {
 label: "Mark as Shipped",
 icon: Truck,
 color: "blue",
 description: "Battery has left the factory and is in transit",
 },
 INSTALL: {
 label: "Mark as In Service",
 icon: Wrench,
 color: "emerald",
 description: "Battery has been installed in a device or vehicle",
 },
 RECYCLE: {
 label: "Mark as Recycled",
 icon: Recycle,
 color: "purple",
 description: "Battery has been processed by a certified recycler",
 },
 RECALL: {
 label: "Recall Battery",
 icon: AlertCircle,
 color: "red",
 description: "Safety or compliance recall",
 },
 CLOSE: {
 label: "Close as End of Life",
 icon: CheckCircle,
 color: "slate",
 description: "Lifecycle permanently closed after recycling",
 },
};

const EVIDENCE_FIELDS: Record<
 string,
 { key: string; label: string; placeholder?: string; type?: string }[]
> = {
 SHIP: [
 {
 key: "shipment_reference",
 label: "Shipment Reference",
 placeholder: "Tracking number / AWB",
 },
 { key: "shipment_date", label: "Shipment Date", type: "date" },
 ],
 INSTALL: [
 { key: "installation_date", label: "Installation Date", type: "date" },
 {
 key: "installer_id",
 label: "Installer ID",
 placeholder: "Technician ID or badge",
 },
 ],
 RECYCLE: [
 {
 key: "recycler_epr_id",
 label: "Recycler EPR ID",
 placeholder: "EPR-XXXX",
 },
 { key: "recycling_date", label: "Recycling Date", type: "date" },
 {
 key: "certificate_reference",
 label: "Certificate Reference",
 placeholder: "Certificate number",
 },
 ],
 RECALL: [
 {
 key: "recall_reason",
 label: "Recall Reason",
 placeholder: "Recall reason",
 },
 {
 key: "recall_reference",
 label: "Recall Reference",
 placeholder: "Incident / reference ID",
 },
 ],
 CLOSE: [
 {
 key: "certificate_reference",
 label: "Certificate Reference",
 placeholder: "Certificate number from recycling",
 },
 ],
};

function PassportActionContent() {
 const params = useParams();
 const searchParams = useSearchParams();
 const router = useRouter();

 const token = searchParams.get("token");
 const passportId = params.uuid as string;

 const [loading, setLoading] = useState(true);
 const [info, setInfo] = useState<PassportInfo | null>(null);
 const [error, setError] = useState("");
 const [selectedAction, setSelectedAction] = useState<string | null>(null);
 const [resultStatus, setResultStatus] = useState<string | null>(null);
 const [evidence, setEvidence] = useState<Record<string, string>>({});
 const [submitting, setSubmitting] = useState(false);
 const [success, setSuccess] = useState(false);
 const [pointsAwarded, setPointsAwarded] = useState(0);
 const [partnerCode, setPartnerCode] = useState("");

 useEffect(() => {
 if (!token) {
 setError(
 "No authentication token provided. Please request a new magic link.",
 );
 setLoading(false);
 return;
 }

 const fetchInfo = async () => {
 try {
 const apiUrl =
 process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
 const response = await fetch(
 `${apiUrl}/passport/${passportId}/action-info?token=${token}`,
 );

 if (!response.ok) {
 const data = await response.json();
 throw new Error(data.error || "Failed to verify magic link");
 }

 const data = await response.json();
 setInfo(data);
 } catch (err: unknown) {
 const error = err as { message?: string };
 setError(error.message || "Invalid or expired magic link");
 } finally {
 setLoading(false);
 }
 };

 fetchInfo();
 }, [passportId, token]);

 const handleTransition = async () => {
 if (!selectedAction || !token) return;

 // Check if UNVERIFIED user needs partner code
 if (info?.actor?.role === "UNVERIFIED" && !partnerCode.trim()) {
 setError("Partner code is required for unverified accounts");
 return;
 }

 const requiredEvidence = EVIDENCE_FIELDS[selectedAction] || [];
 for (const field of requiredEvidence) {
 if (!evidence[field.key]?.trim()) {
 setError(`${field.label} is required`);
 return;
 }
 }

 setSubmitting(true);
 try {
 const apiUrl =
 process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

 // Build payload with optional partner_code
 const payload: {
 action: string;
 evidence: Record<string, string>;
 partner_code?: string;
 } = {
 action: selectedAction,
 evidence: evidence,
 };
 if (partnerCode.trim()) {
 payload.partner_code = partnerCode.trim();
 }

 const response = await fetch(
 `${apiUrl}/passport/${passportId}/transition`,
 {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify(payload),
 },
 );

 const data = await response.json();

 if (!response.ok) {
 throw new Error(data.error || "Transition failed");
 }

 // Capture points awarded from response
 if (data.points_awarded) {
 setPointsAwarded(data.points_awarded);
 }
 if (data.new_status) {
 setResultStatus(data.new_status);
 }

 setSuccess(true);
 } catch (err: unknown) {
 const error = err as { message?: string };
 setError(error.message || "Failed to apply action");
 } finally {
 setSubmitting(false);
 }
 };

 // Loading state
 if (loading) {
 return (
 <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
 <div className="fixed inset-0 overflow-hidden pointer-events-none">
 <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
 </div>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="flex flex-col items-center gap-4"
 >
 <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
 <p className="text-muted-foreground">Verifying your access...</p>
 </motion.div>
 </div>
 );
 }

 // Error state
 if (error) {
 return (
 <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="max-w-md w-full bg-[#171717]/80 backdrop-blur-xl rounded-2xl border border-red-500/20 p-8 text-center"
 >
 <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
 <AlertCircle className="h-8 w-8 text-red-400" />
 </div>
 <h2 className="text-xl text-white mb-2">Access Denied</h2>
 <p className="text-muted-foreground mb-6">{error}</p>
 <button
 onClick={() => router.push(`/p/${passportId}`)}
 className="px-6 py-3 bg-secondary hover:bg-accent text-white rounded-xl font-medium transition-colors"
 >
 Back to Passport
 </button>
 </motion.div>
 </div>
 );
 }

 // Success state
 if (success) {
 const config = ACTION_CONFIG[selectedAction || ""] || {
 color: "emerald",
 icon: CheckCircle,
 };

 // Trigger confetti
 import("canvas-confetti").then((confetti) => {
 confetti.default({
 particleCount: 100,
 spread: 70,
 origin: { y: 0.6 },
 colors: ["#10b981", "#3b82f6", "#f59e0b"],
 });
 });

 return (
 <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="max-w-md w-full bg-[#171717]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-8 text-center"
 >
 <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
 <CheckCircle className="h-10 w-10 text-emerald-400" />
 </div>
 <h2 className="text-2xl text-white mb-2">
 Status Updated!
 </h2>
 <p className="text-muted-foreground mb-2">
 Action applied:{" "}
 <span className="text-emerald-400 ">
 {config.label}
 </span>
 </p>
 {resultStatus && (
 <p className="text-muted-foreground text-sm mb-2">
 New status:{" "}
 <span className="text-muted-foreground font-mono">{resultStatus}</span>
 </p>
 )}
 <p className="text-muted-foreground text-sm mb-4">
 This action has been recorded to the audit trail.
 </p>

 {/* Gamification Reward Display */}
 {pointsAwarded > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6"
 >
 <div className="flex items-center justify-center gap-3">
 <Trophy className="w-8 h-8 text-amber-500" />
 <div className="text-left">
 <h3 className=" text-amber-400 text-lg">
 Warranty Registered! +{pointsAwarded} Partner Points
 </h3>
 <p className="text-sm text-amber-500/80">
 Battery Installed! Warranty Activated.
 </p>
 </div>
 </div>
 </motion.div>
 )}

 <button
 onClick={() => router.push(`/p/${passportId}`)}
 className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500/100 text-white rounded-xl font-medium transition-colors"
 >
 View Updated Passport
 </button>
 </motion.div>
 </div>
 );
 }

 // Main action selection
 return (
 <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
 {/* Background */}
 <div className="fixed inset-0 overflow-hidden pointer-events-none">
 <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
 <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
 </div>

 <div className="relative z-10 max-w-lg mx-auto">
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="text-center mb-8"
 >
 <div className="flex items-center justify-center gap-2 mb-4">
 <Shield className="h-6 w-6 text-emerald-400" />
 <span className="text-muted-foreground text-sm">Authenticated Action</span>
 </div>
 <h1 className="text-2xl text-white mb-2">
 Update Battery Status
 </h1>
 <p className="text-muted-foreground">
 Serial:{" "}
 <code className="text-muted-foreground">
 {info?.passport?.serial_number}
 </code>
 </p>
 </motion.div>

 {/* Actor Info */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="bg-[#171717]/60 backdrop-blur-xl rounded-xl border border-border p-4 mb-6"
 >
 <div className="flex items-center gap-4">
 <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
 <User className="h-6 w-6 text-emerald-400" />
 </div>
 <div>
 <p className="text-white font-medium">{info?.actor?.email}</p>
 <p className="text-muted-foreground text-sm flex items-center gap-1">
 <Building2 className="h-3 w-3" />
 {info?.actor?.role}
 </p>
 </div>
 </div>
 </motion.div>

 {/* Current Status */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.15 }}
 className="bg-[#171717]/60 backdrop-blur-xl rounded-xl border border-border p-4 mb-6"
 >
 <p className="text-muted-foreground text-sm mb-1">Current Status</p>
 <p className="text-lg text-white">
 {info?.passport?.status}
 </p>
 </motion.div>

 {/* Available Transitions */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="mb-6"
 >
 <p className="text-muted-foreground text-sm mb-3">Select action:</p>
 <div className="space-y-3">
 {info?.allowed_actions?.map((action) => {
 const config = ACTION_CONFIG[action] || {
 label: action,
 icon: ArrowRight,
 color: "slate",
 description: "",
 };
 const Icon = config.icon;
 const isSelected = selectedAction === action;

 return (
 <button
 key={action}
 onClick={() => {
 setSelectedAction(action);
 setEvidence({});
 setError("");
 }}
 className={`w-full p-4 rounded-xl border transition-all text-left ${
 isSelected
 ? `bg-${config.color}-500/10 border-${config.color}-500/50`
 : "bg-[#171717]/60 border-border hover:border-border"
 }`}
 >
 <div className="flex items-center gap-3">
 <div
 className={`h-10 w-10 rounded-lg bg-${config.color}-500/10 flex items-center justify-center`}
 >
 <Icon className={`h-5 w-5 text-${config.color}-400`} />
 </div>
 <div className="flex-1">
 <p className="text-white font-medium">{config.label}</p>
 <p className="text-muted-foreground text-sm">
 {config.description}
 </p>
 </div>
 {isSelected && (
 <CheckCircle className="h-5 w-5 text-emerald-400" />
 )}
 </div>
 </button>
 );
 })}
 </div>
 </motion.div>

 {/* Evidence Input */}
 {selectedAction && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: "auto" }}
 className="bg-[#171717]/60 backdrop-blur-xl rounded-xl border border-border p-4 mb-6"
 >
 <p className="text-muted-foreground text-sm mb-3">Evidence Required</p>

 {(EVIDENCE_FIELDS[selectedAction] || []).length === 0 ? (
 <p className="text-muted-foreground text-sm">
 No evidence is required for this action.
 </p>
 ) : (
 <div className="space-y-3">
 {(EVIDENCE_FIELDS[selectedAction] || []).map((field) => (
 <div key={field.key}>
 <label className="block text-muted-foreground text-xs mb-2">
 {field.label}
 </label>
 <input
 type={field.type || "text"}
 placeholder={field.placeholder || ""}
 value={evidence[field.key] || ""}
 onChange={(e) =>
 setEvidence({
 ...evidence,
 [field.key]: e.target.value,
 })
 }
 className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:border-emerald-500"
 />
 </div>
 ))}
 </div>
 )}

 {/* Partner Code Gate for UNVERIFIED users */}
 {info?.actor?.role === "UNVERIFIED" && (
 <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
 <p className="text-amber-400 text-sm mb-3 flex items-center gap-2">
 <Shield className="h-4 w-4" />
 Public email detected. Please enter your shop&apos;s partner
 code.
 </p>
 <input
 type="text"
 placeholder="Enter Partner Access Code"
 value={partnerCode}
 onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
 className="w-full px-4 py-3 bg-secondary/50 border border-amber-500/30 rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:border-amber-500 font-mono uppercase"
 />
 </div>
 )}
 </motion.div>
 )}

 {/* Submit Button */}
 <motion.button
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.3 }}
 onClick={handleTransition}
 disabled={!selectedAction || submitting}
 className={`w-full py-4 rounded-xl text-white transition-all flex items-center justify-center gap-2 ${
 selectedAction
 ? "bg-emerald-600 hover:bg-emerald-500/100"
 : "bg-secondary cursor-not-allowed"
 }`}
 >
 {submitting ? (
 <>
 <Loader2 className="h-5 w-5 animate-spin" />
 Updating...
 </>
 ) : (
 <>
 Confirm Action
 <ArrowRight className="h-5 w-5" />
 </>
 )}
 </motion.button>

 {/* Cancel */}
 <button
 onClick={() => router.push(`/p/${passportId}`)}
 className="w-full mt-3 py-3 text-muted-foreground hover:text-white transition-colors"
 >
 Cancel
 </button>
 </div>
 </div>
 );
}

export default function PassportActionPage() {
 return (
 <Suspense
 fallback={
 <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
 <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
 </div>
 }
 >
 <PassportActionContent />
 </Suspense>
 );
}
