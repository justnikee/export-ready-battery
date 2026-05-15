import { notFound } from "next/navigation";
import BatteryRewardsPage from "@/components/rewards/battery-rewards-page";
import { UnderDevelopment } from "@/components/shared/under-development";
import { isProductSlug } from "@/lib/products";

type ProductRewardsPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductRewardsPage({
  params,
}: ProductRewardsPageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <UnderDevelopment
      pageTitle="Textile Rewards"
      description="Rewards and gamification for textile traceability."
    />
  ) : (
    <BatteryRewardsPage />
  );
}
