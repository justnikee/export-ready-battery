import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ComponentsTab } from "./ComponentsTab";

const mockGet = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/api", () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("ComponentsTab", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockDelete.mockReset();
  });

  it("renders loading state initially", () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ComponentsTab batchId="batch-1" isDraft />);
    expect(screen.getByText("Loading components...")).toBeTruthy();
  });

  it("renders empty state when no components", async () => {
    mockGet.mockResolvedValue({ data: { tree: [] } });
    render(<ComponentsTab batchId="batch-1" isDraft />);
    await waitFor(() => {
      expect(screen.getByText("No components defined for this batch.")).toBeTruthy();
    });
  });

  it("renders component tree and allows selection", async () => {
    mockGet.mockResolvedValue({
      data: {
        tree: [
          {
            id: "comp-1",
            component_type: "pack",
            name: "Main Pack",
            manufacturer: "Amara Raja",
            weight_kg: 25.5,
            children: [],
          },
        ],
      },
    });
    render(<ComponentsTab batchId="batch-1" isDraft />);
    await waitFor(() => {
      expect(screen.getByText("Main Pack")).toBeTruthy();
    });
    fireEvent.click(screen.getByText("Main Pack"));
    // Weight appears in both tree and detail panel — use getAllByText
    expect(screen.getAllByText("25.5 kg").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Amara Raja").length).toBeGreaterThanOrEqual(1);
  });

  it("opens add dialog when Add Component clicked", async () => {
    mockGet.mockResolvedValue({ data: { tree: [] } });
    render(<ComponentsTab batchId="batch-1" isDraft />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Add Component/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: /Add Component/i }));
    expect(screen.getByRole("heading", { name: "Add Component" })).toBeTruthy();
  });

  it("hides add button when not draft", async () => {
    mockGet.mockResolvedValue({ data: { tree: [] } });
    render(<ComponentsTab batchId="batch-1" isDraft={false} />);
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Add Component/i })).toBeNull();
    });
  });

  it("deletes component after confirm", async () => {
    mockGet.mockResolvedValue({
      data: {
        tree: [
          {
            id: "comp-1",
            component_type: "pack",
            name: "Main Pack",
            children: [],
          },
        ],
      },
    });
    mockDelete.mockResolvedValue({});
    render(<ComponentsTab batchId="batch-1" isDraft />);
    await waitFor(() => {
      expect(screen.getByText("Main Pack")).toBeTruthy();
    });
    fireEvent.click(screen.getByText("Main Pack"));
    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Delete Component?" })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: /Delete$/i }));
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("/api/v1/components/comp-1");
    });
  });
});
