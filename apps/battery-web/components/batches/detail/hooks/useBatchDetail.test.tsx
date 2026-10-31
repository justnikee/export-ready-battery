import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import api from "@/lib/api";
import { useBatchDetail } from "./useBatchDetail";

vi.mock("@/lib/api", () => ({ default: { get: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({ user: null, refreshUser: vi.fn() }),
}));

describe("batch detail initial load", () => {
  it("requests compliance once while loading the batch", async () => {
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (String(url).endsWith("/compliance")) return { data: { compliance_score: 90, compliance_gaps: [] } };
      if (String(url).endsWith("/anchors")) return { data: { anchors: [] } };
      if (String(url).includes("/passports?")) return { data: { passports: [], page: 1, limit: 50, total: 0 } };
      return { data: { batch: { id: "batch-1", status: "DRAFT", market_region: "INDIA", specs: {} }, passport_count: 0 } };
    });
    const { unmount } = renderHook(() => useBatchDetail("batch-1", "/dashboard/batches/batch-1"));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/batches/batch-1/compliance"));
    expect(vi.mocked(api.get).mock.calls.filter(([url]) => String(url).endsWith("/compliance"))).toHaveLength(1);
    unmount();
  });
});
