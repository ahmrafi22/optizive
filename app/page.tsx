"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Package,
  Users,
  TrendingUp,
  ShoppingBasket,
  FileText,
  BarChart3,
  Database,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Activity,
  Bot,
  Zap,
  ScanBarcode,
  HandCoins,
} from "lucide-react";
import { IoPricetagSharp } from "react-icons/io5";
import { GiAndromedaChain } from "react-icons/gi";
import { MdOutlineInventory } from "react-icons/md";
import React from "react";

/* ─── Custom easing ─────────────────────────────────────── */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/* ─── Nav links ─────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
];

/* ─── Feature pills for the ticker ──────────────────────── */
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
      className="inline-flex items-center justify-center p-2 mx-1.5 rounded-xl bg-gradient-to-br from-yellow-400 via-[#fff44f] to-yellow-500 shadow-lg shadow-black/20 align-middle"
      style={{ fontSize: '0.6em' }}
    >
      <Icon className="text-black" />
    </motion.span>
  );
}

function MorphButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      id="hero-start-btn"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="btn-press relative overflow-hidden flex items-center justify-center h-12 px-7 rounded-xl font-archivo font-semibold text-sm cursor-pointer"
      style={{
        background: "var(--clr-yellow)",
        boxShadow: isHovered ? "none" : "0 0 28px rgba(255,244,79,0.4)",
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
            animate={isHovered ? "hover" : "rest"}
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
        animate={{ color: isHovered ? "#ffffff" : "#111111" }}
        transition={{ duration: 0.4 }}
      >
        {children}
      </motion.div>
    </button>
  );
}

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#111111] text-zinc-50 overflow-x-hidden selection:bg-yellow-400/30">

      {/* ══════════════════════════════════════════════════════
          HERO — 100 dvh wrapper
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative w-full flex justify-center"
        style={{ height: "100dvh", minHeight: 560 }}
      >
        {/* 92% constrained hero column */}
        <div className="relative w-[92%] h-full">


          {/* ── Video ─────────────────────────────────────── */}
          <div
            className="absolute top-0 left-0 right-0 overflow-hidden"
            style={{ height: "62dvh", borderRadius: "0 0 2rem 2rem" }}
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
              className="w-full h-full object-cover block"
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

          {/* ── Floating nav row ─────────────────────────── */}
          <div
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between"
            style={{ paddingTop: "1.5rem", paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              className="select-none flex items-center gap-3 logo-mark"
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
                <svg width="36" height="36" viewBox="0 0 366 357" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M211.713 307.81c34.152-5.907 65.566-21.841 89.276-45.285 23.711-23.444 38.365-53.06 41.647-84.165s-4.995-61.928-23.524-87.593-46.252-44.71-78.787-54.124l-19.299 49.189c20.555 5.947 38.069 17.979 49.775 34.193 11.706 16.215 16.935 35.687 14.862 55.338-2.074 19.652-11.332 38.362-26.311 53.173-14.98 14.81-34.826 24.877-56.401 28.609z" fill="#111111" />
                  <path d="m133.226 324.474 78.652-16.815-8.788-50.656zm21.129-277.3c-34.322 4.82-66.225 19.75-90.668 42.43-24.442 22.68-40.029 51.816-44.296 82.802s3.029 62.055 20.734 88.295 44.81 46.155 77.03 56.596l20.85-48.552c-20.356-6.596-37.479-19.178-48.665-35.755s-15.795-36.206-13.099-55.782 12.543-37.982 27.985-52.31 35.597-23.761 57.28-26.806z" fill="#111111" />
                  <path d="M233.332 33.009 154.185 47.32l7.178 50.91z" fill="#111111" />
                </svg>
              </div>
              <span className="font-naston text-xl md:text-2xl tracking-widest text-white">
                OPTIZIVE
              </span>
            </motion.div>


            {/* Nav links */}
            <motion.nav
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              className="flex items-center gap-6 md:gap-8"
              aria-label="Primary navigation"
            >
              {NAV_LINKS.map((link, i) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="nav-link text-sm font-archivo font-medium text-white/80"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {link.label}
                </a>
              ))}
            </motion.nav>
          </div>

          {/* ── Hero text + CTA ──────────────────────────── */}
          <div
            className="absolute left-0 right-0 bottom-0 z-10 flex flex-col justify-end"
            style={{ top: "62dvh", paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
          >
            {/* Top row: headline left, CTA right */}
            <div className="flex items-end justify-between gap-8 pb-5 md:pb-7">

              {/* Left: headline with staggered word reveal */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.01 }}
                className="flex-1 min-w-0"
              >
                <h1
                  className="font-archivo leading-[1.08] tracking-tight text-white"
                  style={{ fontSize: "clamp(2.1rem, 4.6vw, 3.7rem)", fontWeight: 700 }}
                >
                  {/* Line 1 */}
                  <span className="block" style={{ overflow: "hidden" }}>
                    <span className="hero-word" style={{ animationDelay: "0.2s", marginRight: "0.28em" }}>Manage</span>
                    <span className="hero-word" style={{ animationDelay: "0.28s", marginRight: "0.1em" }}>Inventory</span>
                    <HeroIcon icon={MdOutlineInventory} delay="0.32s" />
                    <span className="hero-word" style={{ animationDelay: "0.36s", marginRight: "0.1em" }}>Pricing</span>
                    <HeroIcon icon={IoPricetagSharp} delay="0.4s" />
                  </span>
                  {/* Line 2 */}
                  <span className="block" style={{ overflow: "hidden" }}>
                    <span className="hero-word" style={{ animationDelay: "0.48s", marginRight: "0.28em" }}>&</span>
                    <span className="hero-word" style={{ animationDelay: "0.56s", marginRight: "0.1em" }}>SupplyChain</span>
                    <HeroIcon icon={GiAndromedaChain} delay="0.6s" />
                    <span className="hero-word" style={{ animationDelay: "0.64s", marginRight: "0.28em" }}>with</span>
                    <span className="hero-word" style={{ animationDelay: "0.72s", marginRight: "0.28em" }}>Ease</span>
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
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0"
              >
                <MorphButton onClick={() => router.push("/login")}>
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
              className="ticker-wrap pb-6 md:pb-9 pt-4"
              aria-label="Platform features"
            >
              <div className="ticker-track gap-2.5">
                {[...FEATURE_PILLS, ...FEATURE_PILLS].map((pill, i) => (
                  <div key={i} className="feature-pill mx-1">
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


      {/* ══════════════════════════════════════════════════════
          FEATURES (Bento Grid)
      ══════════════════════════════════════════════════════ */}
      <main id="features" className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="font-naston text-4xl md:text-5xl mb-4">Architectural Components</h2>
          <p className="font-serif text-2xl text-zinc-400 italic">Precision tools for the modern digital merchant.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Smart Inventory */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bento-card noise-overlay md:col-span-8 p-8 group"
          >
            <div className="relative z-10">
              <Package className="bento-icon w-10 h-10 text-yellow-400 mb-6" />
              <h3 className="text-3xl font-naston mb-3 text-zinc-100">SmartInventory &amp; Expiry Tracker</h3>
              <p className="text-zinc-400 max-w-md mb-8 text-lg leading-relaxed">
                Never lose a margin to spoilage again. Real-time visual countdowns and automated reordering logic.
              </p>
              <div className="flex gap-4 overflow-hidden">
                <div className="bg-black/40 p-4 rounded-2xl min-w-[160px] border-l-4 border-rose-500">
                  <span className="block text-[10px] text-rose-500 font-bold uppercase tracking-widest mb-2">Expires in 2d</span>
                  <div className="text-lg font-semibold text-zinc-200">Organic Milk</div>
                  <div className="progress-bar mt-4"><div className="progress-fill bg-rose-500 w-4/5" /></div>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl min-w-[160px] border-l-4 border-emerald-500">
                  <span className="block text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-2">Stock Level 94%</span>
                  <div className="text-lg font-semibold text-zinc-200">Cold Brew</div>
                  <div className="progress-bar mt-4"><div className="progress-fill bg-emerald-500 w-full" /></div>
                </div>
              </div>
            </div>
            <Package className="bento-bg-icon w-[300px] h-[300px]" />
          </motion.div>

          {/* Demand Forecasting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bento-card md:col-span-4 p-8 flex flex-col group"
          >
            <Activity className="bento-icon w-10 h-10 text-blue-400 mb-6" />
            <h3 className="text-2xl font-naston mb-3 text-zinc-100">Demand Forecasting</h3>
            <p className="text-zinc-400 mb-auto leading-relaxed">
              Predictive curves for flash sales and festival spikes using neural networking.
            </p>
            <div className="mt-8 flex items-end gap-1.5 h-24">
              {[33, 50, 66, 90, 50].map((h, i) => (
                <div
                  key={i}
                  className="bar-chart-bar flex-1 bg-blue-500/30 group-hover:bg-blue-500/60"
                  style={{ height: `${h}%`, transitionDelay: `${i * 40}ms` }}
                />
              ))}
            </div>
          </motion.div>

          {/* Price Monitor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bento-card md:col-span-4 p-8 group"
          >
            <TrendingUp className="bento-icon w-10 h-10 text-purple-400 mb-6" />
            <h3 className="text-2xl font-naston mb-3 text-zinc-100">Price Monitor</h3>
            <p className="text-zinc-400 mb-6 leading-relaxed">Comparative charts &amp; insights to outpace competitors.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl text-sm">
                <span className="text-zinc-300">Competitor A</span>
                <span className="font-mono text-zinc-400">$29.99</span>
              </div>
              <div className="relative flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm overflow-hidden">
                <div className="shimmer absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full" />
                <span className="text-purple-400 font-semibold relative z-10">OPTIZIVE AI</span>
                <span className="font-mono text-purple-400 font-bold relative z-10">$27.50</span>
              </div>
            </div>
          </motion.div>

          {/* Smart Procurement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bento-card noise-overlay md:col-span-8 p-8 relative overflow-hidden group"
          >
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <Users className="bento-icon w-10 h-10 text-emerald-400 mb-6" />
                <h3 className="text-3xl font-naston mb-3 text-zinc-100">Smart Procurement</h3>
                <p className="text-zinc-400 mb-6 text-lg leading-relaxed">
                  Connect with social network procurement groups. Unlock tiered pricing with collective buying tags.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="tag bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Group Active</span>
                  <span className="tag bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">Save 15%</span>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center pointer-events-none">
                <div className="relative h-40 w-40">
                  <div className="absolute inset-0 border-[3px] border-dashed border-white/10 rounded-full group-hover:animate-[spin_10s_linear_infinite]" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-black rounded-full border-2 border-emerald-400 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-10 h-10 bg-black rounded-full border-2 border-blue-400 flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 blur-xl absolute" />
                    <Users className="w-10 h-10 text-emerald-400 relative z-10" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Basket Engine */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bento-card md:col-span-6 p-8 flex flex-col justify-between group"
          >
            <div>
              <ShoppingBasket className="bento-icon w-10 h-10 text-pink-400 mb-6" />
              <h3 className="text-3xl font-naston mb-3 text-zinc-100">Basket Engine</h3>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Upsell logic that actually converts. Smart product bundling based on real behavioral data.
              </p>
            </div>
            <div className="mt-8 flex gap-4 items-center">
              <div className="relative bg-black/40 p-4 rounded-2xl border border-white/10 group-hover:border-pink-500/30" style={{ transition: "border-color 240ms var(--ease-out-strong)" }}>
                <Package className="w-8 h-8 text-zinc-400 group-hover:text-pink-400" style={{ transition: "color 200ms ease" }} />
                <span className="absolute -top-3 -right-3 bg-pink-500 text-white px-2 py-1 rounded-lg text-[10px] font-black shadow-lg shadow-pink-500/20">+ UPSELL</span>
              </div>
              <div className="w-8 border-t border-dashed border-zinc-600" />
              <div className="bg-black/40 p-4 rounded-2xl border border-white/10">
                <Package className="w-8 h-8 text-zinc-400" />
              </div>
            </div>
          </motion.div>

          {/* REST API */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bento-card md:col-span-6 p-8 font-mono text-sm group"
            style={{ background: "#0a0a0a" }}
          >
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-xl font-bold font-sans text-cyan-400 flex items-center gap-2">
                <FileText className="w-6 h-6" /> API Integration
              </h3>
              <span className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] rounded-full">v1.2.0</span>
            </div>
            <div className="space-y-2 text-zinc-500 bg-black/50 p-4 rounded-xl border border-white/5">
              <p><span className="text-purple-400">POST</span> /api/v1/payments/track</p>
              <p className="pl-4">{"{"}</p>
              <p className="pl-8">&quot;seller_id&quot;: <span className="text-yellow-400">&quot;INF_8829&quot;</span>,</p>
              <p className="pl-8">&quot;status&quot;: <span className="text-emerald-400">&quot;COMPLETED&quot;</span>,</p>
              <p className="pl-8">&quot;method&quot;: <span className="text-yellow-400">&quot;USSD_MOBILE_MONEY&quot;</span></p>
              <p className="pl-4">{"}"}</p>
            </div>
            <div className="mt-6 p-4 bg-zinc-900/80 rounded-xl border border-white/5 flex items-center justify-between font-sans">
              <span className="text-sm font-medium text-zinc-300">Invoice #8841-B</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-400/10 px-3 py-1 rounded-full">
                <div className="pulse-dot w-2 h-2 rounded-full bg-emerald-400" /> PAID
              </span>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════
          CTA Section
      ══════════════════════════════════════════════════════ */}
      <section id="about" className="max-w-5xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="noise-overlay rounded-[3rem] border border-white/10 p-12 md:p-20 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #1a1a1a 0%, #0a0a0a 100%)" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(255,244,79,0.1) 0%, transparent 70%)" }}
          />
          <div className="relative z-10">
            <h2 className="font-naston text-4xl md:text-6xl mb-6">Ready to Optizive?</h2>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto font-serif italic">
              Join thousands of modern sellers leveraging AI and smart insights to dominate their market.
            </p>
            <button
              id="cta-create-btn"
              onClick={() => router.push("/login")}
              className="btn-press h-14 px-10 rounded-full bg-white text-black font-semibold text-lg"
            >
              Create Free Account
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-sm text-zinc-500">
        <p>© {new Date().getFullYear()} OPTIZIVE. All rights reserved.</p>
      </footer>

    </div>
  );
}
