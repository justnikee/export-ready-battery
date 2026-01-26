'use client';

import { motion } from 'framer-motion';
import { CodeBlock } from '@/components/docs';
import {
    Shield,
    CheckCircle2,
    Flag,
    FileCheck,
    Recycle,
    AlertTriangle,
    Globe,
    Leaf
} from 'lucide-react';

// Compliance Section
function ComplianceSection({
    id,
    icon,
    title,
    flag,
    description,
    children
}: {
    id: string;
    icon: React.ReactNode;
    title: string;
    flag: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className="scroll-mt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl border border-white/10 bg-white/5"
            >
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{flag}</span>
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {icon}
                            {title}
                        </h2>
                    </div>
                </div>
                <p className="text-gray-400 mb-6">{description}</p>
                {children}
            </motion.div>
        </section>
    );
}

// Requirement Item
function ReqItem({
    name,
    supported,
    description
}: {
    name: string;
    supported: boolean | 'partial';
    description: string;
}) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            {supported === true ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : supported === 'partial' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
                <span className="w-5 h-5 border-2 border-gray-500 rounded shrink-0 mt-0.5" />
            )}
            <div>
                <div className="font-medium text-white">{name}</div>
                <div className="text-sm text-gray-400">{description}</div>
            </div>
        </div>
    );
}

