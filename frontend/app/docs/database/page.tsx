'use client';

import { motion } from 'framer-motion';
import { CodeBlock } from '@/components/docs';
import {
    Database,
    Table,
    Key,
    Link2,
    Clock,
    FileText
} from 'lucide-react';

// Table Documentation
function TableDoc({
    name,
    description,
    columns
}: {
    name: string;
    description: string;
    columns: { name: string; type: string; nullable: boolean; description: string }[];
}) {
    return (
        <div className="p-6 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 mb-2">
                <Table className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white font-mono">{name}</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">{description}</p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-2 px-3 text-gray-500 font-medium">Column</th>
                            <th className="text-left py-2 px-3 text-gray-500 font-medium">Type</th>
                            <th className="text-left py-2 px-3 text-gray-500 font-medium">Nullable</th>
                            <th className="text-left py-2 px-3 text-gray-500 font-medium">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {columns.map((col) => (
                            <tr key={col.name} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-2 px-3 font-mono text-indigo-400">{col.name}</td>
                                <td className="py-2 px-3 font-mono text-amber-400">{col.type}</td>
                                <td className="py-2 px-3">
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${col.nullable ? 'bg-gray-500/20 text-gray-400' : 'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                        {col.nullable ? 'NULL' : 'NOT NULL'}
                                    </span>
                                </td>
                                <td className="py-2 px-3 text-gray-400">{col.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function DatabasePage() {
    return (
        <div className="space-y-12">
            {/* Header */}
            <section>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                      bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm mb-4">
                    <Database className="w-3.5 h-3.5" />
                    <span>Database Schema</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Database Documentation
                </h1>

                <p className="text-lg text-gray-400 max-w-2xl">
                    Complete database schema reference for ExportReady-Battery.
                    The database is PostgreSQL hosted on Supabase.
                </p>
            </section>

            {/* Entity Relationship Diagram */}
            <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-indigo-400" />
                    Entity Relationships
                </h2>
                <div className="p-4 rounded-lg bg-black/30 font-mono text-sm text-gray-300 overflow-x-auto">
                    <pre>{`
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   TENANTS    │       │   BATCHES    │       │  PASSPORTS   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │──┐    │ uuid (PK)    │
│ company_name │  │    │ tenant_id(FK)│◄─┘    │ batch_id(FK) │◄─┐
│ email (UK)   │  │    │ batch_name   │       │ serial_number│  │
│ password_hash│  └───►│ specs (JSONB)│       │ manufacture_ │  │
│ epr_number   │       │ market_region│       │   date       │  │
│ bis_r_number │       │ pli_compliant│       │ status       │  │
│ iec_code     │       │ domestic_va  │       │ created_at   │  │
│ created_at   │       │ created_at   │       └──────────────┘  │
└──────────────┘       └──────────────┘                         │
                                                                │
┌──────────────┐       ┌──────────────┐                         │
│  TEMPLATES   │       │ SCAN_EVENTS  │                         │
├──────────────┤       ├──────────────┤                         │
│ id (PK)      │       │ id (PK)      │                         │
│ tenant_id(FK)│       │ passport_id  │─────────────────────────┘
│ name         │       │   (FK)       │
│ specs (JSONB)│       │ ip_address   │
│ created_at   │       │ city         │
└──────────────┘       │ country      │
                       │ device_type  │
                       │ scanned_at   │
                       └──────────────┘
          `}</pre>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                    PK = Primary Key, FK = Foreign Key, UK = Unique Key
                </p>
            </section>

            {/* Tables Documentation */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Table className="w-6 h-6 text-emerald-400" />
                    Table Specifications
                </h2>

                <TableDoc
                    name="tenants"
                    description="Stores company/organization information for multi-tenant support"
                    columns={[
                        { name: 'id', type: 'UUID', nullable: false, description: 'Primary key, auto-generated' },
                        { name: 'company_name', type: 'VARCHAR(255)', nullable: false, description: 'Company display name' },
                        { name: 'email', type: 'VARCHAR(255)', nullable: false, description: 'Unique login email' },
                        { name: 'password_hash', type: 'VARCHAR(255)', nullable: false, description: 'bcrypt hashed password' },
                        { name: 'address', type: 'TEXT', nullable: true, description: 'Company address' },
                        { name: 'logo_url', type: 'VARCHAR(500)', nullable: true, description: 'Company logo URL' },
                        { name: 'support_email', type: 'VARCHAR(255)', nullable: true, description: 'Support contact email' },
                        { name: 'website', type: 'VARCHAR(255)', nullable: true, description: 'Company website' },
                        { name: 'epr_registration_number', type: 'VARCHAR(100)', nullable: true, description: 'CPCB EPR registration' },
                        { name: 'bis_r_number', type: 'VARCHAR(50)', nullable: true, description: 'BIS CRS R-number' },
                        { name: 'iec_code', type: 'VARCHAR(20)', nullable: true, description: 'Import Export Code' },
                        { name: 'reset_token', type: 'VARCHAR(255)', nullable: true, description: 'Password reset token' },
                        { name: 'reset_token_expires', type: 'TIMESTAMPTZ', nullable: true, description: 'Token expiry time' },
                        { name: 'quota_balance', type: 'INT', nullable: false, description: 'Passport quota remaining' },
                        { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Account creation time' },
                    ]}
                />

                <TableDoc
                    name="batches"
                    description="Production batches containing battery specifications"
                    columns={[
                        { name: 'id', type: 'UUID', nullable: false, description: 'Primary key' },
                        { name: 'tenant_id', type: 'UUID', nullable: false, description: 'FK to tenants.id' },
                        { name: 'batch_name', type: 'VARCHAR(100)', nullable: false, description: 'User-defined name' },
                        { name: 'specs', type: 'JSONB', nullable: false, description: 'Battery specifications' },
                        { name: 'market_region', type: 'VARCHAR(20)', nullable: false, description: 'INDIA, EU, or GLOBAL' },
                        { name: 'pli_compliant', type: 'BOOLEAN', nullable: true, description: 'PLI eligibility (India)' },
                        { name: 'domestic_value_add', type: 'DECIMAL(5,2)', nullable: true, description: 'DVA percentage' },
                        { name: 'cell_source', type: 'VARCHAR(20)', nullable: true, description: 'IMPORTED or DOMESTIC' },
                        { name: 'bill_of_entry_no', type: 'VARCHAR(50)', nullable: true, description: 'Customs entry no.' },
                        { name: 'country_of_origin', type: 'VARCHAR(100)', nullable: true, description: 'Cell origin country' },
                        { name: 'customs_date', type: 'DATE', nullable: true, description: 'Customs clearance date' },
                        { name: 'deleted_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Soft delete timestamp' },
                        { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Batch creation time' },
                    ]}
                />

                <TableDoc
                    name="passports"
                    description="Individual battery passports with unique identifiers"
                    columns={[
                        { name: 'uuid', type: 'UUID', nullable: false, description: 'Primary key, passport ID' },
                        { name: 'batch_id', type: 'UUID', nullable: false, description: 'FK to batches.id' },
                        { name: 'serial_number', type: 'VARCHAR(100)', nullable: false, description: 'Battery serial no.' },
                        { name: 'manufacture_date', type: 'DATE', nullable: false, description: 'Manufacturing date' },
                        { name: 'status', type: 'VARCHAR(50)', nullable: false, description: 'ACTIVE, RECALLED, etc.' },
                        { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Creation timestamp' },
                    ]}
                />

                <TableDoc
                    name="templates"
                    description="Reusable battery specification templates"
                    columns={[
                        { name: 'id', type: 'UUID', nullable: false, description: 'Primary key' },
                        { name: 'tenant_id', type: 'UUID', nullable: false, description: 'FK to tenants.id' },
                        { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'Template name' },
                        { name: 'specs', type: 'JSONB', nullable: false, description: 'Saved specifications' },
                        { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Creation timestamp' },
                    ]}
                />

                <TableDoc
                    name="scan_events"
                    description="QR code scan tracking with geolocation"
                    columns={[
                        { name: 'id', type: 'UUID', nullable: false, description: 'Primary key' },
                        { name: 'passport_id', type: 'UUID', nullable: false, description: 'FK to passports.uuid' },
                        { name: 'ip_address', type: 'VARCHAR(45)', nullable: true, description: 'Scanner IP address' },
                        { name: 'city', type: 'VARCHAR(100)', nullable: true, description: 'Geolocated city' },
                        { name: 'country', type: 'VARCHAR(100)', nullable: true, description: 'Geolocated country' },
                        { name: 'device_type', type: 'VARCHAR(50)', nullable: true, description: 'Mobile/Desktop' },
                        { name: 'user_agent', type: 'TEXT', nullable: true, description: 'Browser user agent' },
                        { name: 'scanned_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Scan timestamp' },
                    ]}
                />

                <TableDoc
                    name="quota_transactions"
                    description="Quota purchase and usage history"
                    columns={[
                        { name: 'id', type: 'UUID', nullable: false, description: 'Primary key' },
                        { name: 'tenant_id', type: 'UUID', nullable: false, description: 'FK to tenants.id' },
                        { name: 'type', type: 'VARCHAR(20)', nullable: false, description: 'PURCHASE or USAGE' },
                        { name: 'amount', type: 'INT', nullable: false, description: 'Quota amount (+/-)' },
                        { name: 'balance_after', type: 'INT', nullable: false, description: 'Balance after txn' },
                        { name: 'razorpay_order_id', type: 'VARCHAR(100)', nullable: true, description: 'Razorpay order' },
                        { name: 'razorpay_payment_id', type: 'VARCHAR(100)', nullable: true, description: 'Razorpay payment' },
                        { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Transaction time' },
                    ]}
                />
            </section>

            {/* JSONB Specs Schema */}
            <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    JSONB Schema: specs
                </h2>
                <p className="text-gray-400 mb-4">
                    The <code className="text-indigo-400">specs</code> column stores battery specifications as JSONB:
                </p>
                <CodeBlock
                    code={`{
  "chemistry": "Li-ion NMC",
  "voltage": "48V",
  "capacity": "100Ah",
  "manufacturer": "Acme Batteries",
  "manufacturer_address": "Industrial Area, Delhi",
  "weight": "45kg",
  "carbon_footprint": "45 kg CO2e/kWh",
  "country_of_origin": "India",
  "recyclable": true,
  
  // EU-specific fields
  "materials": {
    "cobalt": { "percentage": 8.5, "recycled": 12 },
    "lithium": { "percentage": 3.2, "recycled": 4 },
    "nickel": { "percentage": 25.0, "recycled": 8 }
  },
  "certifications": ["CE", "UN38.3"],
  "eu_representative": "EU Rep GmbH",
  "eu_representative_email": "contact@eurep.eu"
}`}
                    language="json"
                    title="BatchSpec JSONB Structure"
                />
            </section>

            {/* Indexes */}
            <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-amber-400" />
                    Indexes
                </h2>
                <CodeBlock
                    code={`-- Performance indexes
CREATE INDEX idx_batches_tenant_id ON batches(tenant_id);
CREATE INDEX idx_passports_batch_id ON passports(batch_id);
CREATE INDEX idx_passports_serial_number ON passports(serial_number);
CREATE INDEX idx_passports_status ON passports(status);
CREATE INDEX idx_scan_events_passport_id ON scan_events(passport_id);
CREATE INDEX idx_scan_events_scanned_at ON scan_events(scanned_at);

-- Unique constraints
CREATE UNIQUE INDEX idx_tenants_email ON tenants(email);
CREATE UNIQUE INDEX idx_passports_batch_serial 
  ON passports(batch_id, serial_number);

-- Password reset lookup
CREATE INDEX idx_tenants_reset_token ON tenants(reset_token) 
  WHERE reset_token IS NOT NULL;`}
                    language="sql"
                    title="Database Indexes"
                />
            </section>

            {/* Migrations */}
            <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    Migration History
                </h2>
                <div className="space-y-2">
                    {[
                        { version: '000001', name: 'initial_schema', desc: 'Core tables: tenants, batches, passports' },
                        { version: '000002', name: 'create_batch_templates', desc: 'Templates table for saved specs' },
                        { version: '000003', name: 'create_scan_events', desc: 'QR scan tracking table' },
                        { version: '000004', name: 'add_dual_mode', desc: 'Market region, PLI, DVA fields' },
                        { version: '000005', name: 'add_tenant_details', desc: 'Profile fields (address, website)' },
                        { version: '000006', name: 'add_soft_delete_batches', desc: 'deleted_at for soft delete' },
                        { version: '000007', name: 'add_india_compliance', desc: 'EPR, BIS, IEC, customs fields' },
                        { version: '000008', name: 'add_quota_system', desc: 'Quota balance and transactions' },
                        { version: '000009', name: 'add_password_reset', desc: 'Reset token fields' },
                    ].map((m) => (
                        <div key={m.version} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                            <span className="font-mono text-indigo-400 w-20">{m.version}</span>
                            <span className="font-mono text-emerald-400 flex-1">{m.name}</span>
                            <span className="text-gray-500 text-sm">{m.desc}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
