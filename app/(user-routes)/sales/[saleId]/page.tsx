import { getSale } from "@/backend/sales/sales";
import SaleDetailView from "../_components/SaleDetailView";
import { LuArrowLeft, LuLoader } from "react-icons/lu";
import Link from "next/link";

interface Props {
  params: Promise<{ saleId: string }>;
}

export default async function SaleDetailPage({ params }: Props) {
  const { saleId } = await params;
  const sale = await getSale(saleId);

  if (!sale) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--clr-surface2)">
          <LuLoader className="h-8 w-8 text-(--clr-fg-muted)" />
        </div>
        <h2 className="text-xl font-semibold text-(--clr-fg)">Sale not found</h2>
        <p className="text-sm text-(--clr-fg-muted) text-center">
          This sale doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <Link
          href="/sales"
          className="flex items-center gap-2 rounded-xl bg-(--clr-teal-dim) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(--clr-teal-dim)/90 transition-all"
        >
          <LuArrowLeft className="h-4 w-4" />
          Back to Sales
        </Link>
      </main>
    );
  }

  return <SaleDetailView sale={sale} />;
}
