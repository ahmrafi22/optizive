"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  Package,
  Users,
  TrendingUp,
  ShoppingBasket,
  FileText,
  BarChart3,
  Database,
  Bot,
  ArrowRight,
  Activity,
  HandCoins,
  Info,
  X,
  Loader2,
} from "lucide-react";
import { IoPricetagSharp } from "react-icons/io5";
import { GiAndromedaChain } from "react-icons/gi";
import { MdOutlineInventory } from "react-icons/md";
import { MorphButton } from "./MorphButton";
import { Navbar } from "./Navbar";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-constants";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const FEATURE_PILLS = [
  { label: "SmartInventory & Expiry Tracker", Icon: Package },
  { label: "Smart Supplier Recommender", Icon: Users },
  { label: "Co-operative Buying Network", Icon: HandCoins },
  { label: "Price Monitoring & Competitor Analysis", Icon: TrendingUp },
  { label: "Demand Forecasting for Flash Sales", Icon: Activity },
  { label: "Basket Recommendation Engine", Icon: ShoppingBasket },
  { label: "Invoice & Payment Tracking", Icon: FileText },
  { label: "Backend Analytics Dashboard", Icon: BarChart3 },
  { label: "Inventory & Sales Records", Icon: Database },
  { label: "AI Q&A Chatbot", Icon: Bot },
];

function HeroIcon({ icon: Icon, delay }: { icon: any; delay: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7, filter: "blur(12px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{
        delay: parseFloat(delay.replace('s', '')),
        duration: 0.5,
        ease: EASE_OUT
      }}
      className="inline-flex items-center justify-center p-2 mx-1.5 rounded-xl bg-primary shadow-lg shadow-black/20 align-middle translate-y-[-0.08em]"
      style={{ fontSize: '0.6em' }}
    >
      <Icon className="text-black" />
    </motion.span>
  );
}

