import { Users, UserPlus } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage team members and access permissions</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <UserPlus className="h-4 w-4" /> Invite Member
        </button>
      </div>
      <div className="relative bg-transparent border border-border rounded-none p-12 text-center"><Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg text-foreground mb-2">Team members will appear here</h3>
        <p className="text-sm text-muted-foreground">Use the web app for full team management capabilities.</p>
      </div>
    </div>
  );
}
