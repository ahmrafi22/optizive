import { auth } from "@/backend/auth/auth";
import { redirect } from "next/navigation";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.onboarded && session.user.role && session.user.role !== "NONE") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-[100dvh] bg-[#111111] text-zinc-50">
      <OnboardingForm initialName={session.user.name ?? ""} />
    </div>
  );
}
