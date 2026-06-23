"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Check, AlertTriangle, X, Sparkles } from "lucide-react";
import type { DatasheetParseResult } from "@/lib/ai/parse-datasheet";

export type FieldEditValue = string | boolean | string[];

// Keep in sync with trackedProvenanceFields in
// services/battery-api/internal/services/ai_service.go
const TRACKED_FIELDS: { key: string; label: string; kind: "text" | "boolean" | "list" }[] = [
  { key: "model_name", label: "Model name", kind: "text" },
  { key: "chemistry", label: "Chemistry", kind: "text" },
  { key: "capacity", label: "Capacity", kind: "text" },
  { key: "voltage", label: "Voltage", kind: "text" },
  { key: "weight", label: "Weight", kind: "text" },
  { key: "manufacturer", label: "Manufacturer", kind: "text" },
  { key: "manufacturer_address", label: "Manufacturer address", kind: "text" },
  { key: "manufacturer_email", label: "Manufacturer email", kind: "text" },
  { key: "country_of_origin", label: "Country of origin", kind: "text" },
  { key: "ce_marking", label: "CE marking", kind: "boolean" },
  { key: "carbon_footprint", label: "Carbon footprint", kind: "text" },
  { key: "carbon_performance_class", label: "Carbon performance class", kind: "text" },
  { key: "notified_body_number", label: "Notified body number", kind: "text" },
  { key: "eu_representative", label: "EU representative", kind: "text" },
  { key: "eu_representative_email", label: "EU representative email", kind: "text" },
  { key: "eu_representative_address", label: "EU representative address", kind: "text" },
  { key: "removable_and_replaceable", label: "Removable & replaceable", kind: "boolean" },
  { key: "expected_lifetime_cycles", label: "Expected lifetime (cycles)", kind: "text" },
  { key: "warranty_months", label: "Warranty (months)", kind: "text" },
  { key: "bis_number", label: "BIS number", kind: "text" },
  { key: "epr_number", label: "EPR number", kind: "text" },
  { key: "hsn_code", label: "HSN code", kind: "text" },
  { key: "hazardous_declaration", label: "Hazardous declaration", kind: "text" },
  { key: "certifications", label: "Certifications", kind: "list" },
];

type Source = "regex" | "llm" | "missing";

function rawValue(result: DatasheetParseResult, key: string): unknown {
  return (result as unknown as Record<string, unknown>)[key];
}

function resolveSource(result: DatasheetParseResult, key: string): Source {
  const reported = result.field_sources?.[key];
  if (reported === "regex" || reported === "llm" || reported === "missing") return reported;
  return "missing";
}

interface AiFieldPreviewTableProps {
  result: DatasheetParseResult;
  editedValues: Record<string, FieldEditValue>;
  onEdit: (field: string, value: FieldEditValue) => void;
  onApply: () => void;
  onTryAnother: () => void;
}

export function AiFieldPreviewTable({
  result,
  editedValues,
  onEdit,
  onApply,
  onTryAnother,
}: AiFieldPreviewTableProps) {
  return (
    <div className="space-y-2">
      <div className="max-h-72 overflow-y-auto border border-border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-6"></TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Extracted value</TableHead>
              <TableHead className="w-24">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TRACKED_FIELDS.map((field) => {
              const source = resolveSource(result, field.key);
              const raw = rawValue(result, field.key);
              const edited = editedValues[field.key];
              const editable = source !== "regex";

              return (
                <TableRow key={field.key} className={source === "missing" ? "bg-red-500/5" : source === "llm" ? "bg-amber-500/5" : undefined}>
                  <TableCell>
                    {source === "regex" && <Check className="h-3.5 w-3.5 text-green-600" />}
                    {source === "llm" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                    {source === "missing" && <X className="h-3.5 w-3.5 text-red-500" />}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{field.label}</TableCell>
                  <TableCell>
                    {field.kind === "boolean" ? (
                      editable ? (
                        <select
                          value={String(edited ?? raw === true)}
                          onChange={(e) => onEdit(field.key, e.target.value === "true")}
                          className="h-7 text-xs border border-border bg-transparent px-1.5"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <strong className="text-xs font-medium">{raw === true ? "Yes" : "No"}</strong>
                      )
                    ) : field.kind === "list" ? (
                      editable ? (
                        <Input
                          value={
                            Array.isArray(edited)
                              ? edited.join(", ")
                              : Array.isArray(raw)
                                ? raw.join(", ")
                                : ""
                          }
                          onChange={(e) =>
                            onEdit(
                              field.key,
                              e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          placeholder="Not found — enter manually"
                          className="h-7 text-xs"
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(raw as string[]).map((c) => (
                            <span key={c} className="px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground border border-border rounded">
                              {c}
                            </span>
                          ))}
                        </div>
                      )
                    ) : editable ? (
                      <Input
                        value={typeof edited === "string" ? edited : typeof raw === "string" ? raw : ""}
                        onChange={(e) => onEdit(field.key, e.target.value)}
                        placeholder="Not found — enter manually"
                        className="h-7 text-xs"
                      />
                    ) : (
                      <strong className="text-xs font-medium">{String(raw)}</strong>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            source === "regex" ? "bg-green-600 w-full" : source === "llm" ? "bg-amber-500 w-3/5" : "bg-red-500 w-0"
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {source === "regex" ? "High" : source === "llm" ? "Medium" : "Not found"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        Amber and red fields need a closer look — edit them inline before applying.
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onApply} className="flex-1">
          <Check className="mr-1 h-3 w-3" />
          Apply All to Form
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onTryAnother}>
          Try Another
        </Button>
      </div>
    </div>
  );
}
