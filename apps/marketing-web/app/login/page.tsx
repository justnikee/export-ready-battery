import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect || "/admin/blog";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <form
        action={signIn}
        className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-white">Admin Login</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage blog content.
          </p>
        </div>

        {params.error && (
          <p className="rounded-md border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-400">
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
