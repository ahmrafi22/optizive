"use client";

import { motion } from "motion/react";
import { IoPricetagSharp, IoCartOutline, IoPeopleOutline } from "react-icons/io5";
import { MdOutlineInventory, MdOutlineAutoGraph, MdOutlineGroups } from "react-icons/md";
import { TbApi } from "react-icons/tb";
import { LuMilk, LuCoffee} from "react-icons/lu";
import { GiChickenOven } from "react-icons/gi";
import { PiBreadFill } from "react-icons/pi";
import { ApiStatusTicker } from "./ApiStatusTicker";

export function FeaturesSection() {
  return (
    <main id="features" className="relative z-10 py-16 md:py-24 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="mb-12 md:mb-16 text-center">
        <h2 className="font-naston text-3xl md:text-4xl lg:text-5xl mb-4">Architectural Components</h2>
        <p className="font-serif text-lg md:text-xl lg:text-2xl text-zinc-400 italic">Precision tools for the modern digital merchant.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Smart Inventory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bento-card noise-overlay md:col-span-12 lg:col-span-8 p-6 md:p-8 group flex flex-col justify-between overflow-hidden relative"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <MdOutlineInventory className="transition-transform duration-240 ease-[cubic-bezier(0.23,1,0.32,1)] w-8 h-8 md:w-10 md:h-10 text-primary" />
              <h3 className="text-2xl md:text-3xl font-naston text-zinc-100">SmartInventory &amp; Expiry Tracker</h3>
            </div>
            <p className="text-zinc-400 max-w-md mb-8 text-base md:text-lg leading-relaxed">
              Never lose a margin to spoilage again. Real-time visual countdowns and automated reordering logic.
            </p>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
              <div className="bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 group-hover:border-primary/30 transition-colors duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-[8px] md:text-[10px] text-primary/80 group-hover:text-primary font-bold uppercase tracking-widest transition-colors duration-300">Expires 2d</span>
                  <LuMilk className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors duration-300" />
                </div>
                <div className="text-xs md:text-sm font-semibold text-zinc-200">Milk</div>
                <div className="h-[3px] rounded-full overflow-hidden bg-white/6 mt-2 md:mt-4"><div className="h-full rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] bg-primary/50 group-hover:bg-primary w-4/5" /></div>
              </div>

              <div className="bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 group-hover:border-zinc-400/50 transition-colors duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-[8px] md:text-[10px] text-zinc-500 group-hover:text-zinc-400 font-bold uppercase tracking-widest transition-colors duration-300">Stock 94%</span>
                  <LuCoffee className="w-4 h-4 text-zinc-500 group-hover:text-zinc-400 transition-colors duration-300" />
                </div>
                <div className="text-xs md:text-sm font-semibold text-zinc-200">Cold Brew</div>
                <div className="h-[3px] rounded-full overflow-hidden bg-white/6 mt-2 md:mt-4"><div className="h-full rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] bg-zinc-600 group-hover:bg-zinc-400 w-full" /></div>
              </div>

              <div className="bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 group-hover:border-primary/30 transition-colors duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-[8px] md:text-[10px] text-red-400 font-bold uppercase tracking-widest transition-colors duration-300">Stock 15%</span>
                  <PiBreadFill className="w-4 h-4 text-red-400 transition-colors duration-300" />
                </div>
                <div className="text-xs md:text-sm font-semibold text-zinc-200">Bread</div>
                <div className="h-[3px] rounded-full overflow-hidden bg-white/6 mt-2 md:mt-4"><div className="h-full rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] bg-red-500/50 group-hover:bg-red-500 w-[15%]" /></div>
              </div>

              <div className="hidden md:block bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 group-hover:border-primary/30 transition-colors duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-[8px] md:text-[10px] text-primary font-bold uppercase tracking-widest transition-colors duration-300">Expires 1d</span>
                  <GiChickenOven className="w-4 h-4 text-primary transition-colors duration-300" />
                </div>
                <div className="text-xs md:text-sm font-semibold text-zinc-200">Chicken</div>
                <div className="h-[3px] rounded-full overflow-hidden bg-white/6 mt-2 md:mt-4"><div className="h-full rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] bg-primary w-1/5" /></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Demand Forecasting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bento-card md:col-span-6 lg:col-span-4 p-6 md:p-8 flex flex-col group"
        >
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <MdOutlineAutoGraph className="transition-transform duration-240 ease-[cubic-bezier(0.23,1,0.32,1)] w-8 h-8 md:w-10 md:h-10 text-primary" />
            <h3 className="text-xl md:text-2xl font-naston text-zinc-100">Demand Forecasting</h3>
          </div>
          <p className="text-zinc-400 mb-auto leading-relaxed text-sm md:text-base">
            Predictive curves for flash sales and festival spikes using neural networking.
          </p>
          <div className="mt-8 flex items-end gap-1.5 h-20 md:h-24">
            {[33, 50, 66, 90, 50].map((h, i) => (
              <div
                key={i}
                className="rounded-t-md transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] flex-1 bg-primary/30 group-hover:bg-primary"
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
          className="bento-card md:col-span-6 lg:col-span-4 p-6 md:p-8 group"
        >
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <IoPricetagSharp className="transition-transform duration-240 ease-[cubic-bezier(0.23,1,0.32,1)] w-8 h-8 md:w-10 md:h-10 text-primary" />
            <h3 className="text-xl md:text-2xl font-naston text-zinc-100">Price Monitor</h3>
          </div>
          <p className="text-zinc-400 mb-6 leading-relaxed text-sm md:text-base">Comparative charts &amp; insights to outpace competitors.</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl text-sm border border-transparent group-hover:border-white/5 transition-colors">
              <span className="text-zinc-300">Competitor A</span>
              <span className="font-mono text-zinc-500 line-through group-hover:text-zinc-400 transition-colors">$29.99</span>
            </div>
            <div className="relative flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-xl text-sm overflow-hidden group-hover:bg-primary/20 transition-colors duration-300">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 2.4, ease: "linear", repeat: Infinity }}
                className="absolute inset-0 bg-linear-to-r from-transparent via-primary/10 to-transparent"
              />
              <span className="text-primary font-semibold relative z-10">OPTIZIVE AI</span>
              <span className="font-mono text-primary font-bold relative z-10 group-hover:scale-110 origin-right transition-transform duration-300 ease-out">$27.50</span>
            </div>
          </div>
        </motion.div>

        {/* Smart Procurement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bento-card noise-overlay md:col-span-12 lg:col-span-8 p-6 md:p-8 relative overflow-hidden group"
        >
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <IoPeopleOutline className="transition-transform duration-240 ease-[cubic-bezier(0.23,1,0.32,1)] w-8 h-8 md:w-10 md:h-10 text-primary" />
                <h3 className="text-2xl md:text-3xl font-naston text-zinc-100">Smart Procurement</h3>
              </div>
              <p className="text-zinc-400 mb-6 text-sm md:text-lg leading-relaxed">
                Connect with social network procurement groups. Unlock tiered pricing with collective buying tags.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-[0.65rem] py-[0.2rem] rounded-full text-[0.65rem] font-bold tracking-[0.08em] uppercase bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 group-hover:bg-zinc-800 group-hover:border-zinc-600 transition-colors text-xs md:text-sm">Group Active</span>
                <span className="inline-flex items-center gap-1 px-[0.65rem] py-[0.2rem] rounded-full text-[0.65rem] font-bold tracking-[0.08em] uppercase bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary/20 transition-colors text-xs md:text-sm">Save 15%</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center pointer-events-none mt-4 md:mt-0 gap-4 md:gap-8 md:translate-y-6 -translate-y-2">
              {/* Circle 1 - 2 People */}
              <div className="relative h-24 w-24 md:h-36 md:w-36 shrink-0">
                <div className="absolute inset-0 border-2 md:border-[3px] border-dashed border-primary/30 md:border-white/10 rounded-full animate-[spin_10s_linear_infinite] md:[animation-play-state:paused] md:group-hover:[animation-play-state:running] md:group-hover:border-primary/30 transition-colors duration-500" />
                {/* 12 o'clock */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-10 md:h-10 bg-black rounded-full border-2 border-primary md:border-zinc-600 flex items-center justify-center md:group-hover:border-primary transition-colors duration-300">
                  <IoPeopleOutline className="w-3 h-3 md:w-5 md:h-5 text-primary md:text-zinc-400 md:group-hover:text-primary transition-colors duration-300" />
                </div>
                {/* 4 o'clock */}
                <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-6 h-6 md:w-10 md:h-10 bg-black rounded-full border-2 border-primary md:border-zinc-600 flex items-center justify-center md:group-hover:border-primary transition-colors duration-300">
                  <IoPricetagSharp className="w-3 h-3 md:w-5 md:h-5 text-primary md:text-zinc-400 md:group-hover:text-primary transition-colors duration-300" />
                </div>
                {/* 8 o'clock */}
                <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 w-6 h-6 md:w-10 md:h-10 bg-black rounded-full border-2 border-primary md:border-zinc-600 flex items-center justify-center md:group-hover:border-primary transition-colors duration-300">
                  <IoPeopleOutline className="w-3 h-3 md:w-5 md:h-5 text-primary md:text-zinc-400 md:group-hover:text-primary transition-colors duration-300" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 md:w-14 md:h-14 rounded-full bg-primary/20 md:bg-primary/10 blur-xl absolute md:group-hover:bg-primary/20 transition-colors duration-500" />
                  <IoPeopleOutline className="w-6 h-6 md:w-8 md:h-8 text-primary relative z-10 md:group-hover:scale-110 transition-transform duration-300 ease-out" />
                </div>
              </div>

              {/* Circle 2 - 3 People */}
              <div className="relative h-20 w-20 md:h-32 md:w-32 shrink-0 md:translate-y-20 translate-y-0">
                <div className="absolute inset-0 border-2 md:border-[3px] border-dashed border-primary/30 md:border-white/10 rounded-full animate-[spin_12s_linear_infinite_reverse] md:[animation-play-state:paused] md:group-hover:[animation-play-state:running] md:group-hover:border-primary/30 transition-colors duration-500" />
                {/* 12 o'clock */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 bg-black rounded-full border-2 border-primary md:border-zinc-600 flex items-center justify-center md:group-hover:border-primary transition-colors duration-300">
                  <MdOutlineGroups className="w-3 h-3 md:w-4 md:h-4 text-primary md:text-zinc-400 md:group-hover:text-primary transition-colors duration-300" />
                </div>
                {/* 7 o'clock */}
                <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 w-6 h-6 md:w-8 md:h-8 bg-black rounded-full border-2 border-primary md:border-zinc-600 flex items-center justify-center md:group-hover:border-primary transition-colors duration-300">
                  <IoPricetagSharp className="w-3 h-3 md:w-4 md:h-4 text-primary md:text-zinc-400 md:group-hover:text-primary transition-colors duration-300" />
                </div>
                {/* 5 o'clock */}
                <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-6 h-6 md:w-8 md:h-8 bg-black rounded-full border-2 border-primary md:border-zinc-600 flex items-center justify-center md:group-hover:border-primary transition-colors duration-300">
                  <IoPeopleOutline className="w-3 h-3 md:w-4 md:h-4 text-primary md:text-zinc-400 md:group-hover:text-primary transition-colors duration-300" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary/20 md:bg-primary/10 blur-xl absolute md:group-hover:bg-primary/20 transition-colors duration-500" />
                  <MdOutlineGroups className="w-6 h-6 md:w-8 md:h-8 text-primary relative z-10 md:group-hover:scale-110 transition-transform duration-300 ease-out" />
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
          className="bento-card md:col-span-12 lg:col-span-6 p-6 md:p-8 flex flex-col justify-between group overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <IoCartOutline className="transition-transform duration-240 ease-[cubic-bezier(0.23,1,0.32,1)] w-8 h-8 md:w-10 md:h-10 text-primary" />
              <h3 className="text-2xl md:text-3xl font-naston text-zinc-100">Basket Engine</h3>
            </div>
            <p className="text-zinc-400 text-sm md:text-lg leading-relaxed max-w-sm">
              Upsell logic that actually converts. Smart product bundling based on real behavioral data.
            </p>
          </div>

          <div className="relative h-24 md:h-32 w-full mt-6 md:mt-8 flex items-center px-4 md:px-8 border border-white/5 rounded-2xl bg-black group-hover:border-primary/20 transition-colors duration-500 overflow-hidden">
            {/* Bottom Glow */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-primary/10 to-transparent pointer-events-none" />

            {/* Basket 1 */}
            <div className="relative z-10 p-2 md:p-3 bg-black rounded-full border border-white/10 group-hover:border-primary/30 transition-all duration-500 ease-out shrink-0">
              <IoCartOutline className="w-5 h-5 md:w-6 md:h-6 text-zinc-400 group-hover:text-primary transition-colors duration-300" />
            </div>

            {/* Line 1 */}
            <div className="grow h-12 relative flex items-center shrink">
              <svg className="w-full h-1 opacity-40 group-hover:opacity-80 transition-opacity duration-500">
                <motion.line
                  x1="0" y1="0.5" x2="100%" y2="0.5"
                  stroke="var(--clr-yellow)" strokeWidth="2" strokeDasharray="6 6"
                  animate={{ strokeDashoffset: [0, -100] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </svg>
            </div>

            {/* Basket 2 */}
            <div className="relative z-10 p-2 md:p-3 bg-black rounded-full border border-white/10 group-hover:border-primary/50 shadow-[0_0_20px_rgba(255,244,79,0.0)] group-hover:shadow-[0_0_20px_rgba(255,244,79,0.15)] group-hover:scale-110 transition-all duration-500 ease-out shrink-0">
              <IoCartOutline className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              <span className="absolute -top-1 -right-1 bg-primary text-black px-1 py-0.5 rounded-lg text-[8px] font-black shadow-lg">+</span>
            </div>

            {/* Line 2 */}
            <div className="grow h-12 relative flex items-center shrink">
              <svg className="w-full h-1 opacity-40 group-hover:opacity-80 transition-opacity duration-500">
                <motion.line
                  x1="0" y1="0.5" x2="100%" y2="0.5"
                  stroke="var(--clr-yellow)" strokeWidth="2" strokeDasharray="6 6"
                  animate={{ strokeDashoffset: [0, -100] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </svg>
            </div>

            {/* Basket 3 */}
            <div className="relative z-10 p-2 md:p-3 bg-black rounded-full border border-white/10 group-hover:border-primary/50 shadow-[0_0_20px_rgba(255,244,79,0.0)] group-hover:shadow-[0_0_20px_rgba(255,244,79,0.15)] group-hover:scale-110 transition-all duration-500 ease-out shrink-0">
              <IoCartOutline className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              <span className="absolute -top-1 -right-1 bg-primary text-black px-1 py-0.5 rounded-lg text-[8px] font-black shadow-lg">+</span>
            </div>
          </div>
        </motion.div>

        {/* REST API */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bento-card md:col-span-12 lg:col-span-6 p-6 md:p-8 font-mono text-xs md:text-sm flex flex-col justify-between group overflow-x-auto scrollbar-hide"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold font-sans text-zinc-100 flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                  <TbApi className="transition-transform duration-240 ease-[cubic-bezier(0.23,1,0.32,1)] w-5 h-5 md:w-6 md:h-6" /> API Integration
                </h3>
                <p className="text-zinc-400 text-sm md:text-lg mt-1 font-sans leading-relaxed">seamless integration with your ecommerce</p>
              </div>
              <ApiStatusTicker />
            </div>
            <div className="space-y-1 text-zinc-500 bg-black/50 p-3 rounded-xl border border-white/5 group-hover:border-primary/20 transition-colors duration-300 relative overflow-hidden min-w-70">
              <p><span className="text-zinc-300 group-hover:text-primary transition-colors duration-300">POST</span> /api/v1/payments/track</p>
              <p className="pl-4 text-zinc-600">{"{"}</p>
              <p className="pl-8">&quot;sellerID&quot;: <span className="text-primary/80 group-hover:text-primary transition-colors duration-300">&quot;INF_8829&quot;</span>,</p>
              <p className="pl-8">&quot;productID&quot;: <span className="text-primary/80 group-hover:text-primary transition-colors duration-300">&quot;PRD_442&quot;</span>,</p>
              <p className="pl-8">&quot;price&quot;: <span className="text-primary/80 group-hover:text-primary transition-colors duration-300">99.99</span>,</p>
              <p className="pl-8">&quot;status&quot;: <span className="text-primary/80 group-hover:text-primary transition-colors duration-300">&quot;PAID&quot;</span></p>
              <p className="pl-4 text-zinc-600">{"}"}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
