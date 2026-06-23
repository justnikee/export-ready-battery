import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";

// Phase D — Desktop Print Station
import PrintStation from "@/pages/PrintStation";
import CsvImport from "@/pages/CsvImport";

// Placeholder pages — Phase 4 ports
import Analytics from "@/pages/Analytics";
import Batches from "@/pages/Batches";
import BatchDetail from "@/pages/BatchDetail";
import Lifecycle from "@/pages/Lifecycle";
import Templates from "@/pages/Templates";
import Compliance from "@/pages/Compliance";
import Exports from "@/pages/Exports";
import Team from "@/pages/Team";
import Partners from "@/pages/Partners";
import Billing from "@/pages/Billing";
import Settings from "@/pages/Settings";
import Developer from "@/pages/Developer";
import Dispatch from "@/pages/Dispatch";
import Rewards from "@/pages/Rewards";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Login />} />

      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/analytics" element={<Analytics />} />
        <Route path="/dashboard/batches" element={<Batches />} />
        <Route path="/dashboard/batches/:id" element={<BatchDetail />} />
        <Route path="/dashboard/dispatch" element={<Dispatch />} />
        <Route path="/dashboard/lifecycle" element={<Lifecycle />} />
        <Route path="/dashboard/templates" element={<Templates />} />
        <Route path="/dashboard/compliance" element={<Compliance />} />
        <Route path="/dashboard/exports" element={<Exports />} />
        <Route path="/dashboard/team" element={<Team />} />
        <Route path="/dashboard/partners" element={<Partners />} />
        <Route path="/dashboard/billing" element={<Billing />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/dashboard/developer" element={<Developer />} />
        <Route path="/dashboard/rewards" element={<Rewards />} />
        <Route path="/dashboard/print-station" element={<PrintStation />} />
        <Route path="/dashboard/print-station/csv-import" element={<CsvImport />} />
      </Route>
    </Routes>
  );
}

export default App;
