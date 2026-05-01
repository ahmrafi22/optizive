"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Globe, Cpu, CheckCircle2, Loader2 } from "lucide-react";

export type PipelineStep = "idle" | "browsing" | "scraping" | "analyzing" | "completed" | "error";

interface PipelineStatusProps {
  step: PipelineStep;
}

const steps = [
  {
    id: "browsing",
    label: "Browsing Web",
    description: "Searching for product listings across multiple domains...",
    icon: Search,
  },
  {
    id: "scraping",
    label: "Scraping Content",
    description: "Extracting pricing and availability data from candidate pages...",
    icon: Globe,
  },
  {
    id: "analyzing",
    label: "AI Analysis",
    description: "Normalizing prices and generating market insights...",
    icon: Cpu,
  },
];

export default function PipelineStatus({ step }: PipelineStatusProps) {
  if (step === "idle" || step === "completed" || step === "error") return null;

  const currentIndex = steps.findIndex((s) => s.id === step);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8"
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">Pipeline Progress</h3>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Processing
            </span>
          </div>
        </div>

        <div className="relative space-y-8">
          {/* Progress Line */}
          <div className="absolute left-[19px] top-2 h-[calc(100%-16px)] w-px bg-zinc-100" />

          {steps.map((s, index) => {
            const isCompleted = currentIndex > index;
            const isActive = currentIndex === index;

            const Icon = s.icon;

            return (
              <div key={s.id} className="relative flex items-start gap-4">
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="completed"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        key="active"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                      >
                        <Icon className="h-5 w-5" />
                        <motion.div
                          layoutId="active-glow"
                          className="absolute -inset-1 rounded-full bg-zinc-900/10"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="pending"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-400"
                      >
                        <Icon className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col pt-1">
                  <span
                    className={`text-sm font-semibold transition-colors duration-300 ${
                      isActive ? "text-zinc-900" : isCompleted ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    {s.label}
                  </span>
                  <AnimatePresence>
                    {isActive && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-1 overflow-hidden text-sm leading-relaxed text-zinc-600"
                      >
                        {s.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
