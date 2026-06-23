import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-dialog";
import { FileUp, CheckCircle2, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CsvRow {
  serial_number: string;
  chemistry?: string;
  voltage?: string;
  capacity?: string;
  weight?: string;
  manufacturer?: string;
  country_of_origin?: string;
}

interface CsvPreview {
  rows: CsvRow[];
  total: number;
  valid: number;
  errors: string[];
}

export default function CsvImportPage() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState("");

  async function pickFile() {
    setLoading(true);
    try {
      const path = await open({
        multiple: false,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (path && typeof path === "string") {
        const result: CsvPreview = await invoke("parse_csv", { path });
        setPreview(result);
        if (result.errors.length > 0) {
          toast.warning(`CSV has ${result.errors.length} errors`);
        }
      }
    } catch (err) {
      toast.error("Failed to read CSV: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  async function importAndQueue() {
    if (!preview || preview.valid === 0 || !selectedBatch) {
      toast.error("Select a file and batch first");
      return;
    }
    setImporting(true);

    try {
      await invoke("generate_serials_from_csv", {
        rows: preview.rows,
        batchId: selectedBatch,
      });

      toast.success(`${preview.valid} serials imported and queued for printing`);
      navigate("/dashboard/print-station");
    } catch (err) {
      toast.error("Import failed: " + String(err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/print-station")}
          className="p-2 hover:bg-accent rounded-md"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CSV Bulk Import</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Import serial numbers from CSV and queue for label printing
          </p>
        </div>
      </div>

      {/* File Picker */}
      <div className="relative bg-transparent border border-border p-8 text-center"><FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          CSV format: serial_number,chemistry,voltage,capacity,weight,manufacturer,country
        </p>
        <button
          onClick={pickFile}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          {loading ? "Reading..." : "Select CSV File"}
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 bg-emerald-500/10 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">{preview.valid} Valid Rows</span>
              </div>
            </div>
            {preview.errors.length > 0 && (
              <div className="flex-1 bg-amber-500/10 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">{preview.errors.length} Errors</span>
                </div>
              </div>
            )}
          </div>

          {preview.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
              <ul className="text-sm text-red-600 space-y-1">
                {preview.errors.slice(0, 10).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {preview.errors.length > 10 && (
                  <li>...and {preview.errors.length - 10} more</li>
                )}
              </ul>
            </div>
          )}

          <div className="relative bg-transparent border border-border overflow-hidden"><div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Serial</th>
                    <th className="text-left px-4 py-3 font-medium">Chemistry</th>
                    <th className="text-left px-4 py-3 font-medium">Voltage</th>
                    <th className="text-left px-4 py-3 font-medium">Capacity</th>
                    <th className="text-left px-4 py-3 font-medium">Manufacturer</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{row.serial_number}</td>
                      <td className="px-4 py-2 text-muted-foreground">{row.chemistry || "—"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{row.voltage || "—"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{row.capacity || "—"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{row.manufacturer || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.rows.length > 20 && (
              <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
                ...and {preview.rows.length - 20} more rows
              </div>
            )}
          </div>

          {/* Import Action */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Batch ID"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="bg-background border border-border rounded px-3 py-2 text-sm w-64"
            />
            <button
              onClick={importAndQueue}
              disabled={importing || preview.valid === 0 || !selectedBatch}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-60"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {importing ? "Importing..." : "Import & Queue Print"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
