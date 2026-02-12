import { AuthLayout } from "@/components/auth/auth-layout"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
    return (
        <AuthLayout
            title="Get started with ExportLens"
            subtitle="Set up your battery passport workspace in under 2 minutes"
            type="register"
        >
            <RegisterForm />
        </AuthLayout>
    )
}
