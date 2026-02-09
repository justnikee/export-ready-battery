import { AuthLayout } from "@/components/auth/auth-layout"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Sign in to your account to continue"
            type="login"
        >
            <LoginForm />
        </AuthLayout>
    )
}
