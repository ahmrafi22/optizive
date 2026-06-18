# Optizive

Inventory management & B2B platform for Bangladeshi grocery businesses.

# Docs

check [docs](https://github.com/k-md-mahi/Optizive/tree/main/docs) for detailed documentation on architecture, API, deployment, and more.

## Features

- **Auth** — Email/password + Google OAuth via NextAuth v5, role-based access (STORE_OWNER / SUPPLIER / BOTH)
- **Onboarding** — Multi-step wizard collecting business profile, role-specific preferences (seller/supplier)
- **Dashboard** — Revenue/sales trends, category distribution, top products, low-stock alerts, recommended suppliers
- **Inventory** — Product CRUD, card/list views, search/filter/sort, stock status badges, Cloudinary image upload
- **Sales** — Create sales with line items, invoice generation, payment & order status tracking, paginated history
- **Expiry Tracker** — Risk scoring, sales velocity, clearance suggestions, predictive at-risk detection (90 days)
- **Smart Basket** — Curated baskets with AI recommendations, public sharing, one-click buy-to-sale
- **Price Compare** — Multi-market price comparison via SSE streaming, history, savings summary
- **Supplier Network** — Personalized match scoring, search/filter, profiles, restock suggestions, bulk discount alerts
- **Community** — Posts feed (PROCUREMENT / GENERAL), comments, votes, fulfillment system with quotes
- **AI Chatbot (OptiBot)** — Persistent chat threads, inventory/sales/sourcing/demand advice, Bangladesh market context
- **Store API** — Auto-generated API keys, endpoint docs, hit logging, activate/deactivate stores
- **Public API** — RESTful endpoints for products, sales, smart baskets, price compare
- **Public Product Pages** — Public product info & update pages

## Tech Stack

Next.js 16, React 19, TypeScript, Tailwind CSS v4, Prisma ORM v7 (Neon/PostgreSQL), NextAuth v5, Cloudinary, Recharts, Motion.dev

## Getting Started
