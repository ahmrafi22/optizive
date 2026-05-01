import type { Metadata } from "next";
import PriceMonitorClient from "@/components/price-monitor/PriceMonitorClient";

export const metadata: Metadata = {
  title: "Price Monitor",
  description:
    "Dynamic AI-powered price discovery and market analysis for sellers.",
};

export default function PriceMonitorPage() {
  return <PriceMonitorClient />;
}
