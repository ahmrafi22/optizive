import { auth } from "@/backend/auth/auth";
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

  if (!session.user.onboarded || !session.user.role || session.user.role === "NONE") {
    redirect("/onboarding");
  }

  return <div className="min-h-screen bg-zinc-50">{children}</div>;
}
