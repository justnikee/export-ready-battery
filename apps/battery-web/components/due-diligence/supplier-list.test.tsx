import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import SupplierList from "./supplier-list";

vi.mock("@/lib/api", () => ({ default: { post: vi.fn() } }));

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("supplier invitation delivery", () => {
  it.each([false, true])("renders the provider delivery outcome (%s)", async (emailSent) => {
    const onChanged = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const inviteToken = "fixture-invitation+/";
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { id: "fixture-supplier", invitation_token: inviteToken, email_sent: emailSent },
    });
    render(<SupplierList suppliers={[]} loading={false} selectedId={null} onSelect={vi.fn()} onChanged={onChanged} />);

    fireEvent.click(screen.getByRole("button", { name: "Invite" }));
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "supplier@example.test" } });
    fireEvent.change(screen.getByLabelText(/Company Name/), { target: { value: "Fixture supplier" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));
    await screen.findByRole("heading", { name: "Invitation created" });

    if (emailSent) {
      expect(screen.getByText(/Invitation email sent/)).toBeInTheDocument();
      expect(screen.queryByRole("alert")).toBeNull();
    } else {
      expect(screen.getByRole("alert")).toHaveTextContent("The invitation email could not be sent.");
      expect(screen.getByText(/share it directly with your supplier/)).toBeInTheDocument();
      expect(screen.queryByText(/Invitation email sent/)).toBeNull();
    }
    const link = new URL(screen.getByRole<HTMLInputElement>("textbox", { name: "Invitation link" }).value);
    expect(link.pathname).toBe("/supplier/accept");
    expect(link.searchParams.get("token")).toBe(inviteToken);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledExactlyOnceWith(link.href));
    expect(onChanged).toHaveBeenCalledOnce();
  });
});
