'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import {
 Shield, Plus, Download, Trash2, Archive,
 CheckCircle2, AlertTriangle, XCircle, TrendingUp,
 FileSpreadsheet, RefreshCw, Loader2, ChevronDown
} from 'lucide-react';
import {
 listCertificates,
 createCertificate,
 retireCertificate,
 deleteCertificate,
 getMultiYearSummary,
 downloadCPCBExport,
 getCurrentFinancialYear,
 getFinancialYearOptions,
 type EPRCertificate,
 type CreateEPRCertificateRequest,
 type EPRObligation,
} from '@/lib/api/epr';
import { useAuth } from '@/context/auth-context';

type Tab = 'overview' | 'certificates' | 'bis' | 'export' | 'eu';

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function CompliancePage() {
 const { user } = useAuth();
 const [activeTab, setActiveTab] = useState<Tab>('overview');
 const eprRegistered = !!user?.epr_registration_number;

 const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
 { id: 'overview', label: 'EPR Obligations', icon: TrendingUp },
 { id: 'certificates', label: 'Certificate Ledger', icon: Shield },
 { id: 'bis', label: 'BIS Tracker', icon: Shield },
 { id: 'export', label: 'CPCB Export', icon: FileSpreadsheet },
 { id: 'eu', label: 'EU Regulation', icon: CheckCircle2 },
 ];

 return (
 <div className="min-h-screen bg-background p-6">
 <div className="w-full mx-auto space-y-6">
 {/* Page Header */}
 <div>
 <h1 className="text-2xl text-foreground tracking-tight">
 India Compliance Hub
 </h1>
 <p className="text-sm text-muted-foreground mt-1">
 BIS, EPR &amp; PLI compliance tracking for Indian battery manufacturers
 </p>
 </div>

 {/* EPR Registration Banner */}
 {!eprRegistered && (
 <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
 <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
 <div>
 <p className="text-sm font-medium text-amber-800">EPR Registration Missing</p>
 <p className="text-xs text-amber-500 mt-0.5">
 Add your CPCB EPR registration number in{' '}
 <a href="/dashboard/settings" className="underline font-medium">Settings → India Compliance</a>{' '}
 to unlock full compliance tracking.
 </p>
 </div>
 </div>
 )}

 {/* India Compliance Readiness */}
 <div className="bg-card border border-border rounded-lg p-5">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-sm text-foreground">Compliance Readiness</h3>
 <a href="/dashboard/settings" className="text-xs text-muted-foreground hover:text-foreground underline">
 Manage in Settings
 </a>
 </div>
 <div className="grid grid-cols-3 gap-4">
 {[
 {
 label: 'EPR Registration',
 status: user?.epr_status || 'NOT_UPLOADED',
 detail: user?.epr_registration_number || 'Not configured',
 rule: 'BWM Rules 2022',
 },
 {
 label: 'BIS Certificate',
 status: user?.bis_status || 'NOT_UPLOADED',
 detail: user?.bis_r_number || 'Not configured',
 rule: 'IS 16046',
 },
 {
 label: 'PLI Scheme',
 status: user?.pli_status || 'NOT_UPLOADED',
 detail: 'Production Linked Incentive',
 rule: 'ACC PLI Phase II',
 },
 ].map((item) => {
 const isVerified = item.status === 'VERIFIED';
 const isPending = item.status === 'PENDING';
 const isRejected = item.status === 'REJECTED';
 return (
 <div
 key={item.label}
 className={`p-4 rounded-lg border ${
 isVerified
 ? 'bg-emerald-500/10 border-emerald-500/20'
 : isPending
 ? 'bg-amber-500/10 border-amber-500/20'
 : isRejected
 ? 'bg-red-500/10 border-red-500/20'
 : 'bg-muted border-border'
 }`}
 >
 <div className="flex items-center gap-2 mb-1">
 {isVerified ? (
 <CheckCircle2 className="h-4 w-4 text-emerald-500" />
 ) : isPending ? (
 <AlertTriangle className="h-4 w-4 text-amber-500" />
 ) : isRejected ? (
 <XCircle className="h-4 w-4 text-red-500" />
 ) : (
 <Shield className="h-4 w-4 text-muted-foreground" />
 )}
 <span className="text-sm font-medium text-foreground">{item.label}</span>
 </div>
 <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
 <p className="text-[10px] text-muted-foreground mt-1">{item.rule}</p>
 </div>
 );
 })}
 </div>
 </div>

 {/* Tabs */}
 <div className="flex gap-1 bg-muted rounded-lg p-1">
 {tabs.map(tab => {
 const Icon = tab.icon;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
 activeTab === tab.id
 ? 'bg-card text-foreground shadow-none'
 : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 <Icon className="w-4 h-4" />
 {tab.label}
 </button>
 );
 })}
 </div>

 {/* Tab Content */}
 {activeTab === 'overview' && <OverviewTab />}
 {activeTab === 'certificates' && <CertificatesTab />}
 {activeTab === 'bis' && <BISTrackerTab />}
 {activeTab === 'export' && <ExportTab />}
 {activeTab === 'eu' && <EURegulationTab />}
 </div>
 </div>
 );
}

