import { afterEach, expect, it, vi } from "vitest";
import { clearSupplierSession, getSupplierAccessToken, restoreSupplierAccessToken } from "./supplier-session";

afterEach(clearSupplierSession);

it("shares token restoration across simultaneous requests", async () => {
  const load = vi.fn(async () => "fixture-token");
  const first = restoreSupplierAccessToken(load);
  const second = restoreSupplierAccessToken(load);

  expect(first).toBe(second);
  await expect(first).resolves.toBe("fixture-token");
  expect(load).toHaveBeenCalledTimes(1);
  expect(getSupplierAccessToken()).toBe("fixture-token");
});

it("discards a token restored after the session cleared", async () => {
  let finish!: (token: string) => void;
  const restoring = restoreSupplierAccessToken(() => new Promise((resolve) => { finish = resolve; }));

  clearSupplierSession();
  finish("old-fixture-token");

  await expect(restoring).resolves.toBeNull();
  expect(getSupplierAccessToken()).toBeNull();
});
