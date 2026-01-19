'use client';

import { motion } from 'framer-motion';
import { CodeBlock } from '@/components/docs';
import {
    Rocket,
    CheckCircle2,
    Terminal,
    Settings,
    Globe,
    ArrowRight,
    Copy,
    Zap
} from 'lucide-react';
import Link from 'next/link';

// Step Component
function Step({
    number,
    title,
    children
}: {
    number: number;
    title: string;
    children: React.ReactNode
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: number * 0.1 }}
            className="relative pl-12 pb-8 border-l-2 border-indigo-500/30 last:border-0 last:pb-0"
        >
            <div className="absolute left-0 top-0 -translate-x-1/2 w-8 h-8 rounded-full 
                    bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                {number}
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
            <div className="text-gray-400">{children}</div>
        </motion.div>
    );
}

export default function GettingStartedPage() {
    return (
        <div className="space-y-12">
            {/* Header */}
            <section>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                      bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm mb-4">
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Quick Start Guide</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Getting Started
                </h1>

                <p className="text-lg text-gray-400 max-w-2xl">
                    Get up and running with ExportReady-Battery in under 10 minutes.
                    This guide covers installation, configuration, and your first battery passport.
                </p>
            </section>

            {/* Prerequisites */}
            <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Prerequisites
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    {[
                        { name: 'Node.js', version: '18.x or later', desc: 'JavaScript runtime' },
                        { name: 'Go', version: '1.24 or later', desc: 'Backend runtime' },
                        { name: 'PostgreSQL', version: '14+', desc: 'Database (or Supabase)' },
                        { name: 'Git', version: 'Latest', desc: 'Version control' },
                    ].map((prereq) => (
                        <div key={prereq.name} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                                <span className="text-white font-medium">{prereq.name}</span>
                                <span className="text-gray-500 text-sm ml-2">{prereq.version}</span>
                                <p className="text-xs text-gray-500">{prereq.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Installation Steps */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                    <Terminal className="w-6 h-6 text-indigo-400" />
                    Installation
                </h2>

                <div className="space-y-2">
                    <Step number={1} title="Clone the Repository">
                        <p className="mb-4">Start by cloning the repository to your local machine:</p>
                        <CodeBlock
                            code={`git clone https://github.com/your-org/exportready-battery.git
cd exportready-battery`}
                            language="bash"
                            title="Terminal"
                        />
                    </Step>

                    <Step number={2} title="Install Frontend Dependencies">
                        <p className="mb-4">Navigate to the frontend directory and install packages:</p>
                        <CodeBlock
                            code={`cd frontend
npm install`}
                            language="bash"
                            title="Terminal"
                        />
                    </Step>

                    <Step number={3} title="Install Backend Dependencies">
                        <p className="mb-4">Navigate to the backend directory and download Go modules:</p>
                        <CodeBlock
                            code={`cd ../backend
go mod download`}
                            language="bash"
                            title="Terminal"
                        />
                    </Step>

                    <Step number={4} title="Configure Environment Variables">
                        <p className="mb-4">Copy the example environment files and configure them:</p>
                        <CodeBlock
                            code={`# Backend configuration
cp .env.example .env

# Edit .env with your database credentials
DATABASE_URL=postgresql://user:password@localhost:5432/battery_db
JWT_SECRET=your-secure-random-secret-key
PORT=8080
FRONTEND_URL=http://localhost:3000
QR_BASE_URL=http://localhost:3000`}
                            language="bash"
                            title=".env"
                        />
                    </Step>

                    <Step number={5} title="Run Database Migrations">
                        <p className="mb-4">Set up your database schema with migrations:</p>
                        <CodeBlock
                            code={`make migrate-up`}
                            language="bash"
                            title="Terminal"
                        />
                    </Step>

                    <Step number={6} title="Start the Development Servers">
                        <p className="mb-4">Open two terminal windows and start both servers:</p>
                        <CodeBlock
                            code={`# Terminal 1: Start backend
cd backend
make run

# Terminal 2: Start frontend
cd frontend
npm run dev`}
                            language="bash"
                            title="Terminal"
                        />
                    </Step>
                </div>
            </section>

            {/* Verification */}
            <section className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    Verify Installation
                </h2>
                <p className="text-gray-300 mb-4">
                    If everything is set up correctly, you should be able to access:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-black/20 border border-white/10">
                        <div className="text-sm text-gray-500 mb-1">Frontend</div>
                        <a
                            href="http://localhost:3000"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:underline font-mono"
                        >
                            http://localhost:3000
                        </a>
                    </div>
                    <div className="p-4 rounded-lg bg-black/20 border border-white/10">
                        <div className="text-sm text-gray-500 mb-1">Backend API</div>
                        <a
                            href="http://localhost:8080/api/v1/health"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:underline font-mono"
                        >
                            http://localhost:8080/api/v1/health
                        </a>
                    </div>
                </div>
            </section>

            {/* First Passport */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Globe className="w-6 h-6 text-purple-400" />
                    Create Your First Passport
                </h2>

                <div className="space-y-6">
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4">1. Register an Account</h3>
                        <p className="text-gray-400 mb-4">
                            Navigate to <code className="text-indigo-400">/register</code> and create a new company account.
                        </p>
                        <CodeBlock
                            code={`POST /api/v1/auth/register
{
  "company_name": "Acme Batteries",
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}`}
                            language="json"
                            title="API Request"
                        />
                    </div>

                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4">2. Create a Batch</h3>
                        <p className="text-gray-400 mb-4">
                            From the dashboard, click &quot;Create Batch&quot; and fill in the battery specifications.
                        </p>
                        <CodeBlock
                            code={`POST /api/v1/batches
{
  "batch_name": "Q1-2026-Production",
  "market_region": "EU",
  "specs": {
    "chemistry": "Li-ion NMC",
    "voltage": "48V",
    "capacity": "100Ah"
  }
}`}
                            language="json"
                            title="API Request"
                        />
                    </div>

                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4">3. Upload Serial Numbers</h3>
                        <p className="text-gray-400 mb-4">
                            Upload a CSV file with serial numbers to generate passports:
                        </p>
                        <CodeBlock
                            code={`serial_number,manufacture_date
BAT-2026-001,2026-01-15
BAT-2026-002,2026-01-15
BAT-2026-003,2026-01-15`}
                            language="csv"
                            title="passports.csv"
                        />
                    </div>

                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4">4. Download QR Codes</h3>
                        <p className="text-gray-400">
                            Once passports are generated, download the QR codes as a ZIP file
                            and attach them to your batteries. Each QR code links to a unique
                            public passport page at <code className="text-indigo-400">/p/[uuid]</code>.
                        </p>
                    </div>
                </div>
            </section>

            {/* Next Steps */}
            <section>
                <h2 className="text-xl font-bold text-white mb-4">Next Steps</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <Link href="/docs/api-reference">
                        <motion.div
                            whileHover={{ x: 4 }}
                            className="flex items-center gap-4 p-4 rounded-xl border border-white/10 
                        bg-white/5 hover:border-indigo-500/50 transition-all cursor-pointer"
                        >
                            <div className="flex-1">
                                <h4 className="font-semibold text-white">API Reference</h4>
                                <p className="text-sm text-gray-500">Explore all available endpoints</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-500" />
                        </motion.div>
                    </Link>
                    <Link href="/docs/features">
                        <motion.div
                            whileHover={{ x: 4 }}
                            className="flex items-center gap-4 p-4 rounded-xl border border-white/10 
                        bg-white/5 hover:border-indigo-500/50 transition-all cursor-pointer"
                        >
                            <div className="flex-1">
                                <h4 className="font-semibold text-white">Features</h4>
                                <p className="text-sm text-gray-500">Discover all platform capabilities</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-500" />
                        </motion.div>
                    </Link>
                </div>
            </section>
        </div>
    );
}
