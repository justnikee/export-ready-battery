import { notFound } from "next/navigation";
import BatteryExportsPage from "@/components/exports/battery-exports-page";
import { UnderDevelopment } from "@/components/shared/under-development";
import { isProductSlug } from "@/lib/products";

type ProductExportsPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductExportsPage({
  params,
}: ProductExportsPageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <UnderDevelopment
      pageTitle="Textile Exports"
      description="Export capabilities for textile traceability records."
    />
  ) : (
    <BatteryExportsPage />
  );
}
