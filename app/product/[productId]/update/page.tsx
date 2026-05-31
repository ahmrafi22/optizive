import { notFound } from "next/navigation";
import { getPublicProductById } from "@/backend/inventory/public";
import { ProductUpdateContent } from "./ProductUpdateContent";

export default async function PublicProductUpdatePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const product = await getPublicProductById(productId);

  if (!product) {
    notFound();
  }

  return <ProductUpdateContent product={product} />;
}
