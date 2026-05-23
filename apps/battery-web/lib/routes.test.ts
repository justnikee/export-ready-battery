import { describe, it, expect } from "vitest";
import {
  productRoutes,
  routesFromPathname,
  stripProductPrefix,
  prefixProductPath,
  dashboardPathFromPathname,
} from "./routes";

describe("productRoutes", () => {
  it("returns battery routes by default", () => {
    const routes = productRoutes();
    expect(routes.login).toBe("/battery/login");
    expect(routes.dashboard).toBe("/battery/dashboard");
    expect(routes.batches).toBe("/battery/dashboard/batches");
  });

  it("returns textile routes when given TEXTILE", () => {
    const routes = productRoutes("TEXTILE");
    expect(routes.login).toBe("/textile/login");
    expect(routes.dashboard).toBe("/textile/dashboard");
    expect(routes.batches).toBe("/textile/dashboard/batches");
  });

  it("returns battery routes for unknown product types", () => {
    const routes = productRoutes("UNKNOWN");
    expect(routes.login).toBe("/battery/login");
    expect(routes.batches).toBe("/battery/dashboard/batches");
  });
});

describe("routesFromPathname", () => {
  it("detects battery from /battery/login", () => {
    const routes = routesFromPathname("/battery/login");
    expect(routes.login).toBe("/battery/login");
  });

  it("detects textile from /textile/dashboard", () => {
    const routes = routesFromPathname("/textile/dashboard");
    expect(routes.dashboard).toBe("/textile/dashboard");
  });

  it("throws for root path without product prefix", () => {
    expect(() => routesFromPathname("/")).toThrow(
      "Cannot determine product from pathname: /. Expected /battery/* or /textile/*."
    );
  });
});

describe("stripProductPrefix", () => {
  it("removes /battery prefix", () => {
    expect(stripProductPrefix("/battery/dashboard")).toBe("/dashboard");
  });

  it("removes /textile prefix", () => {
    expect(stripProductPrefix("/textile/login")).toBe("/login");
  });

  it("returns root when only prefix is present", () => {
    expect(stripProductPrefix("/battery")).toBe("/");
  });

  it("returns unmodified path without prefix", () => {
    expect(stripProductPrefix("/docs")).toBe("/docs");
  });
});

describe("prefixProductPath", () => {
  it("adds battery prefix to plain path", () => {
    expect(prefixProductPath("/battery/login", "/settings")).toBe(
      "/battery/settings",
    );
  });

  it("does not double-prefix when target already has prefix", () => {
    expect(prefixProductPath("/battery/login", "/textile/settings")).toBe(
      "/textile/settings",
    );
  });
});

describe("dashboardPathFromPathname", () => {
  it("returns dashboard root without subpath", () => {
    expect(dashboardPathFromPathname("/battery/login")).toBe("/battery/dashboard");
  });

  it("appends subpath", () => {
    expect(dashboardPathFromPathname("/battery/login", "/batches")).toBe(
      "/battery/dashboard/batches",
    );
  });
});
