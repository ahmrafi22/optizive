import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UserRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <div className="min-h-screen bg-zinc-50">{children}</div>;
}
