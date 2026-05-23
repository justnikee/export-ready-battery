import { Package, ArrowRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const LIFECYCLE_STATES = ["ALL", "CREATED", "ACTIVE", "SHIPPED", "IN_SERVICE", "RECALLED", "RECYCLED", "END_OF_LIFE"];

export default function LifecyclePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight">Lifecycle Operations</h1>
        <p className="text-sm text-muted-foreground mt-1">Track, transition, and manage battery passports across their lifecycle</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {LIFECYCLE_STATES.slice(1).map(status => (
          <div key={status} className="p-3 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer text-left transition-all">
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium text-muted-foreground truncate">{status.replace(/_/g, " ")}</span>
            </div>
            <span className="text-lg font-semibold text-foreground tabular-nums">—</span>
          </div>
        ))}
      </div>

      <div className="relative bg-transparent border border-border rounded-none p-12 text-center">
        <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
        <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg text-foreground mb-2">Full Lifecycle Management</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">The complete lifecycle management interface is available in the web app. Connect backend to enable.</p>
        <Link to="/dashboard/batches" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <ArrowRight className="h-4 w-4" /> View Batches
        </Link>
      </div>
    </div>
  );
}
