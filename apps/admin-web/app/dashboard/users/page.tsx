"use client";

import { Users, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@anvaya/ui/card";
import { Input } from "@anvaya/ui/input";
import { Badge } from "@anvaya/ui/badge";

const users = [
  { id: 1, name: "Rahul Sharma", email: "rahul@tata.com", tenant: "Tata AutoComp", role: "Admin", status: "active" },
  { id: 2, name: "Priya Patel", email: "priya@arvind.com", tenant: "Arvind Limited", role: "Manager", status: "active" },
  { id: 3, name: "Amit Kumar", email: "amit@exide.com", tenant: "Exide Industries", role: "Admin", status: "active" },
  { id: 4, name: "Sneha Gupta", email: "sneha@raymond.com", tenant: "Raymond UCO", role: "Viewer", status: "invited" },
  { id: 5, name: "Vikram Rao", email: "vikram@amararaja.com", tenant: "Amara Raja", role: "Admin", status: "active" },
];

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">All users across tenants.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search users..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left font-medium pb-3 pr-4">User</th>
                  <th className="text-left font-medium pb-3 pr-4">Tenant</th>
                  <th className="text-left font-medium pb-3 pr-4">Role</th>
                  <th className="text-left font-medium pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {u.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">{u.tenant}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={u.role === "Admin" ? "default" : u.role === "Manager" ? "secondary" : "outline"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                        u.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-blue-500"}`} />
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
