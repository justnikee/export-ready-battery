import { notFound } from "next/navigation";
import BatteryBatchesPage from "@/components/batches/battery-batches-page";
import { TextileBatchesPage } from "@/components/textile/textile-batches-page";
import { isProductSlug } from "@/lib/products";

type ProductBatchesPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductBatchesPage({
  params,
}: ProductBatchesPageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <TextileBatchesPage />
  ) : (
    <BatteryBatchesPage />
  );
}
