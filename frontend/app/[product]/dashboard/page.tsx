import { notFound } from "next/navigation";
import BatteryDashboardPage from "@/components/dashboard/battery-dashboard-page";
import TextileDashboardPage from "@/components/dashboard/textile-dashboard-page";
import { isProductSlug } from "@/lib/products";

type ProductDashboardPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductDashboardPage({
  params,
}: ProductDashboardPageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <TextileDashboardPage />
  ) : (
    <BatteryDashboardPage />
  );
}
