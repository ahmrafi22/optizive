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
} from "lucide-react";
import { IoPricetagSharp } from "react-icons/io5";
import { GiAndromedaChain } from "react-icons/gi";
import { MdOutlineInventory } from "react-icons/md";
import { MorphButton } from "./MorphButton";
import { Navbar } from "./Navbar";
import { useState } from "react";

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

  const handleStartOptimizing = () => {
    setIsNavigating(true);
    router.push("/login");
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
                    <span className="hero-word" style={{ animationDelay: "0.2s", marginRight: "0.28em" }}>Manage</span>
                  </span>
                  
                  <span className="hero-word inline-block" style={{ animationDelay: "0.28s", marginRight: "0.1em" }}>Inventory</span>
                  <span className="inline-block align-middle"><HeroIcon icon={MdOutlineInventory} delay="0.32s" /></span>
                  <span className="hero-word inline-block" style={{ animationDelay: "0.36s", marginRight: "0.1em", marginLeft: "0.1em" }}>Pricing</span>
                  <span className="inline-block align-middle"><HeroIcon icon={IoPricetagSharp} delay="0.4s" /></span>

                  <br className="hidden md:block" />

                  <span className="hero-word inline-block" style={{ animationDelay: "0.48s", marginRight: "0.28em", marginLeft: "0.1em" }}>&</span>
                  <span className="hero-word inline-block" style={{ animationDelay: "0.56s", marginRight: "0.1em" }}>SupplyChain</span>
                  <span className="inline-block align-middle"><HeroIcon icon={GiAndromedaChain} delay="0.6s" /></span>
                  
                  {/* Mobile Only 'Manage' (comes after SupplyChain icon) */}
                  <span className="inline-block md:hidden">
                    <span className="hero-word" style={{ animationDelay: "0.64s", marginRight: "0.28em", marginLeft: "0.1em" }}>Manage</span>
                  </span>

                  <span className="hero-word inline-block" style={{ animationDelay: "0.68s", marginRight: "0.28em", marginLeft: "0.1em" }}>with</span>
                  <span className="hero-word inline-block" style={{ animationDelay: "0.76s", marginRight: "0.28em" }}>Ease</span>
                </span>
                {/* Line 3 */}
                <span className="flex items-center flex-wrap mt-2 italic" >

                  {["Optimized", "with", "AI"].map((word, i) => (
                    <span
                      key={word + i}
                      className="hero-word font-instrument"
                      style={{
                        color: "var(--clr-yellow)",
                        fontSize: "1.15em",
                        fontWeight: 500,
                        animationDelay: `${0.88 + i * 0.08}s`,
                        marginRight: "0.25em"
                      }}
                    >
                      {word}
                    </span>
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
              >
                Start Optimizing
                <ArrowRight className="w-4 h-4 arrow-icon" />
              </MorphButton>
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
                  <pill.Icon className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                  <span>{pill.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>{/* end 92% wrapper */}
    </section>
  );
}
