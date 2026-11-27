const legacyCacheName = "supplier-portal-v1";
let cleanup: Promise<void> | undefined;

function confirmWorkerRetirement(worker: ServiceWorker): Promise<void> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const finish = (error?: Error) => {
      window.clearTimeout(timeout);
      worker.removeEventListener("statechange", checkState);
      channel.port1.close();
      channel.port2.close();
      if (error) reject(error);
      else resolve();
    };
    const checkState = () => {
      if (worker.state === "activated") {
        worker.removeEventListener("statechange", checkState);
        try {
          worker.postMessage("supplier-cache-status", [channel.port2]);
        } catch {
          finish(new Error("Could not verify supplier cache cleanup"));
        }
      } else if (worker.state === "redundant") {
        finish(new Error("Supplier cache worker was replaced"));
      }
    };
    const timeout = window.setTimeout(() => finish(new Error("Could not verify supplier cache cleanup")), 5_000);
    channel.port1.onmessage = ({ data }) => {
      if (data === "supplier-cache-retired") finish();
    };
    worker.addEventListener("statechange", checkState);
    checkState();
  });
}

async function removeLegacySupplierCache() {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const legacyScript = new URL("/sw-supplier.js", window.location.origin).href;
    if (registration && [registration.active, registration.waiting, registration.installing].some(
      (worker) => worker?.scriptURL === legacyScript,
    )) {
      await registration.update();
      const worker = registration.installing ?? registration.waiting ?? registration.active;
      if (!worker || worker.scriptURL !== legacyScript) {
        throw new Error("Could not verify supplier cache cleanup");
      }
      await confirmWorkerRetirement(worker);
    }
  }
  // Also clean up orphaned entries from browsers without the old registration.
  await window.caches?.delete(legacyCacheName);
}

export function prepareSupplierCache(): Promise<void> {
  if (typeof window === "undefined" || !window.isSecureContext) return Promise.resolve();
  cleanup ??= removeLegacySupplierCache().catch((error: unknown) => {
    cleanup = undefined;
    throw error;
  });
  return cleanup;
}
