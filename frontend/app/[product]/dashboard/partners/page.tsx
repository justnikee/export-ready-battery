import { notFound } from "next/navigation";
import BatteryPartnersPage from "@/components/partners/battery-partners-page";
import { UnderDevelopment } from "@/components/shared/under-development";
import { isProductSlug } from "@/lib/products";

type ProductPartnersPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductPartnersPage({
  params,
}: ProductPartnersPageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <UnderDevelopment
      pageTitle="Textile Partners"
      description="Supply-chain partner management for textile traceability."
    />
  ) : (
    <BatteryPartnersPage />
  );
}
