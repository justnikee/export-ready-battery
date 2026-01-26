'use client';

import { motion } from 'framer-motion';
import { CodeBlock } from '@/components/docs';
import {
    Server,
    Settings,
    Terminal,
    Globe,
    Key,
    Database,
    Rocket,
    CheckCircle2
} from 'lucide-react';

// Environment Variable
function EnvVar({
    name,
    example,
    required,
    description
}: {
    name: string;
    example: string;
    required: boolean;
    description: string;
}) {
    return (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
                <code className="text-indigo-400 font-mono font-bold">{name}</code>
                {required && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        Required
                    </span>
                )}
            </div>
            <p className="text-gray-400 text-sm mb-2">{description}</p>
            <code className="text-xs text-gray-500">{example}</code>
        </div>
    );
}

export default function DeploymentPage() {
    return (
        <div className="space-y-12">
            {/* Header */}
            <section>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                      bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm mb-4">
                    <Server className="w-3.5 h-3.5" />
                    <span>Deployment Guide</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Deployment & Configuration
                </h1>

                <p className="text-lg text-gray-400 max-w-2xl">
                    Complete guide for deploying ExportReady-Battery to production.
                    Covers environment configuration, build commands, and hosting options.
                </p>
            </section>

            {/* Quick Deploy */}
            <section className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-emerald-400" />
                    Quick Deploy Checklist
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    {[
                        'Set up PostgreSQL database (Supabase recommended)',
                        'Configure environment variables',
                        'Run database migrations',
                        'Build frontend production bundle',
                        'Build backend binary',
                        'Configure reverse proxy (Nginx/Caddy)',
                        'Set up SSL certificates',
                        'Configure domain DNS',
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-black/20">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-gray-300 text-sm">{item}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Environment Variables */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Key className="w-6 h-6 text-amber-400" />
                    Environment Variables
                </h2>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Server className="w-4 h-4 text-indigo-400" />
                        Backend (.env)
                    </h3>

                    <div className="grid gap-3">
                        <EnvVar
                            name="DATABASE_URL"
                            example="postgresql://user:pass@host:5432/database?sslmode=require"
                            required={true}
                            description="PostgreSQL connection string. Use sslmode=require for production."
                        />
                        <EnvVar
                            name="JWT_SECRET"
                            example="your-secure-random-secret-key-at-least-32-chars"
                            required={true}
                            description="Secret key for signing JWT tokens. Use a cryptographically random string."
                        />
                        <EnvVar
                            name="PORT"
                            example="8080"
                            required={false}
                            description="Server port. Defaults to 8080 if not specified."
                        />
                        <EnvVar
                            name="FRONTEND_URL"
                            example="https://app.exportready.com"
                            required={true}
                            description="Frontend URL for CORS configuration."
                        />
                        <EnvVar
                            name="QR_BASE_URL"
                            example="https://app.exportready.com"
                            required={true}
                            description="Base URL for QR code links. Points to public passport pages."
                        />
                        <EnvVar
                            name="RAZORPAY_KEY_ID"
                            example="rzp_live_xxxxxxxxxxxxx"
                            required={false}
                            description="Razorpay API key ID for payment processing."
                        />
                        <EnvVar
                            name="RAZORPAY_KEY_SECRET"
                            example="xxxxxxxxxxxxxxxxxxxxx"
                            required={false}
                            description="Razorpay API secret key."
                        />
                    </div>

                    <CodeBlock
                        code={`# Backend .env example
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
JWT_SECRET=your-super-secure-random-string-here
PORT=8080
FRONTEND_URL=https://app.exportready.com
QR_BASE_URL=https://app.exportready.com
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=xxxx`}
                        language="bash"
                        title=".env"
                    />
                </div>

                <div className="space-y-4 mt-8">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        Frontend (.env.local)
                    </h3>

                    <div className="grid gap-3">
                        <EnvVar
                            name="NEXT_PUBLIC_API_URL"
                            example="https://api.exportready.com/api/v1"
                            required={true}
                            description="Backend API base URL."
                        />
                        <EnvVar
                            name="NEXT_PUBLIC_RAZORPAY_KEY_ID"
                            example="rzp_live_xxxxxxxxxxxxx"
                            required={false}
                            description="Razorpay public key for checkout."
                        />
                    </div>

                    <CodeBlock
                        code={`# Frontend .env.local example
NEXT_PUBLIC_API_URL=https://api.exportready.com/api/v1
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxx`}
                        language="bash"
                        title=".env.local"
                    />
                </div>
            </section>

            {/* Build Commands */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Terminal className="w-6 h-6 text-emerald-400" />
                    Build Commands
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Backend Commands */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Server className="w-5 h-5 text-cyan-400" />
                            Backend (Go)
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Install dependencies:</p>
                                <CodeBlock code="go mod download" language="bash" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Run development server:</p>
                                <CodeBlock code="make run" language="bash" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Build production binary:</p>
                                <CodeBlock code="make build" language="bash" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Run migrations:</p>
                                <CodeBlock code="make migrate-up" language="bash" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Run tests:</p>
                                <CodeBlock code="make test" language="bash" />
                            </div>
                        </div>
                    </div>

                    {/* Frontend Commands */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-400" />
                            Frontend (Next.js)
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Install dependencies:</p>
                                <CodeBlock code="npm install" language="bash" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Run development server:</p>
                                <CodeBlock code="npm run dev" language="bash" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Build production bundle:</p>
                                <CodeBlock code="npm run build" language="bash" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Start production server:</p>
                                <CodeBlock code="npm run start" language="bash" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Run linting:</p>
                                <CodeBlock code="npm run lint" language="bash" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Makefile Reference */}
            <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h2 className="text-xl font-bold text-white mb-4">Makefile Commands Reference</h2>
                <CodeBlock
                    code={`# Development
make run              # Start backend server
make dev              # Start with hot reload (requires air)

# Build
make build            # Build binary to ./bin/server

# Testing
make test             # Run all tests
make test-coverage    # Run tests with coverage

# Database Migrations
make migrate-up       # Run pending migrations
make migrate-down     # Rollback last migration
make migrate-reset    # Rollback ALL migrations
make migrate-version  # Show current version
make migrate-create   # Create new migration file

# Utilities
make clean            # Remove build artifacts
make lint             # Run Go linter`}
                    language="makefile"
                    title="Makefile"
                />
            </section>

            {/* Database Setup */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Database className="w-6 h-6 text-purple-400" />
                    Database Setup
                </h2>

                <div className="p-6 rounded-2xl border border-white/10 bg-white/5 mb-6">
                    <h3 className="text-lg font-bold text-white mb-4">Option 1: Supabase (Recommended)</h3>
                    <ol className="space-y-3 text-gray-300">
                        <li className="flex gap-3">
                            <span className="text-indigo-400 font-bold">1.</span>
                            Create a new project at <a href="https://supabase.com" className="text-indigo-400 hover:underline">supabase.com</a>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-indigo-400 font-bold">2.</span>
                            Copy the connection string from Settings → Database
                        </li>
                        <li className="flex gap-3">
                            <span className="text-indigo-400 font-bold">3.</span>
                            Set <code className="text-amber-400">DATABASE_URL</code> in your .env file
                        </li>
                        <li className="flex gap-3">
                            <span className="text-indigo-400 font-bold">4.</span>
                            Run <code className="text-amber-400">make migrate-up</code> to create tables
                        </li>
                    </ol>
                </div>

                <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">Option 2: Local PostgreSQL</h3>
                    <CodeBlock
                        code={`# Create database
createdb battery_db

# Set connection string
export DATABASE_URL="postgresql://postgres:password@localhost:5432/battery_db"

# Run migrations
cd backend
make migrate-up`}
                        language="bash"
                    />
                </div>
            </section>

            {/* Production Deployment */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Rocket className="w-6 h-6 text-pink-400" />
                    Production Deployment
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                        <h3 className="text-lg font-bold text-white mb-4">Railway</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Deploy both frontend and backend to Railway with auto-scaling.
                        </p>
                        <CodeBlock
                            code={`# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy backend
cd backend
railway up

# Deploy frontend
cd ../frontend
railway up`}
                            language="bash"
                        />
                    </div>

                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                        <h3 className="text-lg font-bold text-white mb-4">Vercel + Fly.io</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Frontend on Vercel, backend on Fly.io.
                        </p>
                        <CodeBlock
                            code={`# Deploy frontend to Vercel
cd frontend
vercel

# Deploy backend to Fly.io
cd ../backend
fly launch
fly deploy`}
                            language="bash"
                        />
                    </div>
                </div>
            </section>

            {/* Nginx Configuration */}
            <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-amber-400" />
                    Nginx Reverse Proxy
                </h2>
                <CodeBlock
                    code={`# /etc/nginx/sites-available/exportready
server {
    listen 443 ssl http2;
    server_name app.exportready.com;

    ssl_certificate /etc/letsencrypt/live/app.exportready.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.exportready.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}`}
                    language="nginx"
                    title="nginx.conf"
                />
            </section>

            {/* Health Check */}
            <section className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                <h2 className="text-xl font-bold text-white mb-4">Health Check Endpoints</h2>
                <p className="text-gray-300 mb-4">
                    Use these endpoints to verify your deployment is working:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-black/20">
                        <div className="text-sm text-gray-500 mb-1">Backend Health</div>
                        <code className="text-emerald-400 font-mono">GET /api/v1/health</code>
                    </div>
                    <div className="p-4 rounded-lg bg-black/20">
                        <div className="text-sm text-gray-500 mb-1">Frontend</div>
                        <code className="text-emerald-400 font-mono">GET /</code>
                    </div>
                </div>
            </section>
        </div>
    );
}
