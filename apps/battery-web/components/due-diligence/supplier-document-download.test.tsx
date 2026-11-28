import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import api from "@/lib/api";
import supplierApi from "@/lib/supplier-api";
import { SupplierDocumentDownload } from "./supplier-document-download";

vi.mock("@/lib/api", () => ({ default: { post: vi.fn() } }));
vi.mock("@/lib/supplier-api", () => ({ default: { post: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const supplierDocument = {
  id: "doc-id",
  doc_type: "coc",
  file_name: "Certificate.pdf",
  status: "pending",
  uploaded_at: "2026-11-26T00:00:00Z",
} as const;

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe("SupplierDocumentDownload", () => {
  it.each([
    ["supplier", supplierApi, api, "/supplier/documents/doc-id/download"],
    ["manufacturer", api, supplierApi, "/supplier-documents/doc-id/download"],
  ] as const)("downloads the attachment through the %s client", async (scope, client, otherClient, endpoint) => {
    const file = new Blob(["private supplier file"]);
    vi.mocked(client.post).mockResolvedValue({ data: file });
    const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:private-file");
    const startDownload = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe(supplierDocument.file_name);
      expect(this.href).toBe("blob:private-file");
    });

    render(<SupplierDocumentDownload document={supplierDocument} scope={scope} />);
    fireEvent.click(screen.getByRole("button", { name: "Download Certificate.pdf" }));

    await waitFor(() => expect(startDownload).toHaveBeenCalledOnce());
    expect(client.post).toHaveBeenCalledWith(endpoint, undefined, { responseType: "blob" });
    expect(otherClient.post).not.toHaveBeenCalled();
    expect(createUrl).toHaveBeenCalledWith(file);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("keeps the file unavailable after an access denial", async () => {
    const error = new AxiosError();
    Object.assign(error, { response: { status: 404 } });
    vi.mocked(supplierApi.post).mockRejectedValue(error);
    const startDownload = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<SupplierDocumentDownload document={supplierDocument} scope="supplier" />);
    fireEvent.click(screen.getByRole("button", { name: "Download Certificate.pdf" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("This document is unavailable."));
    expect(startDownload).not.toHaveBeenCalled();
  });
});
