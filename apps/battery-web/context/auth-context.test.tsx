import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth-context";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/product-session", () => ({
  syncProductCookies: vi.fn(),
  clearProductCookies: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  refreshAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
}));

vi.mock("@/lib/auth-api", () => ({
  authApi: {
    logout: vi.fn(),
  },
}));

import api, { refreshAccessToken, setAccessToken } from "@/lib/api";
import { authApi } from "@/lib/auth-api";

const mockedApiGet = vi.mocked(api.get);
const mockedAuthApiLogout = vi.mocked(authApi.logout);
const mockedRefreshAccessToken = vi.mocked(refreshAccessToken);
const mockedSetAccessToken = vi.mocked(setAccessToken);

function TestConsumer() {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? "loading" : "ready"}</div>
      <div data-testid="user">{user ? user.email : "null"}</div>
      <button
        onClick={() =>
          login("token123", {
            id: "u1",
            tenant_id: "t1",
            email: "test@example.com",
            company_name: "Acme",
            product_type: "BATTERY",
            onboarding_completed: true,
          })
        }
      >
        Login
      </button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = "";
  });

  it("initializes with no user when there is no valid refresh session", async () => {
    mockedRefreshAccessToken.mockResolvedValueOnce(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("null");
    expect(mockedApiGet).not.toHaveBeenCalled();
  });

  it("restores session via silent refresh on mount", async () => {
    mockedRefreshAccessToken.mockResolvedValueOnce("existing-token");
    mockedApiGet.mockResolvedValueOnce({
      data: {
        id: "u1",
        tenant_id: "t1",
        email: "restored@example.com",
        company_name: "Restored Co",
        product_type: "TEXTILE",
        onboarding_completed: true,
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(
        "restored@example.com",
      );
    });
    expect(mockedApiGet).toHaveBeenCalledWith("/auth/me");
  });

  it("logs in and navigates to dashboard", async () => {
    mockedRefreshAccessToken.mockResolvedValueOnce(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });

    mockedApiGet.mockResolvedValueOnce({
      data: {
        id: "u1",
        tenant_id: "t1",
        email: "test@example.com",
        company_name: "Acme",
        product_type: "BATTERY",
        onboarding_completed: true,
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
    });

    expect(mockedSetAccessToken).toHaveBeenCalledWith("token123");
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("logs out and clears state", async () => {
    mockedRefreshAccessToken.mockResolvedValueOnce("existing-token");
    mockedApiGet.mockResolvedValueOnce({
      data: {
        id: "u1",
        tenant_id: "t1",
        email: "logged@example.com",
        company_name: "Acme",
        product_type: "BATTERY",
        onboarding_completed: true,
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(
        "logged@example.com",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("null");
    });

    expect(mockedAuthApiLogout).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
