"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  listLedgers,
  MATERIAL_TYPE_LABELS,
  RECYCLED_CONTENT_THRESHOLDS,
  RECYCLED_CONTENT_DEADLINE,
  type MaterialType,
  type MassBalanceLedger,
} from "@/lib/api/mass-balance";
import { dashboardPathFromPathname } from "@/lib/routes";
import { Scale, Loader2 } from "lucide-react";

// Deliberately not all of MaterialType: only these four have an Annex II
// recycled-content target. Manganese is tracked in the mass balance ledger
// but has no regulatory minimum, so it doesn't belong in this table.
const MATERIALS: MaterialType[] = ["cobalt", "lithium", "nickel", "lead"];

export default function RecycledContentTab() {
  const pathname = usePathname();
  const massBalanceHref = dashboardPathFromPathname(pathname, "mass-balance");
  const [ledgers, setLedgers] = useState<MassBalanceLedger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listLedgers()
      .then((res) => setLedgers(res.ledgers || []))
      .catch(() => toast.error("Failed to load mass balance ledgers"))
      .finally(() => setLoading(false));
  }, []);

  const deadlineLabel = new Date(RECYCLED_CONTENT_DEADLINE).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const totals = MATERIALS.reduce(
    (acc, material) => {
      const matLedgers = ledgers.filter((l) => l.material_type === material);
      acc[material] = {
        incoming: matLedgers.reduce((sum, l) => sum + l.incoming_kg, 0),
        allocated: matLedgers.reduce((sum, l) => sum + l.allocated_kg, 0),
      };
      return acc;
    },
    {} as Record<MaterialType, { incoming: number; allocated: number }>,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading mass balance data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Material</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Incoming (kg)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Allocated (kg)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Allocated %</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                Regulatory Target ({deadlineLabel})
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MATERIALS.map((material) => {
              const t = totals[material];
              const allocatedPct = t.incoming > 0 ? (t.allocated / t.incoming) * 100 : 0;
              return (
                <tr key={material}>
                  <td className="px-4 py-3 text-foreground font-medium">{MATERIAL_TYPE_LABELS[material]}</td>
                  <td className="px-4 py-3 text-right text-foreground">{t.incoming.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-foreground">{t.allocated.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-foreground">{allocatedPct.toFixed(0)}%</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{RECYCLED_CONTENT_THRESHOLDS[material]}% recycled</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        "Allocated %" reflects how much of the recycled material received has been allocated to batches — it is not a
        measurement against the regulatory minimum, which requires comparing recycled content to total material used
        per battery. Use the Mass Balance page to track allocations in detail.
      </p>

      <Link
        href={massBalanceHref}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Scale className="w-4 h-4" />
        Go to Mass Balance
      </Link>
    </div>
  );
}
