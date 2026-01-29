'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, AlertCircle, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/lib/api';
import { SeatLimitError } from '@/lib/types';

const formSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});

interface InviteMemberDialogProps {
    onSuccess?: () => void;
}

export function InviteMemberDialog({ onSuccess }: InviteMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [seatError, setSeatError] = useState<SeatLimitError | null>(null);
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            role: 'MEMBER',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setSeatError(null);

        try {
            await api.post('/team/invite', values);

            toast.success('Invitation Sent', {
                description: `Despatched an invitation to ${values.email}`,
            });

            setOpen(false);
            form.reset();
            onSuccess?.();
        } catch (error: any) {
            // Check for specific seat limit error structure
            if (error.response?.data?.error === 'seat_limit_reached') {
                setSeatError(error.response.data);
            } else {
                toast.error('Failed to invite', {
                    description: error.response?.data?.error || 'Something went wrong',
                });
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) {
                setSeatError(null);
                form.reset();
            }
            setOpen(val);
        }}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Send an invitation to a new team member. They will receive an email to join your organization.
                    </DialogDescription>
                </DialogHeader>

                {seatError ? (
                    <div className="space-y-4">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Seat Limit Reached</AlertTitle>
                            <AlertDescription>
                                {seatError.message}
                            </AlertDescription>
                        </Alert>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-linear-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                                onClick={() => router.push(seatError.upgrade_url || '/billing')}
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Upgrade Plan
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="colleague@company.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                                <SelectItem value="MEMBER">Member</SelectItem>
                                                <SelectItem value="VIEWER">Viewer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Invitation
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
