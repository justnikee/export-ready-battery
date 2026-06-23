import { z } from "zod";

export const onboardingStep1Schema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  support_email: z.string().email("Invalid email address"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const onboardingStep3Schema = z
  .object({
    primary_market: z.enum(["india", "eu", "both"]),
    epr_registration_number: z.string().optional(),
    bis_r_number: z.string().optional(),
    iec_code: z.string().optional(),
    morth_manufacturer_code: z.string().optional(),
    eu_authorized_representative_name: z.string().optional(),
    eu_authorized_representative_address: z.string().optional(),
    eu_contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const hasIndia = data.primary_market === "india" || data.primary_market === "both";

    if (hasIndia && data.epr_registration_number && data.epr_registration_number.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "EPR number seems too short",
        path: ["epr_registration_number"],
      });
    }
  });

export type OnboardingStep1Data = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep3Data = z.infer<typeof onboardingStep3Schema>;
