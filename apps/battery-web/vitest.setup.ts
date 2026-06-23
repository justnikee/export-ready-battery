import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "./test/msw-handlers";

// Clean up after each test to avoid state leakage
afterEach(() => {
  cleanup();
});

// Mock server for contract tests that exercise real API call sites via
// lib/api.ts. Tests that don't need it are unaffected — unhandled requests
// are bypassed rather than erroring.
export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Provide a minimal localStorage mock for tests that don't need the full storage API
Object.defineProperty(globalThis, "localStorage", {
  value: (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })(),
  writable: true,
});

// Minimal document.cookie mock
Object.defineProperty(globalThis.document, "cookie", {
  value: "",
  writable: true,
});

// ResizeObserver mock for Radix UI components in tests
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, "ResizeObserver", {
  value: ResizeObserverMock,
  writable: true,
});
