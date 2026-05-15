import { notFound } from "next/navigation";
import BatteryOnboardingPage from "@/components/onboarding/battery-onboarding-page";
import { TextileOnboardingPage } from "@/components/onboarding/textile-onboarding-page";
import { isProductSlug } from "@/lib/products";

type ProductOnboardingPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductOnboardingPage({
  params,
}: ProductOnboardingPageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <TextileOnboardingPage />
  ) : (
    <BatteryOnboardingPage />
  );
}
