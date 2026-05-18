"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function CtaSection() {
  const router = useRouter();

  return (
    <section id="about" className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="noise-overlay rounded-[2rem] md:rounded-[3rem] border border-white/10 p-8 md:p-12 lg:p-20 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1a1a1a 0%, #0a0a0a 100%)" }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] md:w-[600px] h-[100px] md:h-[200px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(255,244,79,0.1) 0%, transparent 70%)" }}
        />
        <div className="relative z-10">
          <h2 className="font-naston text-3xl md:text-5xl lg:text-6xl mb-4 md:mb-6">Ready to Optizive?</h2>
          <p className="text-base md:text-xl text-zinc-400 mb-8 md:mb-10 max-w-2xl mx-auto font-serif italic">
            Join thousands of modern sellers leveraging AI and smart insights to dominate their market.
          </p>
          <button
            id="cta-create-btn"
            onClick={() => router.push("/login")}
            className="active:scale-[0.97] transition-transform duration-150 h-12 md:h-14 px-8 md:px-10 rounded-full bg-white text-black font-semibold text-base md:text-lg w-full sm:w-auto"
          >
            Create Free Account
          </button>
        </div>
      </motion.div>
    </section>
  );
}
