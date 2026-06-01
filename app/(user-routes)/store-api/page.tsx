import { ensureMainStore } from "@/backend/store/store";
import StoreApiClient from "./_components/StoreApiClient";

export default async function StoreApiPage() {
  const stats = await ensureMainStore();

  return (
    <main className="relative pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-naston leading-tight text-(--clr-fg) sm:text-3xl">Store API</h1>
      </div>
      <StoreApiClient initialStats={stats} />
    </main>
  );
}
