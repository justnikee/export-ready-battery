import { notFound } from "next/navigation";
import BatteryBillingPage from "@/components/billing/battery-billing-page";
import { UnderDevelopment } from "@/components/shared/under-development";
import { isProductSlug } from "@/lib/products";

type ProductBillingPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductBillingPage({
  params,
}: ProductBillingPageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <UnderDevelopment
      pageTitle="Textile Billing"
      description="Quota and subscription management for textile traceability."
    />
  ) : (
    <BatteryBillingPage />
  );
}