// ============================================================================
// OVERVIEW TAB — Multi-year obligation summary
// ============================================================================

function OverviewTab() {
 const [obligations, setObligations] = useState<EPRObligation[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');

 const fetchData = useCallback(async () => {
 setLoading(true);
 setError('');
 try {
 const data = await getMultiYearSummary();
 setObligations(data || []);
 } catch {
 setError('Failed to load obligation data');
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => { fetchData(); }, [fetchData]);

 if (loading) return <LoadingState />;
 if (error) return <ErrorState message={error} onRetry={fetchData} />;
 if (obligations.length === 0) return <EmptyState message="No obligation data available" />;

 return (
 <div className="space-y-4">
 {obligations.map(ob => (
 <div key={ob.year} className="bg-card border border-border rounded-lg p-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <h3 className="text-lg text-foreground">FY {ob.financial_year}</h3>
 <StatusBadge status={ob.status} />
 </div>
 {ob.epr_registered && (
 <span className="text-xs text-muted-foreground font-mono">{ob.epr_number}</span>
 )}
 </div>

 {/* Stats Grid */}
 {(() => {
 const weightKg = ob.total_weight_kg ?? 0;
 const requiredKg = ob.required_collection_kg ?? 0;
 const collectedKg = ob.collected_kg ?? 0;
 const deficitKg = ob.deficit_kg ?? 0;
 const surplusKg = ob.surplus_kg ?? 0;
 const progressPct = requiredKg > 0 ? Math.min(100, (collectedKg / requiredKg) * 100) : 0;
 return (
 <>
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 <StatCard label="Batches" value={ob.total_batches ?? 0} />
 <StatCard label="Production Weight" value={`${weightKg.toFixed(1)} kg`} />
 <StatCard
 label={`Target (${ob.collection_target_pct ?? 0}%)`}
 value={`${requiredKg.toFixed(1)} kg`}
 />
 <StatCard
 label="Collected (Certs)"
 value={`${collectedKg.toFixed(1)} kg`}
 highlight={collectedKg >= requiredKg ? 'green' : undefined}
 />
 <StatCard
 label={deficitKg > 0 ? 'Deficit' : 'Surplus'}
 value={`${(deficitKg > 0 ? deficitKg : surplusKg).toFixed(1)} kg`}
 highlight={deficitKg > 0 ? 'red' : 'green'}
 />
 </div>

 {/* Progress Bar */}
 {requiredKg > 0 && (
 <div className="mt-4">
 <div className="flex justify-between text-xs text-muted-foreground mb-1">
 <span>Progress toward target</span>
 <span>{progressPct.toFixed(0)}%</span>
 </div>
 <div className="h-2 bg-muted rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full transition-all duration-500 ${
 collectedKg >= requiredKg
 ? 'bg-emerald-500/100'
 : collectedKg > 0
 ? 'bg-amber-500/100'
 : 'bg-muted'
 }`}
 style={{ width: `${progressPct}%` }}
 />
 </div>
 </div>
 )}
 </>
 );
 })()}
 </div>
 ))}
 </div>
 );
}

// ============================================================================
// CERTIFICATES TAB — CRUD Table
// ============================================================================

function CertificatesTab() {
 const [certificates, setCertificates] = useState<EPRCertificate[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [selectedFY, setSelectedFY] = useState(getCurrentFinancialYear());
 const [showForm, setShowForm] = useState(false);
 const [saving, setSaving] = useState(false);

 const fyOptions = getFinancialYearOptions();

 const fetchCerts = useCallback(async () => {
 setLoading(true);
 setError('');
 try {
 const data = await listCertificates(selectedFY);
 setCertificates(data || []);
 } catch {
 setError('Failed to load certificates');
 } finally {
 setLoading(false);
 }
 }, [selectedFY]);

 useEffect(() => { fetchCerts(); }, [fetchCerts]);

 const handleCreate = async (data: CreateEPRCertificateRequest) => {
 setSaving(true);
 try {
 await createCertificate(data);
 setShowForm(false);
 fetchCerts();
 } catch {
 alert('Failed to create certificate');
 } finally {
 setSaving(false);
 }
 };

 const handleRetire = async (id: string) => {
 if (!confirm('Retire this certificate? It will no longer count toward your obligation.')) return;
 try {
 await retireCertificate(id);
 fetchCerts();
 } catch {
 alert('Failed to retire certificate');
 }
 };

 const handleDelete = async (id: string) => {
 if (!confirm('Permanently delete this certificate?')) return;
 try {
 await deleteCertificate(id);
 fetchCerts();
 } catch {
 alert('Failed to delete certificate');
 }
 };

 const activeCerts = certificates.filter(c => c.status === 'ACTIVE');
 const totalWeight = activeCerts.reduce((sum, c) => sum + c.weight_kg, 0);

 return (
 <div className="space-y-4">
 {/* Header Row */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="relative">
 <select
 value={selectedFY}
 onChange={e => setSelectedFY(e.target.value)}
 className="appearance-none pl-3 pr-8 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 {fyOptions.map(fy => (
 <option key={fy} value={fy}>FY {fy}</option>
 ))}
 </select>
 <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
 </div>
 <span className="text-sm text-muted-foreground">
 {activeCerts.length} active · {totalWeight.toFixed(1)} kg certified
 </span>
 </div>
 <button
 onClick={() => setShowForm(!showForm)}
 className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
 >
 <Plus className="w-4 h-4" />
 Add Certificate
 </button>
 </div>

 {/* Create Form */}
 {showForm && (
 <CertificateForm
 defaultFY={selectedFY}
 onSubmit={handleCreate}
 onCancel={() => setShowForm(false)}
 saving={saving}
 />
 )}

 {/* Error */}
 {error && <ErrorState message={error} onRetry={fetchCerts} />}

 {/* Table */}
 {loading ? (
 <LoadingState />
 ) : certificates.length === 0 ? (
 <EmptyState message="No certificates for this financial year" />
 ) : (
 <div className="bg-card border border-border rounded-lg overflow-hidden">
 <table className="w-full">
 <thead className="bg-muted border-b border-border">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Certificate</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Recycler</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Weight</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Issued</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
 <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody>
 {certificates.map(cert => (
 <tr key={cert.id} className="border-b border-border hover:bg-accent transition-colors">
 <td className="px-4 py-4">
 <div className="text-sm font-medium text-foreground">{cert.certificate_number}</div>
 {cert.battery_type && (
 <div className="text-xs text-muted-foreground">{cert.battery_type}</div>
 )}
 </td>
 <td className="px-4 py-4">
 <div className="text-sm text-foreground">{cert.recycler_name}</div>
 {cert.recycler_epr_id && (
 <div className="text-xs text-muted-foreground font-mono">{cert.recycler_epr_id}</div>
 )}
 </td>
 <td className="px-4 py-4 text-sm font-medium text-foreground">
 {cert.weight_kg.toFixed(1)} kg
 </td>
 <td className="px-4 py-4 text-sm text-muted-foreground">
 {new Date(cert.issued_date).toLocaleDateString()}
 </td>
 <td className="px-4 py-4">
 <CertStatusBadge status={cert.status} />
 </td>
 <td className="px-4 py-4 text-right">
 <div className="flex items-center justify-end gap-1">
 {cert.status === 'ACTIVE' && (
 <button
 onClick={() => handleRetire(cert.id)}
 title="Retire"
 className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded transition-colors"
 >
 <Archive className="w-4 h-4" />
 </button>
 )}
 <button
 onClick={() => handleDelete(cert.id)}
 title="Delete"
 className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 );
}

// ============================================================================
// EXPORT TAB — CPCB Form 3 CSV Download
// ============================================================================

function ExportTab() {
 const [selectedFY, setSelectedFY] = useState(getCurrentFinancialYear());
 const [downloading, setDownloading] = useState(false);
 const fyOptions = getFinancialYearOptions();

 const handleDownload = async () => {
 setDownloading(true);
 try {
 await downloadCPCBExport(selectedFY);
 } catch {
 alert('Failed to download CPCB export. Ensure you have batch data for this financial year.');
 } finally {
 setDownloading(false);
 }
 };

 return (
 <div className="bg-card border border-border rounded-lg p-8">
 <div className="max-w-lg mx-auto text-center space-y-6">
 <div className="p-4 bg-emerald-500/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
 <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
 </div>

 <div>
 <h3 className="text-lg text-foreground">CPCB Annual Return — Form 3</h3>
 <p className="text-sm text-muted-foreground mt-1">
 Generate a CSV for your CPCB portal submission. Includes production data,
 recycler certificates, and battery category aggregations.
 </p>
 </div>

 <div className="flex flex-col items-center gap-4">
 <div className="relative">
 <select
 value={selectedFY}
 onChange={e => setSelectedFY(e.target.value)}
 className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 {fyOptions.map(fy => (
 <option key={fy} value={fy}>FY {fy}</option>
 ))}
 </select>
 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
 </div>

 <button
 onClick={handleDownload}
 disabled={downloading}
 className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
 >
 {downloading ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <Download className="w-4 h-4" />
 )}
 Download Form 3 CSV
 </button>
 </div>

 <p className="text-xs text-muted-foreground">
 Upload this CSV to the CPCB EPR portal at{' '}
 <a
 href="https://eprportal.cpcb.gov.in"
 target="_blank"
 rel="noopener noreferrer"
 className="underline"
 >
 eprportal.cpcb.gov.in
 </a>
 </p>
 </div>
 </div>
 );
}

// ============================================================================
// CERTIFICATE CREATE FORM
// ============================================================================

function CertificateForm({
 defaultFY,
 onSubmit,
 onCancel,
 saving,
}: {
 defaultFY: string;
 onSubmit: (data: CreateEPRCertificateRequest) => void;
 onCancel: () => void;
 saving: boolean;
}) {
 const [form, setForm] = useState<CreateEPRCertificateRequest>({
 certificate_number: '',
 recycler_name: '',
 recycler_epr_id: '',
 weight_kg: 0,
 battery_type: '',
 financial_year: defaultFY,
 issued_date: new Date().toISOString().split('T')[0],
 });

 const update = (field: string, value: string | number) =>
 setForm(prev => ({ ...prev, [field]: value }));

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!form.certificate_number || !form.recycler_name || form.weight_kg <= 0) {
 alert('Certificate number, recycler name, and weight are required.');
 return;
 }
 onSubmit(form);
 };

 return (
 <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
 <h4 className="text-sm text-foreground">Add EPR Certificate</h4>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <Input label="Certificate Number *" value={form.certificate_number} onChange={v => update('certificate_number', v)} placeholder="EPR/WP/CERT/2025/001" />
 <Input label="Recycler Name *" value={form.recycler_name} onChange={v => update('recycler_name', v)} placeholder="GreenRecycle India Pvt Ltd" />
 <Input label="Recycler EPR ID" value={form.recycler_epr_id || ''} onChange={v => update('recycler_epr_id', v)} placeholder="EPR/WP/R/2024/00123" />
 <Input label="Weight (kg) *" type="number" value={String(form.weight_kg)} onChange={v => update('weight_kg', parseFloat(v) || 0)} placeholder="500" />
 <Input label="Battery Type" value={form.battery_type || ''} onChange={v => update('battery_type', v)} placeholder="LFP, NMC, etc." />
 <Input label="Issued Date *" type="date" value={form.issued_date} onChange={v => update('issued_date', v)} />
 </div>
 <div className="flex justify-end gap-2 pt-2">
 <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-accent transition-colors">
 Cancel
 </button>
 <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50">
 {saving && <Loader2 className="w-4 h-4 animate-spin" />}
 Save Certificate
 </button>
 </div>
 </form>
 );
}

// ============================================================================
// BIS TRACKER TAB
// ============================================================================

function BISTrackerTab() {
 const { user } = useAuth();
 const bisStatus = user?.bis_status || 'NOT_UPLOADED';
 const bisNumber = user?.bis_r_number || '';

 return (
 <div className="space-y-6">
 {/* BIS Status Card */}
 <div className="bg-card border border-border rounded-lg p-6">
 <h3 className="text-base text-foreground mb-4">BIS CRS Registration — IS 16046</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <p className="text-xs text-muted-foreground mb-1">R-Number</p>
 <p className="text-sm font-mono text-foreground">{bisNumber || '—'}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Certificate Status</p>
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
 bisStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
 bisStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
 bisStatus === 'REJECTED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
 'bg-muted text-muted-foreground border border-border'
 }`}>
 {bisStatus === 'VERIFIED' ? '✅ Verified' :
 bisStatus === 'PENDING' ? '⏳ Pending Review' :
 bisStatus === 'REJECTED' ? '❌ Rejected' :
 'Not Uploaded'}
 </span>
 </div>
 </div>
 </div>

 {/* BIS Requirements Checklist */}
 <div className="bg-card border border-border rounded-lg">
 <div className="px-6 py-4 border-b border-border">
 <h3 className="text-sm text-foreground">IS 16046 Requirements Checklist</h3>
 <p className="text-xs text-muted-foreground mt-0.5">Safety requirements for lithium-ion batteries used in portable electronics and EVs</p>
 </div>
 <div className="divide-y divide-border">
 {[
 { test: 'Continuous low-rate charging', section: '10.1', done: bisStatus === 'VERIFIED' },
 { test: 'Vibration test', section: '10.2', done: bisStatus === 'VERIFIED' },
 { test: 'High-temperature operation', section: '10.3', done: bisStatus === 'VERIFIED' },
 { test: 'Short circuit (external)', section: '10.4', done: bisStatus === 'VERIFIED' },
 { test: 'Impact / crush test', section: '10.5', done: bisStatus === 'VERIFIED' },
 { test: 'Thermal abuse test', section: '10.6', done: bisStatus === 'VERIFIED' },
 { test: 'Overcharge protection', section: '10.7', done: bisStatus === 'VERIFIED' },
 { test: 'Forced internal short circuit', section: '10.8', done: bisStatus === 'VERIFIED' },
 ].map(item => (
 <div key={item.section} className="px-6 py-3 flex items-center justify-between">
 <div className="flex items-center gap-2">
 {item.done ? (
 <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
 ) : (
 <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
 )}
 <span className="text-sm text-foreground">{item.test}</span>
 </div>
 <span className="text-xs text-muted-foreground font-mono">§{item.section}</span>
 </div>
 ))}
 </div>
 </div>

 {/* Action Link */}
 {bisStatus !== 'VERIFIED' && (
 <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
 <Shield className="w-5 h-5 text-blue-500 shrink-0" />
 <div className="flex-1">
 <p className="text-sm font-medium text-blue-800">Upload your BIS certificate</p>
 <p className="text-xs text-blue-500 mt-0.5">
 Go to <a href="/dashboard/settings" className="underline font-medium">Settings → India Compliance Vault</a> to upload your BIS IS 16046 certificate for verification.
 </p>
 </div>
 </div>
 )}
 </div>
 );
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function Input({ label, value, onChange, placeholder, type = 'text' }: {
 label: string; value: string; onChange: (v: string) => void;
 placeholder?: string; type?: string;
}) {
 return (
 <div>
 <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
 <input
 type={type}
 value={value}
 onChange={e => onChange(e.target.value)}
 placeholder={placeholder}
 className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: 'green' | 'red' }) {
 return (
 <div className="p-3 bg-muted rounded-lg">
 <p className="text-xs text-muted-foreground mb-1">{label}</p>
 <p className={`text-lg ${
 highlight === 'green' ? 'text-emerald-500' :
 highlight === 'red' ? 'text-red-500' :
 'text-foreground'
 }`}>
 {value}
 </p>
 </div>
 );
}

// ============================================================================
// EU REGULATION TAB
// ============================================================================

interface EUAttr {
 id: string;
 name: string;
 category: string;
 reg_ref: string;
 filled: boolean;
}

interface EUScoreResult {
 batch_id: string;
 score: number;
 filled: number;
 total: number;
 attributes: EUAttr[];
}

function EURegulationTab() {
 const [batches, setBatches] = useState<{ id: string; batch_name: string; model_name: string; market_region: string; status: string }[]>([]);
 const [selectedBatch, setSelectedBatch] = useState('');
 const [scoreResult, setScoreResult] = useState<EUScoreResult | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchBatches = async () => {
 try {
 const res = await api.get('/batches');
 const allBatches = res.data.batches || [];
 const euBatches = allBatches.filter((b: { market_region: string; status: string }) =>
 (b.market_region === 'EU' || b.market_region === 'GLOBAL') && b.status === 'ACTIVE'
 );
 setBatches(euBatches);
 if (euBatches.length > 0) setSelectedBatch(euBatches[0].id);
 } catch {
 console.warn('Failed to fetch batches');
 } finally {
 setLoading(false);
 }
 };
 fetchBatches();
 }, []);

 useEffect(() => {
 if (!selectedBatch) return;
 const fetchScore = async () => {
 try {
 const res = await api.get<EUScoreResult>(`/batches/${selectedBatch}/eu-attribute-score`);
 setScoreResult(res.data);
 } catch {
 setScoreResult(null);
 }
 };
 fetchScore();
 }, [selectedBatch]);

 const categories = scoreResult?.attributes
 ? Array.from(new Set(scoreResult.attributes.map(a => a.category)))
 : [];

 const deadlines = [
 { date: 'Feb 18, 2027', desc: 'Digital Battery Passport mandatory for EV & industrial >2kWh' },
 { date: 'Aug 18, 2027', desc: 'Carbon footprint performance class (A-G) on label' },
 { date: 'Aug 18, 2028', desc: 'Recycled content minimum thresholds enforced' },
 ];

 if (loading) {
 return (
 <div className="flex items-center justify-center py-12">
 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
 </div>
 );
 }

 if (batches.length === 0) {
 return (
 <div className="text-center py-12 bg-card rounded-xl border border-border">
 <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
 <p className="text-muted-foreground">No EU/GLOBAL active batches found</p>
 <p className="text-xs text-muted-foreground mt-1">Create a batch with EU or GLOBAL market region to see EU compliance data</p>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 {/* Batch Selector */}
 <div className="flex items-center gap-3">
 <label className="text-sm font-medium text-foreground">Batch:</label>
 <select
 value={selectedBatch}
 onChange={(e) => setSelectedBatch(e.target.value)}
 className="border border-border rounded-lg px-3 py-2 text-sm flex-1 max-w-xs"
 >
 {batches.map(b => (
 <option key={b.id} value={b.id}>{b.batch_name || b.model_name}</option>
 ))}
 </select>
 </div>

 {/* Score Overview */}
 {scoreResult && (
 <div className="bg-card rounded-xl border border-border p-6">
 <div className="flex items-center gap-6 mb-4">
 <div className={`text-4xl ${
 scoreResult.score >= 80 ? 'text-emerald-500' : scoreResult.score >= 50 ? 'text-amber-500' : 'text-red-500'
 }`}>
 {Math.round(scoreResult.score)}%
 </div>
 <div>
 <p className="text-foreground font-medium">EU BatteryPass Attribute Coverage</p>
 <p className="text-sm text-muted-foreground">
 {scoreResult.filled} of {scoreResult.total} mandatory attributes filled
 </p>
 </div>
 </div>
 <div className="w-full bg-muted rounded-full h-3">
 <div
 className={`h-3 rounded-full transition-all ${
 scoreResult.score >= 80 ? 'bg-emerald-500/100' : scoreResult.score >= 50 ? 'bg-amber-500/100' : 'bg-red-500/100'
 }`}
 style={{ width: `${scoreResult.score}%` }}
 />
 </div>
 </div>
 )}

 {/* Attribute Checklist by Category */}
 {scoreResult && categories.map(cat => {
 const attrs = scoreResult.attributes.filter(a => a.category === cat);
 const filledCount = attrs.filter(a => a.filled).length;
 return (
 <div key={cat} className="bg-card rounded-xl border border-border">
 <div className="px-5 py-3 border-b border-border flex items-center justify-between">
 <h3 className="text-sm font-medium text-foreground">{cat}</h3>
 <span className={`text-xs font-medium ${filledCount === attrs.length ? 'text-emerald-500' : 'text-amber-500'}`}>
 {filledCount}/{attrs.length}
 </span>
 </div>
 <div className="divide-y divide-border">
 {attrs.map(attr => (
 <div key={attr.id} className="px-5 py-2.5 flex items-center justify-between">
 <div className="flex items-center gap-2">
 {attr.filled ? (
 <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
 ) : (
 <XCircle className="h-4 w-4 text-red-400 shrink-0" />
 )}
 <span className="text-sm text-foreground">{attr.name}</span>
 </div>
 <span className="text-xs text-muted-foreground font-mono">{attr.reg_ref}</span>
 </div>
 ))}
 </div>
 </div>
 );
 })}

 {/* EU Deadlines */}
 <div className="bg-card rounded-xl border border-border p-5">
 <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
 <AlertTriangle className="h-4 w-4 text-amber-500" />
 EU Battery Regulation Deadlines
 </h3>
 <div className="space-y-3">
 {deadlines.map((d, i) => (
 <div key={i} className="flex items-start gap-3">
 <span className="text-xs text-foreground bg-muted px-2 py-1 rounded whitespace-nowrap">
 {d.date}
 </span>
 <span className="text-sm text-muted-foreground">{d.desc}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

function StatusBadge({ status }: { status: string }) {
 const map: Record<string, { icon: React.ElementType; classes: string; label: string }> = {
 COMPLIANT: { icon: CheckCircle2, classes: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Compliant' },
 NON_COMPLIANT: { icon: AlertTriangle, classes: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Non-Compliant' },
 NOT_REGISTERED: { icon: XCircle, classes: 'bg-muted text-muted-foreground border-border', label: 'Not Registered' },
 PARTIAL: { icon: AlertTriangle, classes: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Partial' },
 };
 const s = map[status] || map.NON_COMPLIANT;
 const Icon = s.icon;
 return (
 <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.classes}`}>
 <Icon className="w-3 h-3" />
 {s.label}
 </span>
 );
}

function CertStatusBadge({ status }: { status: string }) {
 const classes: Record<string, string> = {
 ACTIVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
 RETIRED: 'bg-muted text-muted-foreground border-border',
 EXPIRED: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
 REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20',
 };
 return (
 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes[status] || classes.ACTIVE}`}>
 {status}
 </span>
 );
}

function LoadingState() {
 return (
 <div className="flex items-center justify-center py-12">
 <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" />
 </div>
 );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
 return (
 <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
 <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
 <p className="text-sm text-red-500">{message}</p>
 <button onClick={onRetry} className="mt-3 inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-800">
 <RefreshCw className="w-3 h-3" /> Retry
 </button>
 </div>
 );
}

function EmptyState({ message }: { message: string }) {
 return (
 <div className="bg-card border border-border rounded-lg p-12">
 <div className="flex flex-col items-center justify-center text-center">
 <div className="p-4 bg-muted rounded-full mb-4">
 <Shield className="w-8 h-8 text-muted-foreground" />
 </div>
 <h3 className="text-lg font-medium text-foreground mb-1">No Data</h3>
 <p className="text-sm text-muted-foreground">{message}</p>
 </div>
 </div>
 );
}
