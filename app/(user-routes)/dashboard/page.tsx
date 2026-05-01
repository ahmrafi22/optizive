import { auth } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold text-zinc-900">Dashboard</h1>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-500">Signed in as</p>
        <p className="mt-1 text-lg font-medium text-zinc-900">
          {session?.user?.name ?? "User"}
        </p>
        <p className="text-sm text-zinc-600">{session?.user?.email ?? ""}</p>
        <div className="mt-4 flex items-center gap-3 text-sm text-zinc-600">
          <span>Role: {session?.user?.role ?? ""}</span>
          <span>Username: {session?.user?.username ?? ""}</span>
        </div>
      </div>
      <SignOutButton />
    </main>
  );
}
