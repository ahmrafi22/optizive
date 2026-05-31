import { notFound } from "next/navigation";
import { getPublicProductById, getPublicProductSales } from "@/backend/inventory/public";
import { ProductInfoContent } from "./ProductInfoContent";

export default async function PublicProductInfoPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const [product, salesData] = await Promise.all([
    getPublicProductById(productId),
    getPublicProductSales(productId, 7),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductInfoContent product={product} salesData={salesData} />;
}
