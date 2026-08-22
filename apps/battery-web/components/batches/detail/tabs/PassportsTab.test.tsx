import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PassportsTab } from "./PassportsTab";
import type { Passport } from "@/lib/types";

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      tenant_id: "tenant-1",
      email: "test@example.com",
      company_name: "Acme Battery Co",
      role: "ADMIN",
    },
  }),
}));

const mockPassports: Passport[] = [
  {
    uuid: "p1",
    serial_number: "SN001",
    batch_id: "batch-123",
    manufacture_date: "2024-01-01",
    created_at: "2024-01-01",
    status: "ACTIVE",
  },
  {
    uuid: "p2",
    serial_number: "SN002",
    batch_id: "batch-123",
    manufacture_date: "2024-01-01",
    created_at: "2024-01-01",
    status: "ACTIVE",
  },
];

const defaultProps = {
  batchId: "batch-123",
  passports: mockPassports,
  passportCount: 2,
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
    hasMore: false,
  },
  region: "INDIA" as const,
  chemistry: "LFP",
  morthCode: "ABC",
  isDraft: false,
  onPageChange: vi.fn(),
  onUploadComplete: vi.fn(),
};

describe("PassportsTab", () => {
  it("renders passport count", () => {
    render(<PassportsTab {...defaultProps} />);
    expect(screen.getByText("Passports")).toBeInTheDocument();
    expect(screen.getByText(/Showing 1–2 of 2/)).toBeInTheDocument();
  });

  it("shows empty state when no passports", () => {
    render(
      <PassportsTab
        {...defaultProps}
        passports={[]}
        passportCount={0}
        pagination={{ ...defaultProps.pagination, total: 0, totalPages: 0 }}
      />,
    );
    expect(screen.getByText("No passports created yet")).toBeInTheDocument();
    expect(screen.getByText(/Create passports for this batch/)).toBeInTheDocument();
  });

  it("shows draft warning when batch is draft", () => {
    render(
      <PassportsTab
        {...defaultProps}
        passports={[]}
        passportCount={0}
        isDraft={true}
        pagination={{ ...defaultProps.pagination, total: 0, totalPages: 0 }}
      />,
    );
    expect(screen.getByText(/Draft Batch - Passports Ready for Creation/)).toBeInTheDocument();
  });

  it("filters passports by search query", () => {
    render(<PassportsTab {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("Search serial number...");
    fireEvent.change(searchInput, { target: { value: "SN001" } });
    expect(screen.getByText("SN001")).toBeInTheDocument();
  });

  it("toggles creation tools when button clicked", () => {
    render(<PassportsTab {...defaultProps} />);
    const toggleBtn = screen.getByRole("button", { name: /Create Passports/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByRole("button", { name: /Hide Tools/i })).toBeInTheDocument();
  });
});
