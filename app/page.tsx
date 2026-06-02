"use client";

import { HeroSection } from "@/components/landing-page/HeroSection";
import { FeaturesSection } from "@/components/landing-page/FeaturesSection";
import { CtaSection } from "@/components/landing-page/CtaSection";
import { Footer } from "@/components/landing-page/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#111111] text-zinc-50 overflow-x-hidden selection:bg-primary/30">
      <HeroSection />
      <FeaturesSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
