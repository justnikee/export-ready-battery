"use client";

import { Battery, Mail, MapPin, ArrowRightLeft } from "lucide-react";
import type { Batch } from "@/lib/types";
import { DashboardPanel } from "../DashboardPanel";

interface CoreSpecsProps {
  batch: Batch;
}

function SpecRow({
  label,
  value,
  href,
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      {href ? (
        <a
          href={href}
          className="text-sm text-foreground hover:text-(--brand-link) transition-colors"
        >
          {value}
        </a>
      ) : (
        <span className="text-sm text-foreground font-medium">{value}</span>
      )}
    </div>
  );
}

export function CoreSpecs({ batch }: CoreSpecsProps) {
  const s = batch.specs;

  return (
    <DashboardPanel>
      <div className="flex items-center gap-2 mb-4">
        <Battery className="h-4 w-4 text-blue-500" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Core Specifications
        </h3>
      </div>
      <div className="space-y-0">
        <SpecRow label="Chemistry" value={s.chemistry || "N/A"} />
        <SpecRow label="Capacity" value={s.capacity || "N/A"} />
        <SpecRow label="Voltage" value={s.voltage || "N/A"} />
        <SpecRow label="Weight" value={s.weight || "N/A"} />

        {s.battery_category && (
          <SpecRow label="Category" value={s.battery_category} />
        )}
        {s.cell_source && (
          <SpecRow
            label="Cell Source"
            value={
              <span
                className={
                  s.cell_source === "IMPORTED"
                    ? "text-amber-500"
                    : "text-emerald-500"
                }
              >
                {s.cell_source}
              </span>
            }
          />
        )}

        <SpecRow label="Manufacturer" value={s.manufacturer || "N/A"} />
        <SpecRow
          label="Country of Origin"
          value={s.country_of_origin || "N/A"}
        />

        {s.hsn_code && <SpecRow label="HSN Code" value={s.hsn_code} />}
        {s.bis_number && <SpecRow label="BIS Number" value={s.bis_number} />}
        {s.epr_number && <SpecRow label="EPR Number" value={s.epr_number} />}

        {s.expected_lifetime_cycles !== undefined &&
          s.expected_lifetime_cycles !== null && (
            <SpecRow
              label="Lifetime Cycles"
              value={`${s.expected_lifetime_cycles.toLocaleString()}`}
            />
          )}
        {s.warranty_months !== undefined && s.warranty_months !== null && (
          <SpecRow
            label="Warranty"
            value={`${s.warranty_months} months`}
          />
        )}

        {s.manufacturer_email && (
          <SpecRow
            label="Compliance Email"
            value={s.manufacturer_email}
            href={`mailto:${s.manufacturer_email}`}
          />
        )}
        {s.manufacturer_address && (
          <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0 gap-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider shrink-0">
              Address
            </span>
            <span className="text-sm text-foreground text-right">
              {s.manufacturer_address}
            </span>
          </div>
        )}
        {s.lot_size && <SpecRow label="Lot Size" value={s.lot_size} />}
        {s.production_stage && (
          <SpecRow label="Production Stage" value={s.production_stage} />
        )}
        {s.gtin && (
          <SpecRow
            label="GTIN"
            value={
              <span className="text-blue-500 font-mono">{s.gtin}</span>
            }
          />
        )}
        <SpecRow
          label="Recyclable"
          value={
            s.recyclable ? (
              <span className="text-emerald-500">Yes</span>
            ) : (
              <span className="text-muted-foreground">No</span>
            )
          }
        />
      </div>
    </DashboardPanel>
  );
}
