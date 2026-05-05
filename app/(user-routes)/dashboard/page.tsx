import { auth } from "@/backend/auth/auth";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200">
          <svg
            className="h-6 w-6 animate-spin text-zinc-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">Build in Progress</h2>
      </div>  
    </main>
  );
}
