<div align="center">

<img src="app/icon.png" alt="Optizive Logo" width="120" />

# Optizive

**AI-Powered Inventory & B2B Supply Chain Management Platform for Bangladeshi Grocery Businesses**

[Docs](https://github.com/ahmrafi22/Optizive/tree/main/docs) · [Report Bug](https://github.com/ahmrafi22/Optizive/issues) · [Request Feature](https://github.com/ahmrafi22/Optizive/issues)

</div>

## Tech Stack

<div align="center">

<img src="https://go-skill-icons.vercel.app/api/icons?i=nextjs,react,typescript,tailwind,css,prisma,neon,vercel,gemini" />

</div>

## Features

| Feature | Description |
|---------|-------------|
| **Auth** | Email/password + Google OAuth via NextAuth v5, role-based access (STORE_OWNER / SUPPLIER / BOTH) |
| **Onboarding** | Multi-step wizard collecting business profile, role-specific preferences (seller/supplier) |
| **Dashboard** | Revenue/sales trends, category distribution, top products, low-stock alerts, recommended suppliers |
| **Inventory** | Product CRUD, card/list views, search/filter/sort, stock status badges, Cloudinary image upload |
| **Sales** | Create sales with line items, invoice generation, payment & order status tracking, paginated history |
| **Expiry Tracker** | Risk scoring, sales velocity, clearance suggestions, predictive at-risk detection (90 days) |
| **Smart Basket** | Curated baskets with AI recommendations, public sharing, one-click buy-to-sale |
| **Price Compare** | Multi-market price comparison via SSE streaming, history, savings summary |
| **Supplier Network** | Personalized match scoring, search/filter, profiles, restock suggestions, bulk discount alerts |
| **Community** | Posts feed (PROCUREMENT / GENERAL), comments, votes, fulfillment system with quotes |
| **AI Chatbot (OptiBot)** | Persistent chat threads, inventory/sales/sourcing/demand advice, Bangladesh market context |
| **Store API** | Auto-generated API keys, endpoint docs, hit logging, activate/deactivate stores |
| **Public API** | RESTful endpoints for products, sales, smart baskets, price compare |
| **Public Product Pages** | Public product info & update pages |


## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or Neon account)
- Cloudinary account
- Google OAuth credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/ahmrafi22/Optizive.git
cd Optizive

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```
