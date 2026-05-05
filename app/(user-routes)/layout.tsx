import { auth } from "@/backend/auth/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

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

  return <DashboardLayout>{children}</DashboardLayout>;
}
