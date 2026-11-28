import { afterEach, beforeEach, expect, it, vi } from "vitest";

const origin = "https://supplier.example.test";
const legacyScript = `${origin}/sw-supplier.js`;
const legacyCache = "supplier-portal-v1";

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function stubBrowser() {
  const reload = vi.fn();
  const deleteCache = vi.fn().mockResolvedValue(true);
  const unregister = vi.fn().mockResolvedValue(true);
  const registration = vi.fn();
  const serviceWorkers = {
    controller: null as Pick<ServiceWorker, "scriptURL" | "state" | "postMessage"> | null,
    getRegistration: registration,
  };
  const markers = new Map<string, string>();
  vi.stubGlobal("navigator", { serviceWorker: serviceWorkers });
  vi.stubGlobal("window", {
    isSecureContext: true,
    location: { origin, reload },
    caches: { delete: deleteCache },
    sessionStorage: {
      getItem: (key: string) => markers.get(key),
      setItem: (key: string, value: string) => markers.set(key, value),
      removeItem: (key: string) => markers.delete(key),
    },
    setTimeout,
    clearTimeout,
  });
  return { reload, deleteCache, unregister, registration, serviceWorkers, markers };
}

it("purges the supplier cache without unregistering an unrelated root worker", async () => {
  const browser = stubBrowser();
  const active = { scriptURL: `${origin}/other.js`, state: "activated", postMessage: vi.fn() } as const;
  browser.serviceWorkers.controller = active;
  browser.registration.mockResolvedValue({ scope: `${origin}/`, active, unregister: browser.unregister });
  const { prepareSupplierCache } = await import("./supplier-cache");

  await prepareSupplierCache();

  expect(browser.deleteCache).toHaveBeenCalledExactlyOnceWith(legacyCache);
  expect(browser.unregister).not.toHaveBeenCalled();
  expect(browser.reload).not.toHaveBeenCalled();
});

it("retires a stalled supplier registration and blocks private requests until reloaded", async () => {
  vi.useFakeTimers();
  const browser = stubBrowser();
  const active = { scriptURL: legacyScript, state: "activated", postMessage: vi.fn() } as const;
  browser.serviceWorkers.controller = active;
  browser.registration.mockResolvedValue({
    scope: `${origin}/`, active, waiting: { scriptURL: legacyScript }, unregister: browser.unregister,
  });
  const { prepareSupplierCache } = await import("./supplier-cache");

  const blocked = expect(prepareSupplierCache()).rejects.toThrow("Could not verify supplier cache cleanup");
  await vi.advanceTimersByTimeAsync(1_000);
  await blocked;
  expect(browser.unregister).toHaveBeenCalledTimes(1);
  expect(browser.deleteCache).toHaveBeenCalledExactlyOnceWith(legacyCache);
  expect(browser.reload).toHaveBeenCalledTimes(1);

  // An unregistered worker might still control the previous document.
  browser.registration.mockResolvedValue(undefined);
  const stillBlocked = expect(prepareSupplierCache()).rejects.toThrow("Could not verify supplier cache cleanup");
  await vi.advanceTimersByTimeAsync(1_000);
  await stillBlocked;
  expect(browser.reload).toHaveBeenCalledTimes(1);

  browser.serviceWorkers.controller = null;
  await prepareSupplierCache();
  expect(browser.markers.size).toBe(0);
});
