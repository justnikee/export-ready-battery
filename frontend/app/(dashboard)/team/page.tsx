'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import api from '@/lib/api';
import { TeamList } from '@/components/team/TeamList';
import { InviteMemberDialog } from '@/components/team/InviteMemberDialog';
import { TeamListResponse, TeamMember } from '@/lib/types';
import { Loader2, Users, Crown, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const { members, seat_count, seat_limit, plan_type } = data || {
        members: [], seat_count: 0, seat_limit: 2, plan_type: 'STARTER'
    };

    const usagePercent = (seat_count / seat_limit) * 100;

    return (
        <div className="space-y-8 p-8 max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team Management</h1>
                    <p className="text-slate-500 mt-2">
                        Manage your team members and their access levels.
                    </p>
                </div>
                <InviteMemberDialog onSuccess={fetchTeam} />
            </div>

            {/* Plan Usage Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Users className="h-32 w-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-white/10 p-2 rounded-lg">
                                <Crown className="h-5 w-5 text-yellow-400" />
                            </span>
                            <div>
                                <h3 className="font-semibold text-lg">{plan_type} Plan</h3>
                                <p className="text-slate-300 text-sm">Subscription active</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">Seat Usage</span>
                                <span className="font-medium">{seat_count} / {seat_limit} members</span>
                            </div>
                            <Progress value={usagePercent} className="h-2 bg-white/10" indicatorClassName={usagePercent >= 100 ? "bg-red-500" : "bg-blue-500"} />
                        </div>

                        {plan_type === 'STARTER' && (
                            <div className="mt-6 flex items-center gap-2 text-sm text-blue-200 bg-blue-500/10 p-3 rounded-md border border-blue-500/20">
                                <CheckCircle2 className="h-4 w-4" />
                                Upgrade to Growth to invite up to 10 members.
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border shadow-sm flex flex-col justify-center items-center text-center space-y-2">
                    <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-2">
                        <Users className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium">Total Members</h3>
                    <div className="text-3xl font-bold tracking-tight">{members.length}</div>
                    <p className="text-xs text-muted-foreground">Including pending invites</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Team Members</h2>
                    <Badge variant="outline" className="px-3 py-1">
                        {members.length} Users
                    </Badge>
                </div>

                <TeamList
                    members={members}
                    onUpdate={fetchTeam}
                    currentUserId={user?.id}
                />
            </div>
        </div>
    );
}
