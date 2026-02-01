'use client';

import { useEffect, useState } from 'react';
import {
    Download,
    RefreshCw,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    FileArchive,
    FileText,
    FileSpreadsheet
} from 'lucide-react';
import {
    listExportJobs,
    refreshExportDownload,
    formatFileSize,
    formatJobType,
    type ExportJob
} from '@/lib/api/exports';
import api from '@/lib/api';

export default function ExportsPage() {
    const [exports, setExports] = useState<ExportJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const limit = 10;

    const fetchExports = async () => {
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
    };

    useEffect(() => {
        fetchExports();
        // Poll for updates every 30 seconds if there are pending jobs
        const interval = setInterval(() => {
            if (exports.some(e => e.status === 'PENDING' || e.status === 'PROCESSING')) {
                fetchExports();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [page]);

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
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'PROCESSING':
                return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
            case 'COMPLETED':
                return <CheckCircle2 className="w-4 h-4 text-green-500" />;
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
                return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Export History</h1>
                    <p className="text-muted-foreground">View and download your previous exports</p>
                </div>
                <button
                    onClick={fetchExports}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {loading && exports.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : exports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <FileArchive className="w-12 h-12 mb-4 opacity-50" />
                    <p>No exports yet</p>
                    <p className="text-sm">Exports will appear here when you download large batches</p>
                </div>
            ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Batch</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Requested</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {exports.map((job) => (
                                <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getJobIcon(job.job_type)}
                                            <span className="text-sm text-foreground">{formatJobType(job.job_type)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-foreground">{job.batch_name}</div>
                                            <div className="text-xs text-muted-foreground">{job.passport_count} passports</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(job.status)}
                                            <span className={`text-sm capitalize ${job.status === 'COMPLETED' ? 'text-green-600' :
                                                    job.status === 'FAILED' ? 'text-red-600' :
                                                        job.status === 'PROCESSING' ? 'text-blue-600' :
                                                            'text-yellow-600'
                                                }`}>
                                                {job.status.toLowerCase()}
                                            </span>
                                        </div>
                                        {job.error_message && (
                                            <p className="text-xs text-red-500 mt-1">{job.error_message}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {formatFileSize(job.file_size_bytes)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {formatDate(job.requested_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {job.status === 'COMPLETED' && job.download_url && (
                                            <button
                                                onClick={() => handleDownload(job)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </button>
                                        )}
                                        {job.status === 'PROCESSING' && (
                                            <span className="text-sm text-blue-600">Processing...</span>
                                        )}
                                        {job.status === 'PENDING' && (
                                            <span className="text-sm text-yellow-600">Queued</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {total > limit && (
                        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} exports
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="px-3 py-1 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={(page + 1) * limit >= total}
                                    className="px-3 py-1 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
