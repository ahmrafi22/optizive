"use client";

import { motion } from "motion/react";
import { FaGithub } from "react-icons/fa6";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const SITE_LINKS = [
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
];

const GITHUB_LINKS = [
  { label: "Fullstack App", href: "https://github.com/ahmrafi22/optizive" },
  { label: "Price Scraper", href: "https://github.com/ahmrafi22/optizive-price-compare-scraper" },
];

export function Footer() {
  return (
    <footer className="relative px-4 md:px-6 pt-10 md:pt-15 pb-8 max-w-7xl mx-auto">

      <div
        className="relative rounded-[1.5rem] md:rounded-[2rem] p-px overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,244,79,0.4) 0%, rgba(255,255,255,0.05) 30%, rgba(78,205,196,0.05) 70%, rgba(78,205,196,0.35) 100%)",
        }}
      >
        <div
          className="noise-overlay rounded-[calc(1.5rem-1px)] md:rounded-[calc(2rem-1px)] relative overflow-hidden"
          style={{
            background:
              "linear-gradient(155deg, #1c1c1c 0%, #121212 55%, #0d0d0d 100%)",
          }}
        >
        {/* Dual radial brand glows (yellow top-center, teal bottom-right) */}
        <div
          className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[480px] md:w-[720px] h-[240px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(255,244,79,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-10 w-[360px] md:w-[520px] h-[220px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 100% 100%, rgba(78,205,196,0.10) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6 p-7 md:p-12">
          {/* Brand block */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="md:col-span-5 flex flex-col"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "0.75rem",
                  padding: "6px 8px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="26" height="26" className="sm:w-[34px] sm:h-[34px]" viewBox="0 0 366 357" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M211.713 307.81c34.152-5.907 65.566-21.841 89.276-45.285 23.711-23.444 38.365-53.06 41.647-84.165s-4.995-61.928-23.524-87.593-46.252-44.71-78.787-54.124l-19.299 49.189c20.555 5.947 38.069 17.979 49.775 34.193 11.706 16.215 16.935 35.687 14.862 55.338-2.074 19.652-11.332 38.362-26.311 53.173-14.98 14.81-34.826 24.877-56.401 28.609z" fill="#111111" />
                  <path d="m133.226 324.474 78.652-16.815-8.788-50.656zm21.129-277.3c-34.322 4.82-66.225 19.75-90.668 42.43-24.442 22.68-40.029 51.816-44.296 82.802s3.029 62.055 20.734 88.295 44.81 46.155 77.03 56.596l20.85-48.552c-20.356-6.596-37.479-19.178-48.665-35.755s-15.795-36.206-13.099-55.782 12.543-37.982 27.985-52.31 35.597-23.761 57.28-26.806z" fill="#111111" />
                  <path d="M233.332 33.009 154.185 47.32l7.178 50.91z" fill="#111111" />
                </svg>
              </div>
              <span className="font-naston text-xl sm:text-2xl md:text-3xl tracking-widest text-white">
                OPTIZIVE
              </span>
            </div>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-sm font-serif italic">
              Precision tools for the modern digital merchant. Built for margins that compound.
            </p>
          </motion.div>

          {/* Links block */}
          <motion.nav
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
            className="md:col-span-4 grid grid-cols-2 gap-6 md:gap-4"
            aria-label="Footer"
          >
            <div>
              <h4 className="text-[0.7rem] font-bold tracking-[0.15em] uppercase text-zinc-500 mb-3">Explore</h4>
              <ul className="space-y-2.5">
                {SITE_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-300 hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[0.7rem] font-bold tracking-[0.15em] uppercase text-zinc-500 mb-3 flex items-center gap-1.5">
                <FaGithub className="w-3 h-3" /> Open Source
              </h4>
              <ul className="space-y-2.5">
                {GITHUB_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-primary transition-colors duration-200 group"
                    >
                      <FaGithub className="w-3.5 h-3.5 text-zinc-500 group-hover:text-primary transition-colors" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.nav>

          {/* CTA block — premium brand-gradient button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT }}
            className="md:col-span-3 flex flex-col justify-between gap-6"
          >
            <a
              href="https://github.com/ahmrafi22/optizive"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl border border-primary/30 px-4 py-3 flex items-center justify-between gap-3 transition-all duration-300 hover:border-primary/60"
              style={{ background: "linear-gradient(135deg, rgba(255,244,79,0.10) 0%, rgba(78,205,196,0.08) 100%)" }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "radial-gradient(circle at 50% 120%, rgba(255,244,79,0.22), transparent 70%)" }}
              />
              <span className="relative z-10 text-sm font-medium text-zinc-100 group-hover:text-white transition-colors">Star on GitHub</span>
              <FaGithub className="relative z-10 w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
            </a>
          </motion.div>
        </div>

        {/* Bottom bar with subtle gradient top border */}
        <div
          className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 px-7 md:px-12 py-5 border-t border-white/5"
        >
          <p className="text-xs md:text-sm text-zinc-500">
            © {new Date().getFullYear()} OPTIZIVE. All rights reserved.
          </p>
        </div>

        {/* Yellow fade gradient from bottom to top */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%]"
          style={{
            background:
              "linear-gradient(to top, rgba(255,244,79,0.08) 0%, transparent 100%)",
          }}
        />
        </div>
      </div>
    </footer>
  );
}
