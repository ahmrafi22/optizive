"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between"
        style={{ paddingTop: "1.5rem", paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          className="select-none flex items-center gap-2 sm:gap-3 logo-mark z-50"
        >
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
            <svg width="28" height="28" className="sm:w-[36px] sm:h-[36px]" viewBox="0 0 366 357" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M211.713 307.81c34.152-5.907 65.566-21.841 89.276-45.285 23.711-23.444 38.365-53.06 41.647-84.165s-4.995-61.928-23.524-87.593-46.252-44.71-78.787-54.124l-19.299 49.189c20.555 5.947 38.069 17.979 49.775 34.193 11.706 16.215 16.935 35.687 14.862 55.338-2.074 19.652-11.332 38.362-26.311 53.173-14.98 14.81-34.826 24.877-56.401 28.609z" fill="#111111" />
              <path d="m133.226 324.474 78.652-16.815-8.788-50.656zm21.129-277.3c-34.322 4.82-66.225 19.75-90.668 42.43-24.442 22.68-40.029 51.816-44.296 82.802s3.029 62.055 20.734 88.295 44.81 46.155 77.03 56.596l20.85-48.552c-20.356-6.596-37.479-19.178-48.665-35.755s-15.795-36.206-13.099-55.782 12.543-37.982 27.985-52.31 35.597-23.761 57.28-26.806z" fill="#111111" />
              <path d="M233.332 33.009 154.185 47.32l7.178 50.91z" fill="#111111" />
            </svg>
          </div>
          <span className="font-naston text-lg sm:text-xl md:text-2xl tracking-widest text-white">
            OPTIZIVE
          </span>
        </motion.div>

        {/* Desktop Nav links */}
        <motion.nav
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          className="hidden md:flex items-center gap-4 sm:gap-6 md:gap-8"
          aria-label="Primary navigation"
        >
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-link text-xs sm:text-sm font-archivo font-medium text-white/80 hover:text-white transition-colors"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {link.label}
            </a>
          ))}
        </motion.nav>

        {/* Mobile Toggle */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden z-50 p-2 text-white/90 hover:text-white"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="fixed inset-0 z-40 bg-[#111111]/95 backdrop-blur-xl md:hidden flex flex-col items-center justify-center gap-8"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.4, ease: EASE_OUT }}
                onClick={() => setIsOpen(false)}
                className="text-2xl font-archivo font-semibold text-white hover:text-primary transition-colors"
              >
                {link.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
