import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TextileOnboardingPage } from "./textile-onboarding-page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  usePathname: () => "/textile/onboarding",
}));

vi.mock("@/context/auth-context", () => {
  const user = {
    id: "u1",
    tenant_id: "t1",
    email: "test@example.com",
    company_name: "Test Textile Co",
    product_type: "TEXTILE",
    onboarding_completed: false,
  };
  return {
    useAuth: () => ({ user, refreshUser: vi.fn(), updateUser: vi.fn() }),
  };
});

vi.mock("@/lib/api", () => ({
  default: {
    put: vi.fn().mockResolvedValue({ data: { onboarding_completed: true } }),
  },
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: function MotionDiv(props: any) {
      return props.children || null;
    },
  },
  AnimatePresence: function AnimatePresence(props: any) {
    return props.children || null;
  },
}));

describe("TextileOnboardingPage flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders step 1 by default", () => {
    render(<TextileOnboardingPage />);
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    expect(screen.getByText("Organization Profile")).toBeInTheDocument();
  });

  it("disables Next on step 1 when required fields are empty", () => {
    render(<TextileOnboardingPage />);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("navigates through steps with Next and Back", async () => {
    render(<TextileOnboardingPage />);

    // Fill step 1 required fields
    fireEvent.change(
      screen.getByPlaceholderText(
        "Registered office or primary manufacturing site",
      ),
      { target: { value: "123 Test St" } },
    );
    fireEvent.change(screen.getByPlaceholderText("ops@company.com"), {
      target: { value: "support@test.com" },
    });

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
      expect(screen.getByText("Supply Chain Setup")).toBeInTheDocument();
    });

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
      expect(screen.getByText("Product Data Readiness")).toBeInTheDocument();
    });

    // Step 3 -> Step 4 (review)
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /complete setup/i }),
      ).toBeInTheDocument();
    });

    // Back to Step 3
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() => {
      expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
    });

    // Back to Step 2
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() => {
      expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    });
  });

  it("completes onboarding and submits profile", async () => {
    const { default: api } = await import("@/lib/api");
    render(<TextileOnboardingPage />);

    // Fill step 1
    fireEvent.change(
      screen.getByPlaceholderText(
        "Registered office or primary manufacturing site",
      ),
      { target: { value: "123 Test St" } },
    );
    fireEvent.change(screen.getByPlaceholderText("ops@company.com"), {
      target: { value: "support@test.com" },
    });

    // Advance to step 4
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /complete setup/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /complete setup/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/auth/profile",
        expect.objectContaining({
          company_name: "Test Textile Co",
          address: "123 Test St",
          support_email: "support@test.com",
        }),
      );
    });
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });
});
