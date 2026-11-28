const legacyCacheName = "supplier-portal-v1";
const workerReloadKey = "supplier-worker-retirement-reload";
let cleanup: Promise<void> | undefined;

function confirmWorkerRetirement(worker: ServiceWorker): Promise<boolean> {
  if (worker.state !== "activated") return Promise.resolve(false);

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const finish = (retired: boolean) => {
      window.clearTimeout(timeout);
      channel.port1.close();
      channel.port2.close();
      resolve(retired);
    };
    const timeout = window.setTimeout(() => finish(false), 1_000);
    channel.port1.onmessage = ({ data }) => {
      if (data === "supplier-cache-retired") finish(true);
    };
    try {
      worker.postMessage("supplier-cache-status", [channel.port2]);
    } catch {
      finish(false);
    }
  });
}

function reloadWithoutLegacyWorker() {
  try {
    if (window.sessionStorage.getItem(workerReloadKey)) return;
    window.sessionStorage.setItem(workerReloadKey, "1");
  } catch {
    // A browser that disallows the marker must reload manually to avoid a loop.
    return;
  }
  window.location.reload();
}

async function removeLegacySupplierCache() {
  if ("serviceWorker" in navigator) {
    const serviceWorkers = navigator.serviceWorker;
    const registration = await serviceWorkers.getRegistration("/");
    const rootScope = new URL("/", window.location.origin).href;
    const legacyScript = new URL("/sw-supplier.js", window.location.origin).href;
    const controller = serviceWorkers.controller?.scriptURL === legacyScript ? serviceWorkers.controller : null;
    const registeredWorkers = [registration?.active, registration?.waiting, registration?.installing].filter(Boolean);
    const supplierRegistration = registration?.scope === rootScope && registeredWorkers.length > 0 &&
      registeredWorkers.every((worker) => worker?.scriptURL === legacyScript) ? registration : undefined;

    if (controller || supplierRegistration) {
      const worker = controller ?? supplierRegistration?.active;
      if (!worker || !await confirmWorkerRetirement(worker)) {
        // An old controller can stay active even while its replacement is waiting.
        // Release the registration and leave this document before making private requests.
        await supplierRegistration?.unregister();
        await window.caches?.delete(legacyCacheName);
        reloadWithoutLegacyWorker();
        throw new Error("Could not verify supplier cache cleanup");
      }
    }
  }
  // Also clean up orphaned entries from browsers without the old registration.
  await window.caches?.delete(legacyCacheName);
  try {
    window.sessionStorage.removeItem(workerReloadKey);
  } catch {
    // Cleanup succeeded even when storage for the reload marker is unavailable.
  }
}

export function prepareSupplierCache(): Promise<void> {
  if (typeof window === "undefined" || !window.isSecureContext) return Promise.resolve();
  cleanup ??= removeLegacySupplierCache().catch((error: unknown) => {
    cleanup = undefined;
    throw error;
  });
  return cleanup;
}
