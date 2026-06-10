import { Key, Code, ExternalLink, FileText } from "lucide-react";

export default function DeveloperPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight">Developer Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">API keys, webhooks, and integration resources</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "API Keys", desc: "Manage access tokens for the REST API", icon: Key },
          { title: "Documentation", desc: "Full API reference and integration guides", icon: FileText },
          { title: "Webhooks", desc: "Configure real-time event notifications", icon: Code },
        ].map(item => (
          <div key={item.title} className="relative bg-transparent border border-border rounded-none p-5 hover:bg-accent transition-colors cursor-pointer"><item.icon className="h-6 w-6 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ExternalLink className="h-4 w-4" /> Full developer console available at <a href="#" className="text-blue-500 hover:underline">API Dashboard</a>
      </div>
    </div>
  );
}
