import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import ComponentLotImportPage from "./component-lot-import";

vi.mock("@/lib/api", () => ({ default: { post: vi.fn() } }));
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({ user: { role: "OWNER", tenant_id: "tenant-1", id: "user-1" }, loading: false }),
}));

const csv = new File(["fixture"], "assembly.csv", { type: "text/csv" });

function selectCSV(file = csv) {
  fireEvent.change(screen.getByLabelText("Component lot CSV"), { target: { files: [file] } });
}

beforeEach(() => vi.resetAllMocks());

describe("component lot import", () => {
  it("shows line-level ambiguity and disables confirmation until the selected file validates", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: {
      rows: [], issues: [{ line: 3, field: "scope", message: "This lot has conflicting batch scopes." }],
      new_rows: 0, existing_rows: 0,
    } });
    render(<ComponentLotImportPage />);
    expect(screen.getByRole("button", { name: "Validate CSV" })).toBeDisabled();
    selectCSV();
    fireEvent.click(screen.getByRole("button", { name: "Validate CSV" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Line 3 · scope · This lot has conflicting batch scopes.");
    expect(screen.queryByRole("button", { name: "Confirm import" })).toBeNull();

    vi.mocked(api.post).mockResolvedValueOnce({ data: {
      rows: [], issues: [], new_rows: 1, existing_rows: 0, validation_token: "preview-1",
    } });
    fireEvent.click(screen.getByRole("button", { name: "Validate CSV" }));
    await screen.findByRole("button", { name: "Confirm import" });
    selectCSV(new File(["changed"], "corrected.csv"));
    expect(screen.queryByRole("button", { name: "Confirm import" })).toBeNull();
  });

  it("submits the validation token and displays the stored rows and replay result", async () => {
    const validation = { rows: [], issues: [], new_rows: 5, existing_rows: 0, validation_token: "preview-1" };
    const commit = { rows: [], issues: [], new_rows: 5, existing_rows: 0, import_id: "import-1" };
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: validation })
      .mockResolvedValueOnce({ data: commit })
      .mockResolvedValueOnce({ data: { ...validation, new_rows: 0, existing_rows: 5, validation_token: "preview-2" } })
      .mockResolvedValueOnce({ data: { ...commit, new_rows: 0, existing_rows: 5 } });
    render(<ComponentLotImportPage />);
    selectCSV();
    fireEvent.click(screen.getByRole("button", { name: "Validate CSV" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm import" }));
    expect(await screen.findByText("5 saved, 0 skipped.")).toBeInTheDocument();
    const [path, form] = vi.mocked(api.post).mock.calls[1];
    expect(path).toBe("/component-lot-imports");
    if (!(form instanceof FormData)) throw new Error("Expected a multipart import body");
    expect(form.get("file")).toBe(csv);
    expect(form.get("validation_token")).toBe("preview-1");

    fireEvent.click(screen.getByRole("button", { name: "Validate CSV" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm import" }));
    expect(await screen.findByText("0 saved, 5 skipped.")).toBeInTheDocument();
  });
});
