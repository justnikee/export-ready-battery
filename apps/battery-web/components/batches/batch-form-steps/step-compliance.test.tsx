import { describe, it, expect, beforeAll } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  batchFormSchema,
  defaultBatchFormValues,
  type BatchFormData,
} from "@/components/batches/batch-form-schema";
import { StepCompliance } from "@/components/batches/batch-form-steps/step-compliance";

function Harness({ onReady }: { onReady?: (methods: UseFormReturn<BatchFormData>) => void }) {
  const methods = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: { ...defaultBatchFormValues, marketRegion: "INDIA" },
    mode: "onBlur",
  });
  onReady?.(methods);
  return (
    <FormProvider {...methods}>
      <StepCompliance
        isUploading={false}
        uploadProgress={0}
        onDocUpload={async () => {}}
        onCertificateUpload={async () => {}}
        iecError={false}
      />
    </FormProvider>
  );
}

beforeAll(() => {
  // jsdom doesn't implement pointer capture / scrollIntoView, which Radix
  // Select needs to complete a click-to-select interaction.
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

describe("StepCompliance", () => {
  it("lets the user open the accordion and change cell source to IMPORTED", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    await user.click(screen.getByText("Classification & Cell Source"));

    await screen.findByText("🏭 Domestic (Enables DVA Calculator)");
    const selectTrigger = container.querySelector("#cellSource") as HTMLElement;
    expect(selectTrigger).toBeTruthy();
    await user.click(selectTrigger);

    const importedOption = await screen.findByText("📦 Imported (Requires IEC Code)");
    await user.click(importedOption);

    await screen.findByText("📦 Imported (Requires IEC Code)");
  });

  it("updates the section completion badge as HSN code is typed", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByText("Classification & Cell Source"));

    const hsnInput = await screen.findByLabelText(/HSN Code/i);
    // Default cellSource is DOMESTIC (truthy) -> section starts at 1/2
    expect(screen.getByText("1 / 2 complete")).toBeTruthy();

    await user.type(hsnInput, "85076000");

    expect(screen.queryByText("1 / 2 complete")).toBeNull();
    expect(screen.getByText("2 / 2 complete")).toBeTruthy();
  });

  it("surfaces the domestic-value-add shortfall error on the Sale Price field", async () => {
    let formMethods!: UseFormReturn<BatchFormData>;
    const user = userEvent.setup();
    render(<Harness onReady={(m) => (formMethods = m)} />);

    await user.click(screen.getByText("Domestic Value Add"));

    formMethods.setValue("salePrice", "100");
    formMethods.setValue("importCost", "100"); // DVA = 0% -> invalid
    await act(async () => {
      await formMethods.trigger(["salePrice", "importCost"]);
    });

    expect(
      await screen.findByText(/Domestic batches must have Domestic Value Add > 0%/i)
    ).toBeTruthy();
  });

  it("surfaces required-field errors for Audited DVA mode", async () => {
    let formMethods!: UseFormReturn<BatchFormData>;
    const user = userEvent.setup();
    render(<Harness onReady={(m) => (formMethods = m)} />);

    await user.click(screen.getByText("Domestic Value Add"));
    await user.click(await screen.findByText("📋 Audited (CA Certified)"));

    await act(async () => {
      await formMethods.trigger(["auditedDva", "uploadedFileUrl"]);
    });

    expect(await screen.findByText(/Audited DVA % is required/i)).toBeTruthy();
    expect(
      await screen.findByText(/CA Certificate upload is required for audited mode/i)
    ).toBeTruthy();
  });

  it("surfaces the PLI-ineligibility error on the PLI checkbox", async () => {
    let formMethods!: UseFormReturn<BatchFormData>;
    const user = userEvent.setup();
    render(<Harness onReady={(m) => (formMethods = m)} />);

    await user.click(screen.getByText("Domestic Value Add"));

    formMethods.setValue("salePrice", "100");
    formMethods.setValue("importCost", "60"); // DVA = 40% -> below the 50% PLI threshold
    formMethods.setValue("pliCompliant", true);
    await act(async () => {
      await formMethods.trigger(["pliCompliant"]);
    });

    expect(
      await screen.findByText(/PLI Scheme requires minimum 50% Domestic Value Add/i)
    ).toBeTruthy();
  });
});
