import { notFound } from "next/navigation";
import BatteryTeamPage from "@/components/team/battery-team-page";
import { TextileTeamPage } from "@/components/team/textile-team-page";
import { isProductSlug } from "@/lib/products";

type ProductTeamPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductTeamPage({
  params,
}: ProductTeamPageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <TextileTeamPage />
  ) : (
    <BatteryTeamPage />
  );
}
