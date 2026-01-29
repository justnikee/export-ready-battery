'use client';

import { useState } from 'react';
import { Loader2, Trash2, Mail, Shield, ShieldCheck, User, Eye, Ban } from 'lucide-react';
import { format } from 'date-fns';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import api from '@/lib/api';
import { TeamMember, TeamRole } from '@/lib/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TeamListProps {
    members: TeamMember[];
    onUpdate: () => void;
    currentUserId?: string; // To prevent deleting self (though backend blocks it)
}

const roleIcons: Record<TeamRole, React.ReactNode> = {
    OWNER: <ShieldCheck className="h-4 w-4 text-purple-600" />,
    ADMIN: <Shield className="h-4 w-4 text-blue-600" />,
    MEMBER: <User className="h-4 w-4 text-slate-600" />,
    VIEWER: <Eye className="h-4 w-4 text-slate-400" />,
};

const statusBadges: Record<string, 'default' | 'success' | 'secondary' | 'destructive'> = {
    ACTIVE: 'success',
    PENDING: 'secondary',
    REVOKED: 'destructive',
};

export function TeamList({ members, onUpdate }: TeamListProps) {
    // const { toast } = useToast(); // Removed
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    async function handleDelete(id: string) {
        try {
            await api.delete(`/team/${id}`);
            toast.success('Member removed');
            onUpdate();
        } catch (error: any) {
            toast.error('Error', {
                description: error.response?.data?.error || 'Failed to remove member',
            });
        } finally {
            setDeletingId(null);
        }
    }

    async function handleRoleUpdate(id: string, newRole: TeamRole) {
        setUpdatingId(id);
        try {
            await api.put(`/team/${id}/role`, { role: newRole });
            toast.success('Role updated');
            onUpdate();
        } catch (error: any) {
            toast.error('Error', {
                description: error.response?.data?.error || 'Failed to update role',
            });
        } finally {
            setUpdatingId(null);
        }
    }

    if (members.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                <p className="text-muted-foreground">No team members found.</p>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Added</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                {member.email.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm text-slate-900">{member.email}</span>
                                            {member.user_id && <span className="text-xs text-slate-500">Registered User</span>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild disabled={member.role === 'OWNER' || updatingId === member.id}>
                                            <Button variant="ghost" size="sm" className="h-8 gap-1 pl-2 pr-3 font-normal border-dashed border">
                                                {updatingId === member.id ? <Loader2 className="h-3 w-3 animate-spin" /> : roleIcons[member.role] || <User className="h-3 w-3" />}
                                                <span className="capitalize text-xs">{member.role.toLowerCase()}</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            <DropdownMenuItem onClick={() => handleRoleUpdate(member.id, 'ADMIN')}>
                                                <Shield className="mr-2 h-4 w-4 text-blue-600" /> Admin
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleUpdate(member.id, 'MEMBER')}>
                                                <User className="mr-2 h-4 w-4 text-slate-600" /> Member
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleUpdate(member.id, 'VIEWER')}>
                                                <Eye className="mr-2 h-4 w-4 text-slate-400" /> Viewer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={(statusBadges[member.status] || 'default') as any}>
                                        {member.status === 'PENDING' && <Mail className="mr-1 h-3 w-3" />}
                                        {member.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {format(new Date(member.created_at), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell className="text-right">
                                    {member.role !== 'OWNER' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                                            onClick={() => setDeletingId(member.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this member? They will lose access to the organization immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingId && handleDelete(deletingId)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
