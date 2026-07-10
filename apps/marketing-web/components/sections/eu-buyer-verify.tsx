"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Search, Loader2 } from "lucide-react";

interface PublicPassportView {
  serial_number: string;
  status: string;
  market_region: string;
  battery_passport_id?: string;
  ce_marking?: boolean;
  carbon_performance_class?: string;
  manufacture_date?: string;
}

// Accepts either a bare UUID or a full passport URL (https://.../p/<uuid>) so
// a buyer can paste the QR code's scanned link directly.
function extractPassportUUID(input: string): string | null {
  const trimmed = input.trim();
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = trimmed.match(uuidPattern);
  return match ? match[0] : null;
}

export default function EUBuyerVerify() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicPassportView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const uuid = extractPassportUUID(input);
    if (!uuid) {
      setError("Paste a passport URL or UUID from a QR code scan.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/passports/${uuid}`,
      );
      if (!res.ok) {
        setError("No passport found for that link — check the QR code or URL.");
        return;
      }
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Couldn't reach the verification service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="verify" className="py-[72px]">
      <div className="max-w-[640px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif text-[clamp(24px,3vw,32px)] font-semibold leading-[1.1] tracking-[-0.02em] text-crew-ink text-center">
            Verify a battery passport
          </h2>
          <p className="mt-3 text-[15px] leading-[1.6] text-[#131313] text-center">
            Paste a passport link from a supplier's QR code to check its live compliance status.
          </p>

          <form onSubmit={handleVerify} className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://app.anviora.com/p/... or a passport UUID"
              className="flex-1 px-4 py-2.5 rounded-lg border border-crew-border bg-white text-sm text-crew-ink placeholder:text-crew-muted focus:outline-none focus:ring-2 focus:ring-crew-coral/20 focus:border-crew-coral"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 h-[44px] px-5 rounded-full text-[14px] font-semibold text-white bg-crew-coral hover:bg-crew-coral-light transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              Verify
            </button>
          </form>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
              <XCircle size={16} />
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 p-5 rounded-2xl bg-paper">
              <div className="flex items-center gap-2 text-crew-green">
                <CheckCircle size={18} />
                <span className="font-semibold text-sm">Passport verified</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-crew-muted text-xs">Serial Number</div>
                  <div className="font-semibold text-crew-ink">{result.serial_number}</div>
                </div>
                <div>
                  <div className="text-crew-muted text-xs">Status</div>
                  <div className="font-semibold text-crew-ink">{result.status}</div>
                </div>
                <div>
                  <div className="text-crew-muted text-xs">Market Region</div>
                  <div className="font-semibold text-crew-ink">{result.market_region}</div>
                </div>
                <div>
                  <div className="text-crew-muted text-xs">CE Marking</div>
                  <div className="font-semibold text-crew-ink">
                    {result.ce_marking ? "Yes" : "Not marked"}
                  </div>
                </div>
                {result.carbon_performance_class && (
                  <div>
                    <div className="text-crew-muted text-xs">Carbon Class</div>
                    <div className="font-semibold text-crew-ink">{result.carbon_performance_class}</div>
                  </div>
                )}
                {result.battery_passport_id && (
                  <div>
                    <div className="text-crew-muted text-xs">Battery Passport ID</div>
                    <div className="font-semibold text-crew-ink truncate">{result.battery_passport_id}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
