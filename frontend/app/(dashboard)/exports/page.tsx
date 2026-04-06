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
                return <FileText className="w-5 h-5 text-zinc-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading && exports.length === 0) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 p-6">
            <div className="w-full mx-auto space-y-6">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Export History</h1>
                        <p className="text-sm text-zinc-500 mt-1">View and download your previous exports</p>
                    </div>
                    <button
                        onClick={fetchExports}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Empty State */}
                {exports.length === 0 ? (
                    <div className="bg-white border border-zinc-200 rounded-lg p-12">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="p-4 bg-zinc-100 rounded-full mb-4">
                                <FileArchive className="w-8 h-8 text-zinc-400" />
                            </div>
                            <h3 className="text-lg font-medium text-zinc-900 mb-1">No exports yet</h3>
                            <p className="text-sm text-zinc-500">Exports will appear here when you download large batches</p>
                        </div>
                    </div>
                ) : (
                    /* Data Table */
                    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Batch</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Size</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Requested</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exports.map((job) => (
                                    <tr key={job.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {getJobIcon(job.job_type)}
                                                <span className="text-sm font-medium text-zinc-900">{formatJobType(job.job_type)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-zinc-900">{job.batch_name}</div>
                                                <div className="text-xs text-zinc-500">{job.passport_count} passports</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(job.status)}
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${job.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    job.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        job.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                    {job.status === 'COMPLETED' ? 'Completed' :
                                                        job.status === 'FAILED' ? 'Failed' :
                                                            job.status === 'PROCESSING' ? 'Processing' : 'Pending'}
                                                </span>
                                            </div>
                                            {job.error_message && (
                                                <p className="text-xs text-red-600 mt-1">{job.error_message}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-zinc-600">
                                            {formatFileSize(job.file_size_bytes)}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-zinc-500">
                                            {formatDate(job.requested_at)}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {job.status === 'COMPLETED' && job.download_url && (
                                                <button
                                                    onClick={() => handleDownload(job)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download
                                                </button>
                                            )}
                                            {job.status === 'PROCESSING' && (
                                                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md border border-blue-200">
                                                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                                    Processing...
                                                </span>
                                            )}
                                            {job.status === 'PENDING' && (
                                                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-amber-600 bg-amber-50 rounded-md border border-amber-200">
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
                            <div className="px-4 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
                                <p className="text-sm text-zinc-500">
                                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} exports
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="px-3 py-1.5 text-sm font-medium border border-zinc-200 rounded-md bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={(page + 1) * limit >= total}
                                        className="px-3 py-1.5 text-sm font-medium border border-zinc-200 rounded-md bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
