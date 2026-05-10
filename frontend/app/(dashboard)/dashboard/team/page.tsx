"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { TeamList } from "@/components/team/TeamList";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { TeamListResponse } from "@/lib/types";
import { Users, Crown, CheckCircle2, Shield } from "lucide-react";

export default function TeamPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeamListResponse | null>(null);

  const fetchTeam = async () => {
    try {
      const response = await api.get("/team");
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch team:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTeam();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" />
      </div>
    );
  }

  const {
    members: rawMembers,
    seat_count,
    seat_limit,
    plan_type,
  } = data || {
    members: [],
    seat_count: 0,
    seat_limit: 2,
    plan_type: "STARTER",
  };
  const members = rawMembers || [];

  const usagePercent = (seat_count / seat_limit) * 100;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-foreground tracking-tight">
              Team Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your team members and their access levels
            </p>
          </div>
          <InviteMemberDialog onSuccess={fetchTeam} />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plan Usage Card */}
          <div className="md:col-span-2 bg-transparent border border-border p-6 relative overflow-visible">
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Users className="h-32 w-32 text-foreground" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20">
                  <Crown className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className=" text-foreground">{plan_type} Plan</h3>
                  <p className="text-muted-foreground text-sm">
                    Subscription active
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seat Usage</span>
                  <span className="font-medium text-foreground">
                    {seat_count} / {seat_limit} members
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${usagePercent >= 100 ? "bg-red-500/100" : usagePercent >= 80 ? "bg-amber-500/100" : "bg-emerald-500/100"}`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
              </div>

              {plan_type === "STARTER" && (
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-500 bg-blue-500/10 p-3 border border-blue-500/20">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Upgrade to Growth to invite up to 10 members.
                </div>
              )}
            </div>
          </div>

          {/* Total Members Card */}
          <div className="relative bg-transparent border border-border p-6">
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Members
              </span>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl text-foreground tracking-tight">
              {members.length}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Including pending invites
            </div>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="relative bg-transparent border border-border overflow-visible">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-medium text-foreground">
                Team Members
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                {members.length} Users
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              Role-based access control
            </div>
          </div>

          <TeamList
            members={members}
            onUpdate={fetchTeam}
            currentUserId={user?.id}
          />
        </div>
      </div>
    </div>
  );
}
