import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminSidebar from "./_components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/services/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, banned: true },
  });

  if (!user || user.role !== "ADMIN" || user.banned) {
    redirect("/services/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-(--clr-surface) text-(--clr-fg)">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
