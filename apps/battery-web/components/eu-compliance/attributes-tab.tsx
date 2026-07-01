"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useEuActiveBatches } from "@/hooks/use-queries";
import { CheckCircle2, XCircle, Loader2, Shield } from "lucide-react";

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

export default function AttributesTab() {
  const { data: batches = [], isLoading: batchesLoading } = useEuActiveBatches();
  const [selectedBatch, setSelectedBatch] = useState("");
  const [scoreResult, setScoreResult] = useState<EUScoreResult | null>(null);

  useEffect(() => {
    if (!selectedBatch && batches.length > 0) {
      setSelectedBatch(batches[0].id);
    }
  }, [batches, selectedBatch]);

  useEffect(() => {
    if (!selectedBatch) return;
    const fetchScore = async () => {
      try {
        const res = await api.get<EUScoreResult>(
          `/batches/${selectedBatch}/eu-attribute-score`,
        );
        setScoreResult(res.data);
      } catch {
        setScoreResult(null);
      }
    };
    fetchScore();
  }, [selectedBatch]);

  const categories = scoreResult?.attributes
    ? Array.from(new Set(scoreResult.attributes.map((a) => a.category)))
    : [];

  if (batchesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="relative text-center py-12 bg-transparent border border-border">
        <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">
          No EU/GLOBAL active batches found
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Create a batch with EU or GLOBAL market region to see mandatory
          attribute coverage
        </p>
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
          className="border border-border px-3 py-2 text-sm flex-1 max-w-xs bg-background text-foreground"
        >
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.batch_name || b.model_name}
            </option>
          ))}
        </select>
      </div>

      {/* Score Overview */}
      {scoreResult && (
        <div className="relative bg-transparent border border-border p-6">
          <div className="flex items-center gap-6 mb-4">
            <div
              className={`text-4xl ${
                scoreResult.score >= 80
                  ? "text-emerald-500"
                  : scoreResult.score >= 50
                    ? "text-amber-500"
                    : "text-red-500"
              }`}
            >
              {Math.round(scoreResult.score)}%
            </div>
            <div>
              <p className="text-foreground font-medium">
                EU BatteryPass Attribute Coverage
              </p>
              <p className="text-sm text-muted-foreground">
                {scoreResult.filled} of {scoreResult.total} mandatory attributes
                filled
              </p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                scoreResult.score >= 80
                  ? "bg-emerald-500"
                  : scoreResult.score >= 50
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${scoreResult.score}%` }}
            />
          </div>
        </div>
      )}

      {/* Attribute Checklist by Category */}
      {scoreResult &&
        categories.map((cat) => {
          const attrs = scoreResult.attributes.filter(
            (a) => a.category === cat,
          );
          const filledCount = attrs.filter((a) => a.filled).length;
          return (
            <div
              key={cat}
              className="relative bg-transparent border border-border"
            >
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">{cat}</h3>
                <span
                  className={`text-xs font-medium ${filledCount === attrs.length ? "text-emerald-500" : "text-amber-500"}`}
                >
                  {filledCount}/{attrs.length}
                </span>
              </div>
              <div className="divide-y divide-border">
                {attrs.map((attr) => (
                  <div
                    key={attr.id}
                    className="px-5 py-2.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {attr.filled ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                      )}
                      <span className="text-sm text-foreground">
                        {attr.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {attr.reg_ref}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
