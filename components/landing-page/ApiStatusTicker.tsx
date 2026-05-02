"use client";

import { motion } from "motion/react";
import { Loader2, Check } from "lucide-react";

import { useState, useEffect } from "react";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function ApiStatusTicker() {
  const [apiState, setApiState] = useState<"idle" | "loading" | "success">("idle");

  useEffect(() => {
    let isMounted = true;
    const runCycle = () => {
      if (!isMounted) return;
      setApiState("loading");
      
      setTimeout(() => {
        if (!isMounted) return;
        setApiState("success");
      }, 1500);

      setTimeout(() => {
        if (!isMounted) return;
        setApiState("idle");
      }, 4000);
    };

    runCycle();
    const interval = setInterval(runCycle, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div
      layout
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors duration-300"
      style={{
        background: apiState === "success" ? "rgba(255,244,79,0.15)" : "rgba(255,255,255,0.05)",
        color: apiState === "success" ? "var(--clr-yellow)" : "#a1a1aa",
        border: `1px solid ${apiState === "success" ? "rgba(255,244,79,0.3)" : "rgba(255,255,255,0.1)"}`
      }}
    >
      <motion.div
        key={apiState}
        initial={{ opacity: 0, filter: "blur(4px)", y: 4 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="flex items-center gap-2"
      >
        {apiState === "idle" && <span>Awaiting...</span>}
        {apiState === "loading" && <><Loader2 className="animate-spin w-3.5 h-3.5" /> <span>Hit...</span></>}
        {apiState === "success" && <><Check className="w-3.5 h-3.5" /> <span>Paid</span></>}
      </motion.div>
    </motion.div>
  );
}
