import { notFound } from "next/navigation";
import BatteryLifecyclePage from "@/components/lifecycle/battery-lifecycle-page";
import { TextileLifecyclePage } from "@/components/textile/textile-lifecycle-page";
import { isProductSlug } from "@/lib/products";

type ProductLifecyclePageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductLifecyclePage({
  params,
}: ProductLifecyclePageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <TextileLifecyclePage />
  ) : (
    <BatteryLifecyclePage />
  );
}
