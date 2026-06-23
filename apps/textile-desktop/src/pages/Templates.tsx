import { FileText, Package } from "lucide-react";
import { Link } from "react-router-dom";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight">Batch Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Reusable templates for quick batch creation</p>
      </div>
      <div className="relative bg-transparent border border-border rounded-none p-12 text-center"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg text-foreground mb-2">Coming Soon</h3>
        <p className="text-sm text-muted-foreground mb-4">Templates will allow lightning-fast batch creation with pre-filled specs.</p>
        <Link to="/dashboard/batches" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Package className="h-4 w-4" /> Create Batch
        </Link>
      </div>
    </div>
  );
}
