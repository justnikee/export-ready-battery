"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { Activity, ThermometerSun, Zap, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────

interface TelemetryReading {
  id: string;
  passport_id: string;
  state_of_health: number | null;
  cycle_count: number | null;
  temperature: number | null;
  voltage: number | null;
  current: number | null;
  thermal_event: boolean;
  thermal_type: string;
  recorded_at: string;
  created_at: string;
}

interface TelemetryResponse {
  readings: TelemetryReading[];
  total: number;
  limit: number;
  offset: number;
}

// ── Range Presets ────────────────────────────────────────────────────────────

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: 0 },
] as const;

// ── Formatters ───────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Mini Chart Card ──────────────────────────────────────────────────────────

function ChartCard({
  title,
  icon: Icon,
  iconColor,
  dataKey,
  unit,
  data,
  color,
  thermalEvents,
  domain,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  dataKey: string;
  unit: string;
  data: Record<string, unknown>[];
  color: string;
  thermalEvents?: { x: string; y: number }[];
  domain?: [number | string, number | string];
}) {
  const latestValue =
    data.length > 0 ? (data[data.length - 1][dataKey] as number | null) : null;
  const hasData = data.some(
    (d) => d[dataKey] !== null && d[dataKey] !== undefined,
  );

  if (!hasData) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/15 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
        </div>
        {latestValue !== null && latestValue !== undefined && (
          <span className="text-lg text-white font-mono">
            {typeof latestValue === "number"
              ? latestValue.toFixed(1)
              : latestValue}
            <span className="text-xs text-muted-foreground ml-1">{unit}</span>
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="time"
              tick={{ fill: "#71717A", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
            />
            <YAxis
              domain={domain || ["auto", "auto"]}
              tick={{ fill: "#71717A", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181B",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#E4E4E7",
              }}
              labelStyle={{ color: "#A1A1AA" }}
              formatter={(value: any) => [
                `${typeof value === "number" ? value.toFixed(2) : "—"} ${unit}`,
                title,
              ]}
              labelFormatter={(label) => `${label}`}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: color,
                stroke: "#09090B",
                strokeWidth: 2,
              }}
              connectNulls
            />
            {thermalEvents?.map((evt, i) => (
              <ReferenceDot
                key={i}
                x={evt.x}
                y={evt.y}
                r={5}
                fill="#ef4444"
                stroke="#09090B"
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

interface TelemetryChartProps {
  passportUuid: string;
  /** Optional class for wrapper */
  className?: string;
}

export function TelemetryChart({
  passportUuid,
  className,
}: TelemetryChartProps) {
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[1]); // default 30d
  const [total, setTotal] = useState(0);

  // Fetch telemetry data
  useEffect(() => {
    let cancelled = false;
    const fetchTelemetry = async () => {
      setLoading(true);
      setError(null);

      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
        const params = new URLSearchParams({ limit: "500" });

        if (range.days > 0) {
          const from = new Date();
          from.setDate(from.getDate() - range.days);
          params.set("from", from.toISOString());
        }

        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(
          `${baseUrl}/passports/${passportUuid}/telemetry?${params}`,
          { headers },
        );

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            // Unauthenticated — no telemetry available
            if (!cancelled) {
              setReadings([]);
              setTotal(0);
            }
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const data: TelemetryResponse = await res.json();
        if (!cancelled) {
          setReadings(data.readings || []);
          setTotal(data.total || 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load telemetry",
          );
          setReadings([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTelemetry();
    return () => {
      cancelled = true;
    };
  }, [passportUuid, range]);

  // Transform data for charts
  const chartData = useMemo(() => {
    if (!readings.length) return [];

    // Sort by recorded_at ascending
    const sorted = [...readings].sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );

    return sorted.map((r) => ({
      time: formatDate(r.recorded_at),
      fullTime: formatDateTime(r.recorded_at),
      soh: r.state_of_health,
      voltage: r.voltage,
      temperature: r.temperature,
      current: r.current,
      cycleCount: r.cycle_count,
      thermalEvent: r.thermal_event,
      thermalType: r.thermal_type,
    }));
  }, [readings]);

  // Thermal event markers
  const thermalMarkers = useMemo(() => {
    return chartData
      .filter((d) => d.thermalEvent && d.temperature !== null)
      .map((d) => ({ x: d.time, y: d.temperature! }));
  }, [chartData]);

  // Don't render if no data and no auth
  if (!loading && readings.length === 0 && !error) {
    return null; // Silently hide if no telemetry
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <div className="bg-linear-to-br from-[#171717]/80 to-[#262626]/60 border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/15 rounded-xl">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base text-white">BMS Telemetry</h3>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? `${total} readings` : "No readings"}
                </p>
              </div>
            </div>

            {/* Range Selector */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              {RANGES.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    range.label === r.label
                      ? "bg-blue-500/20 text-blue-400 shadow-none"
                      : "text-muted-foreground hover:text-muted-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="h-5 w-5 border-2 border-border border-t-blue-400 rounded-full animate-spin" />
                <span className="text-sm">Loading telemetry…</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Activity className="h-8 w-8 mb-3 opacity-40" />
              <span className="text-sm">
                No telemetry readings for this period
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard
                title="State of Health"
                icon={Activity}
                iconColor="bg-emerald-500/15 text-emerald-400"
                dataKey="soh"
                unit="%"
                data={chartData}
                color="#10b981"
                domain={[0, 100]}
              />
              <ChartCard
                title="Voltage"
                icon={Zap}
                iconColor="bg-amber-500/15 text-amber-400"
                dataKey="voltage"
                unit="V"
                data={chartData}
                color="#f59e0b"
              />
              <ChartCard
                title="Temperature"
                icon={ThermometerSun}
                iconColor="bg-red-500/15 text-red-400"
                dataKey="temperature"
                unit="°C"
                data={chartData}
                color="#ef4444"
                thermalEvents={thermalMarkers}
              />
              <ChartCard
                title="Current"
                icon={Zap}
                iconColor="bg-blue-500/15 text-blue-400"
                dataKey="current"
                unit="A"
                data={chartData}
                color="#3b82f6"
              />
            </div>
          )}

          {/* Thermal Events Summary */}
          {thermalMarkers.length > 0 && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">
                <span className="">
                  {thermalMarkers.length} thermal event
                  {thermalMarkers.length !== 1 ? "s" : ""}
                </span>{" "}
                detected — marked with red dots on the temperature chart
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
