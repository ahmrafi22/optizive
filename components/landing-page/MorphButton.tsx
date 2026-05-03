"use client";

import React from "react";
import { motion } from "motion/react";
import { useState } from "react";

import { Loader2 } from "lucide-react";

export function MorphButton({
  children,
  onClick,
  isLoading = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      id="hero-start-btn"
      onClick={!isLoading ? onClick : undefined}
      disabled={isLoading}
      onMouseEnter={() => !isLoading && setIsHovered(true)}
      onMouseLeave={() => !isLoading && setIsHovered(false)}
      className={`btn-press relative overflow-hidden flex items-center justify-center h-12 px-7 rounded-xl font-archivo font-semibold text-sm w-full sm:w-auto ${isLoading ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
      style={{
        background: "var(--clr-yellow)",
        border: "1px solid var(--clr-yellow)",
        outline: "none",
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: "inherit", overflow: "hidden" }}>
        <svg
          style={{ width: "100%", height: "100%" }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <motion.path
            fill="var(--clr-charcoal)"
            initial="rest"
            animate={(isHovered || isLoading) ? "hover" : "rest"}
            variants={{
              rest: {
                d: "M 0 100 V 100 Q 50 100 100 100 V 100 z",
                transition: { duration: 0.4, ease: "easeOut" }
              },
              hover: {
                d: [
                  "M 0 100 V 100 Q 50 100 100 100 V 100 z",
                  "M 0 100 V 50 Q 50 0 100 50 V 100 z",
                  "M 0 100 V 0 Q 50 0 100 0 V 100 z"
                ],
                transition: { duration: 0.5, times: [0, 0.5, 1], ease: ["easeIn", "easeOut"] }
              }
            }}
          />
        </svg>
      </div>
      <motion.div
        className="relative z-10 flex items-center gap-2"
        initial={false}
        animate={{ color: (isHovered || isLoading) ? "#ffffff" : "#111111" }}
        transition={{ duration: 0.4 }}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          children
        )}
      </motion.div>
    </button>
  );
}
