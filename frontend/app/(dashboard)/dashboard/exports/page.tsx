'use client';

import { useCallback, useEffect, useState } from 'react';
import {
 Download,
 RefreshCw,
 Clock,
 CheckCircle2,
 XCircle,
 Loader2,
 FileArchive,
 FileText,
 FileSpreadsheet,
 Shield
} from 'lucide-react';
import {
 listExportJobs,
 refreshExportDownload,
 formatFileSize,
 formatJobType,
 type ExportJob
} from '@/lib/api/exports';

export default function ExportsPage() {
 const [exports, setExports] = useState<ExportJob[]>([]);
 const [loading, setLoading] = useState(true);
 const [total, setTotal] = useState(0);
 const [page, setPage] = useState(0);
 const limit = 10;

 const fetchExports = useCallback(async () => {
 setLoading(true);
 try {
 const data = await listExportJobs(limit, page * limit);
 setExports(data.jobs || []);
 setTotal(data.total);
 } catch (error) {
 console.error('Failed to fetch exports:', error);
 } finally {
 setLoading(false);
 }
 }, [limit, page]);

 // Track if there are pending jobs for polling
 const hasPendingJobs = exports.some(e => e.status === 'PENDING' || e.status === 'PROCESSING');

 useEffect(() => {
 fetchExports();
 }, [fetchExports]);

 // Separate effect for polling - runs when hasPendingJobs changes
 useEffect(() => {
 if (!hasPendingJobs) return;

 // Poll every 5 seconds when there are pending jobs
 const interval = setInterval(() => {
 fetchExports();
 }, 5000);

 return () => clearInterval(interval);
 }, [fetchExports, hasPendingJobs]);

 const handleDownload = async (job: ExportJob) => {
 if (!job.download_url) return;

 try {
 // Check if URL might be expired
 if (job.expires_at && new Date(job.expires_at) < new Date()) {
 // Refresh the URL first
 const result = await refreshExportDownload(job.id);
 window.open(result.download_url, '_blank');
 } else {
 window.open(job.download_url, '_blank');
 }
 } catch (error) {
 console.error('Download failed:', error);
 }
 };

 const getStatusIcon = (status: ExportJob['status']) => {
 switch (status) {
 case 'PENDING':
 return <Clock className="w-4 h-4 text-amber-500" />;
 case 'PROCESSING':
 return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
 case 'COMPLETED':
 return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
 case 'FAILED':
 return <XCircle className="w-4 h-4 text-red-500" />;
 }
 };

 const getJobIcon = (type: ExportJob['job_type']) => {
 switch (type) {
 case 'QR_ZIP':
 return <FileArchive className="w-5 h-5 text-purple-500" />;
 case 'LABELS_PDF':
 return <FileText className="w-5 h-5 text-blue-500" />;
 case 'CSV':
 return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
 case 'DUE_DILIGENCE':
 return <Shield className="w-5 h-5 text-indigo-500" />;
 default:
 return <FileText className="w-5 h-5 text-muted-foreground" />;
 }
 };

 const formatDate = (dateString: string) => {
 return new Date(dateString).toLocaleString();
 };

 if (loading && exports.length === 0) {
 return (
 <div className="min-h-screen bg-background flex items-center justify-center">
 <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" />
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-background p-6">
 <div className="w-full mx-auto space-y-6">

 {/* Page Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl text-foreground tracking-tight">Export History</h1>
 <p className="text-sm text-muted-foreground mt-1">View and download your previous exports</p>
 </div>
 <button
 onClick={fetchExports}
 disabled={loading}
 className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
 >
 <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
 Refresh
 </button>
 </div>

 {/* Empty State */}
 {exports.length === 0 ? (
 <div className="relative bg-transparent border border-border p-12">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
 <div className="flex flex-col items-center justify-center text-center">
 <div className="p-4 bg-muted rounded-full mb-4">
 <FileArchive className="w-8 h-8 text-muted-foreground" />
 </div>
 <h3 className="text-lg font-medium text-foreground mb-1">No exports yet</h3>
 <p className="text-sm text-muted-foreground">Exports will appear here when you download large batches</p>
 </div>
 </div>
 ) : (
 /* Data Table */
 <div className="relative bg-transparent border border-border overflow-visible">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
 <table className="w-full">
 <thead className="bg-muted border-b border-border">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Batch</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Requested</th>
 <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody>
 {exports.map((job) => (
 <tr key={job.id} className="border-b border-border hover:bg-accent transition-colors">
 <td className="px-4 py-4">
 <div className="flex items-center gap-2">
 {getJobIcon(job.job_type)}
 <span className="text-sm font-medium text-foreground">{formatJobType(job.job_type)}</span>
 </div>
 </td>
 <td className="px-4 py-4">
 <div>
 <div className="text-sm font-medium text-foreground">{job.batch_name}</div>
 <div className="text-xs text-muted-foreground">{job.passport_count} passports</div>
 </div>
 </td>
 <td className="px-4 py-4">
 <div className="flex items-center gap-2">
 {getStatusIcon(job.status)}
 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
 job.status === 'FAILED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
 job.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
 'bg-amber-500/10 text-amber-500 border-amber-500/20'
 }`}>
 {job.status === 'COMPLETED' ? 'Completed' :
 job.status === 'FAILED' ? 'Failed' :
 job.status === 'PROCESSING' ? 'Processing' : 'Pending'}
 </span>
 </div>
 {job.error_message && (
 <p className="text-xs text-red-500 mt-1">{job.error_message}</p>
 )}
 </td>
 <td className="px-4 py-4 text-sm text-muted-foreground">
 {formatFileSize(job.file_size_bytes)}
 </td>
 <td className="px-4 py-4 text-sm text-muted-foreground">
 {formatDate(job.requested_at)}
 </td>
 <td className="px-4 py-4 text-right">
 {job.status === 'COMPLETED' && job.download_url && (
 <button
 onClick={() => handleDownload(job)}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
 >
 <Download className="w-4 h-4" />
 Download
 </button>
 )}
 {job.status === 'PROCESSING' && (
 <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-500 bg-blue-500/10 border border-blue-500/20">
 <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
 Processing...
 </span>
 )}
 {job.status === 'PENDING' && (
 <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20">
 <Clock className="w-3 h-3 mr-1.5" />
 Queued
 </span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>

 {/* Pagination */}
 {total > limit && (
 <div className="px-4 py-3 border-t border-border bg-muted flex items-center justify-between">
 <p className="text-sm text-muted-foreground">
 Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} exports
 </p>
 <div className="flex gap-2">
 <button
 onClick={() => setPage(p => Math.max(0, p - 1))}
 disabled={page === 0}
 className="px-3 py-1.5 text-sm font-medium border border-border bg-transparent text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 Previous
 </button>
 <button
 onClick={() => setPage(p => p + 1)}
 disabled={(page + 1) * limit >= total}
 className="px-3 py-1.5 text-sm font-medium border border-border bg-transparent text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 Next
 </button>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
}
