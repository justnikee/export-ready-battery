'use client';

import { motion } from 'framer-motion';
import { CodeBlock } from '@/components/docs';
import {
    Sparkles,
    FileText,
    QrCode,
    Upload,
    Calculator,
    Layers,
    Zap,
    CheckCircle2,
    BarChart3,
    Mail,
    Download,
    Globe
} from 'lucide-react';

// Feature Card
function FeatureCard({
    id,
    icon,
    title,
    description,
    status,
    children
}: {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    status: 'complete' | 'partial' | 'pending';
    children?: React.ReactNode;
}) {
    const statusColors = {
        complete: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        partial: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };

    const statusLabels = {
        complete: 'Complete',
        partial: 'Partial',
        pending: 'Pending',
    };

    return (
        <section id={id} className="scroll-mt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl border border-white/10 bg-white/5"
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            {icon}
                        </div>
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded border ${statusColors[status]}`}>
                        {statusLabels[status]}
                    </span>
                </div>
                <p className="text-gray-400 mb-6">{description}</p>
                {children}
            </motion.div>
        </section>
    );
}

// Feature List Item
function FeatureItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-start gap-2 text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
            <span>{children}</span>
        </li>
    );
}

export default function FeaturesPage() {
    return (
        <div className="space-y-12">
            {/* Header */}
            <section>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                      bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Platform Features</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Features
                </h1>

                <p className="text-lg text-gray-400 max-w-2xl">
                    Explore all the powerful features of ExportReady-Battery.
                    From batch management to compliance tracking, we&apos;ve got you covered.
                </p>
            </section>

            {/* Features Grid Overview */}
            <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { icon: <FileText className="w-5 h-5 text-indigo-400" />, label: 'Batch Management', status: '✅' },
                    { icon: <QrCode className="w-5 h-5 text-emerald-400" />, label: 'QR Generation', status: '✅' },
                    { icon: <Upload className="w-5 h-5 text-blue-400" />, label: 'CSV Upload', status: '✅' },
                    { icon: <Calculator className="w-5 h-5 text-amber-400" />, label: 'DVA Calculator', status: '✅' },
                    { icon: <Layers className="w-5 h-5 text-purple-400" />, label: 'Templates', status: '✅' },
                    { icon: <BarChart3 className="w-5 h-5 text-cyan-400" />, label: 'Analytics', status: '🔄' },
                ].map((feature) => (
                    <div
                        key={feature.label}
                        className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5"
                    >
                        {feature.icon}
                        <span className="text-white font-medium flex-1">{feature.label}</span>
                        <span>{feature.status}</span>
                    </div>
                ))}
            </section>

            {/* ============= BATCH MANAGEMENT ============= */}
            <FeatureCard
                id="batch-management"
                icon={<FileText className="w-5 h-5 text-indigo-400" />}
                title="Batch Management"
                description="Create and manage battery production batches with comprehensive specifications."
                status="complete"
            >
                <ul className="space-y-2 mb-6">
                    <FeatureItem>Create batches with full battery specifications (chemistry, voltage, capacity)</FeatureItem>
                    <FeatureItem>Dual-mode support for India (🇮🇳) and EU (🇪🇺) markets</FeatureItem>
                    <FeatureItem>Track PLI compliance, DVA percentage, and cell source</FeatureItem>
                    <FeatureItem>Store customs declaration for imported cells</FeatureItem>
                    <FeatureItem>View batch details with passport counts and status</FeatureItem>
                </ul>

                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Batch Specifications</h4>
                <CodeBlock
                    code={`{
  "batch_name": "Q1-2026-Production",
  "market_region": "INDIA",
  "specs": {
    "chemistry": "Li-ion NMC",
    "voltage": "48V",
    "capacity": "100Ah",
    "manufacturer": "Acme Batteries",
    "weight": "45kg",
    "country_of_origin": "India",
    "recyclable": true
  },
  "pli_compliant": true,
  "domestic_value_add": 65.5,
  "cell_source": "DOMESTIC"
}`}
                    language="json"
                    title="Batch Object"
                />
            </FeatureCard>

            {/* ============= QR GENERATION ============= */}
            <FeatureCard
                id="qr-generation"
                icon={<QrCode className="w-5 h-5 text-emerald-400" />}
                title="QR Code Generation"
                description="Generate unique QR codes for each battery passport, enabling instant verification."
                status="complete"
            >
                <ul className="space-y-2 mb-6">
                    <FeatureItem>256x256 PNG QR codes with medium error correction</FeatureItem>
                    <FeatureItem>Parallel generation with worker pool (20 concurrent workers)</FeatureItem>
                    <FeatureItem>Bulk download as ZIP archive</FeatureItem>
                    <FeatureItem>Each QR links to public passport page</FeatureItem>
                    <FeatureItem>Customizable base URL for different environments</FeatureItem>
                </ul>

                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">QR Code URL Format</h4>
                <CodeBlock
                    code={`https://your-domain.com/p/{passport-uuid}

Example:
https://exportready.com/p/550e8400-e29b-41d4-a716-446655440000`}
                    language="text"
                />
            </FeatureCard>

            {/* ============= CSV UPLOAD ============= */}
            <FeatureCard
                id="csv-upload"
                icon={<Upload className="w-5 h-5 text-blue-400" />}
                title="CSV Upload & Processing"
                description="Bulk import serial numbers via CSV with high-performance parallel processing."
                status="complete"
            >
                <ul className="space-y-2 mb-6">
                    <FeatureItem>Stream processing for large files (5000+ rows)</FeatureItem>
                    <FeatureItem>Worker pool validation (10 concurrent workers)</FeatureItem>
                    <FeatureItem>Automatic UTF-8 BOM detection and removal</FeatureItem>
                    <FeatureItem>Multi-format date support (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY)</FeatureItem>
                    <FeatureItem>Row-level error reporting with detailed messages</FeatureItem>
                </ul>

                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Expected CSV Format</h4>
                <CodeBlock
                    code={`serial_number,manufacture_date
BAT-2026-001,2026-01-15
BAT-2026-002,2026-01-15
BAT-2026-003,15/01/2026
BAT-2026-004,01-15-2026`}
                    language="csv"
                    title="passports.csv"
                />
            </FeatureCard>

            {/* ============= DVA CALCULATOR ============= */}
            <FeatureCard
                id="dva-calculator"
                icon={<Calculator className="w-5 h-5 text-amber-400" />}
                title="DVA Calculator"
                description="Calculate Domestic Value Addition (DVA) for India's PLI scheme eligibility."
                status="complete"
            >
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
                    <p className="text-amber-400 font-semibold mb-2">PLI Eligibility Formula</p>
                    <code className="text-white text-sm">
                        DVA = ((Ex-Factory Sale Price - Cost of Imported Materials) / Ex-Factory Sale Price) × 100
                    </code>
                </div>

                <ul className="space-y-2 mb-6">
                    <FeatureItem>Real-time calculation as user types</FeatureItem>
                    <FeatureItem>Visual PLI eligibility indicator (≥50% = Eligible)</FeatureItem>
                    <FeatureItem>Progress bar with animated glow effect</FeatureItem>
                    <FeatureItem>&quot;Apply to Batch&quot; auto-fills the form</FeatureItem>
                </ul>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">PLI Eligible</span>
                        </div>
                        <p className="text-sm text-gray-400">DVA ≥ 50%</p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-red-400" />
                            <span className="text-red-400 font-semibold">Low Value Add</span>
                        </div>
                        <p className="text-sm text-gray-400">DVA &lt; 50%</p>
                    </div>
                </div>
            </FeatureCard>

            {/* ============= TEMPLATES ============= */}
            <FeatureCard
                id="templates"
                icon={<Layers className="w-5 h-5 text-purple-400" />}
                title="Batch Templates"
                description="Save and reuse battery specifications across multiple batches."
                status="complete"
            >
                <ul className="space-y-2 mb-6">
                    <FeatureItem>Save batch specifications as reusable templates</FeatureItem>
                    <FeatureItem>Quick-load templates when creating new batches</FeatureItem>
                    <FeatureItem>Animated template selection with auto-fill</FeatureItem>
                    <FeatureItem>Edit and delete templates from dashboard</FeatureItem>
                </ul>

                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">API Example</h4>
                <CodeBlock
                    code={`POST /api/v1/templates
{
  "name": "EV Battery 48V",
  "specs": {
    "chemistry": "Li-ion NMC",
    "voltage": "48V",
    "capacity": "100Ah"
  }
}

GET /api/v1/templates
// Returns list of saved templates`}
                    language="json"
                />
            </FeatureCard>

            {/* ============= ANALYTICS ============= */}
            <FeatureCard
                id="analytics"
                icon={<BarChart3 className="w-5 h-5 text-cyan-400" />}
                title="Scan Analytics"
                description="Track QR code scans with geolocation and device information."
                status="partial"
            >
                <ul className="space-y-2 mb-6">
                    <FeatureItem>Record scan events with timestamp</FeatureItem>
                    <FeatureItem>IP-based geolocation (city, country)</FeatureItem>
                    <FeatureItem>Device type detection (Mobile/Desktop)</FeatureItem>
                    <FeatureItem>User agent parsing</FeatureItem>
                    <li className="flex items-start gap-2 text-gray-500">
                        <span className="w-4 h-4 mt-1 border border-gray-500 rounded shrink-0" />
                        <span>Analytics dashboard (Coming Soon)</span>
                    </li>
                </ul>

                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Scan Event Data</h4>
                <CodeBlock
                    code={`{
  "id": "scan-uuid",
  "passport_id": "passport-uuid",
  "ip_address": "203.0.113.42",
  "city": "Mumbai",
  "country": "India",
  "device_type": "Mobile",
  "user_agent": "Mozilla/5.0 (iPhone; ...)",
  "scanned_at": "2026-01-15T14:30:00Z"
}`}
                    language="json"
                />
            </FeatureCard>

            {/* ============= PUBLIC PASSPORT ============= */}
            <FeatureCard
                id="public-passport"
                icon={<Globe className="w-5 h-5 text-pink-400" />}
                title="Public Battery Passport"
                description="Consumer-facing passport page with dynamic market-based rendering."
                status="complete"
            >
                <ul className="space-y-2 mb-6">
                    <FeatureItem>Dynamic rendering based on market region (India/EU/Global)</FeatureItem>
                    <FeatureItem>Premium dark theme with glassmorphism UI</FeatureItem>
                    <FeatureItem>India view: PLI badge, DVA progress, EPR, BIS, recycling instructions</FeatureItem>
                    <FeatureItem>EU view: Carbon footprint, material composition, CE mark</FeatureItem>
                    <FeatureItem>Automatic scan tracking on page load</FeatureItem>
                    <FeatureItem>Verified authenticity badge</FeatureItem>
                </ul>

                <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-indigo-400 font-semibold mb-2">Access Pattern</p>
                    <code className="text-white text-sm">
                        GET /p/550e8400-e29b-41d4-a716-446655440000
                    </code>
                    <p className="text-gray-400 text-sm mt-2">
                        No authentication required. Accessible by anyone with the QR code.
                    </p>
                </div>
            </FeatureCard>

            {/* ============= BILLING ============= */}
            <FeatureCard
                id="billing"
                icon={<Zap className="w-5 h-5 text-yellow-400" />}
                title="Quota & Billing"
                description="Passport quota system with Razorpay payment integration."
                status="complete"
            >
                <ul className="space-y-2 mb-6">
                    <FeatureItem>Quota-based passport activation</FeatureItem>
                    <FeatureItem>Real-time quota balance tracking</FeatureItem>
                    <FeatureItem>Razorpay payment gateway integration</FeatureItem>
                    <FeatureItem>Multiple pricing packages (Starter, Professional, Enterprise)</FeatureItem>
                    <FeatureItem>Transaction history and invoices</FeatureItem>
                </ul>

                <div className="grid sm:grid-cols-3 gap-4">
                    {[
                        { name: 'Starter', quota: '100', price: '₹999' },
                        { name: 'Professional', quota: '500', price: '₹3,999' },
                        { name: 'Enterprise', quota: '2000', price: '₹9,999' },
                    ].map((pkg) => (
                        <div key={pkg.name} className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                            <div className="text-lg font-bold text-white">{pkg.name}</div>
                            <div className="text-2xl font-bold text-indigo-400 mt-1">{pkg.quota}</div>
                            <div className="text-xs text-gray-500">passports</div>
                            <div className="text-sm text-gray-400 mt-2">{pkg.price}</div>
                        </div>
                    ))}
                </div>
            </FeatureCard>
        </div>
    );
}
