import { FileDown, FileSpreadsheet, Download } from "lucide-react";

export default function ExportsPage() {

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight">Export Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate compliance reports and regulatory exports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "CPCB Form 3", desc: "Annual return for EPR compliance", icon: FileSpreadsheet, action: "Download CSV" },
          { title: "Batch Labels", desc: "QR labels for all passports in a batch", icon: FileDown, action: "Download" },
          { title: "EPCIS Export", desc: "GS1 EPCIS 2.0 traceability document", icon: FileDown, action: "Export JSON-LD" },
          { title: "Audit Trail", desc: "Full tamper-evident lifecycle log", icon: FileSpreadsheet, action: "Export CSV" },
        ].map(item => (
          <div key={item.title} className="relative bg-transparent border border-border rounded-none p-5 hover:bg-accent transition-colors cursor-pointer group"><div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-medium text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
              <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-blue-500">
              <Download className="h-4 w-4" /> {item.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
