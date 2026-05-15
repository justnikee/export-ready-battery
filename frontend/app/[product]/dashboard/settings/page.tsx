import { notFound } from "next/navigation";
import BatterySettingsPage from "@/components/settings/battery-settings-page";
import { TextileSettingsPage } from "@/components/settings/textile-settings-page";
import { isProductSlug } from "@/lib/products";

type ProductSettingsPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductSettingsPage({
  params,
}: ProductSettingsPageProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return product === "textile" ? (
    <TextileSettingsPage />
  ) : (
    <BatterySettingsPage />
  );
}
