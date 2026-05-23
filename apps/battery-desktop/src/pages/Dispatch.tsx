import { Link } from "react-router-dom";
import { Truck, Package } from "lucide-react";

export default function DispatchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight">Dispatch Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage shipments and logistics for battery batches</p>
      </div>
      <div className="relative bg-transparent border border-border rounded-none p-12 text-center">
        <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
        <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
        <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg text-foreground mb-2">Dispatch Management</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">Ship batteries and update lifecycle status with logistics evidence.</p>
        <Link to="/dashboard/lifecycle" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Package className="h-4 w-4" /> Go to Lifecycle
        </Link>
      </div>
    </div>
  );
}
