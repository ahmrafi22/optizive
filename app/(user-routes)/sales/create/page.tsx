import { LuPlus } from "react-icons/lu";
import CreateSaleForm from "../_components/CreateSaleForm";

export default function CreateSalePage() {
  return (
    <main className="relative space-y-6 pb-12">
      <div className="relative isolate overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) px-6 py-5 shadow-[0_16px_45px_rgba(0,0,0,0.04)] dark:shadow-[0_18px_55px_rgba(0,0,0,0.16)] sm:px-7">
        <div className="noise-overlay absolute inset-0" />
        <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--clr-teal-dim)/10">
            <LuPlus className="h-6 w-6 text-(--clr-teal-dim)" />
          </div>
          <div>
            <h1 className="text-2xl font-naston leading-tight text-(--clr-fg) sm:text-3xl">
              New Sale
            </h1>
            <p className="text-sm text-(--clr-fg-muted) mt-0.5">
              Record a sale to a platform user or external customer
            </p>
          </div>
        </div>
      </div>

      <CreateSaleForm />
    </main>
  );
}
