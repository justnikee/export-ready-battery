"use client";

import { useEffect, useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { getSoHHistory, type SoHHistoryEntry } from "@/lib/api/lifecycle";

interface SoHHistoryProps {
  passportUuid?: string;
}

export function SoHHistory({ passportUuid }: SoHHistoryProps) {
  const [history, setHistory] = useState<SoHHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!passportUuid) return;
    setLoading(true);
    getSoHHistory(passportUuid)
      .then((res) => setHistory(res.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [passportUuid]);

  if (!passportUuid) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-medium text-white">State of Health History</h3>
        {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>

      {history.length === 0 && !loading ? (
        <p className="text-xs text-muted-foreground">No SoH readings recorded yet.</p>
      ) : (
        <div className="space-y-1.5">
          {history.slice(0, 10).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-white/[0.03] border border-white/[0.06]"
            >
              <span className="text-muted-foreground">
                {new Date(entry.recorded_at).toLocaleDateString()}
              </span>
              <span
                className={`font-medium ${
                  entry.state_of_health >= 80
                    ? "text-emerald-400"
                    : entry.state_of_health >= 50
                      ? "text-amber-400"
                      : "text-red-400"
                }`}
              >
                {entry.state_of_health}%
              </span>
              <span className="text-muted-foreground truncate max-w-[100px]">
                {entry.source}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
