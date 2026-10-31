import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import api from "@/lib/api";
import { UploadCSV } from "./upload-csv";

vi.mock("@/lib/api", () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

afterEach(() => vi.clearAllMocks());

function openGenerator(props: Partial<React.ComponentProps<typeof UploadCSV>> = {}) {
  render(<UploadCSV batchId="batch-1" marketRegion="INDIA" isDraft onUploadComplete={vi.fn()} {...props} />);
  fireEvent.click(screen.getByRole("button", { name: /Auto-Generate/i }));
}

describe("batch passport generator", () => {
  it("allows industrial India batches without MoRTH and sends only server-owned serial inputs", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { passports_created: 2, serial_range: "IN-ABC-LFP-1 to IN-ABC-LFP-2" } });
    openGenerator({ batteryCategory: "INDUSTRIAL", defaultQuantity: "2" });
    expect(screen.getByRole("button", { name: "Generate Passports" })).toBeEnabled();
    expect(screen.queryByText(/MoRTH manufacturer code is missing/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Serial Prefix")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Start Number")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Generate Passports" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/batches/batch-1/auto-generate", {
      count: 2,
      manufacture_date: expect.any(String),
    }));
    expect(await screen.findByText("IN-ABC-LFP-1 to IN-ABC-LFP-2")).toBeInTheDocument();
  });

  it("warns on missing traction MoRTH without blocking draft generation", () => {
    openGenerator({ batteryCategory: "EV", morthCode: "TBC" });
    expect(screen.getByText(/MoRTH manufacturer code is missing/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate Passports" })).toBeEnabled();
  });
});
