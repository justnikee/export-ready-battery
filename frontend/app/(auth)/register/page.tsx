import { AuthLayout } from "@/components/auth/auth-layout"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
    return (
        <AuthLayout
            title="Create your account"
            subtitle="Start your free trial and get started in minutes"
            type="register"
        >
            <RegisterForm />
        </AuthLayout>
    )
}
