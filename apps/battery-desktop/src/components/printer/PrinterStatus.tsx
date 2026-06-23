import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Printer, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface PrinterInfo {
  name: string;
  vid: number;
  pid: number;
  connected: boolean;
}

export default function PrinterStatus() {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<string>(
    localStorage.getItem("selected_printer") || ""
  );
  const [open, setOpen] = useState(false);

  async function detect() {
    setLoading(true);
    try {
      const detected: PrinterInfo[] = await invoke("detect_usb_printers");
      setPrinters(detected);
      if (detected.length > 0 && !selectedPrinter) {
        setSelectedPrinter(detected[0].name);
        localStorage.setItem("selected_printer", detected[0].name);
      }
    } catch (err) {
      console.error("Failed to detect printers:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    detect();
    const interval = setInterval(detect, 10000);
    return () => clearInterval(interval);
  }, []);

  const activePrinter = printers.find((p) => p.name === selectedPrinter);
  const isConnected = activePrinter?.connected ?? false;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
      >
        <Printer className="h-4 w-4 text-muted-foreground" />
        {isConnected ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
        )}
        <span className="text-sm text-foreground">
          {selectedPrinter || "No Printer"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-popover border border-border rounded-md shadow-lg z-50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Printers</span>
            <button onClick={detect} disabled={loading} className="p-1 hover:bg-accent rounded">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {printers.length === 0 ? (
            <div className="text-xs text-muted-foreground py-2">
              No USB printers detected. Connect a Zebra or TSC printer.
            </div>
          ) : (
            <div className="space-y-1">
              {printers.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setSelectedPrinter(p.name);
                    localStorage.setItem("selected_printer", p.name);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                    selectedPrinter === p.name
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left truncate">{p.name}</span>
                  {p.connected && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedPrinter && (
            <button
              onClick={async () => {
                try {
                  const result: { success: boolean; message: string } = await invoke(
                    "print_test_page",
                    { printerName: selectedPrinter }
                  );
                  alert(result.message);
                } catch (err) {
                  alert("Test print failed: " + String(err));
                }
              }}
              className="w-full mt-2 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Print Test Page
            </button>
          )}
        </div>
      )}
    </div>
  );
}
