import { notFound } from "next/navigation";
import { AcceptInviteView } from "@/components/auth/accept-invite-view";
import { isProductSlug } from "@/lib/products";

type ProductAcceptInvitePageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductAcceptInvitePage({
  params,
}: ProductAcceptInvitePageProps) {
  const { product } = await params;
  if (!isProductSlug(product)) {
    notFound();
  }

  return <AcceptInviteView productSlug={product} />;
}
