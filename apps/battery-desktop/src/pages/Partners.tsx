import { Shield, ExternalLink } from "lucide-react";

export default function PartnersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight">Partners</h1>
        <p className="text-sm text-muted-foreground mt-1">Recycler network and compliance partnerships</p>
      </div>
      <div className="relative bg-transparent border border-border rounded-none p-12 text-center">
        <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
        <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg text-foreground mb-2">Partner Network</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">Manage recycler relationships, EPR certificate partners, and compliance contacts.</p>
        <a href="#" className="inline-flex items-center gap-2 text-sm text-blue-500 hover:underline"><ExternalLink className="h-4 w-4" /> Open Web App</a>
      </div>
    </div>
  );
}
