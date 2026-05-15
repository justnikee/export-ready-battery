import { notFound } from "next/navigation";
import BatteryCompliancePage from "@/components/settings/battery-compliance-page";
import { TextileCompliancePage } from "@/components/settings/textile-compliance-page";
import { isProductSlug } from "@/lib/products";

type ProductCompliancePageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductCompliancePage({
  params,
}: ProductCompliancePageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <TextileCompliancePage />
  ) : (
    <BatteryCompliancePage />
  );
}
