"use client";

import { motion } from "framer-motion";
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
  Activity
} from "lucide-react";
import React from "react";

const features = [
  {
    title: "SmartInventory & Expiry",
    description: "Track inventory and automate expiry date alerts for perishable products to minimize waste.",
    icon: <Package className="w-6 h-6" />,
    color: "from-yellow-400 to-orange-500",
  },
  {
    title: "Supplier Recommender",
    description: "Meet buyers with similar needs. Buy together with our smart procurement planner for co-operative buying.",
    icon: <Users className="w-6 h-6" />,
    color: "from-blue-400 to-indigo-500",
  },
  {
    title: "Price Monitoring & Forecasting",
    description: "AI-driven competitor analysis. Forecast demand for flash sales and festivals to optimize your pricing.",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "from-green-400 to-emerald-500",
  },
  {
    title: "Basket Recommendations",
    description: "Smart engine for bundled offers. Suggest products to upsell and increase average order value.",
    icon: <ShoppingBasket className="w-6 h-6" />,
    color: "from-purple-400 to-pink-500",
  },
  {
    title: "Invoice & Payment Tracking",
    description: "Built for informal sellers. Includes a REST API to easily connect with your existing eCommerce platform.",
    icon: <FileText className="w-6 h-6" />,
    color: "from-rose-400 to-red-500",
  },
  {
    title: "Backend Analytics",
    description: "A comprehensive dashboard providing actionable insights into your sales and inventory metrics.",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "from-cyan-400 to-blue-500",
  },
  {
    title: "Inventory & Sales Records",
    description: "Well-documented, easily accessible historical data for auditing and long-term business strategy.",
    icon: <Database className="w-6 h-6" />,
    color: "from-teal-400 to-emerald-500",
  },
  {
    title: "AI Q&A Chatbot",
    description: "24/7 intelligent assistant to answer your business queries and guide you through the platform.",
    icon: <MessageSquare className="w-6 h-6" />,
    color: "from-amber-400 to-yellow-500",
  },
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 overflow-hidden selection:bg-yellow-400/30">

      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-purple-500/30 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-naston text-2xl tracking-wider text-white"
          >
            OPTIZIVE
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex gap-8 items-center text-sm font-medium text-zinc-400"
          >
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="h-10 px-6 rounded-full bg-white text-black hover:bg-zinc-200 transition-colors font-semibold">
              Get Started
            </button>
          </motion.div>
        </div>
      </nav>

      <main className="pt-32 pb-24 relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300 mb-8"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>The future of sales optimization</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-naston text-6xl md:text-8xl lg:text-9xl tracking-tight leading-none mb-6 text-white drop-shadow-2xl"
          >
            OPTIZIVE
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="font-serif text-3xl md:text-4xl text-zinc-400 max-w-3xl mb-12 italic"
          >
            Empowering sellers with intelligent inventory, dynamic pricing, and collaborative procurement.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="group h-14 px-8 rounded-full bg-yellow-400 text-zinc-950 font-semibold text-lg flex items-center justify-center gap-2 hover:bg-yellow-300 transition-all hover:scale-105 active:scale-95">
              Start Optimizing
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="h-14 px-8 rounded-full bg-white/5 border border-white/10 text-white font-medium text-lg hover:bg-white/10 transition-colors">
              Book a Demo
            </button>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5 relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

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
              className="md:col-span-8 group p-8 rounded-[2rem] bg-zinc-900/50 border border-white/10 hover:border-yellow-400/50 transition-all duration-500 overflow-hidden relative"
            >
              <div className="relative z-10">
                <Package className="w-10 h-10 text-yellow-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-3xl font-naston mb-3 text-zinc-100">SmartInventory & Expiry Tracker</h3>
                <p className="text-zinc-400 max-w-md mb-8 text-lg leading-relaxed">Never lose a margin to spoilage again. Real-time visual countdowns and automated reordering logic.</p>
                <div className="flex gap-4 overflow-hidden">
                  <div className="bg-black/40 p-4 rounded-2xl min-w-[160px] border-l-4 border-rose-500">
                    <span className="block text-[10px] text-rose-500 font-bold uppercase tracking-widest mb-2">Expires in 2d</span>
                    <div className="text-lg font-semibold text-zinc-200">Organic Milk</div>
                    <div className="w-full bg-white/5 h-1.5 mt-4 rounded-full overflow-hidden">
                      <div className="bg-rose-500 w-4/5 h-full"></div>
                    </div>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl min-w-[160px] border-l-4 border-emerald-500">
                    <span className="block text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-2">Stock Level 94%</span>
                    <div className="text-lg font-semibold text-zinc-200">Cold Brew</div>
                    <div className="w-full bg-white/5 h-1.5 mt-4 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 w-full h-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none">
                <Package className="w-[300px] h-[300px]" />
              </div>
            </motion.div>

            {/* Demand Forecasting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="md:col-span-4 p-8 rounded-[2rem] bg-zinc-900/50 backdrop-blur-md border border-white/10 hover:border-blue-400/50 transition-all flex flex-col group"
            >
              <Activity className="w-10 h-10 text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-2xl font-naston mb-3 text-zinc-100">Demand Forecasting</h3>
              <p className="text-zinc-400 mb-auto leading-relaxed">Predictive curves for flash sales and festival spikes using neural networking.</p>
              <div className="mt-8 flex items-end gap-1.5 h-24">
                <div className="flex-1 bg-blue-500/20 h-1/3 rounded-t-lg group-hover:bg-blue-500/40 transition-colors"></div>
                <div className="flex-1 bg-blue-500/30 h-1/2 rounded-t-lg group-hover:bg-blue-500/50 transition-colors delay-75"></div>
                <div className="flex-1 bg-blue-500/40 h-2/3 rounded-t-lg group-hover:bg-blue-500/60 transition-colors delay-100"></div>
                <div className="flex-1 bg-blue-500/80 h-[90%] rounded-t-lg relative group-hover:bg-blue-400 transition-colors delay-150">
                  <Sparkles className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1 bg-blue-500/30 h-1/2 rounded-t-lg group-hover:bg-blue-500/50 transition-colors delay-200"></div>
              </div>
            </motion.div>

            {/* Price Monitor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="md:col-span-4 p-8 rounded-[2rem] bg-zinc-900/50 border border-white/10 hover:border-purple-400/50 transition-all group"
            >
              <TrendingUp className="w-10 h-10 text-purple-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-2xl font-naston mb-3 text-zinc-100">Price Monitor</h3>
              <p className="text-zinc-400 mb-6 leading-relaxed">Comparative charts & insights to outpace competitors.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl text-sm">
                  <span className="text-zinc-300">Competitor A</span>
                  <span className="font-mono text-zinc-400">$29.99</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
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
              className="md:col-span-8 p-8 rounded-[2rem] bg-zinc-900/50 border border-white/10 hover:border-emerald-400/50 transition-all relative overflow-hidden group"
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <Users className="w-10 h-10 text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-3xl font-naston mb-3 text-zinc-100">Smart Procurement</h3>
                  <p className="text-zinc-400 mb-6 text-lg leading-relaxed">Connect with social network procurement groups. Unlock tiered pricing with collective buying tags.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">Group Active</span>
                    <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full uppercase tracking-wider">Save 15%</span>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center pointer-events-none">
                  <div className="relative h-40 w-40">
                    <div className="absolute inset-0 border-[3px] border-dashed border-white/10 rounded-full group-hover:animate-[spin_10s_linear_infinite] transition-all"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-black rounded-full border-2 border-emerald-400 flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-10 h-10 bg-black rounded-full border-2 border-blue-400 flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 blur-xl absolute"></div>
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
              className="md:col-span-6 p-8 rounded-[2rem] bg-zinc-900/50 border border-white/10 hover:border-pink-400/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <ShoppingBasket className="w-10 h-10 text-pink-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-3xl font-naston mb-3 text-zinc-100">Basket Engine</h3>
                <p className="text-zinc-400 text-lg leading-relaxed">Upsell logic that actually converts. Smart product bundling based on real behavioral data.</p>
              </div>
              <div className="mt-8 flex gap-4 items-center">
                <div className="relative bg-black/40 p-4 rounded-2xl border border-white/10 group-hover:border-pink-500/30 transition-colors">
                  <Package className="w-8 h-8 text-zinc-400 group-hover:text-pink-400 transition-colors" />
                  <span className="absolute -top-3 -right-3 bg-pink-500 text-white px-2 py-1 rounded-lg text-[10px] font-black shadow-lg shadow-pink-500/20">+ UPSELL</span>
                </div>
                <div className="flex items-center text-zinc-600">
                  <div className="w-6 h-0.5 bg-zinc-600"></div>
                  <div className="w-6 h-0.5 bg-zinc-600 rotate-90 -ml-6"></div>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors">
                  <Package className="w-8 h-8 text-zinc-400" />
                </div>
              </div>
            </motion.div>

            {/* REST API Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="md:col-span-6 p-8 rounded-[2rem] bg-zinc-950 border border-white/10 hover:border-cyan-400/50 transition-all font-mono text-sm group"
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
                <p className="pl-8">"seller_id": <span className="text-yellow-400">"INF_8829"</span>,</p>
                <p className="pl-8">"status": <span className="text-emerald-400">"COMPLETED"</span>,</p>
                <p className="pl-8">"method": <span className="text-yellow-400">"USSD_MOBILE_MONEY"</span></p>
                <p className="pl-4">{"}"}</p>
              </div>
              <div className="mt-6 p-4 bg-zinc-900/80 rounded-xl border border-white/5 flex items-center justify-between font-sans">
                <span className="text-sm font-medium text-zinc-300">Invoice #8841-B</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-400/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  PAID
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-5xl mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-[3rem] bg-gradient-to-b from-zinc-900 to-black border border-white/10 p-12 md:p-20 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="relative z-10">
              <h2 className="font-naston text-4xl md:text-6xl mb-6">Ready to Optizive?</h2>
              <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto font-serif italic">
                Join thousands of modern sellers leveraging AI and smart insights to dominate their market.
              </p>
              <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="h-14 px-10 rounded-full bg-white text-black font-semibold text-lg hover:scale-105 active:scale-95 transition-all">
                Create Free Account
              </button>
            </div>
          </motion.div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-sm text-zinc-500">
        <p>Â© {new Date().getFullYear()} OPTIZIVE. All rights reserved.</p>
      </footer>

    </div>
  );
}
