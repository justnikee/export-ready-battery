import { fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { BulkImportDialog } from "./bulk-import-dialog";

vi.mock("@/lib/api", () => ({ default: { post: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

it.each([{ errors: null }, { errors: [] }])("confirms a successful batch import and refreshes the list with errors=$errors", async ({ errors }) => {
  vi.mocked(api.post).mockResolvedValueOnce({ data: { total: 2, created: 2, failed: 0, errors } });
  const refreshBatches = vi.fn();
  render(<BulkImportDialog onImported={refreshBatches} />);
  fireEvent.click(screen.getByRole("button", { name: "Bulk Import" }));
  fireEvent.drop(screen.getByText(/Drop a CSV file here/), {
    dataTransfer: { files: [new File(["batch_name,model_name\nA,Pack\nB,Pack"], "batches.csv", { type: "text/csv" })] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Import Batches" }));

  expect(await screen.findByText("2 created")).toBeVisible();
  expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
  expect(toast.success).toHaveBeenCalledWith("Imported 2 batches");
  expect(toast.error).not.toHaveBeenCalled();
  expect(refreshBatches).toHaveBeenCalledTimes(1);
});
