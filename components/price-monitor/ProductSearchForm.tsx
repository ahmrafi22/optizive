"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";

type ProductSearchFormProps = {
  onSubmit: (payload: { productName: string; country: string }) => Promise<void>;
  isSubmitting: boolean;
};

export default function ProductSearchForm({
  onSubmit,
  isSubmitting,
}: ProductSearchFormProps) {
  const [productName, setProductName] = useState("");
  const [country, setCountry] = useState("Bangladesh");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedProduct = productName.trim();
    const normalizedCountry = country.trim() || "Bangladesh";

    if (!normalizedProduct) {
      return;
    }

    await onSubmit({
      productName: normalizedProduct,
      country: normalizedCountry,
    });
  };

  return (
    <motion.form
      layout
      onSubmit={handleSubmit}
      className="rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6"
    >
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-zinc-800" htmlFor="productName">
            Product Name
            <motion.input
              whileFocus={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              id="productName"
              name="productName"
              type="text"
              required
              minLength={2}
              autoComplete="off"
              placeholder="e.g. Nothing Phone 4a"
              className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none transition-all focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-zinc-800" htmlFor="country">
            Country / Market
            <motion.input
              whileFocus={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              id="country"
              name="country"
              type="text"
              required
              className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none transition-all focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            />
          </label>

          <p className="text-sm leading-6 text-zinc-600">
            Real-time pipeline: Puppeteer discovery, Firecrawl scraping, and
            LLM-based price analysis.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="relative flex h-12 min-w-44 items-center justify-center gap-2 overflow-hidden rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span>Discover Prices</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.form>
  );
}
