import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PassportVCActions } from "./passport-vc-actions";
import { getPassportVC, issuePassportVC } from "@/lib/api/vcs";
import { downloadPassportVC } from "@/lib/passport-vc";

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: { id: "u1", tenant_id: "t1", email: "a@b.co", company_name: "Acme", role: "ADMIN" },
  }),
}));

vi.mock("@/lib/api/vcs", () => ({
  issuePassportVC: vi.fn(),
  getPassportVC: vi.fn(),
}));

vi.mock("@/lib/passport-vc", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/passport-vc")>();
  return {
    ...actual,
    downloadPassportVC: vi.fn(),
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const issuedDoc = {
  id: "urn:uuid:1",
  type: ["VerifiableCredential", "BatteryPassportCredential"],
  issuer: "did:key:z6Mk",
};

describe("PassportVCActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("issues a VC and downloads the payload", async () => {
    vi.mocked(issuePassportVC).mockResolvedValue({
      vc: issuedDoc,
      status: "issued",
      message: "signed",
    });
    const user = userEvent.setup();
    render(<PassportVCActions uuid="p-1" serialNumber="IN-ABC-00001" />);

    await user.click(screen.getByRole("button", { name: /Credential actions for IN-ABC-00001/i }));
    await user.click(screen.getByText("Issue VC"));

    await waitFor(() => {
      expect(issuePassportVC).toHaveBeenCalledWith("p-1");
      expect(downloadPassportVC).toHaveBeenCalledWith("IN-ABC-00001", issuedDoc);
    });
    expect(await screen.findByText("Issued")).toBeInTheDocument();
  });

  it("downloads a stored VC", async () => {
    vi.mocked(getPassportVC).mockResolvedValue({
      vc: issuedDoc,
      status: "issued",
    });
    const user = userEvent.setup();
    render(<PassportVCActions uuid="p-1" serialNumber="IN-ABC-00001" />);

    await user.click(screen.getByRole("button", { name: /Credential actions for IN-ABC-00001/i }));
    await user.click(screen.getByText("Download VC"));

    await waitFor(() => {
      expect(getPassportVC).toHaveBeenCalledWith("p-1");
      expect(downloadPassportVC).toHaveBeenCalledWith("IN-ABC-00001", issuedDoc);
    });
  });
});
