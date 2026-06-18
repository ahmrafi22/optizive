import type { CompareRequest, CompareResponse, ProductResult, StreamStage } from "@/app/(user-routes)/price-compare/_components/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_PRICE_COMPARE_API ?? "https://optizive-scrape.vercel.app";

export type { CompareRequest, CompareResponse, ProductResult, StreamStage };

// ---------------------------------------------------------------------------
// SSE chunk parser
// ---------------------------------------------------------------------------

export function parseSseChunk(chunk: string): { eventType: string; payload: Record<string, unknown> } | null {
  const normalized = chunk.replace(/\r\n/g, "\n").trim();
  if (!normalized) return null;

  let eventType = "message";
  const dataLines: string[] = [];

  normalized.split("\n").forEach((line) => {
    if (line.startsWith("event:")) {
      eventType = line.replace("event:", "").trim();
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.replace(/^data:\s?/, ""));
    }
  });

  const dataText = dataLines.join("\n").trim();
  if (!dataText) return null;

  try {
    const payload = JSON.parse(dataText) as Record<string, unknown>;
    return { eventType, payload };
  } catch (err) {
    console.error("Failed to parse SSE chunk:", dataText, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Streaming compare — calls the Next.js /api/price-compare SSE proxy
// ---------------------------------------------------------------------------

export interface StreamEventHandlers {
  onStatus: (stage: StreamStage, message: string, total?: number) => void;
  onLinks: (links: string[]) => void;
  onScrape: (completed: number, total: number) => void;
  onProducts: (
    exact: ProductResult[],
    related: ProductResult[],
    completed: number,
    total: number,
    totalFound: number | null,
    source: string,
    prevCompleted: number,
    prevTotal: number,
  ) => void;
  onAnalysis: (bestPrice: string | null, sellerPrice: string | null, summary: string, sellerSummary: string) => void;
  onComplete: (response: CompareResponse) => void;
  onError: (message: string) => void;
}

export async function runStreamingCompare(
  payload: CompareRequest,
  signal: AbortSignal,
  handlers: StreamEventHandlers,
  getProgress: () => { completed: number; total: number },
): Promise<void> {
  const streamUrl = "/api/price-compare";
  console.log("🚀 Starting streaming request to:", streamUrl);

  const response = await fetch(streamUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    signal,
    cache: "no-store" as RequestCache,
  });

  console.log("📡 Response received:", {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Streaming request failed");
    throw new Error(errorText || `HTTP ${response.status}: Streaming unavailable`);
  }

  if (!response.body) {
    throw new Error("Response body is empty");
  }

  console.log("📖 Starting to read stream...");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let chunkCount = 0;
  let receivedProducts = false;
  let endStage: StreamStage | null = null;

  const handleEvent = (eventType: string, eventPayload: Record<string, unknown>) => {
    console.log("Stream event:", eventType, eventPayload);

    if (eventType === "status") {
      const stage = eventPayload.stage as StreamStage;
      const message = (eventPayload.message as string) ?? "";
      const total = typeof eventPayload.total === "number" ? eventPayload.total : undefined;
      handlers.onStatus(stage, message, total);
      return;
    }

    if (eventType === "links") {
      const links = Array.isArray(eventPayload.links) ? (eventPayload.links as string[]) : [];
      handlers.onLinks(links);
      return;
    }

    if (eventType === "scrape") {
      const completed = Number(eventPayload.completed ?? 0);
      const total = Number(eventPayload.total ?? 0);
      handlers.onScrape(completed, total);
      return;
    }

    if (eventType === "products") {
      const exact = (eventPayload.exactMatches as ProductResult[]) ?? [];
      const related = (eventPayload.relatedProducts as ProductResult[]) ?? [];
      const { completed: prevCompleted, total: prevTotal } = getProgress();
      const completed = Number(eventPayload.completed ?? prevCompleted);
      const total = Number(eventPayload.total ?? prevTotal);
      const source = (eventPayload.source as string) || "a source";
      const totalFound = typeof eventPayload.totalFound === "number" ? eventPayload.totalFound : null;

      console.log("Products received:", { exact: exact.length, related: related.length, completed, total, source });

      if (exact.length > 0 || related.length > 0) {
        receivedProducts = true;
      }

      handlers.onProducts(exact, related, completed, total, totalFound, source, prevCompleted, prevTotal);
      return;
    }

    if (eventType === "analysis") {
      handlers.onAnalysis(
        (eventPayload.bestPrice as string | null) ?? null,
        (eventPayload.sellerPrice as string | null) ?? null,
        (eventPayload.summary as string) ?? "",
        (eventPayload.sellerSummary as string) ?? "",
      );
      return;
    }

    if (eventType === "complete") {
      endStage = "complete";
      handlers.onComplete(eventPayload as unknown as CompareResponse);
      return;
    }

    if (eventType === "error") {
      endStage = "error";
      handlers.onError((eventPayload.message as string) ?? "Something went wrong");
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        console.log("✅ Stream done signal received, total chunks:", chunkCount);
        break;
      }

      if (!value || value.length === 0) {
        console.warn("⚠️ Empty chunk received, continuing...");
        continue;
      }

      chunkCount++;
      const chunk = decoder.decode(value, { stream: true });
      console.log(`📦 Chunk ${chunkCount} (${value.length} bytes):`, chunk.substring(0, 200));

      buffer += chunk.replace(/\r\n/g, "\n");

      let boundaryIndex = buffer.indexOf("\n\n");
      while (boundaryIndex !== -1) {
        const sseChunk = buffer.slice(0, boundaryIndex);
        buffer = buffer.slice(boundaryIndex + 2);

        const trimmed = sseChunk.trim();
        if (!trimmed || trimmed.startsWith(":")) {
          if (trimmed) console.log("💓 Keepalive received");
          boundaryIndex = buffer.indexOf("\n\n");
          continue;
        }

        console.log("🔍 Processing SSE chunk:", sseChunk.substring(0, 200));

        const parsed = parseSseChunk(sseChunk);
        if (parsed) {
          console.log("✅ Parsed event:", parsed.eventType);
          handleEvent(parsed.eventType, parsed.payload);
        } else {
          console.warn("⚠️ Failed to parse SSE chunk:", sseChunk);
        }

        boundaryIndex = buffer.indexOf("\n\n");
      }
    }
  } catch (readError) {
    console.error("❌ Error reading stream:", readError);
    throw readError;
  }

  console.log("📊 Stream reading complete, total chunks:", chunkCount);

  // Handle any remaining buffer
  if (buffer.trim()) {
    const trimmed = buffer.trim();
    if (!trimmed.startsWith(":")) {
      console.log("🔍 Processing remaining buffer:", buffer.substring(0, 200));
      const parsed = parseSseChunk(buffer);
      if (parsed) {
        console.log("✅ Parsed remaining event:", parsed.eventType);
        handleEvent(parsed.eventType, parsed.payload);
      }
    }
  }

  if (!endStage) {
    if (receivedProducts) {
      handlers.onStatus("complete", "Comparison complete!");
    } else {
      throw new Error(
        "Stream ended unexpectedly without results. The backend connection may have closed during crawling.",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Standard (non-streaming) compare — calls the external backend directly
// ---------------------------------------------------------------------------

export async function runStandardCompare(
  payload: CompareRequest,
  signal: AbortSignal,
): Promise<CompareResponse> {
  const response = await fetch(`${API_BASE_URL}/api/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = (errorData as { error?: string })?.error || `HTTP ${response.status}: Request failed`;
    throw new Error(message);
  }

  const data = (await response.json()) as CompareResponse;

  if (!data.success) {
    throw new Error(data.summary || "No results available");
  }

  return data;
}
