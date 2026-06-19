"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { FaGithub } from "react-icons/fa6";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function CtaSection() {
  const router = useRouter();

  return (
    <section id="about" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="relative rounded-[2rem] md:rounded-[2.5rem] p-[1px] overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,244,79,0.4) 0%, rgba(255,255,255,0.05) 30%, rgba(78,205,196,0.05) 70%, rgba(78,205,196,0.35) 100%)",
        }}
      >
        <div
          className="noise-overlay rounded-[calc(2rem-1px)] md:rounded-[calc(2.5rem-1px)] border border-white/10 px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #1a1a1a 0%, #0e0e0e 60%, #0a0a0a 100%)" }}
        >
          {/* Dual radial brand glows */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[720px] h-[160px] md:h-[260px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(255,244,79,0.14) 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-16 -right-10 w-[320px] md:w-[480px] h-[200px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 80% at 100% 100%, rgba(78,205,196,0.10) 0%, transparent 70%)" }}
          />

          <div className="relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
              className="font-naston text-3xl md:text-5xl lg:text-6xl mb-4 md:mb-5"
            >
              Ready to <span className="text-primary">Optizive?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT }}
              className="text-base md:text-xl text-zinc-400 mb-8 md:mb-10 max-w-2xl mx-auto font-serif italic"
            >
              Join thousands of modern sellers leveraging AI and smart insights to dominate their market.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3, ease: EASE_OUT }}
              className="flex flex-col sm:flex-row items-stretch justify-center gap-3 md:gap-4 max-w-xl mx-auto"
            >
              <button
                id="cta-create-btn"
                onClick={() => router.push("/login")}
                className="group relative overflow-hidden active:scale-[0.97] transition-transform duration-150 h-12 md:h-14 px-8 md:px-10 rounded-full font-semibold text-base md:text-lg flex-1 sm:flex-none text-black hover:cursor-pointer"
                style={{ background: "linear-gradient(135deg, #fff44f 0%, #ffe94d 50%, #f0e04a 100%)" }}
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(circle at 50% 120%, rgba(255,255,255,0.5), transparent 70%)" }}
                />
                <span className="relative z-10">Create Free Account</span>
              </button>

              <a
                href="https://github.com/ahmrafi22/optizive"
                target="_blank"
                rel="noopener noreferrer"
                className="group active:scale-[0.97] transition-transform duration-150 h-12 md:h-14 px-6 md:px-8 rounded-full font-semibold text-base md:text-lg flex items-center justify-center gap-2 border border-white/15 bg-white/[0.03] text-zinc-100 hover:border-primary/40 hover:bg-white/[0.06] hover:text-white flex-1 sm:flex-none"
              >
                <FaGithub className="w-5 h-5 text-zinc-300 group-hover:text-primary transition-colors" />
                Explore on GitHub
              </a>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
