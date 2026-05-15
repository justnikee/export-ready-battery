import { notFound } from "next/navigation";
import BatteryAnalyticsPage from "@/components/analytics/battery-analytics-page";
import { UnderDevelopment } from "@/components/shared/under-development";
import { isProductSlug } from "@/lib/products";

type ProductAnalyticsPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductAnalyticsPage({
  params,
}: ProductAnalyticsPageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <UnderDevelopment
      pageTitle="Textile Analytics"
      description="Traceability analytics for textile supply chains."
    />
  ) : (
    <BatteryAnalyticsPage />
  );
}
