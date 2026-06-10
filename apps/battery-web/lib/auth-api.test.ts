import { describe, it, expect, vi, beforeEach } from "vitest";
import { authApi } from "./auth-api";

// Mock the api module before auth-api imports it
vi.mock("./api", () => {
  let token: string | null = null;
  return {
    default: {
      post: vi.fn(),
    },
    getAccessToken: vi.fn(() => token),
    setAccessToken: vi.fn((t: string | null) => {
      token = t;
    }),
  };
});

import api, { getAccessToken, setAccessToken } from "./api";

const mockedPost = vi.mocked(api.post);

describe("authApi.login", () => {
  beforeEach(() => {
    mockedPost.mockClear();
  });

  it("returns token data on success", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        token: "abc123",
        tenant_id: "t-1",
        email: "a@b.com",
        company_name: "Acme",
        expires_in: 3600,
      },
    });

    const result = await authApi.login("a@b.com", "secret");
    expect(result.token).toBe("abc123");
    expect(result.tenant_id).toBe("t-1");
    expect(mockedPost).toHaveBeenCalledWith("/auth/login", {
      email: "a@b.com",
      password: "secret",
    });
  });

  it("returns error with code on 401 response", async () => {
    const axiosError = {
      response: {
        data: {
          error: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        },
      },
    };
    mockedPost.mockRejectedValueOnce(axiosError);

    const result = await authApi.login("a@b.com", "wrong");
    expect(result.error).toBe("Invalid credentials");
    expect(result.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns fallback error for unexpected failures", async () => {
    mockedPost.mockRejectedValueOnce(new Error("network"));

    const result = await authApi.login("a@b.com", "secret");
    expect(result.error).toBe("An unexpected error occurred.");
  });
});

describe("authApi.register", () => {
  beforeEach(() => {
    mockedPost.mockClear();
  });

  it("returns message on success", async () => {
    mockedPost.mockResolvedValueOnce({
      data: { message: "Check your email" },
    });

    const result = await authApi.register({
      email: "a@b.com",
      password: "secret",
      company_name: "Acme",
    });
    expect(result.message).toBe("Check your email");
  });

  it("returns error on failure", async () => {
    mockedPost.mockRejectedValueOnce({
      response: { data: { error: "Email already exists" } },
    });

    const result = await authApi.register({
      email: "dup@b.com",
      password: "secret",
      company_name: "Acme",
    });
    expect(result.error).toBe("Email already exists");
  });
});

describe("authApi.logout", () => {
  const mockedSetAccessToken = vi.mocked(setAccessToken);

  beforeEach(() => {
    mockedPost.mockClear();
    mockedSetAccessToken.mockClear();
    setAccessToken("my-token");
  });

  it("calls logout endpoint when token exists", async () => {
    mockedPost.mockResolvedValueOnce({ data: {} });

    await authApi.logout();

    expect(mockedPost).toHaveBeenCalledWith(
      "/auth/logout",
      {},
      {
        headers: { Authorization: "Bearer my-token" },
      },
    );
    expect(mockedSetAccessToken).toHaveBeenCalledWith(null);
    expect(getAccessToken()).toBeNull();
  });

  it("still clears local state when server logout fails", async () => {
    mockedPost.mockRejectedValueOnce(new Error("server down"));

    await authApi.logout();

    expect(mockedSetAccessToken).toHaveBeenCalledWith(null);
    expect(getAccessToken()).toBeNull();
  });
});
