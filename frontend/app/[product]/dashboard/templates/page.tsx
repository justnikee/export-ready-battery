import { notFound } from "next/navigation";
import BatteryTemplatesPage from "@/components/templates/battery-templates-page";
import { TextileTemplatesPage } from "@/components/textile/textile-templates-page";
import { isProductSlug } from "@/lib/products";

type ProductTemplatesPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductTemplatesPage({
  params,
}: ProductTemplatesPageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <TextileTemplatesPage />
  ) : (
    <BatteryTemplatesPage />
  );
}
