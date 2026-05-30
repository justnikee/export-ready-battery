"use client";

import { Megaphone, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@anvaya/ui/card";
import { Button } from "@anvaya/ui/button";

const announcements = [
  { id: 1, title: "EU Battery Regulation Update", message: "New carbon footprint requirements effective July 2026.", audience: "All Battery tenants", date: "Jun 10, 2026", status: "active" },
  { id: 2, title: "Scheduled Maintenance", message: "Platform maintenance on June 25, 2026 at 2:00 AM IST.", audience: "All tenants", date: "Jun 08, 2026", status: "scheduled" },
  { id: 3, title: "New Textile DPP Fields", message: "Additional material composition fields now available.", audience: "All Textile tenants", date: "May 28, 2026", status: "active" },
];

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">Broadcast messages to tenants and users.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Announcement
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Megaphone className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Audience: {a.audience}</span>
                      <span>Posted: {a.date}</span>
                      <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full ${
                        a.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
