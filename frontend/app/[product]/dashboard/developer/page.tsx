import { notFound } from "next/navigation";
import BatteryDeveloperPage from "@/components/developer/battery-developer-page";
import { UnderDevelopment } from "@/components/shared/under-development";
import { isProductSlug } from "@/lib/products";

type ProductDeveloperPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductDeveloperPage({
  params,
}: ProductDeveloperPageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <UnderDevelopment
      pageTitle="Textile Developer Tools"
      description="API keys and integration tools for textile traceability."
    />
  ) : (
    <BatteryDeveloperPage />
  );
}
