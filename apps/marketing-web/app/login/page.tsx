import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect || "/admin";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f1] px-4">
      <form
        action={signIn}
        className="w-full max-w-sm space-y-6 rounded-sm border border-[#c3c4c7] bg-white p-8"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-medium text-[#1d2327]">Admin Login</h1>
          <p className="text-sm text-[#646970]">
            Sign in to manage blog content.
          </p>
        </div>

        {params.error && (
          <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {params.error}
          </p>
        )}

        <input type="hidden" name="redirect" value={redirectTo} />

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoFocus />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>

        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </div>
  );
}
