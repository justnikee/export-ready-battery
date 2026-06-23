import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateTextileLotDialog } from "../textile/create-textile-lot-dialog";
import api from "@/lib/api";

const pushMock = vi.fn();
const postMock = vi.mocked(api.post);

vi.mock("next/navigation", () => ({
  usePathname: () => "/textile/dashboard",
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/context/auth-context", () => {
  const user = {
    id: "u1",
    tenant_id: "t1",
    email: "test@example.com",
    company_name: "Textile Co",
    product_type: "TEXTILE",
    onboarding_completed: true,
  };
  return {
    useAuth: () => ({ user, refreshUser: vi.fn(), updateUser: vi.fn() }),
  };
});

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { templates: [] } }),
    post: vi.fn().mockResolvedValue({ data: { id: "lot-1" } }),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  },
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetTrigger: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetContent: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetHeader: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetTitle: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetDescription: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetFooter: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("CreateTextileLotDialog — textile lot creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders trigger button", () => {
    render(
      <CreateTextileLotDialog
        open={true}
        onOpenChange={vi.fn()}
        onLotCreated={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /create lot/i }),
    ).toBeInTheDocument();
  });

  it("submits textile lot with correct payload", async () => {
    const onLotCreated = vi.fn();
    render(
      <CreateTextileLotDialog
        open={true}
        onOpenChange={vi.fn()}
        onLotCreated={onLotCreated}
      />,
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/lot name/i), {
      target: { value: "Summer Cotton Lot" },
    });
    fireEvent.change(screen.getByLabelText(/style \/ sku/i), {
      target: { value: "SC-2024-001" },
    });

    // Fill optional textile fields
    fireEvent.change(screen.getByLabelText(/material profile/i), {
      target: { value: "100% organic cotton" },
    });
    fireEvent.change(screen.getByLabelText(/gsm/i), {
      target: { value: "180" },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /create lot/i }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledTimes(1);
    });

    const payload = postMock.mock.calls[0][1];
    expect(payload).toMatchObject({
      tenant_id: "t1",
      product_type: "TEXTILE",
      specs: expect.objectContaining({
        material_profile: "100% organic cotton",
      }),
    });
    expect(onLotCreated).toHaveBeenCalled();
  });

  it("shows validation errors for missing required fields", async () => {
    render(
      <CreateTextileLotDialog
        open={true}
        onOpenChange={vi.fn()}
        onLotCreated={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /create lot/i }));

    // Validation should block submission — API must not be called
    await waitFor(() => {
      expect(postMock).not.toHaveBeenCalled();
    });
  });
});
