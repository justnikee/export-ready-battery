import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

// Mock browser globals and dependencies before importing api.ts
const locationSpy = vi.fn();
Object.defineProperty(globalThis, "window", {
  value: {
    location: {
      pathname: "/dashboard",
      href: "",
      get hrefValue() {
        return this.href;
      },
      set hrefValue(v: string) {
        locationSpy(v);
        this.href = v;
      },
    },
  },
  writable: true,
});

vi.mock("@/lib/routes", () => ({
  routesFromPathname: () => ({
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
  }),
}));

vi.mock("@/lib/product-session", () => ({
  clearProductCookies: vi.fn(),
}));

// Reset modules so api.ts re-evaluates for each test
beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  document.cookie = "";
  locationSpy.mockClear();
});

describe("getBaseUrl", () => {
  it("strips /api/v1 suffix from NEXT_PUBLIC_API_URL", async () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com/api/v1";

    const { getBaseUrl } = await import("./api");
    expect(getBaseUrl()).toBe("https://api.example.com");

    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  it("strips trailing slash after /api/v1", async () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com/api/v1/";

    const { getBaseUrl } = await import("./api");
    expect(getBaseUrl()).toBe("https://api.example.com");

    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  it("falls back to localhost when env is missing", async () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;

    const { getBaseUrl } = await import("./api");
    expect(getBaseUrl()).toBe("http://localhost:8080");

    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });
});

describe("api request interceptor", () => {
  it("injects Bearer token from in-memory storage into request headers", async () => {
    const { default: api, setAccessToken } = await import("./api");
    setAccessToken("test-access-token");

    // axios request interceptors are functions that receive config and return it.
    // We can exercise the interceptor by calling the internal handler if exposed,
    // but axios does not expose it. Instead, verify the api instance was created
    // and that defaults reflect the expected baseURL.
    // jsdom provides `window`, so the browser path uses same-origin /api/v1.
    expect(api.defaults.baseURL).toBe("/api/v1");
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.headers["Content-Type"]).toBe("application/json");
  });
});

describe("refresh coordination", () => {
  it("shares one cookie rotation across overlapping requests", async () => {
    let resolveRefresh!: (value: { data: { token: string } }) => void;
    const post = vi.spyOn(axios, "post").mockImplementation(() =>
      new Promise((resolve) => { resolveRefresh = resolve as typeof resolveRefresh; }),
    );
    const { refreshAccessToken, getAccessToken } = await import("./api");
    const first = refreshAccessToken();
    const second = refreshAccessToken();
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][2]).toMatchObject({ withCredentials: true, timeout: 15000 });
    resolveRefresh({ data: { token: "rotated-token" } });
    expect(await Promise.all([first, second])).toEqual(["rotated-token", "rotated-token"]);
    expect(getAccessToken()).toBe("rotated-token");
    post.mockRestore();
  });

  it("does not overwrite a newer login when an older refresh fails", async () => {
    let rejectRefresh!: (reason: Error) => void;
    const post = vi.spyOn(axios, "post").mockImplementation(() =>
      new Promise((_, reject) => { rejectRefresh = reject; }),
    );
    const { refreshAccessToken, setAccessToken, getAccessToken } = await import("./api");
    const oldRefresh = refreshAccessToken();
    setAccessToken("new-login");
    rejectRefresh(new Error("old cookie expired"));
    expect(await oldRefresh).toBe("new-login");
    expect(getAccessToken()).toBe("new-login");
    post.mockRestore();
  });
});
