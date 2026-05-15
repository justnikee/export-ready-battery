import { notFound } from "next/navigation";
import BatteryDispatchPage from "@/components/dispatch/battery-dispatch-page";
import { UnderDevelopment } from "@/components/shared/under-development";
import { isProductSlug } from "@/lib/products";

type ProductDispatchPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductDispatchPage({
  params,
}: ProductDispatchPageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <UnderDevelopment
      pageTitle="Textile Dispatch"
      description="Dispatch and shipment management for textile supply chains."
    />
  ) : (
    <BatteryDispatchPage />
  );
}
