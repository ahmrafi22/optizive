"use client";

import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from "react";

import type { StreamStage, ProductResult } from "./types";

export interface StreamingState {
  isLoading: boolean;
  statusStage: StreamStage;
  statusMessage: string;
  progress: { completed: number; total: number };
  links: string[];
  exactMatches: ProductResult[];
  relatedProducts: ProductResult[];
  totalFound: number | null;
  bestPrice: string | null;
  sellerPrice: string | null;
  summary: string;
  sellerSummary: string;
  timestamp: string | null;
  searchQueries: string[];
  searchLinks: string[];
}

const initialState: StreamingState = {
  isLoading: false,
  statusStage: "idle",
  statusMessage: "Ready to compare",
  progress: { completed: 0, total: 0 },
  links: [],
  exactMatches: [],
  relatedProducts: [],
  totalFound: null,
  bestPrice: null,
  sellerPrice: null,
  summary: "",
  sellerSummary: "",
  timestamp: null,
  searchQueries: [],
  searchLinks: [],
};

interface PriceCompareContextType {
  state: StreamingState;
  setState: React.Dispatch<React.SetStateAction<StreamingState>>;
  abortRef: React.MutableRefObject<AbortController | null>;
  resetResults: () => void;
}

const PriceCompareContext = createContext<PriceCompareContextType | null>(null);

export function PriceCompareProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StreamingState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const resetResults = useCallback(() => setState(initialState), []);

  return (
    <PriceCompareContext.Provider value={{ state, setState, abortRef, resetResults }}>
      {children}
    </PriceCompareContext.Provider>
  );
}

export function usePriceCompare() {
  const ctx = useContext(PriceCompareContext);
  if (!ctx) throw new Error("usePriceCompare must be used within PriceCompareProvider");
  return ctx;
}
