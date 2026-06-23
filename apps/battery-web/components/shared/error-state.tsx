import { XCircle, RefreshCw } from "lucide-react";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 p-6 text-center">
      <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
      <p className="text-sm text-red-500">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-800"
      >
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  );
}
