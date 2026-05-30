'use client';

import {
  Beaker,
  Leaf,
  Recycle,
  Globe,
  FileCheck,
  Languages,
  ShieldCheck,
  BarChart3,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RoadmapItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  deadline: string;
  status: 'in-dev' | 'planned' | 'future';
}

const items: RoadmapItem[] = [
  {
    icon: <Beaker className="h-5 w-5 text-amber-500" />,
    title: 'Chemical Compliance (REACH)',
    description: 'SVHC screening, SCIP notifications, restricted substance tracking',
    deadline: '2026 Q4',
    status: 'planned',
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-blue-500" />,
    title: 'Ecodesign Scoring',
    description: 'Robustness, recyclability, and recycled content scores per JRC Milestone 3',
    deadline: '2027 Q1',
    status: 'planned',
  },
  {
    icon: <Leaf className="h-5 w-5 text-emerald-500" />,
    title: 'Environmental Footprint',
    description: 'Carbon, water, energy, and microplastic shedding data per PEFCR Apparel',
    deadline: '2027 Q1',
    status: 'planned',
  },
  {
    icon: <Recycle className="h-5 w-5 text-teal-500" />,
    title: 'EPR & End-of-Life',
    description: 'PRO registration, eco-modulation fees, recycling instructions, take-back schemes',
    deadline: '2027 Q2',
    status: 'future',
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-rose-500" />,
    title: 'CSDDD Due Diligence',
    description: 'OECD-aligned risk assessments, supplier audits, corrective action tracking',
    deadline: '2027 Q3',
    status: 'future',
  },
  {
    icon: <FileCheck className="h-5 w-5 text-violet-500" />,
    title: 'Declaration of Conformity',
    description: 'EU DoC generation, digital signatures, compliance attestation',
    deadline: '2027 Q2',
    status: 'future',
  },
  {
    icon: <Globe className="h-5 w-5 text-sky-500" />,
    title: 'EU DPP Registry (EREVS)',
    description: 'UPI submission, data access point registration, 10-year retention tracking',
    deadline: '2027 Q2',
    status: 'future',
  },
  {
    icon: <Languages className="h-5 w-5 text-pink-500" />,
    title: 'Multi-Language DPP',
    description: 'Localized product names, care instructions, and safety warnings in 24 EU languages',
    deadline: '2027 Q3',
    status: 'future',
  },
];

const statusLabels = {
  'in-dev': 'In Development',
  planned: 'Planned',
  future: 'Future',
};

const statusColors = {
  'in-dev': 'bg-green-100 text-green-700 border-green-200',
  planned: 'bg-amber-100 text-amber-700 border-amber-200',
  future: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function RegulatoryRoadmap() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Regulatory Roadmap
          </CardTitle>
          <Badge variant="outline" className="text-xs font-normal">
            EU ESPR / REACH / EPR / CSDDD
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          These modules will unlock as EU delegated acts are finalized. Your core
          product passport, material composition, and supply chain data are ready
          today.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-1.5 rounded-md bg-muted">{item.icon}</div>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[item.status]}`}
                >
                  {statusLabels[item.status]}
                </Badge>
              </div>
              <h4 className="text-sm font-medium mb-1">{item.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {item.description}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                Expected: {item.deadline}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
