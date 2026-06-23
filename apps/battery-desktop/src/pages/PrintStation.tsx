import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  QrCode,
  Package,
  FileDown,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Batch {
  id: string;
  batch_name: string;
  status: string;
}

interface PrintJob {
  id: string;
  serial_number: string;
  zpl_data: string;
  status: string;
}

interface PrinterInfo {
  name: string;
  connected: boolean;
}

export default function PrintStationPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [generating, setGenerating] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>(
    localStorage.getItem("selected_printer") || ""
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchBatches();
    detectPrinters();
  }, []);

  async function fetchBatches() {
    try {
      const res = await api.get("/batches?limit=50");
      const list = (res.data.batches || []) as Batch[];
      setBatches(list.filter((b) => b.status === "ACTIVE"));
    } catch {
      toast.error("Failed to load batches");
    }
  }

  async function detectPrinters() {
    try {
      const detected: PrinterInfo[] = await invoke("detect_usb_printers");
      setPrinters(detected);
      if (detected.length > 0 && !selectedPrinter) {
        setSelectedPrinter(detected[0].name);
        localStorage.setItem("selected_printer", detected[0].name);
      }
    } catch {
      // silent — printer detection may fail in dev
    }
  }

  async function generateLabels() {
    if (!selectedBatch || quantity < 1) {
      toast.error("Select a batch and enter quantity");
      return;
    }
    setGenerating(true);
    setJobs([]);

    try {
      const batch = batches.find((b) => b.id === selectedBatch);
      const batchName = batch?.batch_name || selectedBatch;
      const newJobs: PrintJob[] = [];

      for (let i = 0; i < quantity; i++) {
        const serial = `SN-${Date.now()}-${i}`;
        const qrData = `${selectedBatch}/${serial}`;
        const zpl: string = await invoke("generate_zpl", {
          payload: {
            qrData,
            serial,
            batchName,
            widthMm: 50,
            heightMm: 30,
          },
        });

        // Save to local SQLite
        const job: PrintJob = await invoke("create_print_job", {
          batchId: selectedBatch,
          serialNumber: serial,
          zplData: zpl,
        });

        newJobs.push(job);
      }

      setJobs(newJobs);
      toast.success(`${quantity} labels generated`);
    } catch (err) {
      toast.error("Failed to generate labels: " + String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function printAll() {
    if (!selectedPrinter) {
      toast.error("Select a printer first");
      return;
    }
    if (jobs.length === 0) {
      toast.error("Generate labels first");
      return;
    }

    setPrinting(true);
    setProgress(0);
    let successCount = 0;

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      try {
        const result: { success: boolean; message: string } = await invoke(
          "print_zpl",
          {
            printerName: selectedPrinter,
            zpl: job.zpl_data,
          }
        );

        if (result.success) {
          await invoke("mark_job_printed", { id: job.id });
          successCount++;
        } else {
          toast.error(`Print failed for ${job.serial_number}: ${result.message}`);
        }
      } catch (err) {
        toast.error(`Print error for ${job.serial_number}: ${String(err)}`);
      }
      setProgress(Math.round(((i + 1) / jobs.length) * 100));
    }

    setPrinting(false);
    if (successCount === jobs.length) {
      toast.success("All labels printed successfully");
    } else {
      toast.warning(`${successCount}/${jobs.length} labels printed`);
    }
  }

  async function clearJobs() {
    for (const job of jobs) {
      try {
        await invoke("delete_job", { id: job.id });
      } catch {
        // ignore
      }
    }
    setJobs([]);
    setProgress(0);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Print Station</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and print QR labels on thermal printers
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/print-station/csv-import")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90"
        >
          <FileDown className="h-4 w-4" /> CSV Import
        </button>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative bg-transparent border border-border p-5"><label className="text-xs text-muted-foreground font-medium block mb-2">Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
          >
            <option value="">Select batch...</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative bg-transparent border border-border p-5"><label className="text-xs text-muted-foreground font-medium block mb-2">Quantity</label>
          <input
            type="number"
            min={1}
            max={1000}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="relative bg-transparent border border-border p-5"><label className="text-xs text-muted-foreground font-medium block mb-2">Printer</label>
          <select
            value={selectedPrinter}
            onChange={(e) => {
              setSelectedPrinter(e.target.value);
              localStorage.setItem("selected_printer", e.target.value);
            }}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
          >
            <option value="">Select printer...</option>
            {printers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} {p.connected ? "(Connected)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={generateLabels}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-60"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
          {generating ? "Generating..." : "Generate Labels"}
        </button>

        <button
          onClick={printAll}
          disabled={printing || jobs.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-60"
        >
          {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          {printing ? `Printing ${progress}%` : "Print All"}
        </button>

        {jobs.length > 0 && (
          <button
            onClick={clearJobs}
            disabled={printing}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-border text-sm font-medium rounded-md hover:bg-accent"
          >
            <Trash2 className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {/* Progress */}
      {printing && (
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-primary h-2.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Jobs Table */}
      {jobs.length > 0 && (
        <div className="relative bg-transparent border border-border overflow-hidden"><div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-medium">Generated Labels ({jobs.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium">Serial Number</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">ZPL Preview</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 font-mono text-xs">{job.serial_number}</td>
                    <td className="px-6 py-3">
                      {job.status === "printed" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500 text-xs">
                          <CheckCircle2 className="h-3 w-3" /> Printed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-500 text-xs">
                          <Package className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded truncate max-w-[300px] block">
                        {job.zpl_data.slice(0, 60)}...
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
