import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, BarChart3, ExternalLink, AlertTriangle, Lightbulb, CheckCircle2, Search, Globe, Cpu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PriceDiscoveryResponse } from "@/types/price-monitor";

type PriceMonitorResultsProps = {
  result: PriceDiscoveryResponse;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
};

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: LucideIcon; color: string }) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -4, scale: 1.02 }}
      className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </p>
      </div>
      <p className="mt-4 text-3xl font-bold text-zinc-900 tracking-tight">{value}</p>
    </motion.div>
  );
}

export default function PriceMonitorResults({
  result,
}: PriceMonitorResultsProps) {
  const diagnostics = result.diagnostics;

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 rounded-3xl border border-zinc-200 bg-white/85 p-5 shadow-sm backdrop-blur sm:p-8"
      aria-live="polite"
    >
      <motion.div variants={item} className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">{result.product}</h2>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <p className="text-sm font-medium text-zinc-600">
            Market scan complete: {result.summary.total_sources} sources verified
          </p>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard 
          label="Lowest" 
          value={result.summary.lowest_price} 
          icon={TrendingDown}
          color="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard 
          label="Average" 
          value={result.summary.average_price} 
          icon={BarChart3}
          color="bg-zinc-50 text-zinc-600"
        />
        <SummaryCard 
          label="Highest" 
          value={result.summary.highest_price} 
          icon={TrendingUp}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <motion.div variants={item} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50/50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-zinc-900">Source</th>
                <th className="px-6 py-4 text-left font-semibold text-zinc-900">Price</th>
                <th className="px-6 py-4 text-left font-semibold text-zinc-900">
                  Availability
                </th>
                <th className="px-6 py-4 text-left font-semibold text-zinc-900">URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {result.sources.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic">
                    No product pages were extracted yet.
                  </td>
                </tr>
              ) : (
                result.sources.map((source, idx) => (
                  <motion.tr 
                    key={`${source.domain}-${source.url}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (idx * 0.05) }}
                    className="group hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900">{source.domain}</span>
                        {source.estimated && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Estimated</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            source.suspicious
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {source.price}
                        </span>
                        {source.originalPrice && (
                          <span className="text-xs text-zinc-400 line-through">
                            {source.originalPrice}
                          </span>
                        )}
                        {source.discount && (
                          <span className="text-xs font-bold text-emerald-600">
                            -{source.discount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${
                        source.availability.toLowerCase().includes('in stock') 
                          ? 'text-emerald-700' 
                          : 'text-zinc-600'
                      }`}>
                        {source.availability}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-zinc-600 underline decoration-zinc-200 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-400"
                      >
                        Visit <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {diagnostics && (
        <motion.div variants={item} className="rounded-2xl border border-zinc-200 bg-zinc-50/50 px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
            Pipeline Diagnostics
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" /> Discovery
              </p>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {diagnostics.discovery.product_pages} pages found
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Scraping
              </p>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {diagnostics.scraping.extracted_prices} prices extracted
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" /> AI Analysis
              </p>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Model: {diagnostics.analysis.model}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={item} className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/50 px-6 py-6 transition-all hover:bg-emerald-50">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-widest">Best Deal</p>
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-emerald-900">
              {result.analysis.best_deal}
            </p>
          </div>
        </motion.div>

        <motion.div variants={item} className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/50 px-6 py-6 transition-all hover:bg-zinc-50">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-zinc-700">
              <Lightbulb className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-widest">Market Insight</p>
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-800">
              {result.analysis.market_insight}
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div variants={item} className="rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Recommendation</p>
        <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-900">
          {result.analysis.recommendation}
        </p>
      </motion.div>

      {result.analysis.risk_flags.length > 0 && (
        <motion.div variants={item} className="rounded-2xl border border-amber-100 bg-amber-50/50 px-6 py-6">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Risk Assessment</p>
          </div>
          <ul className="mt-4 space-y-3">
            {result.analysis.risk_flags.map((flag, index) => (
              <motion.li 
                key={`${flag}-${index}`}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + (index * 0.1) }}
                className="flex items-start gap-2 text-sm font-medium text-amber-900"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                {flag}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.section>
  );
}
