'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import api from '@/lib/api';
import { TeamList } from '@/components/team/TeamList';
import { InviteMemberDialog } from '@/components/team/InviteMemberDialog';
import { TeamListResponse, TeamMember } from '@/lib/types';
import { Loader2, Users, Crown, CheckCircle2, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function TeamPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<TeamListResponse | null>(null);

    const fetchTeam = async () => {
        try {
            const response = await api.get('/team');
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch team:', error);
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
            </div>
        );
    }

    const { members, seat_count, seat_limit, plan_type } = data || {
        members: [], seat_count: 0, seat_limit: 2, plan_type: 'STARTER'
    };

    const usagePercent = (seat_count / seat_limit) * 100;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="w-full mx-auto space-y-6">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Team Management</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage your team members and their access levels</p>
                    </div>
                    <InviteMemberDialog onSuccess={fetchTeam} />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Plan Usage Card */}
                    <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Users className="h-32 w-32 text-slate-900" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                                    <Crown className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">{plan_type} Plan</h3>
                                    <p className="text-slate-500 text-sm">Subscription active</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Seat Usage</span>
                                    <span className="font-medium text-slate-900">{seat_count} / {seat_limit} members</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {plan_type === 'STARTER' && (
                                <div className="mt-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-md border border-blue-200">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    Upgrade to Growth to invite up to 10 members.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Total Members Card */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Members</span>
                            <Users className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="text-2xl font-semibold text-slate-900 tracking-tight">{members.length}</div>
                        <div className="text-xs text-slate-500 mt-2">Including pending invites</div>
                    </div>
                </div>

                {/* Team Members Table */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-base font-medium text-slate-900">Team Members</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {members.length} Users
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
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