export function HeroSection() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDemoNavigating, setIsDemoNavigating] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const handleStartOptimizing = () => {
    setIsNavigating(true);
    router.push("/login");
  };

  const handleCheckDemo = async () => {
    setIsDemoNavigating(true);
    try {
      const result = await signIn("credentials", {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        redirect: false,
      });
      if (result?.ok) {
        router.push("/dashboard");
        return;
      }
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <section
      className="relative w-full flex justify-center"
      style={{ height: "100dvh", minHeight: 560 }}
    >
      {/* 92% constrained hero column */}
      <div className="relative w-[100%] sm:w-[92%] h-full sm:px-0 px-4">
        {/* ── Video ─────────────────────────────────────── */}
        <div
          className="absolute top-0 left-0 right-0 overflow-hidden sm:rounded-b-[2rem] h-[68dvh] sm:h-[62dvh]"
        >
          <video
            src="/final.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full object-cover block scale-[1.05] sm:scale-100 translate-y-[2%] sm:translate-y-0"
          />
          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.45) 100%)",
            }}
          />
        </div>

        <Navbar />

        {/* ── Hero text + CTA ──────────────────────────── */}
        <div
          className="absolute left-0 right-0 bottom-0 z-10 flex flex-col justify-end pt-8 md:pt-0 top-[68dvh] sm:top-[62dvh]"
          style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
        >
          {/* Top row: headline left, CTA right */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-8 pb-5 md:pb-7">

            {/* Left: headline with staggered word reveal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.01 }}
              className="flex-1 min-w-0"
            >
              <h1
                className="font-archivo leading-[1.1] tracking-tight text-white"
                style={{ fontSize: "clamp(1.8rem, 4.6vw, 3.7rem)", fontWeight: 700 }}
              >
                {/* Unified Text Block */}
                <span className="block leading-[1.2] md:leading-[1.1] " style={{ overflow: "hidden" }}>
                  {/* Desktop Only 'Manage' */}
                    <span className="hidden md:inline-block">
                    <motion.span
                      initial={{ opacity: 0, y: 18, clipPath: "inset(0 -0.5em 100% -0.5em)" }}
                      animate={{ opacity: 1, y: 0, clipPath: "inset(0 -0.5em 0% -0.5em)" }}
                      transition={{ delay: 0.2, duration: 0.55, ease: EASE_OUT }}
                      className="inline-block pr-[0.12em] -mr-[0.12em]"
                      style={{ marginRight: "0.28em" }}
                    >Manage</motion.span>
                    </span>
                    
                    <motion.span
                      initial={{ opacity: 0, y: 18, clipPath: "inset(0 -0.5em 100% -0.5em)" }}
                      animate={{ opacity: 1, y: 0, clipPath: "inset(0 -0.5em 0% -0.5em)" }}
                      transition={{ delay: 0.28, duration: 0.55, ease: EASE_OUT }}
                      className="inline-block pr-[0.12em] -mr-[0.12em]"
                      style={{ marginRight: "0.1em" }}
                    >Inventory</motion.span>
                    <span className="inline-block align-middle"><HeroIcon icon={MdOutlineInventory} delay="0.32s" /></span>
                    <motion.span
                      initial={{ opacity: 0, y: 18, clipPath: "inset(0 -0.5em 100% -0.5em)" }}
                      animate={{ opacity: 1, y: 0, clipPath: "inset(0 -0.5em 0% -0.5em)" }}
                      transition={{ delay: 0.36, duration: 0.55, ease: EASE_OUT }}
                      className="inline-block pr-[0.12em] -mr-[0.12em]"
                      style={{ marginRight: "0.1em", marginLeft: "0.1em" }}
                    >Pricing</motion.span>
                    <span className="inline-block align-middle"><HeroIcon icon={IoPricetagSharp} delay="0.4s" /></span>

                    <br className="hidden md:block" />

                    <motion.span
                      initial={{ opacity: 0, y: 18, clipPath: "inset(0 -0.5em 100% -0.5em)" }}
                      animate={{ opacity: 1, y: 0, clipPath: "inset(0 -0.5em 0% -0.5em)" }}
                      transition={{ delay: 0.48, duration: 0.55, ease: EASE_OUT }}
                      className="inline-block pr-[0.12em] -mr-[0.12em]"
                      style={{ marginRight: "0.28em", marginLeft: "0.1em" }}
                    >&</motion.span>
                    <motion.span
                      initial={{ opacity: 0, y: 18, clipPath: "inset(0 -0.5em 100% -0.5em)" }}
                      animate={{ opacity: 1, y: 0, clipPath: "inset(0 -0.5em 0% -0.5em)" }}
                      transition={{ delay: 0.56, duration: 0.55, ease: EASE_OUT }}
                      className="inline-block pr-[0.12em] -mr-[0.12em]"
                      style={{ marginRight: "0.1em" }}
                    >SupplyChain</motion.span>
                    <span className="inline-block align-middle"><HeroIcon icon={GiAndromedaChain} delay="0.6s" /></span>
                    
                    {/* Mobile Only 'Manage' (comes after SupplyChain icon) */}
                    <span className="inline-block md:hidden">
                      <motion.span
                        initial={{ opacity: 0, y: 18, clipPath: "inset(0 -0.5em 100% -0.5em)" }}
                        animate={{ opacity: 1, y: 0, clipPath: "inset(0 -0.5em 0% -0.5em)" }}
                        transition={{ delay: 0.64, duration: 0.55, ease: EASE_OUT }}
                        className="inline-block pr-[0.12em] -mr-[0.12em]"
                        style={{ marginRight: "0.28em", marginLeft: "0.1em" }}
                      >Manage</motion.span>
                    </span>

                    <motion.span
                      initial={{ opacity: 0, y: 18, clipPath: "inset(0 -0.5em 100% -0.5em)" }}
                      animate={{ opacity: 1, y: 0, clipPath: "inset(0 -0.5em 0% -0.5em)" }}
                      transition={{ delay: 0.68, duration: 0.55, ease: EASE_OUT }}
                      className="inline-block pr-[0.12em] -mr-[0.12em]"
                      style={{ marginRight: "0.28em", marginLeft: "0.1em" }}
                    >with</motion.span>
                    <motion.span
                      initial={{ opacity: 0, y: 18, clipPath: "inset(0 -0.5em 100% -0.5em)" }}
                      animate={{ opacity: 1, y: 0, clipPath: "inset(0 -0.5em 0% -0.5em)" }}
                      transition={{ delay: 0.76, duration: 0.55, ease: EASE_OUT }}
                      className="inline-block pr-[0.12em] -mr-[0.12em]"
                      style={{ marginRight: "0.28em" }}
                    >Ease</motion.span>
                  </span>
                  {/* Line 3 */}
                  <span className="flex items-center flex-wrap mt-2 italic" >

                    {["Optimized", "with", "AI"].map((word, i) => (
                      <motion.span
                        key={word + i}
                        initial={{ opacity: 0, y: 18, clipPath: "inset(0 -0.5em 100% -0.5em)" }}
                        animate={{ opacity: 1, y: 0, clipPath: "inset(0 -0.5em 0% -0.5em)" }}
                        transition={{ delay: 0.88 + i * 0.08, duration: 0.55, ease: EASE_OUT }}
                        className="font-instrument inline-block pr-[0.12em] -mr-[0.12em]"
                        style={{
                          color: "var(--clr-yellow)",
                          fontSize: "1.15em",
                          fontWeight: 500,
                          marginRight: "0.25em"
                        }}
                      >
                        {word}
                      </motion.span>
                    ))}
                </span>
              </h1>
            </motion.div>

            {/* Right: CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52, duration: 0.55, ease: EASE_OUT }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 w-full lg:w-auto mt-2 lg:mt-0"
            >
              <MorphButton
                onClick={handleStartOptimizing}
                isLoading={isNavigating}
                icon={<ArrowRight className="w-4 h-4 transition-transform duration-220 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1" />}
              >
                Start Optimizing
              </MorphButton>
              <button
                onClick={handleCheckDemo}
                disabled={isDemoNavigating}
                className="flex items-center justify-center h-12 px-7 rounded-xl font-archivo font-semibold text-sm w-full sm:w-auto text-white disabled:opacity-60 disabled:cursor-wait cursor-pointer"
                style={{ background: "var(--clr-charcoal)", border: "1px solid var(--clr-charcoal)" }}
              >
                {isDemoNavigating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in…
                  </>
                ) : (
                  "Check Demo"
                )}
              </button>
              <button
                onClick={() => setIsInfoOpen(true)}
                aria-label="How it works"
                className="flex items-center justify-center h-12 px-4 rounded-xl font-archivo font-semibold text-sm w-full sm:w-auto text-white cursor-pointer"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <Info className="w-4 h-4 mr-2" />
                How it works
              </button>
            </motion.div>
          </div>

          {/* ── Feature ticker strip ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.68, duration: 0.5, ease: EASE_OUT }}
            className="ticker-wrap pb-6 md:pb-9 pt-2 md:pt-4"
            aria-label="Platform features"
          >
            <div className="ticker-track gap-2.5">
              {[...FEATURE_PILLS, ...FEATURE_PILLS].map((pill, i) => (
                <div key={i} className="feature-pill mx-1 text-xs md:text-sm whitespace-nowrap">
                  <span className="pill-dot" aria-hidden="true" />
                  <pill.Icon className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  <span>{pill.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>{/* end 92% wrapper */}

      {/* ── How it works modal ─────────────────────── */}
      {isInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsInfoOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#141414] p-6 md:p-8"
          >
            <button
              onClick={() => setIsInfoOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-archivo text-2xl font-bold text-white mb-4">
              How Optizive works
            </h3>
            <ul className="space-y-3 text-sm text-zinc-300 leading-relaxed">
              {[
                ["1", "Add your inventory", "Track products, costs, stock levels and expiry dates in one place."],
                ["2", "Get AI insights", "Demand forecasts, flash-sale suggestions and smart restock recommendations."],
                ["3", "Connect with suppliers", "The recommender matches you with reliable suppliers and bulk discounts."],
                ["4", "Sell & co-operate", "Create smart baskets, join the buying network and auto-generate invoices."],
                ["5", "Monitor the market", "Compare prices, watch competitors and stay ahead of every trend."],
                ["6", "Ask the AI assistant", "Get instant answers about your store from the built-in chatbot."],
              ].map(([n, title, desc]) => (
                <li key={n} className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-black text-xs font-bold shrink-0 mt-0.5">
                    {n}
                  </span>
                  <p>
                    <span className="text-white font-semibold">{title} — </span>
                    {desc}
                  </p>
                </li>
              ))}
            </ul>
            <button
              onClick={handleCheckDemo}
              className="mt-6 w-full flex items-center justify-center h-12 rounded-xl font-archivo font-semibold text-sm text-black cursor-pointer"
              style={{ background: "var(--clr-yellow)" }}
            >
              Try it with the demo →
            </button>
          </motion.div>
        </div>
      )}
    </section>
  );
}