export default function CompliancePage() {
    return (
        <div className="space-y-12">
            {/* Header */}
            <section>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                      bg-violet-500/20 border border-violet-500/30 text-violet-400 text-sm mb-4">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Regulatory Compliance</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Compliance Documentation
                </h1>

                <p className="text-lg text-gray-400 max-w-2xl">
                    ExportReady-Battery supports compliance with global battery regulations
                    including India&apos;s PLI scheme and the EU Battery Regulation.
                </p>
            </section>

            {/* Overview */}
            <section className="grid sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
                    <div className="text-3xl mb-3">🇮🇳</div>
                    <h3 className="text-lg font-bold text-white mb-2">India Compliance</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li>• PLI Scheme for ACC Batteries</li>
                        <li>• Battery Waste Management Rules 2022</li>
                        <li>• BIS Certification (IS 16046)</li>
                        <li>• EPR Registration (CPCB)</li>
                    </ul>
                </div>
                <div className="p-6 rounded-xl border border-blue-500/30 bg-blue-500/10">
                    <div className="text-3xl mb-3">🇪🇺</div>
                    <h3 className="text-lg font-bold text-white mb-2">EU Compliance</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li>• EU Battery Regulation 2023/1542</li>
                        <li>• Digital Battery Passport (Article 77)</li>
                        <li>• Carbon Footprint Declaration</li>
                        <li>• Material Composition Tracking</li>
                    </ul>
                </div>
            </section>

            {/* ============= INDIA COMPLIANCE ============= */}
            <ComplianceSection
                id="india"
                icon={<Flag className="w-6 h-6 text-orange-400" />}
                title="India Compliance"
                flag="🇮🇳"
                description="Support for India's battery regulations including PLI scheme, Battery Aadhaar, and environmental compliance."
            >
                {/* PLI Scheme */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-emerald-400" />
                        PLI Scheme for ACC Batteries
                    </h3>
                    <p className="text-gray-400 mb-4">
                        The Production Linked Incentive (PLI) scheme for Advanced Chemistry Cell (ACC)
                        batteries requires manufacturers to meet minimum Domestic Value Addition (DVA) thresholds.
                    </p>

                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
                        <p className="text-emerald-400 font-semibold mb-2">DVA Requirement</p>
                        <p className="text-white">Minimum 50% Domestic Value Add for PLI eligibility</p>
                        <code className="text-sm text-gray-400 block mt-2">
                            DVA = ((Sale Price - Imported Cost) / Sale Price) × 100
                        </code>
                    </div>

                    <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2 mt-6">Platform Support</h4>
                    <div className="grid gap-3">
                        <ReqItem
                            name="DVA Calculator"
                            supported={true}
                            description="Built-in calculator to compute DVA percentage with visual PLI eligibility indicator"
                        />
                        <ReqItem
                            name="PLI Compliance Flag"
                            supported={true}
                            description="Mark batches as PLI compliant with automatic badge on passport"
                        />
                        <ReqItem
                            name="Cell Source Tracking"
                            supported={true}
                            description="Track whether cells are imported or domestic with customs declaration"
                        />
                    </div>
                </div>

                {/* EPR */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Recycle className="w-5 h-5 text-green-400" />
                        EPR (Extended Producer Responsibility)
                    </h3>
                    <p className="text-gray-400 mb-4">
                        Under the Battery Waste Management Rules 2022, producers must register
                        with CPCB and ensure proper collection and recycling of used batteries.
                    </p>

                    <div className="grid gap-3">
                        <ReqItem
                            name="EPR Registration Number"
                            supported={true}
                            description="Store and display CPCB EPR registration on all passports"
                        />
                        <ReqItem
                            name="Recycling Instructions"
                            supported={true}
                            description="Display proper disposal and recycling instructions per BWM Rules 2022"
                        />
                        <ReqItem
                            name="Collection Targets"
                            supported="partial"
                            description="Schema supports tracking, reporting dashboard pending"
                        />
                    </div>
                </div>

                {/* BIS */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-blue-400" />
                        BIS Certification (IS 16046)
                    </h3>
                    <p className="text-gray-400 mb-4">
                        Bureau of Indian Standards certification is mandatory for lithium-ion
                        batteries sold in India.
                    </p>

                    <div className="grid gap-3">
                        <ReqItem
                            name="BIS R-Number Storage"
                            supported={true}
                            description="Store BIS CRS registration number at tenant level"
                        />
                        <ReqItem
                            name="BIS Mark Display"
                            supported={true}
                            description="Display BIS certification mark on public passports"
                        />
                    </div>
                </div>

                {/* Import Declaration */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-purple-400" />
                        Import Declaration (For Imported Cells)
                    </h3>
                    <p className="text-gray-400 mb-4">
                        For batches using imported cells, customs declaration details must be recorded.
                    </p>

                    <CodeBlock
                        code={`// Batch with imported cells
{
  "cell_source": "IMPORTED",
  "bill_of_entry_no": "1234567890",
  "country_of_origin": "China",
  "customs_date": "2026-01-15"
}`}
                        language="json"
                        title="Import Declaration Fields"
                    />
                </div>
            </ComplianceSection>

            {/* ============= EU COMPLIANCE ============= */}
            <ComplianceSection
                id="eu"
                icon={<Shield className="w-6 h-6 text-blue-400" />}
                title="EU Battery Regulation"
                flag="🇪🇺"
                description="Support for EU Battery Regulation 2023/1542 including digital battery passports and sustainability requirements."
            >
                {/* Digital Battery Passport */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Article 77 - Digital Battery Passport
                    </h3>
                    <p className="text-gray-400 mb-4">
                        From February 2027, all EV batteries, LMT batteries, and industrial batteries
                        over 2kWh must have a digital battery passport accessible via QR code.
                    </p>

                    <div className="grid gap-3">
                        <ReqItem
                            name="Unique Identifier (UUID)"
                            supported={true}
                            description="Each battery has a globally unique identifier"
                        />
                        <ReqItem
                            name="QR Code Access"
                            supported={true}
                            description="QR code linking to digital passport page"
                        />
                        <ReqItem
                            name="Manufacturer Information"
                            supported={true}
                            description="Company name, address, and contact details"
                        />
                        <ReqItem
                            name="Battery Specifications"
                            supported={true}
                            description="Chemistry, capacity, voltage, weight"
                        />
                    </div>
                </div>

                {/* Carbon Footprint */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-green-400" />
                        Carbon Footprint Declaration
                    </h3>
                    <p className="text-gray-400 mb-4">
                        Starting 2025, batteries must declare their carbon footprint per kWh
                        across the lifecycle.
                    </p>

                    <div className="grid gap-3">
                        <ReqItem
                            name="Carbon Footprint Field"
                            supported={true}
                            description="Store and display carbon footprint value (kg CO2e/kWh)"
                        />
                        <ReqItem
                            name="Carbon Intensity Class"
                            supported="partial"
                            description="Schema supports classification, awaiting EU thresholds"
                        />
                    </div>

                    <CodeBlock
                        code={`{
  "specs": {
    "carbon_footprint": "45 kg CO2e/kWh",
    "lifecycle_analysis": "Cradle-to-gate"
  }
}`}
                        language="json"
                        title="Carbon Footprint Data"
                    />
                </div>

                {/* Material Composition */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Recycle className="w-5 h-5 text-cyan-400" />
                        Material Composition & Recycled Content
                    </h3>
                    <p className="text-gray-400 mb-4">
                        The regulation requires disclosure of critical raw materials
                        and recycled content percentages.
                    </p>

                    <div className="grid gap-3">
                        <ReqItem
                            name="Material Composition"
                            supported={true}
                            description="Track cobalt, lithium, nickel, lead content"
                        />
                        <ReqItem
                            name="Recycled Content"
                            supported="partial"
                            description="Schema supports, thresholds effective 2031"
                        />
                        <ReqItem
                            name="Recyclability Info"
                            supported={true}
                            description="Display recyclability status and instructions"
                        />
                    </div>

                    <CodeBlock
                        code={`{
  "materials": {
    "cobalt": { "percentage": 8.5, "recycled": 12 },
    "lithium": { "percentage": 3.2, "recycled": 4 },
    "nickel": { "percentage": 25.0, "recycled": 8 },
    "lead": { "percentage": 0, "recycled": 0 }
  },
  "recyclable": true
}`}
                        language="json"
                        title="Material Composition Data"
                    />
                </div>

                {/* Due Diligence */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Due Diligence & Supply Chain
                    </h3>
                    <p className="text-gray-400 mb-4">
                        Economic operators must establish due diligence policies for
                        raw material sourcing.
                    </p>

                    <div className="grid gap-3">
                        <ReqItem
                            name="Country of Origin"
                            supported={true}
                            description="Track manufacturing and material origin"
                        />
                        <ReqItem
                            name="Supply Chain Documentation"
                            supported="partial"
                            description="Basic tracking, full chain pending"
                        />
                    </div>
                </div>
            </ComplianceSection>

            {/* Compliance Roadmap */}
            <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h2 className="text-xl font-bold text-white mb-6">Compliance Roadmap</h2>
                <div className="space-y-4">
                    {[
                        { date: '2024', event: 'Battery Waste Management Rules 2022 enforcement', status: 'Active' },
                        { date: '2025', event: 'Carbon footprint declaration mandatory (EU)', status: 'Upcoming' },
                        { date: '2026', event: 'PLI scheme Phase II targets', status: 'Upcoming' },
                        { date: '2027', event: 'Digital Battery Passport mandatory (EU)', status: 'Upcoming' },
                        { date: '2031', event: 'Recycled content minimums (EU)', status: 'Future' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                            <span className="w-16 text-indigo-400 font-bold">{item.date}</span>
                            <span className="flex-1 text-gray-300">{item.event}</span>
                            <span className={`text-xs px-2 py-1 rounded ${item.status === 'Active'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : item.status === 'Upcoming'
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                {item.status}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
