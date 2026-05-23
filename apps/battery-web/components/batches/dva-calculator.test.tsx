import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DVACalculator } from "./dva-calculator";

const accessibleTrigger = <button type="button">Open calculator</button>;

describe("DVACalculator", () => {
  it("renders custom trigger", () => {
    render(<DVACalculator onApply={vi.fn()} trigger={accessibleTrigger} />);
    expect(
      screen.getByRole("button", { name: /open calculator/i }),
    ).toBeInTheDocument();
  });

  it("calculates DVA correctly for typical values", async () => {
    const onApply = vi.fn();
    render(<DVACalculator onApply={onApply} trigger={accessibleTrigger} />);

    fireEvent.click(screen.getByRole("button", { name: /open calculator/i }));

    const saleInput = screen.getByPlaceholderText(/e\.g 15000/);
    const costInput = screen.getByPlaceholderText(/e\.g 6000/);

    fireEvent.change(saleInput, { target: { value: "15000" } });
    fireEvent.change(costInput, { target: { value: "6000" } });

    await waitFor(() => {
      expect(screen.getByText("60.0%")).toBeInTheDocument();
    });

    expect(screen.getByText(/PLI Eligible/i)).toBeInTheDocument();
  });

  it("shows Low Value Add when DVA is below 50%", async () => {
    render(<DVACalculator onApply={vi.fn()} trigger={accessibleTrigger} />);

    fireEvent.click(screen.getByRole("button", { name: /open calculator/i }));

    const saleInput = screen.getByPlaceholderText(/e\.g 15000/);
    const costInput = screen.getByPlaceholderText(/e\.g 6000/);

    fireEvent.change(saleInput, { target: { value: "10000" } });
    fireEvent.change(costInput, { target: { value: "6000" } });

    await waitFor(() => {
      expect(screen.getByText("40.0%")).toBeInTheDocument();
    });

    expect(screen.getByText(/Low Value Add/i)).toBeInTheDocument();
  });

  it("clamps DVA to 0 when cost exceeds sale price", async () => {
    render(<DVACalculator onApply={vi.fn()} trigger={accessibleTrigger} />);

    fireEvent.click(screen.getByRole("button", { name: /open calculator/i }));

    const saleInput = screen.getByPlaceholderText(/e\.g 15000/);
    const costInput = screen.getByPlaceholderText(/e\.g 6000/);

    fireEvent.change(saleInput, { target: { value: "10000" } });
    fireEvent.change(costInput, { target: { value: "12000" } });

    await waitFor(() => {
      expect(screen.getByText("0.0%")).toBeInTheDocument();
    });
  });

  it("clamps DVA to 100 when cost is zero", async () => {
    render(<DVACalculator onApply={vi.fn()} trigger={accessibleTrigger} />);

    fireEvent.click(screen.getByRole("button", { name: /open calculator/i }));

    const saleInput = screen.getByPlaceholderText(/e\.g 15000/);

    fireEvent.change(saleInput, { target: { value: "10000" } });

    await waitFor(() => {
      expect(screen.getByText("100.0%")).toBeInTheDocument();
    });
  });

  it("calls onApply with rounded DVA when Apply is clicked", async () => {
    const onApply = vi.fn();
    render(<DVACalculator onApply={onApply} trigger={accessibleTrigger} />);

    fireEvent.click(screen.getByRole("button", { name: /open calculator/i }));

    const saleInput = screen.getByPlaceholderText(/e\.g 15000/);
    const costInput = screen.getByPlaceholderText(/e\.g 6000/);

    fireEvent.change(saleInput, { target: { value: "15000" } });
    fireEvent.change(costInput, { target: { value: "6000" } });

    await waitFor(() => {
      expect(screen.getByText("60.0%")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /apply to batch/i }));

    expect(onApply).toHaveBeenCalledWith(60);
  });

  it("disables apply button when sale price is zero or empty", () => {
    render(<DVACalculator onApply={vi.fn()} trigger={accessibleTrigger} />);

    fireEvent.click(screen.getByRole("button", { name: /open calculator/i }));

    const applyBtn = screen.getByRole("button", { name: /apply to batch/i });
    expect(applyBtn).toBeDisabled();
  });
});
