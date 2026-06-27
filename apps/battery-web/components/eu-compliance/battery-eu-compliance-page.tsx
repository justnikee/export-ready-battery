"use client";

import { useState } from "react";
import { Globe, TrendingUp, Recycle, ShieldCheck, Calendar } from "lucide-react";
import OverviewTab from "@/components/eu-compliance/overview-tab";
import CarbonTab from "@/components/eu-compliance/carbon-tab";
import RecycledContentTab from "@/components/eu-compliance/recycled-content-tab";
import DueDiligenceTab from "@/components/eu-compliance/due-diligence-tab";
import DeadlinesTab from "@/components/eu-compliance/deadlines-tab";

type Tab = "overview" | "carbon" | "recycled-content" | "due-diligence" | "deadlines";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Globe },
  { id: "carbon", label: "Carbon (Art.7)", icon: TrendingUp },
  { id: "recycled-content", label: "Recycled Content (Art.8)", icon: Recycle },
  { id: "due-diligence", label: "Due Diligence (Art.11)", icon: ShieldCheck },
  { id: "deadlines", label: "Deadlines", icon: Calendar },
];

export default function EuCompliancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl text-foreground tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6 text-indigo-500" />
            EU Compliance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Carbon footprint (Art.7), recycled content (Art.8), supply chain due diligence (Art.11), and deadlines
            under EU Battery Regulation 2023/1542.
          </p>
        </div>

        <div className="flex gap-1 bg-muted p-1 flex-wrap">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-transparent text-foreground shadow-none"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "carbon" && <CarbonTab />}
        {activeTab === "recycled-content" && <RecycledContentTab />}
        {activeTab === "due-diligence" && <DueDiligenceTab />}
        {activeTab === "deadlines" && <DeadlinesTab />}
      </div>
    </div>
  );
}
