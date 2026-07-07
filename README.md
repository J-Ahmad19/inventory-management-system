# StockFlow — Intelligent Inventory Management System

A real-time Inventory Management System (IMS) built with Next.js that empowers businesses to track stock across multiple locations, predict replenishment needs, prevent shrinkage, and optimize supply chain efficiency.

## Features

- **Multi-Location Tracking** — Monitor inventory across warehouses, distribution centers, and retail stores
- **Real-Time Updates** — Server-Sent Events (SSE) for live stock changes, alerts, and metrics
- **Predictive Replenishment** — AI-driven velocity analysis with days-until-stockout and order quantity recommendations
- **Shrinkage Detection** — Automatic variance detection between expected and actual counts
- **Supply Chain Insights** — Optimization recommendations for transfers, order consolidation, and safety stock
- **Interactive Dashboard** — KPIs, trend charts, category distribution, and location utilization

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS 4**
- **Recharts** for data visualization
- **Radix UI** primitives for accessible components

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with KPIs, charts, and live alerts |
| `/inventory` | Searchable inventory table with location breakdown |
| `/locations` | Multi-location cards with utilization metrics |
| `/analytics` | Replenishment predictions and shrinkage analysis |
| `/alerts` | Real-time alert management |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/inventory` | GET, POST | List/filter inventory, transfer & adjust stock |
| `/api/analytics` | GET | Dashboard metrics, trends, predictions |
| `/api/alerts` | GET, PATCH | List alerts, acknowledge alerts |
| `/api/locations` | GET | Location utilization and analytics |
| `/api/events` | GET (SSE) | Real-time event stream |

## Architecture

```
src/
├── app/                  # Next.js pages and API routes
├── components/
│   ├── dashboard/        # Charts, KPIs, alerts, predictions
│   ├── inventory/        # Inventory table with filters
│   ├── layout/           # Sidebar, header, app shell
│   └── ui/               # Reusable UI primitives
├── hooks/                # useRealtime SSE hook
└── lib/
    ├── data/             # Seed data
    ├── engine/           # Prediction & shrinkage algorithms
    ├── store/            # In-memory store with simulation
    └── types.ts          # TypeScript interfaces
```

The in-memory store simulates live inventory activity (inbound/outbound every 8 seconds) and can be replaced with a database (PostgreSQL, MongoDB) for production use.

## Production Considerations

- Replace in-memory store with a persistent database
- Add authentication (NextAuth.js) and role-based access
- Connect to ERP/WMS systems via webhooks
- Deploy SSE via Redis pub/sub for multi-instance scaling
- Add barcode scanning and mobile PWA support
