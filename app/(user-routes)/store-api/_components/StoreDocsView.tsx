"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuBook, LuX, LuCopy, LuCheck } from "react-icons/lu";
import type { StoreInfo } from "@/backend/store/store";

function highlightJson(json: string): string {
  let result = json;
  result = result.replace(/(["][^"]*["])\s*(:)/g, '<span class="text-blue-300">$1</span>$2');
  result = result.replace(/(:)\s*(["](?:[^"\\]|\\.)*["])/g, '$1 <span class="text-emerald-300">$2</span>');
  result = result.replace(/(:)\s*(-?\d+\.?\d*)\b/g, '$1 <span class="text-amber-300">$2</span>');
  result = result.replace(/(:)\s*(true|false)\b/g, '$1 <span class="text-purple-300">$2</span>');
  result = result.replace(/(:)\s*(null)\b/g, '$1 <span class="text-red-300">$2</span>');
  return result;
}

function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  const highlighted = lang === "json" ? highlightJson(code) : code;
  return (
    <pre
      className="overflow-x-auto rounded-lg bg-[#1a1a2e] p-4 text-xs leading-relaxed"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button onClick={copy} className="shrink-0 rounded-lg p-1.5 text-(--clr-fg-muted) hover:bg-white/10 transition-all">
      {copied ? <LuCheck className="h-3.5 w-3.5 text-emerald-400" /> : <LuCopy className="h-3.5 w-3.5" />}
    </button>
  );
}

interface Props {
  store: StoreInfo;
  businessSlug: string;
  open: boolean;
  onClose: () => void;
}

export default function StoreDocsView({ store, businessSlug, open, onClose }: Props) {
  const BASE = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const branchSlug = store.slug;
  const apiKey = store.apiKey;

  if (!open) return null;

  const sections = [
    {
      title: "Authentication",
      desc: "Public endpoints (products, check-price) don't need authentication. Write endpoints (sales) require the API key header.",
      code: `# All write operations require this header:\nx-api-key: ${apiKey}`,
    },
    {
      title: "List Products",
      method: "GET",
      endpoint: `/api/${businessSlug}/${branchSlug}/products`,
      desc: "Paginated list of all active products in your inventory.",
      query: "?page=1&limit=20&category=ELECTRONICS&search=rice",
      example: `curl "${BASE}/api/${businessSlug}/${branchSlug}/products?page=1&limit=10"`,
      response: JSON.stringify({
        success: true,
        data: {
          products: [
            { id: "uuid", name: "Basmati Rice", price: 120, stock: 50, unit: "KG", image: null, category: "GROCERIES", sku: null }
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
        }
      }, null, 2),
    },
    {
      title: "Check Price",
      method: "POST",
      endpoint: `/api/${businessSlug}/${branchSlug}/check-price`,
      desc: "Calculate total price for a list of products with optional discount. No API key needed.",
      optionalFields: ["discount"],
      example: `curl -X POST "${BASE}/api/${businessSlug}/${branchSlug}/check-price" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [{"productId": "uuid", "quantity": 5}],
    "discount": 50    // optional, fixed amount in BDT
  }'`,
      response: JSON.stringify({
        success: true,
        data: {
          items: [{ productId: "uuid", productName: "Basmati Rice", quantity: 5, unitPrice: 120, totalPrice: 600, unit: "KG" }],
          subtotal: 600,
          discount: 50,
          total: 550,
          currency: "BDT"
        }
      }, null, 2),
    },
    {
      title: "Create Sale",
      method: "POST",
      endpoint: `/api/${businessSlug}/${branchSlug}/sales`,
      desc: "Create a new sale. Requires API key. Returns the full invoice.",
      optionalFields: ["customerName", "customerPhone", "discount", "paidAmount", "deliveryAddress", "notes"],
      example: `curl -X POST "${BASE}/api/${businessSlug}/${branchSlug}/sales" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "items": [{"productId": "uuid", "quantity": 5}],
    "customerName": "ABC Traders",     // optional
    "customerPhone": "017XXXXXXXX",    // optional
    "discount": 50,                    // optional, fixed amount in BDT
    "paidAmount": 500,                 // optional
    "deliveryAddress": "123 Main St",  // optional
    "notes": "Handle with care"        // optional
  }'`,
      response: JSON.stringify({
        success: true,
        data: {
          invoice: {
            invoiceNumber: "ST-250601-ABC12",
            customerName: "ABC Traders",
            totalAmount: 600,
            discount: 50,
            finalAmount: 550,
            paymentStatus: "PARTIAL",
            paidAmount: 500,
            dueAmount: 50,
            createdAt: "2025-06-01T12:00:00.000Z",
            items: [{ productId: "uuid", productName: "Basmati Rice", quantity: 5, unitPrice: 120, totalPrice: 600 }]
          }
        }
      }, null, 2),
    },
    {
      title: "Get Invoice",
      method: "GET",
      endpoint: `/api/${businessSlug}/${branchSlug}/sales/{invoiceNumber}`,
      desc: "Get full invoice details with all line items. Requires API key.",
      example: `curl "${BASE}/api/${businessSlug}/${branchSlug}/sales/ST-250601-ABC12" \\
  -H "x-api-key: ${apiKey}"`,
      response: JSON.stringify({
        success: true,
        data: {
          invoice: {
            invoiceNumber: "ST-250601-ABC12",
            customerName: "ABC Traders",
            totalAmount: 600,
            discount: 50,
            finalAmount: 550,
            paymentStatus: "PARTIAL",
            paidAmount: 500,
            dueAmount: 50,
            deliveryAddress: null,
            items: [{ productId: "uuid", productName: "Basmati Rice", quantity: 5, unitPrice: 120, totalPrice: 600 }]
          }
        }
      }, null, 2),
    },
    {
      title: "Update Invoice",
      method: "PATCH",
      endpoint: `/api/${businessSlug}/${branchSlug}/sales/{invoiceNumber}`,
      desc: "Update payment status, order status, or delivery address. Requires API key.",
      optionalFields: ["paidAmount", "paymentStatus", "orderStatus", "deliveryAddress"],
      example: `curl -X PATCH "${BASE}/api/${businessSlug}/${branchSlug}/sales/ST-250601-ABC12" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "paidAmount": 550,          // optional, fixed amount in BDT
    "paymentStatus": "PAID",    // optional
    "orderStatus": "SHIPPED",   // optional
    "deliveryAddress": "456 Oak Ave" // optional
  }'`,
      response: JSON.stringify({
        success: true,
        data: {
          invoice: {
            invoiceNumber: "ST-250601-ABC12",
            paymentStatus: "PAID",
            paidAmount: 550,
            dueAmount: 0,
            orderStatus: "SHIPPED"
          }
        }
      }, null, 2),
    },
    {
      title: "List Sales",
      method: "GET",
      endpoint: `/api/${businessSlug}/${branchSlug}/sales`,
      desc: "List all sales with optional payment status filter. Requires API key.",
      query: "?paymentStatus=UNPAID&page=1&limit=10",
      example: `curl "${BASE}/api/${businessSlug}/${branchSlug}/sales?paymentStatus=UNPAID" \\
  -H "x-api-key: ${apiKey}"`,
      response: JSON.stringify({
        success: true,
        data: {
          sales: [
            { invoiceNumber: "ST-250601-ABC12", customerName: "ABC Traders", total: 550, paymentStatus: "UNPAID", itemCount: 1, createdAt: "2025-06-01T12:00:00.000Z" }
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
        }
      }, null, 2),
    },
    {
      title: "List Smart Baskets",
      method: "GET",
      endpoint: `/api/${businessSlug}/${branchSlug}/smart-baskets`,
      desc: "List all smart baskets owned by this business. Requires API key.",
      example: `curl "${BASE}/api/${businessSlug}/${branchSlug}/smart-baskets" \\
  -H "x-api-key: ${apiKey}"`,
      response: JSON.stringify({
        success: true,
        data: {
          baskets: [
            { id: "uuid", title: "Weekly Groceries", description: null, isPublic: false, baseTotal: 1200, customTotal: 1100, itemCount: 5, createdAt: "2025-06-01T12:00:00.000Z" }
          ]
        }
      }, null, 2),
    },
    {
      title: "Get Smart Basket",
      method: "GET",
      endpoint: `/api/${businessSlug}/${branchSlug}/smart-baskets/{id}`,
      desc: "Get full smart basket details with all items. Requires API key.",
      example: `curl "${BASE}/api/${businessSlug}/${branchSlug}/smart-baskets/uuid" \\
  -H "x-api-key: ${apiKey}"`,
      response: JSON.stringify({
        success: true,
        data: {
          basket: {
            id: "uuid",
            title: "Weekly Groceries",
            baseTotal: 1200,
            customTotal: 1100,
            items: [
              { id: "item-uuid", productId: "prod-uuid", productName: "Basmati Rice", price: 120, quantity: 5, unit: "KG", role: "SEED" }
            ]
          }
        }
      }, null, 2),
    },
    {
      title: "Buy Smart Basket",
      method: "POST",
      endpoint: `/api/${businessSlug}/${branchSlug}/smart-baskets/{id}/buy`,
      desc: "Create a sale from a smart basket. Uses customTotal if set, otherwise calculates from item prices. Requires API key.",
      optionalFields: ["customerName", "customerPhone", "discount", "paidAmount", "deliveryAddress", "notes"],
      example: `curl -X POST "${BASE}/api/${businessSlug}/${branchSlug}/smart-baskets/uuid/buy" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "customerName": "ABC Traders",
    "discount": 50,
    "paidAmount": 1050
  }'`,
      response: JSON.stringify({
        success: true,
        data: {
          invoice: {
            invoiceNumber: "ST-250601-ABC12",
            customerName: "ABC Traders",
            totalAmount: 1200,
            discount: 50,
            finalAmount: 1100,
            paymentStatus: "PARTIAL",
            paidAmount: 1050,
            dueAmount: 50,
            smartBasket: "Weekly Groceries",
            createdAt: "2025-06-01T12:00:00.000Z",
            items: [{ productId: "prod-uuid", productName: "Basmati Rice", quantity: 5, unitPrice: 120, totalPrice: 600 }]
          }
        }
      }, null, 2),
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-4 z-50 mx-auto flex max-w-4xl flex-col overflow-hidden rounded-2xl border border-(--clr-border) bg-(--clr-surface) shadow-2xl sm:inset-6 lg:inset-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-(--clr-border) px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--clr-teal-dim)/10">
                  <LuBook className="h-[18px] w-[18px] text-(--clr-teal-dim)" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-(--clr-fg)">{store.name} — API Docs</h2>
                  <p className="text-xs text-(--clr-fg-muted)">
                    {BASE}/api/{businessSlug}/{branchSlug}/...
                  </p>
                </div>
              </div>
              <button onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-(--clr-fg-muted) hover:bg-(--clr-surface2) transition-all"
              >
                <LuX className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {sections.map((section) => (
                  <div key={section.title} className="rounded-xl border border-(--clr-border) bg-(--clr-surface) overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-(--clr-border)">
                      <div className="flex items-center gap-3">
                        {section.method && (
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            section.method === "GET" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" :
                            section.method === "POST" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" :
                            "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                          }`}>{section.method}</span>
                        )}
                        <h3 className="text-sm font-semibold text-(--clr-fg)">{section.title}</h3>
                      </div>
                      {section.endpoint && (
                        <div className="hidden items-center gap-1.5 sm:flex">
                          <code className="text-xs text-(--clr-teal-dim)">{section.endpoint}{section.query || ""}</code>
                          <CopyButton text={`${BASE}${section.endpoint}${section.query || ""}`} />
                        </div>
                      )}
                    </div>
                    <div className="p-5 space-y-4">
                      <p className="text-sm text-(--clr-fg)">{section.desc}</p>
                      {(section as any).optionalFields && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Optional:</span>
                          {(section as any).optionalFields.map((f: string) => (
                            <span key={f} className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                      {"code" in section && section.code && (
                        <div>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Usage</p>
                          <div className="relative">
                            <CodeBlock code={section.code} lang="plaintext" />
                            <div className="absolute right-2 top-2">
                              <CopyButton text={section.code} />
                            </div>
                          </div>
                        </div>
                      )}
                      {"example" in section && section.example && (
                        <div>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Example Request</p>
                          <div className="relative">
                            <CodeBlock code={section.example} lang="bash" />
                            <div className="absolute right-2 top-2">
                              <CopyButton text={section.example} />
                            </div>
                          </div>
                        </div>
                      )}
                      {"response" in section && section.response && (
                        <div>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Response</p>
                          <CodeBlock code={section.response} lang="json" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
